package mocks

import (
	"context"
	"net/http"
	"sync"

	"github.com/arpansaha13/messaging-system/apps/backend-go/pb"
)

// ValidateSessionResponse represents the auth service response
type ValidateSessionResponse struct {
	Valid  bool
	UserID int64
	Error  error
}

// GetUserResponse represents user data from auth service
type GetUserResponse struct {
	ID       int64
	Email    string
	Username string
	Verified bool
	Error    error
}

// MockAuthService mocks the auth service for testing
type MockAuthService struct {
	mu               sync.RWMutex
	validateSessions map[string]*ValidateSessionResponse
	getUsers         map[int64]*GetUserResponse
	defaultValidate  *ValidateSessionResponse
	defaultGetUser   *GetUserResponse
}

// NewMockAuthService creates a new mock auth service
func NewMockAuthService() *MockAuthService {
	return &MockAuthService{
		validateSessions: make(map[string]*ValidateSessionResponse),
		getUsers:         make(map[int64]*GetUserResponse),
		defaultValidate: &ValidateSessionResponse{
			Valid:  true,
			UserID: 1,
			Error:  nil,
		},
		defaultGetUser: &GetUserResponse{
			ID:       1,
			Email:    "test@example.com",
			Username: "testuser",
			Verified: true,
			Error:    nil,
		},
	}
}

// SetValidateSessionResponse sets the response for a specific token
func (m *MockAuthService) SetValidateSessionResponse(token string, resp *ValidateSessionResponse) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.validateSessions[token] = resp
}

// SetGetUserResponse sets the response for a specific user ID
func (m *MockAuthService) SetGetUserResponse(userID int64, resp *GetUserResponse) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.getUsers[userID] = resp
}

// ValidateSession validates a session token
func (m *MockAuthService) ValidateSession(token string) *ValidateSessionResponse {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if resp, exists := m.validateSessions[token]; exists {
		return resp
	}
	return m.defaultValidate
}

// GetUser gets user information by ID
func (m *MockAuthService) GetUser(userID int64) *GetUserResponse {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if resp, exists := m.getUsers[userID]; exists {
		return resp
	}
	resp := &GetUserResponse{
		ID:       userID,
		Email:    "test@example.com",
		Username: "testuser",
		Verified: true,
		Error:    nil,
	}
	return resp
}

// SetDefaultValidateResponse sets the default validate response
func (m *MockAuthService) SetDefaultValidateResponse(resp *ValidateSessionResponse) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.defaultValidate = resp
}

// SetDefaultGetUserResponse sets the default get user response
func (m *MockAuthService) SetDefaultGetUserResponse(resp *GetUserResponse) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.defaultGetUser = resp
}

// MockAuthServiceClient wraps the mock auth service to work with the auth middleware
type MockAuthServiceClient struct {
	mockAuth      *MockAuthService
	SignupFunc    func(ctx context.Context, email, password string) (*pb.SignupResponse, error)
	LoginFunc     func(ctx context.Context, email, password string) (*pb.LoginResponse, error)
	VerifyOTPFunc func(ctx context.Context, otpHash, code string) (*pb.VerifyOTPResponse, error)
}

// NewMockAuthServiceClient creates a new mock auth service client
func NewMockAuthServiceClient(mockAuth *MockAuthService) *MockAuthServiceClient {
	return &MockAuthServiceClient{
		mockAuth: mockAuth,
	}
}

// ValidateSession validates a session token and returns a protobuf response
func (c *MockAuthServiceClient) ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
	resp := c.mockAuth.ValidateSession(token)
	if resp.Error != nil {
		return nil, resp.Error
	}

	return &pb.ValidateSessionResponse{
		Valid:  resp.Valid,
		UserId: resp.UserID,
	}, nil
}

// GetUser gets user information and returns a protobuf response
func (c *MockAuthServiceClient) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	resp := c.mockAuth.GetUser(userID)
	if resp.Error != nil {
		return nil, resp.Error
	}

	return &pb.GetUserResponse{
		User: &pb.UserData{
			UserId:   resp.ID,
			Email:    resp.Email,
			Username: resp.Username,
			Verified: resp.Verified,
		},
	}, nil
}

// Signup is a stub implementation of the IAuthServiceClient interface
func (c *MockAuthServiceClient) Signup(ctx context.Context, email, password string) (*pb.SignupResponse, error) {
	if c.SignupFunc != nil {
		return c.SignupFunc(ctx, email, password)
	}
	return &pb.SignupResponse{}, nil
}

// Login is a stub implementation of the IAuthServiceClient interface
func (c *MockAuthServiceClient) Login(ctx context.Context, email, password string) (*pb.LoginResponse, error) {
	if c.LoginFunc != nil {
		return c.LoginFunc(ctx, email, password)
	}
	return &pb.LoginResponse{}, nil
}

// VerifyOTP is a stub implementation of the IAuthServiceClient interface
func (c *MockAuthServiceClient) VerifyOTP(ctx context.Context, otpHash, code string) (*pb.VerifyOTPResponse, error) {
	if c.VerifyOTPFunc != nil {
		return c.VerifyOTPFunc(ctx, otpHash, code)
	}
	return &pb.VerifyOTPResponse{}, nil
}

// Close is a stub implementation of the IAuthServiceClient interface
func (c *MockAuthServiceClient) Close() error {
	return nil
}

// getTokenFromRequest extracts the token from the request
func getTokenFromRequest(r *http.Request) string {
	// Try Authorization header
	auth := r.Header.Get("Authorization")
	if auth != "" {
		// Remove "Bearer " prefix
		if len(auth) > 7 && auth[:7] == "Bearer " {
			return auth[7:]
		}
		return auth
	}

	// Try cookie
	cookie, err := r.Cookie("sessionToken")
	if err == nil {
		return cookie.Value
	}

	return ""
}
