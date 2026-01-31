package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend-go/tests/mocks"
)

func TestInviteService_SendInvite(t *testing.T) {
	tests := []struct {
		name           string
		groupID        int64
		userID         int64
		invitedBy      int64
		mockInviteRepo func() *mocks.MockInviteRepository
		mockGroupRepo  func() *mocks.MockGroupRepository
		mockUserRepo   func() *mocks.MockUserRepository
		expectedError  bool
		validateResp   func(t *testing.T, invite *domain.Invite)
	}{
		{
			name:      "successful send invite",
			groupID:   1,
			userID:    2,
			invitedBy: 1,
			mockInviteRepo: func() *mocks.MockInviteRepository {
				return &mocks.MockInviteRepository{
					CreateFunc: func(ctx context.Context, invite *domain.Invite) error {
						invite.ID = 1
						return nil
					},
				}
			},
			mockGroupRepo: func() *mocks.MockGroupRepository {
				return &mocks.MockGroupRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.Group, error) {
						return &domain.Group{
							ID:        1,
							Name:      "developers",
							FounderID: 1,
						}, nil
					},
				}
			},
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         id,
							GlobalName: "User " + string(rune(id)),
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, invite *domain.Invite) {
				assert.NotNil(t, invite)
				assert.Equal(t, int64(1), invite.GroupID)
				assert.Equal(t, "pending", invite.Status)
			},
		},
		{
			name:      "group not found",
			groupID:   999,
			userID:    2,
			invitedBy: 1,
			mockInviteRepo: func() *mocks.MockInviteRepository {
				return &mocks.MockInviteRepository{}
			},
			mockGroupRepo: func() *mocks.MockGroupRepository {
				return &mocks.MockGroupRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.Group, error) {
						return nil, &domain.NotFoundError{Message: "group not found"}
					},
				}
			},
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{}
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockInviteRepo := tt.mockInviteRepo()
			mockGroupRepo := tt.mockGroupRepo()
			mockUserRepo := tt.mockUserRepo()

			svc := service.NewInviteService(mockInviteRepo, mockGroupRepo, mockUserRepo)

			invite, err := svc.SendInvite(context.Background(), tt.groupID, tt.userID, tt.invitedBy)

			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, invite)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, invite)
			}
		})
	}
}

func TestInviteService_GetInvites(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		mockFunc      func() *mocks.MockInviteRepository
		expectedError bool
		validateResp  func(t *testing.T, invites []*domain.Invite)
	}{
		{
			name:   "successful get invites",
			userID: 1,
			mockFunc: func() *mocks.MockInviteRepository {
				return &mocks.MockInviteRepository{
					GetUserInvitesFunc: func(ctx context.Context, userID int64) ([]*domain.Invite, error) {
						return []*domain.Invite{
							{
								ID:        1,
								GroupID:   1,
								UserID:    userID,
								InvitedBy: 2,
								Status:    "pending",
							},
							{
								ID:        2,
								GroupID:   2,
								UserID:    userID,
								InvitedBy: 3,
								Status:    "pending",
							},
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, invites []*domain.Invite) {
				assert.Equal(t, 2, len(invites))
				assert.Equal(t, "pending", invites[0].Status)
				assert.Equal(t, "pending", invites[1].Status)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			svc := service.NewInviteService(mockRepo, &mocks.MockGroupRepository{}, &mocks.MockUserRepository{})

			invites, err := svc.GetInvites(context.Background(), tt.userID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, invites)
			}
		})
	}
}
