package mocks

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/pb"
	"github.com/arpansaha13/messaging-system/apps/user/internal/service"
	"github.com/stretchr/testify/mock"
)

type MockAuthServiceClient struct {
	mock.Mock
}

func (m *MockAuthServiceClient) ValidateSession(ctx context.Context, token string) (*pb.ValidateSessionResponse, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*pb.ValidateSessionResponse), args.Error(1)
}

func (m *MockAuthServiceClient) GetUser(ctx context.Context, userID int64, token string) (*pb.GetUserResponse, error) {
	args := m.Called(ctx, userID, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*pb.GetUserResponse), args.Error(1)
}

func (m *MockAuthServiceClient) Close() error {
	return nil
}

var _ service.IAuthServiceClient = (*MockAuthServiceClient)(nil)
