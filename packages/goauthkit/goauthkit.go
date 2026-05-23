package goauthkit

import (
	"fmt"
	"net/http"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/sony/gobreaker/v2"
	"google.golang.org/grpc"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	iccache "github.com/arpansaha13/messaging-system/packages/goauthkit/internal/cache"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/controller"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/middleware"
	irepo "github.com/arpansaha13/messaging-system/packages/goauthkit/internal/repository"
	isvc "github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	iutil "github.com/arpansaha13/messaging-system/packages/goauthkit/internal/utils"
	iworker "github.com/arpansaha13/messaging-system/packages/goauthkit/internal/worker"
)

// ============================================================================
// Error Types
// ============================================================================

// ValidationError represents validation failures
type ValidationError = gtk.ValidationError

// ConflictError represents resource conflict (e.g., duplicate email)
type ConflictError = gtk.ConflictError

// NotFoundError represents missing resource
type NotFoundError = gtk.NotFoundError

// UnauthorizedError represents authentication failures
type UnauthorizedError = gtk.UnauthorizedError

// ForbiddenError represents authorization failures
type ForbiddenError = gtk.ForbiddenError

// ServiceUnavailableError represents service dependency outages
type ServiceUnavailableError = gtk.ServiceUnavailableError

// InternalError represents unexpected server errors
type InternalError = gtk.InternalError

// IsConflict checks if an error is a ConflictError
func IsConflict(err error) bool {
	return gtk.IsConflict(err)
}

// IsNotFound checks if an error is a NotFoundError
func IsNotFound(err error) bool {
	return gtk.IsNotFound(err)
}

// IsUnauthorized checks if an error is an UnauthorizedError
func IsUnauthorized(err error) bool {
	return gtk.IsUnauthorized(err)
}

// IsForbidden checks if an error is a ForbiddenError
func IsForbidden(err error) bool {
	return gtk.IsForbidden(err)
}

// IsValidation checks if an error is a ValidationError
func IsValidation(err error) bool {
	return gtk.IsValidation(err)
}

// IsServiceUnavailable checks if an error is a ServiceUnavailableError
func IsServiceUnavailable(err error) bool {
	return gtk.IsServiceUnavailable(err)
}

// ============================================================================
// Service Exports
// ============================================================================

// Interfaces
type IAuthService = isvc.IAuthService

// Service implementations
type AuthService = isvc.AuthService
type AuthServiceConfig = isvc.AuthServiceConfig
type UserCreatedEvent = isvc.UserCreatedEvent
type AuthServiceHooks = isvc.AuthServiceHooks

// Request/Response types
type SignupRequest = isvc.SignupRequest
type SignupResponse = isvc.SignupResponse
type VerifyOTPRequest = isvc.VerifyOTPRequest
type VerifyOTPResponse = isvc.VerifyOTPResponse
type LoginRequest = isvc.LoginRequest
type LoginResponse = isvc.LoginResponse

type ProviderType = domain.ProviderType

const (
	ProviderTypeGoogle = domain.ProviderTypeGoogle
)

type ExchangeOAuthCodeRequest = isvc.ExchangeOAuthCodeRequest
type ValidateSessionRequest = isvc.ValidateSessionRequest
type ValidateSessionResponse = isvc.ValidateSessionResponse
type RefreshSessionRequest = isvc.RefreshSessionRequest
type RefreshSessionResponse = isvc.RefreshSessionResponse
type LogoutRequest = isvc.LogoutRequest
type LogoutResponse = isvc.LogoutResponse
type ForgotPasswordRequest = isvc.ForgotPasswordRequest
type ForgotPasswordResponse = isvc.ForgotPasswordResponse
type ResetPasswordRequest = isvc.ResetPasswordRequest
type ResetPasswordResponse = isvc.ResetPasswordResponse
type GetUserRequest = isvc.GetUserRequest
type GetUserResponse = isvc.GetUserResponse
type GetUserByEmailRequest = isvc.GetUserByEmailRequest
type GetUserByEmailResponse = isvc.GetUserByEmailResponse
type DeleteUserRequest = isvc.DeleteUserRequest
type DeleteUserResponse = isvc.DeleteUserResponse

// NewAuthService creates a new auth service
func NewAuthService(
	userRepo IUserRepository,
	otpRepo IOTPRepository,
	sessionRepo ISessionRepository,
	providerRepo IProviderRepository,
	sessionCache ISessionCache,
	hasher *PasswordHasher,
	config AuthServiceConfig,
	hooks *AuthServiceHooks,
) IAuthService {
	return isvc.NewAuthService(userRepo, otpRepo, sessionRepo, providerRepo, sessionCache, hasher, config, hooks)
}

// ============================================================================
// Repository Exports
// ============================================================================

// Interfaces
type IUserRepository = irepo.IUserRepository
type IOTPRepository = irepo.IOTPRepository
type ISessionRepository = irepo.ISessionRepository
type IProviderRepository = irepo.IProviderRepository

// Repository implementations
type UserRepository = irepo.UserRepository
type OTPRepository = irepo.OTPRepository
type SessionRepository = irepo.SessionRepository
type ProviderRepository = irepo.ProviderRepository

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) IUserRepository {
	return irepo.NewUserRepository(db, cb)
}

// NewOTPRepository creates a new OTP repository
func NewOTPRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) IOTPRepository {
	return irepo.NewOTPRepository(db, cb)
}

// NewSessionRepository creates a new session repository
func NewSessionRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) ISessionRepository {
	return irepo.NewSessionRepository(db, cb)
}

// NewProviderRepository creates a new provider repository
func NewProviderRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) IProviderRepository {
	return irepo.NewProviderRepository(db, cb)
}

// ============================================================================
// Cache Exports
// ============================================================================

// Interfaces
type ISessionCache = iccache.ISessionCache

// Cache implementations
type MemcachedSessionCache = iccache.MemcachedSessionCache

// NewMemcachedSessionCache creates a new session cache backed by memcached client wrapper
func NewMemcachedSessionCache(client *gtk.MemcachedClient, cb *gobreaker.CircuitBreaker[any]) ISessionCache {
	return iccache.NewMemcachedSessionCache(client, cb)
}

// NewNoopSessionCache creates a new no-op session cache
func NewNoopSessionCache() ISessionCache {
	return &iccache.NoopSessionCache{}
}

// NewInMemorySessionCache creates a new in-memory session cache
func NewInMemorySessionCache() ISessionCache {
	return iccache.NewInMemorySessionCache()
}

// ============================================================================
// Utils Exports
// ============================================================================

type PasswordHasher = iutil.PasswordHasher
type Validator = iutil.Validator

// NewPasswordHasher creates a new password hasher
func NewPasswordHasher() *PasswordHasher {
	return iutil.NewPasswordHasher()
}

// NewValidator creates a new validator
func NewValidator() *Validator {
	return iutil.NewValidator()
}

// GenerateOTP generates a random OTP code
func GenerateOTP(length int) (string, error) {
	return iutil.GenerateOTP(length)
}

// GenerateToken generates a random token
func GenerateToken(length int) (string, error) {
	return iutil.GenerateToken(length)
}

// ============================================================================
// Worker Exports
// ============================================================================

// Interfaces
type EmailProvider = iworker.EmailProvider

// Worker implementations
type EmailWorkerPool = iworker.EmailWorkerPool
type MockEmailProvider = iworker.MockEmailProvider
type SMTPEmailProvider = iworker.SMTPEmailProvider

// NewEmailWorkerPool creates a new email worker pool
func NewEmailWorkerPool(poolSize, queueSize int, provider EmailProvider) *iworker.EmailWorkerPool {
	return iworker.NewEmailWorkerPool(poolSize, queueSize, provider)
}

// NewMockEmailProvider creates a new mock email provider
func NewMockEmailProvider() EmailProvider {
	return iworker.NewMockEmailProvider()
}

// NewSMTPEmailProvider creates a new SMTP email provider
func NewSMTPEmailProvider(host string, port int, user, password, from string) EmailProvider {
	return iworker.NewSMTPEmailProvider(host, port, user, password, from)
}

// ============================================================================
// Controller Exports
// ============================================================================

// Controller implementations
type AuthServiceImpl = controller.AuthServiceImpl

// NewAuthServiceImpl creates a new gRPC auth service controller
func NewAuthServiceImpl(authService IAuthService, validator *Validator) *AuthServiceImpl {
	return controller.NewAuthServiceImpl(authService, validator)
}

// HTTP Controller Exports
type CookieConfig = controller.CookieConfig
type ProviderConfig = controller.ProviderConfig

// NewSignupController creates a new HTTP signup controller
func NewSignupController(authService IAuthService, validator *Validator) gtk.ControllerFunc {
	return controller.NewSignupController(authService, validator)
}

// NewLoginController creates a new HTTP login controller
func NewLoginController(authService IAuthService, validator *Validator, cookieConfig CookieConfig) gtk.ControllerFunc {
	return controller.NewLoginController(authService, validator, cookieConfig)
}

// NewVerifyOTPController creates a new HTTP OTP verification controller
func NewVerifyOTPController(authService IAuthService, validator *Validator, cookieConfig CookieConfig) gtk.ControllerFunc {
	return controller.NewVerifyOTPController(authService, validator, cookieConfig)
}

// NewLogoutController creates a new HTTP logout controller
func NewLogoutController(authService IAuthService, cookieConfig CookieConfig) gtk.ControllerFunc {
	return controller.NewLogoutController(authService, cookieConfig)
}

// NewOAuthLoginController returns a controller that initiates the OAuth flow
func NewOAuthLoginController(providerCfg ProviderConfig) gtk.ControllerFunc {
	return controller.NewOAuthLoginController(providerCfg)
}

// NewOAuthCallbackController returns a controller that handles the OAuth callback
func NewOAuthCallbackController(authService IAuthService, providerCfg ProviderConfig, cookieConfig CookieConfig) gtk.ControllerFunc {
	return controller.NewOAuthCallbackController(authService, providerCfg, cookieConfig)
}

// ============================================================================
// Middleware Exports
// ============================================================================

// AuthorizationInterceptor intercepts gRPC requests to validate session tokens
func AuthorizationInterceptor() grpc.UnaryServerInterceptor {
	return middleware.AuthorizationInterceptor()
}

// NewAuthMiddleware returns an HTTP middleware that validates session tokens
func NewAuthMiddleware(authService IAuthService, cookieName string) func(http.Handler) http.Handler {
	return middleware.NewAuthMiddleware(authService, cookieName)
}

// ============================================================================
// Database Helpers
// ============================================================================

// InitDB initializes a PostgreSQL database connection
func InitDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	return db, nil
}

// CloseDB closes the database connection
func CloseDB(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}
	return sqlDB.Close()
}
