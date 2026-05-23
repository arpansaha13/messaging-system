package tests

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/arpansaha13/messaging-system/apps/common/testdeps"
	"github.com/stretchr/testify/suite"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/app"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/server/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/constants"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// BaseTestSuite provides common test setup and teardown for all test suites
type BaseTestSuite struct {
	suite.Suite
	DepSet          *testdeps.ResolvedDependencySet
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

	deps, err := testdeps.ResolveTestDependencies(ctx, testdeps.PostgresConfig{
		ServiceName: "backend",
		DBUser:      "testuser",
		DBPassword:  "testpass",
		DBName:      "test_messaging",
	})
	s.Require().NoError(err, "Failed to initialize test dependencies")
	s.DepSet = deps

	databaseURL := deps.Deps.PostgresURL
	os.Setenv("DATABASE_URL", databaseURL)

	// Connect to database
	dsn := deps.Deps.PostgresDSN

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
	if s.DepSet != nil {
		s.Require().NoError(s.DepSet.Teardown(s.Ctx))
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

	// This ensures tests get proper error handling when publishing messages
	testChatBroker := broker.NewRabbitMQBroker("amqp://localhost", testLogger, cbs.RabbitMQ)

	// Create listener for test server
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return fmt.Errorf("failed to create listener: %w", err)
	}

	s.HTTPServerAddr = "http://" + listener.Addr().String()

	// Assemble HTTP server with all components
	router := app.SetupRouter(app.Deps{
		DB:         db,
		ChatBroker: testChatBroker,
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
