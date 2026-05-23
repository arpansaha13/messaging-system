package service

import (
	"context"
	"fmt"
	"time"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
)

// GetUserRequest represents get user input with user ID
type GetUserRequest struct {
	UserID int64 // User ID
}

// UserData contains user information
type UserData struct {
	UserID    int64
	Email     string
	Username  string
	Verified  bool
	CreatedAt time.Time
}

// GetUserResponse represents get user output
type GetUserResponse struct {
	User UserData
}

// GetUser retrieves user information by user ID.
// Returns complete user data including email, username, and verified status.
// Returns error if user not found or database query fails.
func (s *AuthService) GetUser(ctx context.Context, req GetUserRequest) (*GetUserResponse, error) {
	key := fmt.Sprintf("auth:user:get:%d", req.UserID)
	ch := s.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)
		user, err := s.userRepo.GetByID(detachedCtx, req.UserID)
		if err != nil {
			return nil, err
		}

		username := ""
		if user.Username != nil {
			username = *user.Username
		}

		userData := UserData{
			UserID:    user.ID,
			Email:     user.Email,
			Username:  username,
			Verified:  user.Verified,
			CreatedAt: user.CreatedAt,
		}

		return &GetUserResponse{User: userData}, nil
	})

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			return nil, res.Err
		}
		return res.Val.(*GetUserResponse), nil
	}
}

// GetUserByEmailRequest represents get user by email input
type GetUserByEmailRequest struct {
	Email string // Email address
}

// GetUserByEmailResponse represents get user by email output
type GetUserByEmailResponse struct {
	User UserData
}

// GetUserByEmail retrieves user information by email.
// Used for internal lookups to find users by their email address.
// Returns error if user not found or database query fails.
func (s *AuthService) GetUserByEmail(ctx context.Context, req GetUserByEmailRequest) (*GetUserByEmailResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}

	username := ""
	if user.Username != nil {
		username = *user.Username
	}

	userData := UserData{
		UserID:    user.ID,
		Email:     user.Email,
		Username:  username,
		Verified:  user.Verified,
		CreatedAt: user.CreatedAt,
	}

	return &GetUserByEmailResponse{User: userData}, nil
}

// DeleteUserRequest represents delete user input
type DeleteUserRequest struct {
	UserID int64 // User ID to delete
}

// DeleteUserResponse represents delete user output
type DeleteUserResponse struct {
	Message string
}

// DeleteUser deletes a user and all associated data (cascade delete).
// This operation removes the user, their credentials, sessions, and OTPs.
// Returns error if user not found or database operation fails.
func (s *AuthService) DeleteUser(ctx context.Context, req DeleteUserRequest) (*DeleteUserResponse, error) {
	// Check if user exists
	_, err := s.userRepo.GetByID(ctx, req.UserID)
	if err != nil {
		return nil, err
	}

	// Delete user (cascade will handle sessions, otps, credentials)
	if err := s.userRepo.Delete(ctx, req.UserID); err != nil {
		return nil, &gtk.InternalError{Message: "failed to delete user", Err: err}
	}

	return &DeleteUserResponse{Message: "user deleted successfully"}, nil
}
