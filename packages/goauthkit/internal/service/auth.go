package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
	"golang.org/x/sync/singleflight"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/cache"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/repository"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/utils"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/worker"
	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
)

// AuthService handles authentication and session management business logic.
// It provides methods for user registration, email verification, login, session validation, refresh, and logout.
// All methods are context-aware and handle errors with domain-specific error types.
type AuthService struct {
	userRepo     repository.IUserRepository
	otpRepo      repository.IOTPRepository
	sessionRepo  repository.ISessionRepository
	providerRepo repository.IProviderRepository
	sessionCache cache.ISessionCache
	hasher       *utils.PasswordHasher
	config       AuthServiceConfig
	hooks        *AuthServiceHooks
	sf           singleflight.Group
}

// UserCreatedEvent encapsulates data for the user creation hook
type UserCreatedEvent struct {
	UserID     int64
	GlobalName string
}

// AuthServiceHooks contains optional callbacks for auth service lifecycle events
type AuthServiceHooks struct {
	OnUserCreated func(ctx context.Context, event UserCreatedEvent) error
}

// AuthServiceConfig holds configuration for the auth service
type AuthServiceConfig struct {
	OTPExpiry  time.Duration
	OTPLength  int
	SessionTTL time.Duration
	SecretKey  string
	EmailPool  *worker.EmailWorkerPool
}

// NewAuthService creates a new auth service with all dependencies initialized.
// Returns a fully configured AuthService ready for use.
func NewAuthService(
	userRepo repository.IUserRepository,
	otpRepo repository.IOTPRepository,
	sessionRepo repository.ISessionRepository,
	providerRepo repository.IProviderRepository,
	sessionCache cache.ISessionCache,
	hasher *utils.PasswordHasher,
	config AuthServiceConfig,
	hooks *AuthServiceHooks,
) *AuthService {
	if userRepo == nil {
		panic("userRepo is required")
	}
	if otpRepo == nil {
		panic("otpRepo is required")
	}
	if sessionRepo == nil {
		panic("sessionRepo is required")
	}
	if providerRepo == nil {
		panic("providerRepo is required")
	}
	if sessionCache == nil {
		panic("sessionCache is required")
	}
	if hasher == nil {
		panic("hasher is required")
	}
	return &AuthService{
		userRepo:     userRepo,
		otpRepo:      otpRepo,
		sessionRepo:  sessionRepo,
		providerRepo: providerRepo,
		sessionCache: sessionCache,
		hasher:       hasher,
		config:       config,
		hooks:        hooks,
	}
}

// SignupRequest represents signup input with email, password and global name
type SignupRequest struct {
	Email           string `json:"email"`           // User's email address
	Password        string `json:"password"`        // User's password (8-30 characters)
	ConfirmPassword string `json:"confirmPassword"` // Password confirmation
	GlobalName      string `json:"globalName"`      // User's display name
}

// SignupResponse represents signup output with confirmation message and OTP hash
type SignupResponse struct {
	Message string `json:"message"`
	OTPHash string `json:"otpHash"`
}

// Signup registers a new user with email and password.
// Validates email uniqueness, hashes password, creates user record, generates 6-digit OTP,
// and enqueues email task for async delivery. OTP expires in 10 minutes.
// Returns error if email already exists, validation fails, or database operations fail.
func (s *AuthService) Signup(ctx context.Context, req SignupRequest) (*SignupResponse, error) {
	// Check if email already exists
	exists, err := s.userRepo.ExistsEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, &gtk.ConflictError{Message: "email already registered"}
	}

	// Hash password
	passwordHash, err := s.hasher.Hash(req.Password)
	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to process password", Err: err}
	}

	// Create user and credentials in transaction
	newUser := &domain.User{
		Email:    req.Email,
		Verified: false,
	}

	credentials := &domain.Credentials{
		PasswordHash: passwordHash,
	}

	if err := s.userRepo.Create(ctx, newUser, credentials); err != nil {
		return nil, &gtk.InternalError{Message: "failed to create user", Err: err}
	}

	// Trigger OnUserCreated hook
	if s.hooks != nil && s.hooks.OnUserCreated != nil {
		_ = s.hooks.OnUserCreated(ctx, UserCreatedEvent{
			UserID:     newUser.ID,
			GlobalName: req.GlobalName,
		})
	}

	// Generate and send OTP
	otp, err := utils.GenerateOTP(s.config.OTPLength)
	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to generate otp", Err: err}
	}

	// Generate random hash for OTP identification
	otpHash, err := utils.GenerateToken(32)
	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to generate otp hash", Err: err}
	}

	// Hash the OTP code for verification
	hashedCode, err := s.hasher.Hash(otp)
	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to process otp", Err: err}
	}

	otpRecord := &domain.OTP{
		UserID:     newUser.ID,
		OTPHash:    otpHash,
		HashedCode: hashedCode,
		Purpose:    domain.OTPPurposeSignupVerification,
		ExpiresAt:  time.Now().Add(s.config.OTPExpiry),
	}

	if err := s.otpRepo.Create(ctx, otpRecord); err != nil {
		return nil, &gtk.InternalError{Message: "failed to store otp", Err: err}
	}

	// Enqueue email task with OTP details
	emailBody := fmt.Sprintf("Your OTP is: %s\n\nThis code expires in 10 minutes.", otp)
	s.config.EmailPool.Enqueue(worker.EmailTask{
		Recipient: req.Email,
		Subject:   "Verify Your Email",
		Body:      emailBody,
	})

	return &SignupResponse{
		Message: "signup successful, check your email for otp",
		OTPHash: otpRecord.OTPHash,
	}, nil
}

// VerifyOTPRequest represents the input for OTP verification
type VerifyOTPRequest struct {
	OTPHash string `json:"otpHash"`
	Code    string `json:"code"`
}

// VerifyOTPResponse represents OTP verification output with username, OTP hash, and initial session
type VerifyOTPResponse struct {
	Message      string    `json:"message"`
	Username     string    `json:"username"`
	OTPHash      string    `json:"otp_hash"`
	SessionToken string    `json:"session_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// VerifyOTP verifies the OTP code sent to user's email and marks user as verified.
// ...
func (s *AuthService) VerifyOTP(ctx context.Context, req VerifyOTPRequest) (*VerifyOTPResponse, error) {
	if req.OTPHash == "" {
		return nil, &gtk.ValidationError{Message: "otp hash is required", Field: "otpHash"}
	}

	// Get OTP by hash and purpose (signup verification)
	otpRecord, err := s.otpRepo.GetByOTPHash(ctx, req.OTPHash, domain.OTPPurposeSignupVerification)
	if err != nil {
		return nil, err
	}

	userID := otpRecord.UserID

	// Get user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Check if already verified
	if user.Verified {
		return nil, &gtk.ValidationError{Message: "user already verified", Field: ""}
	}

	// Check expiry
	if time.Now().After(otpRecord.ExpiresAt) {
		return nil, &gtk.UnauthorizedError{Message: "otp has expired"}
	}

	// Verify OTP hash
	if !s.hasher.Verify(otpRecord.HashedCode, req.Code) {
		return nil, &gtk.UnauthorizedError{Message: "invalid otp code"}
	}

	// Generate username with retry logic
	emailPrefix := utils.GetEmailPrefix(user.Email)
	username, err := s.generateUniqueUsername(ctx, emailPrefix)
	if err != nil {
		return nil, err
	}

	// Update user as verified and set username in transaction
	if err := s.userRepo.UpdateVerified(ctx, userID, username); err != nil {
		return nil, &gtk.InternalError{Message: "failed to update user", Err: err}
	}

	// Delete OTP by hash and purpose
	if err := s.otpRepo.SoftDeleteByOTPHash(ctx, req.OTPHash, domain.OTPPurposeSignupVerification); err != nil {
		return nil, &gtk.InternalError{Message: "failed to clean up otp", Err: err}
	}

	// Create session
	sessionToken, expiresAt, err := s.createSession(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &VerifyOTPResponse{
		Message:      "otp verified successfully",
		Username:     username,
		OTPHash:      req.OTPHash,
		SessionToken: sessionToken,
		ExpiresAt:    expiresAt,
	}, nil
}

// LoginRequest represents login input with email and password
type LoginRequest struct {
	Email    string `json:"email"`    // User's email address
	Password string `json:"password"` // User's password
}

// LoginResponse represents login output with session token and expiry
type LoginResponse struct {
	SessionToken string    `json:"session_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// ExchangeOAuthCodeRequest represents OAuth callback input
type ExchangeOAuthCodeRequest struct {
	ProviderID  domain.ProviderType   `json:"provider_id"`
	Code        string                `json:"code"`
	RedirectURI string                `json:"redirect_uri"`
	Nonce       string                `json:"nonce"`
	OAuthConfig *oauth2.Config        `json:"-"`
	Verifier    *oidc.IDTokenVerifier `json:"-"`
}

// ExchangeOAuthCode exchanges an OAuth authorization code for a session token.
// It verifies the ID token, validates the nonce, and handles user creation or linking.
func (s *AuthService) ExchangeOAuthCode(ctx context.Context, req ExchangeOAuthCodeRequest) (*LoginResponse, error) {
	// Exchange code for token
	oauth2Token, err := req.OAuthConfig.Exchange(ctx, req.Code)
	if err != nil {
		return nil, &gtk.UnauthorizedError{Message: "failed to exchange code"}
	}

	// Extract and verify ID Token
	rawIDToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		return nil, &gtk.UnauthorizedError{Message: "no id_token in response"}
	}

	idToken, err := req.Verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, &gtk.UnauthorizedError{Message: "failed to verify id token"}
	}

	// Validate Nonce
	if idToken.Nonce != req.Nonce {
		return nil, &gtk.UnauthorizedError{Message: "nonce mismatch"}
	}

	// Extract claims
	var claims struct {
		Subject       string `json:"sub"`
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}
	if err := idToken.Claims(&claims); err != nil {
		return nil, &gtk.InternalError{Message: "failed to parse claims", Err: err}
	}

	// 1. Check if (provider, sub) exists
	providerLink, err := s.providerRepo.GetByProvider(ctx, req.ProviderID, claims.Subject)
	if err == nil {
		// Existing provider link -> Login
		_ = s.providerRepo.UpdateLastLogin(ctx, req.ProviderID, claims.Subject)
		
		sessionToken, expiresAt, err := s.createSession(ctx, providerLink.UserID)
		if err != nil {
			return nil, err
		}
		return &LoginResponse{
			SessionToken: sessionToken,
			ExpiresAt:    expiresAt,
		}, nil
	}

	if !gtk.IsNotFound(err) {
		return nil, err
	}

	// 2. Provider link not found. Check if user with email exists.
	_, err = s.userRepo.GetByEmail(ctx, claims.Email)
	if err == nil {
		// Email exists -> Conflict (instruct user to login and link)
		return nil, &gtk.ConflictError{Message: "an account with this email already exists, please login and link your provider"}
	}

	if !gtk.IsNotFound(err) {
		return nil, err
	}

	// 3. User does not exist -> Create new user and link provider
	emailPrefix := utils.GetEmailPrefix(claims.Email)
	username, err := s.generateUniqueUsername(ctx, emailPrefix)
	if err != nil {
		return nil, err
	}

	newUser := &domain.User{
		Email:    claims.Email,
		Username: &username,
		Verified: true, // OAuth providers verify emails
	}


	// Create user with empty credentials (since it's OAuth-only for now)
	if err := s.userRepo.Create(ctx, newUser, &domain.Credentials{}); err != nil {
		return nil, &gtk.InternalError{Message: "failed to create user", Err: err}
	}

	// Trigger OnUserCreated hook for new OAuth registration
	if s.hooks != nil && s.hooks.OnUserCreated != nil {
		_ = s.hooks.OnUserCreated(ctx, UserCreatedEvent{
			UserID:     newUser.ID,
			GlobalName: claims.Name,
		})
	}


	// Link provider
	providerLink = &domain.UserProvider{
		ProviderID:  req.ProviderID,
		ProviderSub: claims.Subject,
		UserID:      newUser.ID,
	}
	if err := s.providerRepo.Create(ctx, providerLink); err != nil {
		return nil, &gtk.InternalError{Message: "failed to link provider", Err: err}
	}

	// Create session
	sessionToken, expiresAt, err := s.createSession(ctx, newUser.ID)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		SessionToken: sessionToken,
		ExpiresAt:    expiresAt,
	}, nil
}

// Login authenticates a user with email and password credentials.
// Validates email and password, checks if user is verified, creates a new session token,
// and updates the user's last_login timestamp.
// Returns error if user not found, password incorrect, email not verified, or database operations fail.
func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	// Get user
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if gtk.IsNotFound(err) {
			return nil, &gtk.UnauthorizedError{Message: "invalid email or password"}
		}
		return nil, err
	}

	// Check if verified
	if !user.Verified {
		return nil, &gtk.UnauthorizedError{Message: "email not verified"}
	}

	// Verify password
	if user.Credentials == nil || !s.hasher.Verify(user.Credentials.PasswordHash, req.Password) {
		return nil, &gtk.UnauthorizedError{Message: "invalid email or password"}
	}

	// Update last login
	_ = s.userRepo.UpdateLastLogin(ctx, user.ID)

	// Create session
	sessionToken, expiresAt, err := s.createSession(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		SessionToken: sessionToken,
		ExpiresAt:    expiresAt,
	}, nil
}

// ValidateSessionRequest represents session validation input
type ValidateSessionRequest struct {
	Token string
}

// ValidateSessionResponse represents session validation output
type ValidateSessionResponse struct {
	UserID int64
	Valid  bool
}

// ValidateSession validates a session token
func (s *AuthService) ValidateSession(ctx context.Context, req ValidateSessionRequest) (*ValidateSessionResponse, error) {
	if req.Token == "" {
		return &ValidateSessionResponse{Valid: false}, nil
	}

	tokenHash := s.hashToken(req.Token)
	key := fmt.Sprintf("auth:session:validate:%s", tokenHash)

	ch := s.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)

		// Try cache first
		valid, userID, err := s.sessionCache.IsTokenValid(detachedCtx, tokenHash)
		if err == nil {
			return &ValidateSessionResponse{
				UserID: userID,
				Valid:  valid,
			}, nil
		}

		// Fall back to repository
		valid, userID, err = s.sessionRepo.IsTokenValid(detachedCtx, tokenHash)
		if err != nil {
			return nil, err
		}

		return &ValidateSessionResponse{
			UserID: userID,
			Valid:  valid,
		}, nil
	})

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			return nil, res.Err
		}
		return res.Val.(*ValidateSessionResponse), nil
	}
}

// RefreshSessionRequest represents session refresh input
type RefreshSessionRequest struct {
	Token string
}

// RefreshSessionResponse represents session refresh output
type RefreshSessionResponse struct {
	NewSessionToken string
}

// RefreshSession extends a valid session token by creating a new session token and updating the expiry.
// Invalidates the old token hash and returns a new one with extended TTL.
// Returns error if token is invalid, expired, or if database update fails.
func (s *AuthService) RefreshSession(ctx context.Context, req RefreshSessionRequest) (*RefreshSessionResponse, error) {
	if req.Token == "" {
		return nil, &gtk.UnauthorizedError{Message: "invalid token"}
	}

	tokenHash := s.hashToken(req.Token)
	session, err := s.sessionRepo.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, err
	}

	// Check if session is still valid
	if time.Now().After(session.ExpiresAt) {
		return nil, &gtk.UnauthorizedError{Message: "session expired"}
	}

	// Generate new token
	newToken, err := utils.GenerateToken(32)
	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to generate new token", Err: err}
	}

	newTokenHash := s.hashToken(newToken)
	session.TokenHash = newTokenHash
	session.ExpiresAt = time.Now().Add(s.config.SessionTTL)

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return nil, &gtk.InternalError{Message: "failed to update session", Err: err}
	}

	// Update cache: invalidate old token and cache new token (best-effort)
	_ = s.sessionCache.InvalidateSessionToken(ctx, tokenHash)
	_ = s.sessionCache.SetSession(ctx, newTokenHash, session, s.config.SessionTTL)

	return &RefreshSessionResponse{
		NewSessionToken: newToken,
	}, nil
}

// LogoutRequest represents logout input (empty, token from context)
type LogoutRequest struct {
	Token string
}

// LogoutResponse represents logout output
type LogoutResponse struct {
	Message string `json:"message"`
}

// Logout soft-deletes the user's current session, making the token invalid for future use.
// The session record is kept in the database with deleted_at timestamp for audit purposes.
// Physically deleted sessions are cleaned up by the cleanup worker.
// Returns error if token is invalid or if soft delete operation fails.
func (s *AuthService) Logout(ctx context.Context, req LogoutRequest) (*LogoutResponse, error) {
	if req.Token == "" {
		return nil, &gtk.UnauthorizedError{Message: "invalid token"}
	}

	tokenHash := s.hashToken(req.Token)

	// Get session to find its ID
	session, err := s.sessionRepo.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, err
	}

	// Check if session is still valid
	if time.Now().After(session.ExpiresAt) {
		return nil, &gtk.UnauthorizedError{Message: "session expired"}
	}

	// Soft delete the session
	if err := s.sessionRepo.SoftDelete(ctx, session.ID); err != nil {
		return nil, &gtk.InternalError{Message: "failed to logout", Err: err}
	}

	// Invalidate session in cache (best-effort)
	_ = s.sessionCache.InvalidateSessionToken(ctx, tokenHash)

	return &LogoutResponse{
		Message: "logout successful",
	}, nil
}

// ForgotPasswordRequest represents forgot password input with email
type ForgotPasswordRequest struct {
	Email string // User's email address
}

// ForgotPasswordResponse represents forgot password output with OTP hash
type ForgotPasswordResponse struct {
	Message string // Confirmation message
	OTPHash string // Unique OTP hash to be sent back during reset
}

// ForgotPassword initiates password reset by generating and sending OTP to user's email.
// Similar to Signup but uses purpose=2 to distinguish from email verification OTPs.
// OTP expires in 10 minutes.
// Returns error if email doesn't exist or database operations fail.
func (s *AuthService) ForgotPassword(ctx context.Context, req ForgotPasswordRequest) (*ForgotPasswordResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if gtk.IsNotFound(err) {
			// Return generic message to avoid email enumeration
			return &ForgotPasswordResponse{
				Message: "if email exists, reset link will be sent",
				OTPHash: "",
			}, nil
		}
		return nil, err
	}

	// Generate OTP code
	otp, err := utils.GenerateOTP(s.config.OTPLength)
	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to generate otp", Err: err}
	}

	// Generate random hash for OTP identification
	otpHash, err := utils.GenerateToken(32)
	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to generate otp hash", Err: err}
	}

	// Hash the OTP code for verification
	hashedCode, err := s.hasher.Hash(otp)
	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to process otp", Err: err}
	}

	// Soft delete any existing forgot password OTP for this user
	_ = s.otpRepo.SoftDeleteByUserIDAndPurpose(ctx, user.ID, domain.OTPPurposeResetPassword)

	// Create new OTP record with purpose=forgot password
	otpRecord := &domain.OTP{
		UserID:     user.ID,
		OTPHash:    otpHash,
		HashedCode: hashedCode,
		Purpose:    domain.OTPPurposeResetPassword,
		ExpiresAt:  time.Now().Add(s.config.OTPExpiry),
	}

	if err := s.otpRepo.Create(ctx, otpRecord); err != nil {
		return nil, &gtk.InternalError{Message: "failed to store otp", Err: err}
	}

	// Enqueue email task with OTP details
	emailBody := fmt.Sprintf("Your password reset OTP is: %s\n\nThis code expires in 10 minutes.", otp)
	s.config.EmailPool.Enqueue(worker.EmailTask{
		Recipient: req.Email,
		Subject:   "Reset Your Password",
		Body:      emailBody,
	})

	return &ForgotPasswordResponse{
		Message: "if email exists, reset link will be sent",
		OTPHash: otpHash,
	}, nil
}

// ResetPasswordRequest represents password reset input
type ResetPasswordRequest struct {
	OTPHash  string // OTP hash received from forgot password
	Code     string // OTP code sent to email
	Password string // New password
}

// ResetPasswordResponse represents password reset output
type ResetPasswordResponse struct {
	Message string // Confirmation message
}

// ResetPassword verifies the OTP and resets the user's password.
// User must provide the OTP hash and code from the forgot password flow.
// Returns error if OTP is invalid, expired, or password update fails.
func (s *AuthService) ResetPassword(ctx context.Context, req ResetPasswordRequest) (*ResetPasswordResponse, error) {
	if req.OTPHash == "" {
		return nil, &gtk.ValidationError{Message: "otp hash is required", Field: "otp_hash"}
	}

	// Get OTP by hash and purpose (forgot password)
	otpRecord, err := s.otpRepo.GetByOTPHash(ctx, req.OTPHash, domain.OTPPurposeResetPassword)
	if err != nil {
		return nil, err
	}

	userID := otpRecord.UserID

	// Check expiry
	if time.Now().After(otpRecord.ExpiresAt) {
		return nil, &gtk.UnauthorizedError{Message: "otp has expired"}
	}

	// Verify OTP code
	if !s.hasher.Verify(otpRecord.HashedCode, req.Code) {
		return nil, &gtk.UnauthorizedError{Message: "invalid otp code"}
	}

	// Hash new password
	newPasswordHash, err := s.hasher.Hash(req.Password)
	if err != nil {
		return nil, &gtk.InternalError{Message: "failed to process password", Err: err}
	}

	// Update password in transaction
	if err := s.userRepo.UpdatePassword(ctx, userID, newPasswordHash); err != nil {
		return nil, &gtk.InternalError{Message: "failed to reset password", Err: err}
	}

	// Soft delete the OTP
	if err := s.otpRepo.SoftDeleteByOTPHash(ctx, req.OTPHash, domain.OTPPurposeResetPassword); err != nil {
		return nil, &gtk.InternalError{Message: "failed to clean up otp", Err: err}
	}

	return &ResetPasswordResponse{
		Message: "password reset successfully",
	}, nil
}

// Private helper methods

func (s *AuthService) generateUniqueUsername(ctx context.Context, emailPrefix string) (string, error) {
	const maxRetries = 10

	for i := 0; i < maxRetries; i++ {
		username, err := utils.GenerateUsername(emailPrefix, 1)
		if err != nil {
			return "", err
		}

		exists, err := s.userRepo.ExistsUsername(ctx, username)
		if err != nil {
			return "", err
		}

		if !exists {
			return username, nil
		}
	}

	return "", &gtk.InternalError{
		Message: fmt.Sprintf("failed to generate unique username after %d retries", maxRetries),
	}
}

func (s *AuthService) hashToken(token string) string {
	hash := sha256.Sum256([]byte(token + s.config.SecretKey))
	return hex.EncodeToString(hash[:])
}

func (s *AuthService) createSession(ctx context.Context, userID int64) (string, time.Time, error) {
	sessionToken, err := utils.GenerateToken(32)
	if err != nil {
		return "", time.Time{}, &gtk.InternalError{Message: "failed to generate session token", Err: err}
	}

	tokenHash := s.hashToken(sessionToken)
	expiresAt := time.Now().Add(s.config.SessionTTL)

	session := &domain.Session{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return "", time.Time{}, &gtk.InternalError{Message: "failed to create session", Err: err}
	}

	// Cache the new session (best-effort, failures are non-fatal)
	_ = s.sessionCache.SetSession(ctx, tokenHash, session, s.config.SessionTTL)

	return sessionToken, expiresAt, nil
}
