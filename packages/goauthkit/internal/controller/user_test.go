package controller

import (
	"context"
	"testing"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/pb"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/tests/mocks"
)

// TestGetUserValidation tests request validation for GetUser endpoint
func TestGetUserValidation(t *testing.T) {
	type TestCaseData struct {
		Name          string
		Request       *pb.GetUserRequest
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.GetUserRequest) (*service.GetUserResponse, error)
	}

	testCases := []TestCaseData{
		{
			Name: "Valid get user request",
			Request: &pb.GetUserRequest{
				UserId: 1,
			},
			ExpectedError: false,
			MockFunc: func(ctx context.Context, req service.GetUserRequest) (*service.GetUserResponse, error) {
				return &service.GetUserResponse{
					User: service.UserData{
						UserID:   req.UserID,
						Email:    "test@example.com",
						Username: "test_user",
					},
				}, nil
			},
		},
		{
			Name: "User ID is zero",
			Request: &pb.GetUserRequest{
				UserId: 0,
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Negative user ID",
			Request: &pb.GetUserRequest{
				UserId: -1,
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthServiceForUser{
				GetUserFunc: tc.MockFunc,
			}
			controller := newTestController(mockService)
			resp, err := controller.GetUser(context.Background(), tc.Request)

			if tc.ExpectedError {
				require.Error(t, err)
				assert.IsType(t, tc.ErrorType, err)
				assert.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				assert.NotNil(t, resp.User)
			}
		})
	}
}

// TestGetUserByEmailValidation tests request validation for GetUserByEmail endpoint
func TestGetUserByEmailValidation(t *testing.T) {
	type TestCaseData struct {
		Name          string
		Request       *pb.GetUserByEmailRequest
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.GetUserByEmailRequest) (*service.GetUserByEmailResponse, error)
	}

	testCases := []TestCaseData{
		{
			Name: "Valid get user by email request",
			Request: &pb.GetUserByEmailRequest{
				Email: "test@example.com",
			},
			ExpectedError: false,
			MockFunc: func(ctx context.Context, req service.GetUserByEmailRequest) (*service.GetUserByEmailResponse, error) {
				return &service.GetUserByEmailResponse{
					User: service.UserData{
						UserID:   1,
						Email:    req.Email,
						Username: "test_user",
					},
				}, nil
			},
		},
		{
			Name: "Missing email",
			Request: &pb.GetUserByEmailRequest{
				Email: "",
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthServiceForUser{
				GetUserByEmailFunc: tc.MockFunc,
			}
			controller := newTestController(mockService)
			resp, err := controller.GetUserByEmail(context.Background(), tc.Request)

			if tc.ExpectedError {
				require.Error(t, err)
				assert.IsType(t, tc.ErrorType, err)
				assert.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				assert.NotNil(t, resp.User)
			}
		})
	}
}

// TestDeleteUserValidation tests request validation for DeleteUser endpoint
func TestDeleteUserValidation(t *testing.T) {
	type TestCaseData struct {
		Name          string
		Request       *pb.DeleteUserRequest
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.DeleteUserRequest) (*service.DeleteUserResponse, error)
	}

	testCases := []TestCaseData{
		{
			Name: "Valid delete user request",
			Request: &pb.DeleteUserRequest{
				UserId: 1,
			},
			ExpectedError: false,
			MockFunc: func(ctx context.Context, req service.DeleteUserRequest) (*service.DeleteUserResponse, error) {
				return &service.DeleteUserResponse{Message: "user deleted successfully"}, nil
			},
		},
		{
			Name: "User ID is zero",
			Request: &pb.DeleteUserRequest{
				UserId: 0,
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
		{
			Name: "Negative user ID",
			Request: &pb.DeleteUserRequest{
				UserId: -1,
			},
			ExpectedError: true,
			ErrorType:     (*gtk.ValidationError)(nil),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthServiceForUser{
				DeleteUserFunc: tc.MockFunc,
			}
			controller := newTestController(mockService)
			resp, err := controller.DeleteUser(context.Background(), tc.Request)

			if tc.ExpectedError {
				require.Error(t, err)
				assert.IsType(t, tc.ErrorType, err)
				assert.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				assert.Equal(t, "user deleted successfully", resp.Message)
			}
		})
	}
}

// TestGetUserErrorHandling tests error handling for GetUser endpoint
func TestGetUserErrorHandling(t *testing.T) {
	type TestCaseData struct {
		Name          string
		Request       *pb.GetUserRequest
		ServiceError  error
		ExpectedError bool
		ErrorType     error
		MockFunc      func(ctx context.Context, req service.GetUserRequest) (*service.GetUserResponse, error)
	}

	testCases := []TestCaseData{
		{
			Name: "User not found error",
			Request: &pb.GetUserRequest{
				UserId: 999,
			},
			ServiceError:  &gtk.NotFoundError{Message: "user not found"},
			ExpectedError: true,
			ErrorType:     (*gtk.NotFoundError)(nil),
			MockFunc: func(ctx context.Context, req service.GetUserRequest) (*service.GetUserResponse, error) {
				return nil, &gtk.NotFoundError{Message: "user not found"}
			},
		},
		{
			Name: "Internal server error",
			Request: &pb.GetUserRequest{
				UserId: 1,
			},
			ServiceError:  &gtk.InternalError{Message: "database connection failed"},
			ExpectedError: true,
			ErrorType:     (*gtk.InternalError)(nil),
			MockFunc: func(ctx context.Context, req service.GetUserRequest) (*service.GetUserResponse, error) {
				return nil, &gtk.InternalError{Message: "database connection failed"}
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			mockService := &mocks.MockAuthServiceForUser{
				GetUserFunc: tc.MockFunc,
			}

			controller := newTestController(mockService)
			resp, err := controller.GetUser(context.Background(), tc.Request)

			require.Error(t, err)
			assert.IsType(t, tc.ErrorType, err)
			assert.Nil(t, resp)
		})
	}
}
