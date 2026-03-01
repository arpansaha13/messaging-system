package tests

import (
	"context"
	"fmt"
	"time"

	"github.com/sony/gobreaker/v2"
	"github.com/stretchr/testify/suite"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/chat-worker/internal/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// BaseTestSuite provides common test setup for chat-worker integration tests
type BaseTestSuite struct {
	suite.Suite
	Ctx          context.Context
	DB           *gorm.DB
	Container    testcontainers.Container
	Broker       *mocks.MockBroker
	CircuitBreak *gobreaker.CircuitBreaker[any]
}

// SetupSuite sets up the test suite with PostgreSQL testcontainer
func (s *BaseTestSuite) SetupSuite() {
	s.Ctx = context.Background()

	// Request PostgreSQL container
	req := testcontainers.ContainerRequest{
		Image:        "postgres:16-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "test",
			"POSTGRES_PASSWORD": "test",
			"POSTGRES_DB":       "messaging_test",
		},
		WaitingFor: wait.ForListeningPort("5432/tcp").WithStartupTimeout(30 * time.Second),
	}

	// Start container
	container, err := testcontainers.GenericContainer(s.Ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	s.Require().NoError(err, "Failed to start PostgreSQL container")
	s.Container = container

	// Get container host and port
	host, err := container.Host(s.Ctx)
	s.Require().NoError(err)
	port, err := container.MappedPort(s.Ctx, "5432")
	s.Require().NoError(err)

	// Build DSN
	dsn := fmt.Sprintf("host=%s port=%s user=test password=test dbname=messaging_test sslmode=disable",
		host, port.Port())

	// Connect to database
	db, err := gorm.Open(
		postgres.Open(dsn),
		&gorm.Config{},
	)
	s.Require().NoError(err, "Failed to connect to database")
	s.DB = db

	// Run migrations
	err = s.DB.AutoMigrate(
		&domain.UserProfile{},
		&domain.Message{},
		&domain.MessageRecipient{},
		&domain.Chat{},
		&domain.Group{},
		&domain.Channel{},
		&domain.UserGroup{},
		&domain.Contact{},
		&domain.Invite{},
	)
	s.Require().NoError(err, "Failed to run migrations")

	// Create mock broker
	s.Broker = mocks.NewMockBroker()
	err = s.Broker.Connect(s.Ctx)
	s.Require().NoError(err)

	// Initialize circuit breaker
	testLogger := zap.NewNop()
	cbs := circuits.New(testLogger)
	s.CircuitBreak = cbs.Postgres
}

// TearDownSuite tears down the test suite
func (s *BaseTestSuite) TearDownSuite() {
	// Close database connection
	if s.DB != nil {
		sqlDB, err := s.DB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}

	// Stop container
	if s.Container != nil {
		err := s.Container.Terminate(s.Ctx)
		s.Require().NoError(err)
	}

	// Disconnect broker
	if s.Broker != nil {
		s.Broker.Disconnect()
	}
}

// SetupTest is run before each test
func (s *BaseTestSuite) SetupTest() {
	// Truncate all tables for test isolation
	tables := []string{
		"message_recipients",
		"messages",
		"chats",
		"channels",
		"user_groups",
		"groups",
		"contacts",
		"invites",
		"user_profiles",
	}

	for _, table := range tables {
		result := s.DB.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		s.Require().NoError(result.Error, "Failed to truncate table %s", table)
	}

	// Clear published messages
	s.Broker.ClearPublishedMessages()
}

// SeedUser creates a test user
func (s *BaseTestSuite) SeedUser(id int64, globalName string) *domain.UserProfile {
	dpValue := "https://example.com/dp.jpg"
	user := &domain.UserProfile{
		ID:         id,
		GlobalName: globalName,
		DP:         &dpValue,
		Bio:        "Test bio",
	}
	result := s.DB.Create(user)
	s.Require().NoError(result.Error, "Failed to seed user")
	return user
}

// SeedGroup creates a test group
func (s *BaseTestSuite) SeedGroup(id int64, name string, founderID int64) *domain.Group {
	group := &domain.Group{
		ID:        id,
		Name:      name,
		FounderID: founderID,
	}
	result := s.DB.Create(group)
	s.Require().NoError(result.Error, "Failed to seed group")
	return group
}

// SeedChannel creates a test channel
func (s *BaseTestSuite) SeedChannel(id int64, name string, groupID int64) *domain.Channel {
	channel := &domain.Channel{
		ID:      id,
		Name:    name,
		GroupID: groupID,
	}
	result := s.DB.Create(channel)
	s.Require().NoError(result.Error, "Failed to seed channel")
	return channel
}

// SeedUserGroup adds a user to a group
func (s *BaseTestSuite) SeedUserGroup(userID, groupID int64, role string) *domain.UserGroup {
	ug := &domain.UserGroup{
		UserID:  userID,
		GroupID: groupID,
		Role:    role,
	}
	result := s.DB.Create(ug)
	s.Require().NoError(result.Error, "Failed to seed user group")
	return ug
}

// SeedChat creates a test chat
func (s *BaseTestSuite) SeedChat(senderID, receiverID int64) *domain.Chat {
	chat := &domain.Chat{
		SenderID:   senderID,
		ReceiverID: receiverID,
	}
	result := s.DB.Create(chat)
	s.Require().NoError(result.Error, "Failed to seed chat")
	return chat
}

// Helper to get a published message by routing key
func (s *BaseTestSuite) GetPublishedByRoutingKey(routingKey string) []mocks.PublishedMessage {
	return s.Broker.GetPublishedMessagesByRoutingKey(routingKey)
}

// Helper to get a published message by topic
func (s *BaseTestSuite) GetPublishedByTopic(topic string) []mocks.PublishedMessage {
	return s.Broker.GetPublishedMessagesByTopic(topic)
}
