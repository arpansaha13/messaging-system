package tests

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/suite"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/handler"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
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

	// Initialize circuit breakers
	testLogger := zap.NewNop()
	cbs := circuits.New(testLogger)

	// Initialize repositories
	userRepo := repository.NewUserRepository(db, cbs.Postgres)
	messageRepo := repository.NewMessageRepository(db, cbs.Postgres)
	chatRepo := repository.NewChatRepository(db, cbs.Postgres)
	channelRepo := repository.NewChannelRepository(db, cbs.Postgres)
	contactRepo := repository.NewContactRepository(db, cbs.Postgres)
	groupRepo := repository.NewGroupRepository(db, cbs.Postgres)
	inviteRepo := repository.NewInviteRepository(db, cbs.Postgres)
	userGroupRepo := repository.NewUserGroupRepository(db, cbs.Postgres)

	// Create a mock RabbitMQ service that simulates unavailability
	// This ensures tests get 500 errors when publishing messages
	mockRabbitMQ := &service.RabbitMQService{
		// conn and channel are intentionally nil to simulate unavailable RabbitMQ
	}

	// Initialize services
	userService := service.NewUserService(userRepo, contactRepo)
	chatService := service.NewChatService(chatRepo, messageRepo)
	messageService := service.NewMessageService(messageRepo, repository.NewMessageRecipientRepository(db, cbs.Postgres), chatRepo, mockRabbitMQ)
	channelService := service.NewChannelService(channelRepo, groupRepo)
	contactService := service.NewContactService(contactRepo, userRepo)
	groupService := service.NewGroupService(groupRepo, userGroupRepo, userRepo)
	inviteService := service.NewInviteService(inviteRepo, groupRepo, userGroupRepo, channelRepo)
	userGroupService := service.NewUserGroupService(userGroupRepo, userRepo, groupRepo)

	// Setup HTTP router
	router := mux.NewRouter()

	// Apply middleware
	router.Use(gotoolkit.HttpRecoveryMiddleware)
	router.Use(logger.HttpMiddleware(testLogger))
	router.Use(gotoolkit.HttpErrorMiddleware)

	// Create mock auth service client and auth middleware
	mockAuthClient := mocks.NewMockAuthServiceClient(s.AuthServiceMock)
	authMiddlewareFunc := middleware.AuthMiddleware(mockAuthClient)

	// Protected router with auth middleware
	protectedRouter := router.PathPrefix("").Subrouter()
	protectedRouter.Use(authMiddlewareFunc)

	// Setup public auth routes first
	handler.SetupAuthRoutes(router, mockAuthClient)

	// Setup routes - user group routes must be registered before user routes
	// to ensure /api/users/groups matches before /api/users/{id}
	handler.SetupAuthProtectedRoutes(protectedRouter, mockAuthClient)
	handler.SetupUserGroupRoutes(router, protectedRouter, userGroupService)
	handler.SetupUserRoutes(router, protectedRouter, userService)
	handler.SetupMessageRoutes(router, protectedRouter, messageService)
	handler.SetupChatRoutes(router, protectedRouter, chatService)
	handler.SetupChannelRoutes(router, protectedRouter, channelService)
	handler.SetupContactRoutes(router, protectedRouter, contactService)
	handler.SetupGroupRoutes(router, protectedRouter, groupService)
	handler.SetupInviteRoutes(router, protectedRouter, inviteService)

	// Start HTTP server
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return fmt.Errorf("failed to create listener: %w", err)
	}

	s.HTTPServerAddr = "http://" + listener.Addr().String()
	s.HTTPServer = &http.Server{
		Handler: router,
	}

	go func() {
		if err := s.HTTPServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("HTTP server error: %v\n", err)
		}
	}()

	// Give server time to start
	time.Sleep(100 * time.Millisecond)

	return nil
}
