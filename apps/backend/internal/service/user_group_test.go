package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

func TestUserGroupService_GetGroupMembers(t *testing.T) {
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
