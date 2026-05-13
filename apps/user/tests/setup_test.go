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

	"github.com/arpansaha13/messaging-system/apps/common/constants"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/arpansaha13/messaging-system/apps/user/internal/app"
	"github.com/arpansaha13/messaging-system/apps/user/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/user/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/user/internal/service"
	"github.com/arpansaha13/messaging-system/apps/user/tests/mocks"
)

type BaseTestSuite struct {
	suite.Suite
	Container      testcontainers.Container
	DB             *gorm.DB
	Ctx            context.Context
	HTTPServerAddr string
	HTTPServer     *http.Server
	AuthMock       *mocks.MockAuthServiceClient
}

func (s *BaseTestSuite) SetupSuite() {
	os.Setenv("ENVIRONMENT", constants.EnvTest.String())
	os.Setenv("API_PORT", "4000")
	os.Setenv("LOG_LEVEL", "info")
	os.Setenv("HTTP_PORT", "4000")
	os.Setenv("GRPC_PORT", "50051")
	os.Setenv("AUTH_SERVICE_GRPC_ADDR", "localhost:50052")
	os.Setenv("AUTH_COOKIE_NAME", "auth_token")

	ctx := context.Background()
	s.Ctx = ctx

	req := testcontainers.ContainerRequest{
		Image:        "postgres:16-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "testuser",
			"POSTGRES_PASSWORD": "testpass",
			"POSTGRES_DB":       "test_user_service",
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections").
			WithOccurrence(2).
			WithStartupTimeout(60 * time.Second),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	s.Require().NoError(err)
	s.Container = container

	host, _ := container.Host(ctx)
	port, _ := container.MappedPort(ctx, "5432")

	databaseURL := fmt.Sprintf(
		"postgres://testuser:testpass@%s:%s/test_user_service?sslmode=disable",
		host, port.Port(),
	)
	os.Setenv("DATABASE_URL", databaseURL)

	dsn := fmt.Sprintf(
		"host=%s port=%s user=testuser password=testpass dbname=test_user_service sslmode=disable",
		host, port.Port(),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Silent),
	})
	s.Require().NoError(err)
	s.DB = db

	err = migrateDatabase(db)
	s.Require().NoError(err)

	s.setupHTTPServer(ctx, db)
}

func (s *BaseTestSuite) TearDownSuite() {
	if s.HTTPServer != nil {
		s.HTTPServer.Shutdown(s.Ctx)
	}
	if s.Container != nil {
		s.Container.Terminate(s.Ctx)
	}
}

func (s *BaseTestSuite) CleanupTablesForSuite() {
	tables := []string{
		"user_profiles",
		"contacts",
	}

	for _, table := range tables {
		err := s.DB.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table)).Error
		s.Require().NoError(err)
	}
}

func migrateDatabase(db *gorm.DB) error {
	return db.AutoMigrate(
		&domain.UserProfile{},
		&domain.Contact{},
	)
}

func (s *BaseTestSuite) setupHTTPServer(ctx context.Context, db *gorm.DB) {
	s.AuthMock = new(mocks.MockAuthServiceClient)
	testLogger := zap.NewNop()
	cbs := circuits.NewCircuits()

	// Initialize dependencies manually for testing
	userProfileRepo := repository.NewUserProfileRepository(db, cbs.Postgres)
	userProfileService := service.NewUserProfileService(userProfileRepo)
	contactRepo := repository.NewContactRepository(db, cbs.Postgres)
	contactService := service.NewContactService(contactRepo, userProfileRepo)

	deps := &app.Dependencies{
		UserProfileService: userProfileService,
		ContactService:     contactService,
		AuthClient:         s.AuthMock,
		ContactRepo:        contactRepo,
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	s.Require().NoError(err)
	s.HTTPServerAddr = "http://" + listener.Addr().String()

	router := app.SetupRouter(deps, testLogger)
	s.HTTPServer = &http.Server{Handler: router}

	go func() {
		if err := s.HTTPServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("HTTP server error: %v\n", err)
		}
	}()

	time.Sleep(100 * time.Millisecond)
}
