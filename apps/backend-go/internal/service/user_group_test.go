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

func TestUserGroupServiceAddUserToGroup(t *testing.T) {
	tests := []struct {
		name              string
		userID            int64
		groupID           int64
		mockUserGroupRepo func() *mocks.MockUserGroupRepository
		mockUserRepo      func() *mocks.MockUserRepository
		mockGroupRepo     func() *mocks.MockGroupRepository
		expectedError     bool
		validateResp      func(t *testing.T, userGroup *domain.UserGroup)
	}{
		{
			name:    "successful add user to group",
			userID:  2,
			groupID: 1,
			mockUserGroupRepo: func() *mocks.MockUserGroupRepository {
				return &mocks.MockUserGroupRepository{
					CreateFunc: func(ctx context.Context, userGroup *domain.UserGroup) error {
						userGroup.ID = 1
						return nil
					},
				}
			},
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{}
			},
			mockGroupRepo: func() *mocks.MockGroupRepository {
				return &mocks.MockGroupRepository{}
			},
			expectedError: false,
			validateResp: func(t *testing.T, userGroup *domain.UserGroup) {
				assert.Equal(t, int64(1), userGroup.ID)
				assert.Equal(t, int64(2), userGroup.UserID)
				assert.Equal(t, int64(1), userGroup.GroupID)
				assert.Equal(t, "member", userGroup.Role)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockUserGroupRepo := tt.mockUserGroupRepo()
			mockUserRepo := tt.mockUserRepo()
			mockGroupRepo := tt.mockGroupRepo()

			svc := service.NewUserGroupService(mockUserGroupRepo, mockUserRepo, mockGroupRepo)

			userGroup, err := svc.AddUserToGroup(context.Background(), tt.userID, tt.groupID)

			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, userGroup)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, userGroup)
			}
		})
	}
}

func TestUserGroupServiceGetGroupMembers(t *testing.T) {
	tests := []struct {
		name          string
		groupID       int64
		mockFunc      func() *mocks.MockUserGroupRepository
		expectedError bool
		validateResp  func(t *testing.T, members []*domain.UserGroup)
	}{
		{
			name:    "successful get group members",
			groupID: 1,
			mockFunc: func() *mocks.MockUserGroupRepository {
				return &mocks.MockUserGroupRepository{
					GetGroupMembersFunc: func(ctx context.Context, groupID int64) ([]*domain.UserGroup, error) {
						return []*domain.UserGroup{
							{
								ID:      1,
								UserID:  1,
								GroupID: groupID,
								Role:    "founder",
							},
							{
								ID:      2,
								UserID:  2,
								GroupID: groupID,
								Role:    "member",
							},
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, members []*domain.UserGroup) {
				assert.Equal(t, 2, len(members))
				assert.Equal(t, "founder", members[0].Role)
				assert.Equal(t, "member", members[1].Role)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			svc := service.NewUserGroupService(mockRepo, &mocks.MockUserRepository{}, &mocks.MockGroupRepository{})

			members, err := svc.GetGroupMembers(context.Background(), tt.groupID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, members)
			}
		})
	}
}

func TestUserGroupServiceGetUserGroups(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		mockFunc      func() *mocks.MockUserGroupRepository
		expectedError bool
		validateResp  func(t *testing.T, userGroups []*domain.UserGroup)
	}{
		{
			name:   "successful get user groups",
			userID: 1,
			mockFunc: func() *mocks.MockUserGroupRepository {
				return &mocks.MockUserGroupRepository{
					GetUserGroupsFunc: func(ctx context.Context, userID int64) ([]*domain.UserGroup, error) {
						return []*domain.UserGroup{
							{
								ID:      1,
								UserID:  userID,
								GroupID: 1,
								Role:    "founder",
							},
							{
								ID:      2,
								UserID:  userID,
								GroupID: 2,
								Role:    "member",
							},
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, userGroups []*domain.UserGroup) {
				assert.Equal(t, 2, len(userGroups))
				assert.Equal(t, "founder", userGroups[0].Role)
				assert.Equal(t, "member", userGroups[1].Role)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			svc := service.NewUserGroupService(mockRepo, &mocks.MockUserRepository{}, &mocks.MockGroupRepository{})

			userGroups, err := svc.GetUserGroups(context.Background(), tt.userID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, userGroups)
			}
		})
	}
}
