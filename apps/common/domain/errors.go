package domain

import "fmt"

// Custom error types

// ValidationError represents validation failures
type ValidationError struct {
	Message string
	Field   string
}

func (e *ValidationError) Error() string {
	if e.Field != "" {
		return fmt.Sprintf("validation error on field %s: %s", e.Field, e.Message)
	}
	return fmt.Sprintf("validation error: %s", e.Message)
}

// ConflictError represents resource conflict
type ConflictError struct {
	Message string
}

func (e *ConflictError) Error() string {
	return fmt.Sprintf("conflict: %s", e.Message)
}

// NotFoundError represents missing resource
type NotFoundError struct {
	Message string
}

func (e *NotFoundError) Error() string {
	return fmt.Sprintf("not found: %s", e.Message)
}

// UnauthorizedError represents authentication failures
type UnauthorizedError struct {
	Message string
}

func (e *UnauthorizedError) Error() string {
	return fmt.Sprintf("unauthorized: %s", e.Message)
}

// ForbiddenError represents authorization failures
type ForbiddenError struct {
	Message string
}

func (e *ForbiddenError) Error() string {
	return fmt.Sprintf("forbidden: %s", e.Message)
}

// InternalError represents internal server errors
type InternalError struct {
	Message string
	Err     error
}

func (e *InternalError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("internal error: %s (%v)", e.Message, e.Err)
	}
	return fmt.Sprintf("internal error: %s", e.Message)
}

// Error type checkers
func IsConflict(err error) bool {
	_, ok := err.(*ConflictError)
	return ok
}

func IsNotFound(err error) bool {
	_, ok := err.(*NotFoundError)
	return ok
}

func IsUnauthorized(err error) bool {
	_, ok := err.(*UnauthorizedError)
	return ok
}

func IsForbidden(err error) bool {
	_, ok := err.(*ForbiddenError)
	return ok
}

func IsValidation(err error) bool {
	_, ok := err.(*ValidationError)
	return ok
}
