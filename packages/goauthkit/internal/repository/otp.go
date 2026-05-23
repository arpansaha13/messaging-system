package repository

import (
	"context"
	"errors"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/sony/gobreaker/v2"
	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
)

// OTPRepository handles OTP-related database operations
type OTPRepository struct {
	db *gorm.DB
	cb *gobreaker.CircuitBreaker[any]
}

// NewOTPRepository creates a new OTP repository
func NewOTPRepository(db *gorm.DB, cb *gobreaker.CircuitBreaker[any]) *OTPRepository {
	return &OTPRepository{db: db, cb: cb}
}

// Create creates a new OTP record
func (r *OTPRepository) Create(ctx context.Context, otp *domain.OTP) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).Create(otp).Error
	})
	return err
}

// GetByOTPHash retrieves OTP by OTP hash and purpose (excludes soft-deleted)
func (r *OTPRepository) GetByOTPHash(ctx context.Context, otpHash string, purpose domain.OTPPurpose) (*domain.OTP, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var otp domain.OTP
		err := r.db.WithContext(ctx).
			Where("otp_hash = ? AND purpose = ? AND deleted_at IS NULL", otpHash, purpose).
			First(&otp).Error
		if err != nil {
			return nil, err
		}
		return &otp, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "otp not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get otp", Err: err}
	}

	return result.(*domain.OTP), nil
}

// GetByUserIDAndPurpose retrieves OTP by user ID and purpose (excludes soft-deleted)
func (r *OTPRepository) GetByUserIDAndPurpose(ctx context.Context, userID int64, purpose domain.OTPPurpose) (*domain.OTP, error) {
	result, err := r.cb.Execute(func() (any, error) {
		var otp domain.OTP
		err := r.db.WithContext(ctx).
			Where("user_id = ? AND purpose = ? AND deleted_at IS NULL", userID, purpose).
			First(&otp).Error
		if err != nil {
			return nil, err
		}
		return &otp, nil
	})

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, &gtk.NotFoundError{Message: "otp not found"}
		}
		return nil, &gtk.InternalError{Message: "failed to get otp", Err: err}
	}

	return result.(*domain.OTP), nil
}

// SoftDelete soft-deletes an OTP record by OTP hash and purpose
func (r *OTPRepository) SoftDeleteByOTPHash(ctx context.Context, otpHash string, purpose domain.OTPPurpose) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Model(&domain.OTP{}).
			Where("otp_hash = ? AND purpose = ?", otpHash, purpose).
			Update("deleted_at", time.Now()).Error
	})
	return err
}

// SoftDeleteByUserIDAndPurpose soft-deletes an OTP record by user ID and purpose
func (r *OTPRepository) SoftDeleteByUserIDAndPurpose(ctx context.Context, userID int64, purpose domain.OTPPurpose) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Model(&domain.OTP{}).
			Where("user_id = ? AND purpose = ?", userID, purpose).
			Update("deleted_at", time.Now()).Error
	})
	return err
}

// DeleteExpiredAndSoftDeleted physically deletes expired and soft-deleted OTPs
func (r *OTPRepository) DeleteExpiredAndSoftDeleted(ctx context.Context) error {
	_, err := r.cb.Execute(func() (any, error) {
		return nil, r.db.WithContext(ctx).
			Where("expires_at < ? OR deleted_at IS NOT NULL", time.Now()).
			Delete(&domain.OTP{}).Error
	})
	return err
}
