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

func TestGroupService_CreateGroup(t *testing.T) {
	tests := []struct {
		name          string
		groupName     string
		founderID     int64
		mockFunc      func() *mocks.MockGroupRepository
		expectedError bool
		validateResp  func(t *testing.T, group *domain.Group)
	}{
		{
			name:      "successful create group",
			groupName: "Test Group",
			founderID: 1,
			mockFunc: func() *mocks.MockGroupRepository {
				return &mocks.MockGroupRepository{
					CreateFunc: func(ctx context.Context, group *domain.Group) error {
						group.ID = 1
						return nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, group *domain.Group) {
				assert.Equal(t, "Test Group", group.Name)
				assert.Equal(t, int64(1), group.FounderID)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockUserGroupRepo := &mocks.MockUserGroupRepository{}
			mockUserRepo := &mocks.MockUserRepository{}
			svc := service.NewGroupService(mockRepo, mockUserGroupRepo, mockUserRepo)

			group, err := svc.CreateGroup(context.Background(), tt.groupName, tt.founderID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, group)
			}
		})
	}
}

func TestGroupService_GetGroups(t *testing.T) {
	tests := []struct {
		name          string
		userGroups    []*domain.UserGroup
		expectedError bool
		validateResp  func(t *testing.T, groups []*domain.Group)
	}{
		{
			name: "successful get groups",
			userGroups: []*domain.UserGroup{
				{ID: 1, UserID: 1, GroupID: 1, Role: "founder"},
				{ID: 2, UserID: 1, GroupID: 2, Role: "member"},
			},
			expectedError: false,
			validateResp: func(t *testing.T, groups []*domain.Group) {
				assert.Len(t, groups, 2)
				assert.Equal(t, "Group 1", groups[0].Name)
				assert.Equal(t, "Group 2", groups[1].Name)
			},
		},
		{
			name:          "empty groups list",
			userGroups:    []*domain.UserGroup{},
			expectedError: false,
			validateResp: func(t *testing.T, groups []*domain.Group) {
				assert.Len(t, groups, 0)
			},
		},
	}

	mockGroupRepo := &mocks.MockGroupRepository{
		GetByIDFunc: func(ctx context.Context, groupID int64) (*domain.Group, error) {
			if groupID == 1 {
				return &domain.Group{ID: 1, Name: "Group 1", FounderID: 1}, nil
			}
			if groupID == 2 {
				return &domain.Group{ID: 2, Name: "Group 2", FounderID: 2}, nil
			}
			return nil, nil
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockUserGroupRepo := &mocks.MockUserGroupRepository{
				GetUserGroupsFunc: func(ctx context.Context, userID int64) ([]*domain.UserGroup, error) {
					return tt.userGroups, nil
				},
			}

			mockUserRepo := &mocks.MockUserRepository{}
			svc := service.NewGroupService(mockGroupRepo, mockUserGroupRepo, mockUserRepo)

			groups, err := svc.GetGroups(context.Background(), 1)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, groups)
			}
		})
	}
}
