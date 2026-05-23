package mocks

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
)

// MockUserRepository is a mock implementation of IUserRepository
type MockUserRepository struct {
	CreateFunc          func(ctx context.Context, user *domain.User, credentials *domain.Credentials) error
	GetByEmailFunc      func(ctx context.Context, email string) (*domain.User, error)
	GetByIDFunc         func(ctx context.Context, userID int64) (*domain.User, error)
	GetByUsernameFunc   func(ctx context.Context, username string) (*domain.User, error)
	UpdateVerifiedFunc  func(ctx context.Context, userID int64, username string) error
	UpdateLastLoginFunc func(ctx context.Context, userID int64) error
	UpdatePasswordFunc  func(ctx context.Context, userID int64, newPasswordHash string) error
	ExistsUsernameFunc  func(ctx context.Context, username string) (bool, error)
	ExistsEmailFunc     func(ctx context.Context, email string) (bool, error)
	DeleteFunc          func(ctx context.Context, userID int64) error
}

func (m *MockUserRepository) Create(ctx context.Context, user *domain.User, credentials *domain.Credentials) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, user, credentials)
	}
	return nil
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	if m.GetByEmailFunc != nil {
		return m.GetByEmailFunc(ctx, email)
	}
	return nil, nil
}

func (m *MockUserRepository) GetByID(ctx context.Context, userID int64) (*domain.User, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, userID)
	}
	return nil, nil
}

func (m *MockUserRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	if m.GetByUsernameFunc != nil {
		return m.GetByUsernameFunc(ctx, username)
	}
	return nil, nil
}

func (m *MockUserRepository) UpdateVerified(ctx context.Context, userID int64, username string) error {
	if m.UpdateVerifiedFunc != nil {
		return m.UpdateVerifiedFunc(ctx, userID, username)
	}
	return nil
}

func (m *MockUserRepository) UpdateLastLogin(ctx context.Context, userID int64) error {
	if m.UpdateLastLoginFunc != nil {
		return m.UpdateLastLoginFunc(ctx, userID)
	}
	return nil
}

func (m *MockUserRepository) UpdatePassword(ctx context.Context, userID int64, newPasswordHash string) error {
	if m.UpdatePasswordFunc != nil {
		return m.UpdatePasswordFunc(ctx, userID, newPasswordHash)
	}
	return nil
}

func (m *MockUserRepository) ExistsUsername(ctx context.Context, username string) (bool, error) {
	if m.ExistsUsernameFunc != nil {
		return m.ExistsUsernameFunc(ctx, username)
	}
	return false, nil
}

func (m *MockUserRepository) ExistsEmail(ctx context.Context, email string) (bool, error) {
	if m.ExistsEmailFunc != nil {
		return m.ExistsEmailFunc(ctx, email)
	}
	return false, nil
}

func (m *MockUserRepository) Delete(ctx context.Context, userID int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, userID)
	}
	return nil
}

// MockOTPRepository is a mock implementation of IOTPRepository
type MockOTPRepository struct {
	CreateFunc                       func(ctx context.Context, otp *domain.OTP) error
	GetByOTPHashFunc                 func(ctx context.Context, otpHash string, purpose domain.OTPPurpose) (*domain.OTP, error)
	GetByUserIDAndPurposeFunc        func(ctx context.Context, userID int64, purpose domain.OTPPurpose) (*domain.OTP, error)
	SoftDeleteByOTPHashFunc          func(ctx context.Context, otpHash string, purpose domain.OTPPurpose) error
	SoftDeleteByUserIDAndPurposeFunc func(ctx context.Context, userID int64, purpose domain.OTPPurpose) error
	DeleteExpiredAndSoftDeletedFunc  func(ctx context.Context) error
}

func (m *MockOTPRepository) Create(ctx context.Context, otp *domain.OTP) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, otp)
	}
	return nil
}

func (m *MockOTPRepository) GetByOTPHash(ctx context.Context, otpHash string, purpose domain.OTPPurpose) (*domain.OTP, error) {
	if m.GetByOTPHashFunc != nil {
		return m.GetByOTPHashFunc(ctx, otpHash, purpose)
	}
	return nil, nil
}

func (m *MockOTPRepository) GetByUserIDAndPurpose(ctx context.Context, userID int64, purpose domain.OTPPurpose) (*domain.OTP, error) {
	if m.GetByUserIDAndPurposeFunc != nil {
		return m.GetByUserIDAndPurposeFunc(ctx, userID, purpose)
	}
	return nil, nil
}

func (m *MockOTPRepository) SoftDeleteByOTPHash(ctx context.Context, otpHash string, purpose domain.OTPPurpose) error {
	if m.SoftDeleteByOTPHashFunc != nil {
		return m.SoftDeleteByOTPHashFunc(ctx, otpHash, purpose)
	}
	return nil
}

func (m *MockOTPRepository) SoftDeleteByUserIDAndPurpose(ctx context.Context, userID int64, purpose domain.OTPPurpose) error {
	if m.SoftDeleteByUserIDAndPurposeFunc != nil {
		return m.SoftDeleteByUserIDAndPurposeFunc(ctx, userID, purpose)
	}
	return nil
}

func (m *MockOTPRepository) DeleteExpiredAndSoftDeleted(ctx context.Context) error {
	if m.DeleteExpiredAndSoftDeletedFunc != nil {
		return m.DeleteExpiredAndSoftDeletedFunc(ctx)
	}
	return nil
}

// MockSessionRepository is a mock implementation of ISessionRepository
type MockSessionRepository struct {
	CreateFunc                      func(ctx context.Context, session *domain.Session) error
	GetByTokenHashFunc              func(ctx context.Context, tokenHash string) (*domain.Session, error)
	GetByUserIDFunc                 func(ctx context.Context, userID int64) ([]domain.Session, error)
	UpdateFunc                      func(ctx context.Context, session *domain.Session) error
	DeleteFunc                      func(ctx context.Context, sessionID int64) error
	SoftDeleteFunc                  func(ctx context.Context, sessionID int64) error
	SoftDeleteByUserIDFunc          func(ctx context.Context, userID int64) error
	DeleteExpiredAndSoftDeletedFunc func(ctx context.Context) error
	IsTokenValidFunc                func(ctx context.Context, tokenHash string) (bool, int64, error)
}

func (m *MockSessionRepository) Create(ctx context.Context, session *domain.Session) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, session)
	}
	return nil
}

func (m *MockSessionRepository) GetByTokenHash(ctx context.Context, tokenHash string) (*domain.Session, error) {
	if m.GetByTokenHashFunc != nil {
		return m.GetByTokenHashFunc(ctx, tokenHash)
	}
	return nil, nil
}

func (m *MockSessionRepository) GetByUserID(ctx context.Context, userID int64) ([]domain.Session, error) {
	if m.GetByUserIDFunc != nil {
		return m.GetByUserIDFunc(ctx, userID)
	}
	return nil, nil
}

func (m *MockSessionRepository) Update(ctx context.Context, session *domain.Session) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, session)
	}
	return nil
}

func (m *MockSessionRepository) Delete(ctx context.Context, sessionID int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, sessionID)
	}
	return nil
}

func (m *MockSessionRepository) SoftDelete(ctx context.Context, sessionID int64) error {
	if m.SoftDeleteFunc != nil {
		return m.SoftDeleteFunc(ctx, sessionID)
	}
	return nil
}

func (m *MockSessionRepository) SoftDeleteByUserID(ctx context.Context, userID int64) error {
	if m.SoftDeleteByUserIDFunc != nil {
		return m.SoftDeleteByUserIDFunc(ctx, userID)
	}
	return nil
}

func (m *MockSessionRepository) DeleteExpiredAndSoftDeleted(ctx context.Context) error {
	if m.DeleteExpiredAndSoftDeletedFunc != nil {
		return m.DeleteExpiredAndSoftDeletedFunc(ctx)
	}
	return nil
}

func (m *MockSessionRepository) IsTokenValid(ctx context.Context, tokenHash string) (bool, int64, error) {
	if m.IsTokenValidFunc != nil {
		return m.IsTokenValidFunc(ctx, tokenHash)
	}
	return false, 0, nil
}

// MockProviderRepository is a mock implementation of IProviderRepository
type MockProviderRepository struct {
	CreateFunc          func(ctx context.Context, provider *domain.UserProvider) error
	GetByProviderFunc   func(ctx context.Context, providerID domain.ProviderType, providerSub string) (*domain.UserProvider, error)
	UpdateLastLoginFunc func(ctx context.Context, providerID domain.ProviderType, providerSub string) error
}

func (m *MockProviderRepository) Create(ctx context.Context, provider *domain.UserProvider) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, provider)
	}
	return nil
}

func (m *MockProviderRepository) GetByProvider(ctx context.Context, providerID domain.ProviderType, providerSub string) (*domain.UserProvider, error) {
	if m.GetByProviderFunc != nil {
		return m.GetByProviderFunc(ctx, providerID, providerSub)
	}
	return nil, nil
}

func (m *MockProviderRepository) UpdateLastLogin(ctx context.Context, providerID domain.ProviderType, providerSub string) error {
	if m.UpdateLastLoginFunc != nil {
		return m.UpdateLastLoginFunc(ctx, providerID, providerSub)
	}
	return nil
}
