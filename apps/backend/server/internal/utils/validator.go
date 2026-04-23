package utils

import (
	"fmt"
	"regexp"

	"github.com/arpansaha13/gotoolkit/gtk"
)

// Validator provides validation utilities
type Validator struct{}

// NewValidator creates a new validator
func NewValidator() *Validator {
	return &Validator{}
}

// ValidateEmail validates email format
func (v *Validator) ValidateEmail(email string) error {
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	if match, _ := regexp.MatchString(pattern, email); !match {
		return &gtk.ValidationError{Message: "invalid email format", Field: "email"}
	}
	return nil
}

// ValidateUsername validates username format
func (v *Validator) ValidateUsername(username string) error {
	if len(username) < 3 || len(username) > 50 {
		return &gtk.ValidationError{Message: "username must be between 3 and 50 characters", Field: "username"}
	}
	pattern := `^[a-zA-Z0-9_-]+$`
	if match, _ := regexp.MatchString(pattern, username); !match {
		return &gtk.ValidationError{Message: "username can only contain alphanumeric characters, underscores, and hyphens", Field: "username"}
	}
	return nil
}

// ValidatePassword validates password strength
func (v *Validator) ValidatePassword(password string) error {
	if len(password) < 8 {
		return &gtk.ValidationError{Message: "password must be at least 8 characters", Field: "password"}
	}
	if len(password) > 128 {
		return &gtk.ValidationError{Message: "password must not exceed 128 characters", Field: "password"}
	}
	return nil
}

// ValidateNotEmpty validates that a string is not empty
func (v *Validator) ValidateNotEmpty(field, value string) error {
	if value == "" {
		return &gtk.ValidationError{Message: fmt.Sprintf("%s is required", field), Field: field}
	}
	return nil
}

// ValidateChatMessage validates a chat message
func (v *Validator) ValidateChatMessage(content string) error {
	if content == "" {
		return &gtk.ValidationError{Message: "message content is required", Field: "content"}
	}
	if len(content) > 5000 {
		return &gtk.ValidationError{Message: "message content exceeds maximum length", Field: "content"}
	}
	return nil
}
