package utils

import (
	"fmt"
	"time"

	"github.com/go-playground/validator/v10"
)

// Validator wraps the validator library
type Validator struct {
	validate *validator.Validate
}

// NewValidator creates a new validator instance
func NewValidator() *Validator {
	return &Validator{
		validate: validator.New(),
	}
}

// SignupRequest validation
type SignupPayload struct {
	Email           string `json:"email" validate:"required,email"`
	GlobalName      string `json:"globalName" validate:"required,min=1,max=20"`
	Password        string `json:"password" validate:"required,min=8,max=30"`
	ConfirmPassword string `json:"confirmPassword" validate:"required,eqfield=Password"`
}

// LoginRequest validation
type LoginPayload struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// VerifyOTPRequest validation
type VerifyOTPPayload struct {
	OTPHash string `json:"otpHash" validate:"required,hexadecimal,len=64"`
	Code    string `json:"code" validate:"required,len=6,numeric"`
}

// Validate validates a struct
func (v *Validator) Validate(data any) error {
	return v.validate.Struct(data)
}

// ValidateEmail validates an email string
func (v *Validator) ValidateEmail(email string) error {
	return v.validate.Var(email, "required,email")
}

// ValidatePassword validates a password string
func (v *Validator) ValidatePassword(password string) error {
	if err := v.validate.Var(password, "required,min=8,max=30"); err != nil {
		return fmt.Errorf("password must be between 8 and 30 characters")
	}
	return nil
}

// ValidateOTPCode validates an OTP code
func (v *Validator) ValidateOTPCode(code string, length int) error {
	if len(code) != length {
		return fmt.Errorf("otp code must be exactly %d digits", length)
	}
	return v.validate.Var(code, "numeric")
}

// ValidateSessionTTL validates TTL duration
func ValidateSessionTTL(ttl time.Duration) error {
	if ttl < time.Minute || ttl > 24*time.Hour {
		return fmt.Errorf("session ttl must be between 1 minute and 24 hours")
	}
	return nil
}
