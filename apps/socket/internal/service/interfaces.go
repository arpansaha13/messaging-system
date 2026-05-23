package service

import (
	"context"

	"github.com/arpansaha13/goauthkit/pb"
)

// IAuthServiceClient defines the auth service operations needed by the socket server.
type IAuthServiceClient interface {
	ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error)
	GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error)
	Close() error
}
