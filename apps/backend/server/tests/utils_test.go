package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"testing"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/server/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/arpansaha13/messaging-system/apps/common/pb"
)

// TestFixture represents a common test fixture for all test cases
type TestFixture struct {
	T          *testing.T
	Ctx        context.Context
	DB         *gorm.DB
	HTTPClient *HTTPTestHelper
	TestDB     *TestDB
}

// NewTestFixture creates a new test fixture for a test (for use with new suite pattern)
func NewTestFixture(t *testing.T, db *gorm.DB, httpServerAddr string, authServiceMock *mocks.MockAuthService, userServiceMock *mocks.MockUserService) *TestFixture {
	httpHelper := NewHTTPTestHelper(httpServerAddr)
	httpHelper.SetAuthMock(authServiceMock)
	return &TestFixture{
		T:          t,
		Ctx:        context.Background(),
		DB:         db,
		HTTPClient: httpHelper,
		TestDB:     NewTestDB(context.Background(), db, authServiceMock, userServiceMock),
	}
}

// Setup prepares the fixture for a test (cleans tables)
func (f *TestFixture) Setup() {
	// Setup is now called after SetupTest which handles cleanup via s.CleanupTablesForSuite()
	// This method is kept for compatibility but does not need to do anything
}

// SetUserID sets the authenticated user ID for HTTP requests
func (f *TestFixture) SetUserID(userID int64) {
	f.HTTPClient.SetUserID(userID)
}

// TestDB holds database connection and repositories
type TestDB struct {
	Ctx            context.Context
	DB             *gorm.DB
	ChatRepo       *repository.ChatRepository
	MessageRepo    *repository.MessageRepository
	AuthMock       *mocks.MockAuthService
	UserMock       *mocks.MockUserService
	ChatService    *service.ChatService
	MessageService *service.MessageService
}

// NewTestDB creates a new test database wrapper
func NewTestDB(ctx context.Context, db *gorm.DB, authMock *mocks.MockAuthService, userMock *mocks.MockUserService) *TestDB {
	// Initialize circuit breaker
	testLogger := zap.NewNop()
	cbs := circuits.New(testLogger)

	return &TestDB{
		Ctx:         ctx,
		DB:          db,
		ChatRepo:    repository.NewChatRepository(db, cbs.Postgres),
		MessageRepo: repository.NewMessageRepository(db, cbs.Postgres),
		AuthMock:    authMock,
		UserMock:    userMock,
	}
}

// CreateTestUserProfile creates a test user profile in the mock
func (t *TestDB) CreateTestUserProfile(id int64, globalName string) (*domain.UserProfile, error) {
	profile := &pb.UserProfileData{
		UserId:     id,
		GlobalName: globalName,
		Bio:        "Test bio",
	}
	t.UserMock.SetUserProfile(id, profile)
	
	// Return as domain profile for convenience
	return &domain.UserProfile{
		ID:         id,
		GlobalName: globalName,
		Bio:        "Test bio",
	}, nil
}

// CreateTestChat creates a test chat
func (t *TestDB) CreateTestChat(senderID, receiverID int64) (*domain.Chat, error) {
	chat := &domain.Chat{
		SenderID:   senderID,
		ReceiverID: receiverID,
		Muted:      false,
		Pinned:     false,
		Archived:   false,
	}
	if err := t.ChatRepo.Create(t.Ctx, chat); err != nil {
		return nil, err
	}
	return chat, nil
}

// CreateTestMessage creates a test message
func (t *TestDB) CreateTestMessage(senderID int64, content string) (*domain.Message, error) {
	msg := &domain.Message{
		SenderID:  senderID,
		ChannelID: nil,
		Content:   content,
	}
	if err := t.MessageRepo.Create(t.Ctx, nil, msg); err != nil {
		return nil, err
	}
	return msg, nil
}

// CreateTestMessageRecipient creates a message recipient record
func (t *TestDB) CreateTestMessageRecipient(messageID, receiverID int64, status domain.MessageStatus) (*domain.MessageRecipient, error) {
	recipient := &domain.MessageRecipient{
		MessageID:  messageID,
		ReceiverID: receiverID,
		Status:     status,
	}
	if err := t.DB.Create(recipient).Error; err != nil {
		return nil, err
	}
	return recipient, nil
}

// CreateTestGroup creates a test group
func (t *TestDB) CreateTestGroup(name string, founderID int64) (*domain.Group, error) {
	group := &domain.Group{
		Name:      name,
		FounderID: founderID,
	}
	if err := t.DB.Create(group).Error; err != nil {
		return nil, err
	}

	// Add founder as a member of the group with OWNER role
	userGroup := &domain.UserGroup{
		UserID:  founderID,
		GroupID: group.ID,
		Role:    "OWNER",
	}
	if err := t.DB.Create(userGroup).Error; err != nil {
		return nil, err
	}

	return group, nil
}

// CreateTestChannel creates a test channel
func (t *TestDB) CreateTestChannel(groupID int64, name string) (*domain.Channel, error) {
	channel := &domain.Channel{
		GroupID: groupID,
		Name:    name,
	}
	if err := t.DB.Create(channel).Error; err != nil {
		return nil, err
	}
	return channel, nil
}

// CreateTestContact creates a test contact
func (t *TestDB) CreateTestContact(userID, userIDInContact int64) (*domain.Contact, error) {
	contact := &domain.Contact{
		UserID:          userID,
		UserIDInContact: userIDInContact,
	}
	if err := t.DB.Create(contact).Error; err != nil {
		return nil, err
	}
	return contact, nil
}

// CreateTestInvite creates a test invite
func (t *TestDB) CreateTestInvite(groupID, inviterID int64, hash string) (*domain.Invite, error) {
	expiresAt := time.Now().Add(24 * time.Hour)
	invite := &domain.Invite{
		Hash:      hash,
		InviterID: inviterID,
		GroupID:   &groupID,
		ExpiresAt: &expiresAt,
	}
	if err := t.DB.Create(invite).Error; err != nil {
		return nil, err
	}
	return invite, nil
}

// CreateTestUserGroup creates a test user group membership
func (t *TestDB) CreateTestUserGroup(userID, groupID int64, role string) (*domain.UserGroup, error) {
	userGroup := &domain.UserGroup{
		UserID:  userID,
		GroupID: groupID,
		Role:    role,
	}
	if err := t.DB.Create(userGroup).Error; err != nil {
		return nil, err
	}
	return userGroup, nil
}

// TableDrivenTestCase represents a single test case in a table-driven test
type TableDrivenTestCase struct {
	Name        string
	Setup       func(*TestFixture) error // Setup creates test data
	Test        func(*TestFixture) error // Test executes the test logic
	Verify      func(*TestFixture) error // Verify checks the results
	ExpectError bool                     // ExpectError indicates if an error is expected
	ErrMsg      string                   // ErrMsg is the expected error message (optional)
}

// ChatTestCase represents a test case for chat operations (deprecated, use TableDrivenTestCase)
type ChatTestCase struct {
	Name          string
	Setup         func(*TestDB) error
	ExecuteTest   func(t *testing.T, testdb *TestDB)
	ExpectError   bool
	ErrorContains string
}

// MessageTestCase represents a test case for message operations (deprecated, use TableDrivenTestCase)
type MessageTestCase struct {
	Name        string
	Setup       func(*TestDB) error
	ExecuteTest func(t *testing.T, testdb *TestDB)
	ExpectError bool
	ErrorType   string
}

// HTTPTestHelper provides HTTP client functionality for tests
type HTTPTestHelper struct {
	BaseURL    string
	Token      string
	HTTPClient *http.Client
	AuthMock   *mocks.MockAuthService
}

// NewHTTPTestHelper creates a new HTTP test helper
func NewHTTPTestHelper(baseURL string) *HTTPTestHelper {
	return &HTTPTestHelper{
		BaseURL:    baseURL,
		Token:      "test-token",
		HTTPClient: &http.Client{},
		AuthMock:   nil,
	}
}

// SetToken sets the authentication token
func (h *HTTPTestHelper) SetToken(token string) {
	h.Token = token
}

// SetAuthMock sets the auth mock service for use with suite pattern
func (h *HTTPTestHelper) SetAuthMock(authMock *mocks.MockAuthService) {
	h.AuthMock = authMock
}

// SetUserID sets the user ID in the mock auth service
func (h *HTTPTestHelper) SetUserID(userID int64) {
	var authMock *mocks.MockAuthService

	// Use the AuthMock if set (which is required with new suite pattern)
	if h.AuthMock != nil {
		authMock = h.AuthMock
	} else {
		return // No auth mock available - required when using suite pattern
	}

	authMock.SetValidateSessionResponse(h.Token, &mocks.ValidateSessionResponse{
		Valid:  true,
		UserID: userID,
		Error:  nil,
	})
	authMock.SetGetUserResponse(userID, &mocks.GetUserResponse{
		ID:       userID,
		Email:    "test@example.com",
		Username: "testuser",
		Verified: true,
		Error:    nil,
	})
}

// MakeRequest makes an HTTP request
func (h *HTTPTestHelper) MakeRequest(method, path string, body any) (*http.Response, error) {
	url := h.BaseURL + path

	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, err
	}

	// Add headers
	req.Header.Set("Content-Type", "application/json")
	if h.Token != "" {
		req.Header.Set("Authorization", "Bearer "+h.Token)
	}

	return h.HTTPClient.Do(req)
}

// GET makes a GET request
func (h *HTTPTestHelper) GET(path string) (*http.Response, error) {
	return h.MakeRequest("GET", path, nil)
}

// POST makes a POST request
func (h *HTTPTestHelper) POST(path string, body any) (*http.Response, error) {
	return h.MakeRequest("POST", path, body)
}

// PATCH makes a PATCH request
func (h *HTTPTestHelper) PATCH(path string, body any) (*http.Response, error) {
	return h.MakeRequest("PATCH", path, body)
}

// DELETE makes a DELETE request
func (h *HTTPTestHelper) DELETE(path string) (*http.Response, error) {
	return h.MakeRequest("DELETE", path, nil)
}

// ReadResponseBody reads and unmarshals response body
func ReadResponseBody(resp *http.Response, v any) error {
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	return json.Unmarshal(body, v)
}
