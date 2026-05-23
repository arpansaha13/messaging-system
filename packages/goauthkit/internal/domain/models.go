package domain

import (
	"time"

	"gorm.io/gorm"
)

// ProviderType represents the type of OAuth provider
type ProviderType int16

const (
	ProviderTypeGoogle ProviderType = 1
)

// User represents the users table
type User struct {
	ID        int64   `gorm:"primaryKey;autoIncrement"`
	Email     string  `gorm:"type:varchar(255);uniqueIndex;not null"`
	Username   *string `gorm:"type:varchar(100);uniqueIndex"`
	Verified   bool    `gorm:"default:false;not null"`
	LastLogin *time.Time
	CreatedAt time.Time

	// Relations
	Credentials *Credentials `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
	OTP         *OTP         `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
	Sessions    []Session    `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName specifies the table name for the User model
func (User) TableName() string {
	return "users"
}

// Credentials represents the credentials table (one-to-one)
type Credentials struct {
	UserID       int64  `gorm:"primaryKey;references:ID"`
	PasswordHash string `gorm:"type:varchar(255);not null"`

	// Relation
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName specifies the table name for the Credentials model
func (Credentials) TableName() string {
	return "credentials"
}

// OTPPurpose defines the purpose of an OTP code
type OTPPurpose int16

const (
	OTPPurposeSignupVerification OTPPurpose = 1 // For email verification during signup
	OTPPurposeResetPassword      OTPPurpose = 2 // For password reset
)

// OTP represents the otps table (one-to-one)
type OTP struct {
	ID         int64      `gorm:"primaryKey;autoIncrement"`
	UserID     int64      `gorm:"not null;index"`
	OTPHash    string     `gorm:"type:varchar(255);uniqueIndex;not null"`
	HashedCode string     `gorm:"type:varchar(255);not null"`
	Purpose    OTPPurpose `gorm:"not null;default:1;index"`
	ExpiresAt  time.Time  `gorm:"not null"`
	DeletedAt  *time.Time `gorm:"type:timestamp with time zone" json:"deleted_at,omitempty"` // Soft delete
	CreatedAt  time.Time  `gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relation
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName specifies the table name for the OTP model
func (OTP) TableName() string {
	return "otps"
}

// Session represents the sessions table
type Session struct {
	ID        int64      `gorm:"primaryKey;autoIncrement"`
	UserID    int64      `gorm:"not null;index"`
	TokenHash string     `gorm:"type:varchar(255);uniqueIndex;not null"`
	ExpiresAt time.Time  `gorm:"not null"`
	DeletedAt *time.Time `gorm:"type:timestamp with time zone" json:"deleted_at,omitempty"` // Soft delete
	CreatedAt time.Time  `gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relation
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// UserProvider represents the user_providers table
type UserProvider struct {
	ProviderID  ProviderType `gorm:"primaryKey;type:smallint"`
	ProviderSub string    `gorm:"primaryKey;type:varchar(255)"`
	UserID      int64     `gorm:"not null;uniqueIndex:idx_provider_user"`
	LastLoginAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt   time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relation
	User *User `gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
}

// TableName specifies the table name for the UserProvider model
func (UserProvider) TableName() string {
	return "user_providers"
}

// TableName specifies the table name for the Session model
func (Session) TableName() string {
	return "sessions"
}

// AutoMigrate runs auto migrations (should not be used - migrations are manual)
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Credentials{},
		&OTP{},
		&Session{},
		&UserProvider{},
	)
}
