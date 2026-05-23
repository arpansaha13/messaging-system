package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// PasswordHasher handles password hashing operations
type PasswordHasher struct {
	cost int
}

// NewPasswordHasher creates a new password hasher
func NewPasswordHasher() *PasswordHasher {
	return &PasswordHasher{
		cost: bcrypt.DefaultCost,
	}
}

// Hash hashes a password
func (ph *PasswordHasher) Hash(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), ph.cost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hash), nil
}

// Verify compares a password with its hash
func (ph *PasswordHasher) Verify(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateOTP generates a random OTP code
func GenerateOTP(length int) (string, error) {
	const digits = "0123456789"
	code := make([]byte, length)

	for i := range length {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", fmt.Errorf("failed to generate otp: %w", err)
		}
		code[i] = digits[num.Int64()]
	}

	return string(code), nil
}

// GenerateToken generates a random token for session
func GenerateToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// HashToken hashes a token (for storage)
func HashToken(token string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(token), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash token: %w", err)
	}
	return string(hash), nil
}

// GenerateUsername generates a username from email prefix and random suffix
func GenerateUsername(emailPrefix string, maxRetries int) (string, error) {
	for i := 0; i < maxRetries; i++ {
		suffix, err := GenerateOTP(6)
		if err != nil {
			return "", err
		}

		username := fmt.Sprintf("%s_%s", emailPrefix, suffix)
		if len(username) <= 100 {
			return username, nil
		}
	}

	return "", fmt.Errorf("failed to generate username after %d retries", maxRetries)
}

// IsValidEmail performs basic email validation
func IsValidEmail(email string) bool {
	if len(email) < 5 || len(email) > 255 {
		return false
	}
	// Simple check: must have @ and at least one dot after @
	atIndex := -1
	for i := 0; i < len(email); i++ {
		if email[i] == '@' {
			atIndex = i
			break
		}
	}

	if atIndex < 1 || atIndex > len(email)-5 {
		return false
	}

	afterAt := email[atIndex+1:]
	hasDot := false
	for i := 0; i < len(afterAt); i++ {
		if afterAt[i] == '.' {
			hasDot = true
			break
		}
	}

	return hasDot
}

// IsValidPassword checks password strength
func IsValidPassword(password string) bool {
	return len(password) >= 8
}

// GetEmailPrefix extracts the prefix part of an email (before @)
func GetEmailPrefix(email string) string {
	for i := 0; i < len(email); i++ {
		if email[i] == '@' {
			return email[:i]
		}
	}
	return email
}

// FormatTime formats a time to ISO 8601 string
func FormatTime(t time.Time) string {
	return t.Format(time.RFC3339)
}

// ParseTime parses an ISO 8601 string to time.Time
func ParseTime(s string) (time.Time, error) {
	return time.Parse(time.RFC3339, s)
}
