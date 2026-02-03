package tests

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/handler"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
)

var (
	globalContainer       testcontainers.Container
	globalDB              *gorm.DB
	globalCtx             context.Context
	globalHTTPServer      *http.Server
	globalHTTPServerAddr  string
	globalAuthServiceMock *mocks.MockAuthService
)

// TestMain sets up shared database for all tests
func TestMain(m *testing.M) {
	ctx := context.Background()
	globalCtx = ctx

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
	if err != nil {
		fmt.Printf("Failed to start container: %v\n", err)
		os.Exit(1)
	}

	globalContainer = container

	// Get container host and port
	host, err := container.Host(ctx)
	if err != nil {
		fmt.Printf("Failed to get host: %v\n", err)
		globalContainer.Terminate(ctx)
		os.Exit(1)
	}

	port, err := container.MappedPort(ctx, "5432")
	if err != nil {
		fmt.Printf("Failed to get port: %v\n", err)
		globalContainer.Terminate(ctx)
		os.Exit(1)
	}

	// Connect to database
	dsn := fmt.Sprintf(
		"host=%s port=%s user=testuser password=testpass dbname=test_messaging sslmode=disable",
		host, port.Port(),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("Failed to connect to database: %v\n", err)
		globalContainer.Terminate(ctx)
		os.Exit(1)
	}

	globalDB = db

	// Run migrations
	if err := migrateDatabase(db); err != nil {
		fmt.Printf("Failed to run migrations: %v\n", err)
		globalContainer.Terminate(ctx)
		os.Exit(1)
	}

	// Setup HTTP server with mocked auth service
	if err := setupHTTPServer(ctx, db); err != nil {
		fmt.Printf("Failed to setup HTTP server: %v\n", err)
		globalContainer.Terminate(ctx)
		os.Exit(1)
	}

	// Run tests
	code := m.Run()

	// Cleanup
	globalHTTPServer.Shutdown(ctx)
	globalContainer.Terminate(ctx)
	os.Exit(code)
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

// CleanupTables truncates all tables to ensure test isolation
func CleanupTables(t *testing.T) {
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
		if err := globalDB.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table)).Error; err != nil {
			t.Fatalf("Failed to truncate table %s: %v", table, err)
		}
	}
}

// GetTestDB returns a new test database wrapper
func GetTestDB(t *testing.T) *TestDB {
	return NewTestDB(globalCtx, globalDB)
}

// GetGlobalContext returns the global context
func GetGlobalContext() context.Context {
	return globalCtx
}

// GetHTTPServerAddr returns the HTTP server address for making requests
func GetHTTPServerAddr() string {
	return globalHTTPServerAddr
}

// GetAuthServiceMock returns the mock auth service
func GetAuthServiceMock() *mocks.MockAuthService {
	return globalAuthServiceMock
}

// setupHTTPServer sets up the HTTP server with mocked auth service
func setupHTTPServer(ctx context.Context, db *gorm.DB) error {
	// Create mock auth service
	globalAuthServiceMock = mocks.NewMockAuthService()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	messageRepo := repository.NewMessageRepository(db)
	chatRepo := repository.NewChatRepository(db)
	channelRepo := repository.NewChannelRepository(db)
	contactRepo := repository.NewContactRepository(db)
	groupRepo := repository.NewGroupRepository(db)
	inviteRepo := repository.NewInviteRepository(db)
	userGroupRepo := repository.NewUserGroupRepository(db)

	// Create a mock RabbitMQ service that simulates unavailability
	// This ensures tests get 500 errors when publishing messages
	mockRabbitMQ := &service.RabbitMQService{
		// conn and channel are intentionally nil to simulate unavailable RabbitMQ
	}

	// Initialize services
	userService := service.NewUserService(userRepo, contactRepo)
	chatService := service.NewChatService(chatRepo, messageRepo)
	messageService := service.NewMessageService(messageRepo, repository.NewMessageRecipientRepository(db), chatRepo, mockRabbitMQ)
	channelService := service.NewChannelService(channelRepo, groupRepo)
	contactService := service.NewContactService(contactRepo, userRepo)
	groupService := service.NewGroupService(groupRepo, userGroupRepo, userRepo)
	inviteService := service.NewInviteService(inviteRepo, groupRepo, userGroupRepo, channelRepo)
	userGroupService := service.NewUserGroupService(userGroupRepo, userRepo, groupRepo)

	// Setup HTTP router
	router := mux.NewRouter()

	// Apply middleware in order: Recovery (outermost) -> Logging -> Error
	router.Use(middleware.RecoveryMiddleware)
	router.Use(middleware.LoggingMiddleware)
	router.Use(middleware.ErrorMiddleware)

	// Create mock auth service client and auth middleware
	mockAuthClient := mocks.NewMockAuthServiceClient(globalAuthServiceMock)
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

	globalHTTPServerAddr = "http://" + listener.Addr().String()
	globalHTTPServer = &http.Server{
		Handler: router,
	}

	go func() {
		if err := globalHTTPServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("HTTP server error: %v\n", err)
		}
	}()

	// Give server time to start
	time.Sleep(100 * time.Millisecond)

	return nil
}
