package tests

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/stretchr/testify/suite"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/app"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/server/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/constants"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// BaseTestSuite provides common test setup and teardown for all test suites
type BaseTestSuite struct {
	suite.Suite
	Container       testcontainers.Container
	DB              *gorm.DB
	Ctx             context.Context
	HTTPServerAddr  string
	HTTPServer      *http.Server
	AuthServiceMock *mocks.MockAuthService
}

// SetupSuite initializes the test environment (runs once before all tests)
func (s *BaseTestSuite) SetupSuite() {
	// Set test environment and required config variables
	os.Setenv("ENVIRONMENT", constants.EnvTest.String())
	os.Setenv("JWT_SECRET", "test-jwt-secret-key-for-testing-purposes-only")
	os.Setenv("API_PORT", "4000")
	os.Setenv("AUTH_COOKIE_NAME", "auth_token")
	os.Setenv("LOG_LEVEL", "info")
	os.Setenv("RABBITMQ_HOST", "localhost")
	os.Setenv("RABBITMQ_PORT", "5672")
	os.Setenv("RABBITMQ_USER", "guest")
	os.Setenv("RABBITMQ_PASS", "guest")
	os.Setenv("AUTH_SYSTEM_HOST", "localhost:50051")

	ctx := context.Background()
	s.Ctx = ctx

	// Start PostgreSQL container
	req := testcontainers.ContainerRequest{
		Image:        "postgres:16-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "testuser",
			"POSTGRES_PASSWORD": "testpass",
			"POSTGRES_DB":       "test_messaging",
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections").
			WithOccurrence(2).
			WithStartupTimeout(60 * time.Second),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	s.Require().NoError(err, "Failed to start PostgreSQL container")
	s.Container = container

	// Get container host and port
	host, err := container.Host(ctx)
	s.Require().NoError(err, "Failed to get container host")

	port, err := container.MappedPort(ctx, "5432")
	s.Require().NoError(err, "Failed to get container port")

	// Set DATABASE_URL with actual container host/port
	databaseURL := fmt.Sprintf(
		"postgres://testuser:testpass@%s:%s/test_messaging?sslmode=disable",
		host, port.Port(),
	)
	os.Setenv("DATABASE_URL", databaseURL)

	// Connect to database
	dsn := fmt.Sprintf(
		"host=%s port=%s user=testuser password=testpass dbname=test_messaging sslmode=disable",
		host, port.Port(),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Silent),
	})
	s.Require().NoError(err, "Failed to connect to database")
	s.DB = db

	// Run migrations
	err = migrateDatabase(db)
	s.Require().NoError(err, "Failed to run migrations")

	// Setup HTTP server with mocked auth service
	err = s.setupHTTPServer(ctx, db)
	s.Require().NoError(err, "Failed to setup HTTP server")
}

// TearDownSuite cleans up the test environment (runs once after all tests)
func (s *BaseTestSuite) TearDownSuite() {
	if s.HTTPServer != nil {
		s.HTTPServer.Shutdown(s.Ctx)
	}
	if s.Container != nil {
		s.Container.Terminate(s.Ctx)
	}
}

// CleanupTablesForSuite truncates all tables for test isolation (called by SetupTest in child suites)
func (s *BaseTestSuite) CleanupTablesForSuite() {
	tables := []string{
		"user_profiles",
		"chats",
		"messages",
		"message_recipients",
		"channels",
		"groups",
		"user_groups",
		"contacts",
		"invites",
	}

	for _, table := range tables {
		err := s.DB.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table)).Error
		s.Require().NoError(err, "Failed to truncate table %s", table)
	}
}

// migrateDatabase runs all database migrations
func migrateDatabase(db *gorm.DB) error {
	return db.AutoMigrate(
		&domain.UserProfile{},
		&domain.Chat{},
		&domain.Message{},
		&domain.MessageRecipient{},
		&domain.Channel{},
		&domain.Group{},
		&domain.UserGroup{},
		&domain.Contact{},
		&domain.Invite{},
	)
}

// setupHTTPServer sets up the HTTP server with mocked auth service
func (s *BaseTestSuite) setupHTTPServer(ctx context.Context, db *gorm.DB) error {
	// Create mock auth service
	s.AuthServiceMock = mocks.NewMockAuthService()
	mockAuthClient := mocks.NewMockAuthServiceClient(s.AuthServiceMock)

	// Initialize circuit breakers and logger
	testLogger := zap.NewNop()
	cbs := circuits.New(testLogger)

	// Create test RabbitMQ service with nil connection (simulates unavailability)
	// This ensures tests get proper error handling when publishing messages
	testRabbitMQ := service.NewRabbitMQService(testLogger, cbs.RabbitMQ)

	// Create listener for test server
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return fmt.Errorf("failed to create listener: %w", err)
	}

	s.HTTPServerAddr = "http://" + listener.Addr().String()

	// Assemble HTTP server with all components
	router := app.SetupRouter(app.Deps{
		DB:         db,
		RabbitMQ:   testRabbitMQ,
		AuthClient: mockAuthClient,
		Circuits:   cbs,
		Logger:     testLogger,
	})
	s.HTTPServer = &http.Server{Handler: router}

	// Start HTTP server
	go func() {
		if err := s.HTTPServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("HTTP server error: %v\n", err)
		}
	}()

	// Give server time to start
	time.Sleep(100 * time.Millisecond)

	return nil
}
