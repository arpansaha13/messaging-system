package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository/mocks"
)

func TestGroupServiceCreateGroup(t *testing.T) {
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
			svc := NewGroupService(mockRepo, mockUserGroupRepo, mockUserRepo)

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

func TestGroupServiceGetGroups(t *testing.T) {
	tests := []struct {
		name          string
		mockFunc      func() *mocks.MockGroupRepository
		expectedError bool
		validateResp  func(t *testing.T, groups []*domain.Group)
	}{
		{
			name: "successful get groups",
			mockFunc: func() *mocks.MockGroupRepository {
				return &mocks.MockGroupRepository{
					GetAllFunc: func(ctx context.Context) ([]*domain.Group, error) {
						return []*domain.Group{
							{ID: 1, Name: "Group 1", FounderID: 1},
							{ID: 2, Name: "Group 2", FounderID: 2},
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, groups []*domain.Group) {
				assert.Len(t, groups, 2)
				assert.Equal(t, "Group 1", groups[0].Name)
				assert.Equal(t, "Group 2", groups[1].Name)
			},
		},
		{
			name: "empty groups list",
			mockFunc: func() *mocks.MockGroupRepository {
				return &mocks.MockGroupRepository{
					GetAllFunc: func(ctx context.Context) ([]*domain.Group, error) {
						return []*domain.Group{}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, groups []*domain.Group) {
				assert.Len(t, groups, 0)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			mockUserGroupRepo := &mocks.MockUserGroupRepository{}
			mockUserRepo := &mocks.MockUserRepository{}
			svc := NewGroupService(mockRepo, mockUserGroupRepo, mockUserRepo)

			groups, err := svc.GetGroups(context.Background())

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, groups)
			}
		})
	}
}
