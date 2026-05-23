package repository

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
)

// IUserRepository defines the interface for user repository operations
type IUserRepository interface {
	Create(ctx context.Context, user *domain.User, credentials *domain.Credentials) error
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, userID int64) (*domain.User, error)
	GetByUsername(ctx context.Context, username string) (*domain.User, error)
	UpdateVerified(ctx context.Context, userID int64, username string) error
	UpdateLastLogin(ctx context.Context, userID int64) error
	UpdatePassword(ctx context.Context, userID int64, newPasswordHash string) error
	ExistsUsername(ctx context.Context, username string) (bool, error)
	ExistsEmail(ctx context.Context, email string) (bool, error)
	Delete(ctx context.Context, userID int64) error
}

// IOTPRepository defines the interface for OTP repository operations
type IOTPRepository interface {
	Create(ctx context.Context, otp *domain.OTP) error
	GetByOTPHash(ctx context.Context, otpHash string, purpose domain.OTPPurpose) (*domain.OTP, error)
	GetByUserIDAndPurpose(ctx context.Context, userID int64, purpose domain.OTPPurpose) (*domain.OTP, error)
	SoftDeleteByOTPHash(ctx context.Context, otpHash string, purpose domain.OTPPurpose) error
	SoftDeleteByUserIDAndPurpose(ctx context.Context, userID int64, purpose domain.OTPPurpose) error
	DeleteExpiredAndSoftDeleted(ctx context.Context) error
}

// ISessionRepository defines the interface for session repository operations
type ISessionRepository interface {
	Create(ctx context.Context, session *domain.Session) error
	GetByTokenHash(ctx context.Context, tokenHash string) (*domain.Session, error)
	GetByUserID(ctx context.Context, userID int64) ([]domain.Session, error)
	Update(ctx context.Context, session *domain.Session) error
	Delete(ctx context.Context, sessionID int64) error
	SoftDelete(ctx context.Context, sessionID int64) error
	SoftDeleteByUserID(ctx context.Context, userID int64) error
	DeleteExpiredAndSoftDeleted(ctx context.Context) error
	IsTokenValid(ctx context.Context, tokenHash string) (bool, int64, error)
}

// IProviderRepository defines the interface for user provider repository operations
type IProviderRepository interface {
	Create(ctx context.Context, provider *domain.UserProvider) error
	GetByProvider(ctx context.Context, providerID domain.ProviderType, providerSub string) (*domain.UserProvider, error)
	UpdateLastLogin(ctx context.Context, providerID domain.ProviderType, providerSub string) error
}

// Compile-time checks to ensure structs implement their interfaces
var (
	_ IUserRepository     = (*UserRepository)(nil)
	_ IOTPRepository      = (*OTPRepository)(nil)
	_ ISessionRepository  = (*SessionRepository)(nil)
	_ IProviderRepository = (*ProviderRepository)(nil)
)
