package service

import (
	"context"

	"github.com/arpansaha13/goauthkit/pb"
)

// IAuthServiceClient defines the interface for auth service client operations.
type IAuthServiceClient interface {
	ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error)
	GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error)
	Close() error
}
