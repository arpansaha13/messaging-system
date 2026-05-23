package controller

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"go.uber.org/zap"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/pb"

	"google.golang.org/protobuf/types/known/timestamppb"
)

// GetUser retrieves user information by user ID
func (s *AuthServiceImpl) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
	// Validate request
	if err := s.validateGetUserRequest(req); err != nil {
		gtk.LoggerFromContext(ctx).Warn("get user validation error", zap.Error(err))
		return nil, err
	}

	// Call service
	serviceReq := service.GetUserRequest{
		UserID: req.UserId,
	}

	resp, err := s.authService.GetUser(ctx, serviceReq)
	if err != nil {
		gtk.LoggerFromContext(ctx).Error("get user error", zap.Error(err))
		return nil, err
	}

	return &pb.GetUserResponse{
		User: &pb.UserData{
			UserId:    resp.User.UserID,
			Email:     resp.User.Email,
			Username:  resp.User.Username,
			Verified:  resp.User.Verified,
			CreatedAt: timestamppb.New(resp.User.CreatedAt),
		},
	}, nil
}

// GetUserByEmail retrieves user information by email address
func (s *AuthServiceImpl) GetUserByEmail(ctx context.Context, req *pb.GetUserByEmailRequest) (*pb.GetUserByEmailResponse, error) {
	// Validate request
	if err := s.validateGetUserByEmailRequest(req); err != nil {
		gtk.LoggerFromContext(ctx).Warn("get user by email validation error", zap.Error(err))
		return nil, err
	}

	// Call service
	serviceReq := service.GetUserByEmailRequest{
		Email: req.Email,
	}

	resp, err := s.authService.GetUserByEmail(ctx, serviceReq)
	if err != nil {
		gtk.LoggerFromContext(ctx).Error("get user by email error", zap.Error(err))
		return nil, err
	}

	return &pb.GetUserByEmailResponse{
		User: &pb.UserData{
			UserId:    resp.User.UserID,
			Email:     resp.User.Email,
			Username:  resp.User.Username,
			Verified:  resp.User.Verified,
			CreatedAt: timestamppb.New(resp.User.CreatedAt),
		},
	}, nil
}

// DeleteUser deletes a user by user ID
func (s *AuthServiceImpl) DeleteUser(ctx context.Context, req *pb.DeleteUserRequest) (*pb.DeleteUserResponse, error) {
	// Validate request
	if err := s.validateDeleteUserRequest(req); err != nil {
		gtk.LoggerFromContext(ctx).Warn("delete user validation error", zap.Error(err))
		return nil, err
	}

	// Call service
	serviceReq := service.DeleteUserRequest{
		UserID: req.UserId,
	}

	resp, err := s.authService.DeleteUser(ctx, serviceReq)
	if err != nil {
		gtk.LoggerFromContext(ctx).Error("delete user error", zap.Error(err))
		return nil, err
	}

	return &pb.DeleteUserResponse{
		Message: resp.Message,
	}, nil
}

// Private helper and validation methods

func (s *AuthServiceImpl) validateGetUserRequest(req *pb.GetUserRequest) error {
	if req.UserId <= 0 {
		return &gtk.ValidationError{Message: "user_id must be greater than zero", Field: "user_id"}
	}
	return nil
}

func (s *AuthServiceImpl) validateGetUserByEmailRequest(req *pb.GetUserByEmailRequest) error {
	if req.Email == "" {
		return &gtk.ValidationError{Message: "email is required", Field: "email"}
	}
	return nil
}

func (s *AuthServiceImpl) validateDeleteUserRequest(req *pb.DeleteUserRequest) error {
	if req.UserId <= 0 {
		return &gtk.ValidationError{Message: "user_id must be greater than zero", Field: "user_id"}
	}
	return nil
}
