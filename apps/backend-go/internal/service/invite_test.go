package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend-go/tests/mocks"
)

func TestInviteService_CreateInvite(t *testing.T) {
	tests := []struct {
		name              string
		inviterID         int64
		groupID           int64
		mockInviteRepo    func() *mocks.MockInviteRepository
		mockGroupRepo     func() *mocks.MockGroupRepository
		mockUserGroupRepo func() *mocks.MockUserGroupRepository
		mockChannelRepo   func() *mocks.MockChannelRepository
		expectedError     bool
		validateResp      func(t *testing.T, invite *domain.Invite)
	}{
		{
			name:      "successful create invite",
			inviterID: 1,
			groupID:   1,
			mockInviteRepo: func() *mocks.MockInviteRepository {
				return &mocks.MockInviteRepository{
					CreateFunc: func(ctx context.Context, invite *domain.Invite) error {
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
			mockUserGroupRepo: func() *mocks.MockUserGroupRepository {
				return &mocks.MockUserGroupRepository{}
			},
			mockChannelRepo: func() *mocks.MockChannelRepository {
				return &mocks.MockChannelRepository{}
			},
			expectedError: false,
			validateResp: func(t *testing.T, invite *domain.Invite) {
				assert.NotNil(t, invite)
				assert.NotEmpty(t, invite.Hash)
				assert.Equal(t, int64(1), invite.InviterID)
				assert.Equal(t, int64(1), *invite.GroupID)
				assert.NotNil(t, invite.ExpiresAt)
			},
		},
		{
			name:      "group not found",
			inviterID: 1,
			groupID:   999,
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
			mockUserGroupRepo: func() *mocks.MockUserGroupRepository {
				return &mocks.MockUserGroupRepository{}
			},
			mockChannelRepo: func() *mocks.MockChannelRepository {
				return &mocks.MockChannelRepository{}
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := service.NewInviteService(
				tt.mockInviteRepo(),
				tt.mockGroupRepo(),
				tt.mockUserGroupRepo(),
				tt.mockChannelRepo(),
			)

			invite, err := svc.CreateInvite(context.Background(), tt.inviterID, tt.groupID)

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

func TestInviteService_FindByHash(t *testing.T) {
	tests := []struct {
		name           string
		hash           string
		mockInviteRepo func() *mocks.MockInviteRepository
		expectedError  bool
		validateResp   func(t *testing.T, invite *domain.Invite)
	}{
		{
			name: "successful find invite",
			hash: "abc123",
			mockInviteRepo: func() *mocks.MockInviteRepository {
				return &mocks.MockInviteRepository{
					GetByHashFunc: func(ctx context.Context, hash string) (*domain.Invite, error) {
						groupID := int64(1)
						expiresAt := time.Now().Add(24 * time.Hour)
						return &domain.Invite{
							Hash:      hash,
							InviterID: 1,
							GroupID:   &groupID,
							ExpiresAt: &expiresAt,
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, invite *domain.Invite) {
				assert.NotNil(t, invite)
				assert.Equal(t, "abc123", invite.Hash)
				assert.Equal(t, int64(1), invite.InviterID)
			},
		},
		{
			name: "invite not found",
			hash: "invalid",
			mockInviteRepo: func() *mocks.MockInviteRepository {
				return &mocks.MockInviteRepository{
					GetByHashFunc: func(ctx context.Context, hash string) (*domain.Invite, error) {
						return nil, &domain.NotFoundError{Message: "invite not found"}
					},
				}
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := service.NewInviteService(
				tt.mockInviteRepo(),
				&mocks.MockGroupRepository{},
				&mocks.MockUserGroupRepository{},
				&mocks.MockChannelRepository{},
			)

			invite, err := svc.FindByHash(context.Background(), tt.hash)

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

func TestInviteService_AcceptInvite(t *testing.T) {
	tests := []struct {
		name              string
		userID            int64
		inviteHash        string
		mockInviteRepo    func() *mocks.MockInviteRepository
		mockGroupRepo     func() *mocks.MockGroupRepository
		mockUserGroupRepo func() *mocks.MockUserGroupRepository
		mockChannelRepo   func() *mocks.MockChannelRepository
		expectedError     bool
		validateResp      func(t *testing.T, resp *service.AcceptInviteResponseDTO)
	}{
		{
			name:       "successful accept invite",
			userID:     2,
			inviteHash: "abc123",
			mockInviteRepo: func() *mocks.MockInviteRepository {
				return &mocks.MockInviteRepository{
					GetByHashWithGroupFunc: func(ctx context.Context, hash string) (*domain.Invite, error) {
						groupID := int64(1)
						expiresAt := time.Now().Add(24 * time.Hour)
						return &domain.Invite{
							Hash:      hash,
							InviterID: 1,
							GroupID:   &groupID,
							ExpiresAt: &expiresAt,
						}, nil
					},
				}
			},
			mockGroupRepo: func() *mocks.MockGroupRepository {
				return &mocks.MockGroupRepository{}
			},
			mockUserGroupRepo: func() *mocks.MockUserGroupRepository {
				return &mocks.MockUserGroupRepository{
					ExistsFunc: func(ctx context.Context, userID, groupID int64) (bool, error) {
						return false, nil
					},
					CreateFunc: func(ctx context.Context, userGroup *domain.UserGroup) error {
						return nil
					},
				}
			},
			mockChannelRepo: func() *mocks.MockChannelRepository {
				return &mocks.MockChannelRepository{
					GetByGroupIDFunc: func(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
						return []*domain.Channel{
							{ID: 1, Name: "general", GroupID: 1},
							{ID: 2, Name: "dev", GroupID: 1},
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, resp *service.AcceptInviteResponseDTO) {
				assert.NotNil(t, resp)
				assert.Equal(t, int64(1), resp.GroupID)
				assert.Equal(t, 2, len(resp.Channels))
			},
		},
		{
			name:       "invite expired",
			userID:     2,
			inviteHash: "expired",
			mockInviteRepo: func() *mocks.MockInviteRepository {
				return &mocks.MockInviteRepository{
					GetByHashWithGroupFunc: func(ctx context.Context, hash string) (*domain.Invite, error) {
						groupID := int64(1)
						expiresAt := time.Now().Add(-1 * time.Hour) // expired
						return &domain.Invite{
							Hash:      hash,
							InviterID: 1,
							GroupID:   &groupID,
							ExpiresAt: &expiresAt,
						}, nil
					},
				}
			},
			mockGroupRepo: func() *mocks.MockGroupRepository {
				return &mocks.MockGroupRepository{}
			},
			mockUserGroupRepo: func() *mocks.MockUserGroupRepository {
				return &mocks.MockUserGroupRepository{}
			},
			mockChannelRepo: func() *mocks.MockChannelRepository {
				return &mocks.MockChannelRepository{}
			},
			expectedError: true,
		},
		{
			name:       "user already in group",
			userID:     2,
			inviteHash: "abc123",
			mockInviteRepo: func() *mocks.MockInviteRepository {
				return &mocks.MockInviteRepository{
					GetByHashWithGroupFunc: func(ctx context.Context, hash string) (*domain.Invite, error) {
						groupID := int64(1)
						expiresAt := time.Now().Add(24 * time.Hour)
						return &domain.Invite{
							Hash:      hash,
							InviterID: 1,
							GroupID:   &groupID,
							ExpiresAt: &expiresAt,
						}, nil
					},
				}
			},
			mockGroupRepo: func() *mocks.MockGroupRepository {
				return &mocks.MockGroupRepository{}
			},
			mockUserGroupRepo: func() *mocks.MockUserGroupRepository {
				return &mocks.MockUserGroupRepository{
					ExistsFunc: func(ctx context.Context, userID, groupID int64) (bool, error) {
						return true, nil
					},
				}
			},
			mockChannelRepo: func() *mocks.MockChannelRepository {
				return &mocks.MockChannelRepository{}
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := service.NewInviteService(
				tt.mockInviteRepo(),
				tt.mockGroupRepo(),
				tt.mockUserGroupRepo(),
				tt.mockChannelRepo(),
			)

			resp, err := svc.AcceptInvite(context.Background(), tt.userID, tt.inviteHash)

			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, resp)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, resp)
			}
		})
	}
}
