package utils

import (
	"testing"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/domain"
	"github.com/stretchr/testify/assert"
)

func TestValidator_ValidateEmail(t *testing.T) {
	v := NewValidator()

	tests := []struct {
		name    string
		email   string
		wantErr bool
	}{
		{"Valid email", "test@example.com", false},
		{"Valid email with dots", "user.name@domain.co.uk", false},
		{"Missing @", "testexample.com", true},
		{"Missing domain", "test@", true},
		{"Invalid characters", "test!#@example.com", true},
		{"Empty string", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateEmail(tt.email)
			if tt.wantErr {
				assert.Error(t, err)
				assert.IsType(t, &domain.ValidationError{}, err)
				assert.Equal(t, "email", err.(*domain.ValidationError).Field)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidator_ValidateUsername(t *testing.T) {
	v := NewValidator()

	tests := []struct {
		name     string
		username string
		wantErr  bool
	}{
		{"Valid username", "gopher_123", false},
		{"Valid with hyphens", "chat-user", false},
		{"Too short", "ab", true},
		{"Too long", "this_is_a_very_long_username_that_exceeds_fifty_characters_limit", true},
		{"Invalid symbols", "user@name", true},
		{"Spaces not allowed", "user name", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateUsername(tt.username)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Equal(t, "username", err.(*domain.ValidationError).Field)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidator_ValidatePassword(t *testing.T) {
	v := NewValidator()

	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"Valid password", "secret123", false},
		{"Minimum length", "12345678", false},
		{"Too short", "1234567", true},
		{"Empty", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidatePassword(tt.password)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Equal(t, "password", err.(*domain.ValidationError).Field)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidator_ValidateNotEmpty(t *testing.T) {
	v := NewValidator()

	t.Run("Empty string returns error", func(t *testing.T) {
		err := v.ValidateNotEmpty("description", "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "description is required")
	})

	t.Run("Non-empty string passes", func(t *testing.T) {
		err := v.ValidateNotEmpty("description", "hello")
		assert.NoError(t, err)
	})
}

func TestValidator_ValidateChatMessage(t *testing.T) {
	v := NewValidator()

	t.Run("Valid message", func(t *testing.T) {
		err := v.ValidateChatMessage("Hello world!")
		assert.NoError(t, err)
	})

	t.Run("Empty message", func(t *testing.T) {
		err := v.ValidateChatMessage("")
		assert.Error(t, err)
	})

	t.Run("Message too long", func(t *testing.T) {
		longMsg := make([]byte, 5001)
		for i := range longMsg {
			longMsg[i] = 'a'
		}
		err := v.ValidateChatMessage(string(longMsg))
		assert.Error(t, err)
	})
}
