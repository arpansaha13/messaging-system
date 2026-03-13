package mocks

import (
	"context"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// MockGroupRepository is a mock implementation of IGroupRepository
type MockGroupRepository struct {
	GetByIDFunc func(ctx context.Context, id int64) (*domain.Group, error)
	CreateFunc  func(ctx context.Context, group *domain.Group) error
	GetAllFunc  func(ctx context.Context) ([]*domain.Group, error)
	DeleteFunc  func(ctx context.Context, id int64) error
	UpdateFunc  func(ctx context.Context, group *domain.Group) error
}

func (m *MockGroupRepository) GetByID(ctx context.Context, id int64) (*domain.Group, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, id)
	}
	return nil, nil
}

func (m *MockGroupRepository) Create(ctx context.Context, group *domain.Group) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, group)
	}
	return nil
}

func (m *MockGroupRepository) GetAll(ctx context.Context) ([]*domain.Group, error) {
	if m.GetAllFunc != nil {
		return m.GetAllFunc(ctx)
	}
	return nil, nil
}

func (m *MockGroupRepository) Delete(ctx context.Context, id int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func (m *MockGroupRepository) Update(ctx context.Context, group *domain.Group) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, group)
	}
	return nil
}

// MockChannelRepository is a mock implementation of IChannelRepository
type MockChannelRepository struct {
	GetByIDFunc      func(ctx context.Context, id int64) (*domain.Channel, error)
	CreateFunc       func(ctx context.Context, channel *domain.Channel) error
	GetAllFunc       func(ctx context.Context) ([]*domain.Channel, error)
	GetByGroupIDFunc func(ctx context.Context, groupID int64) ([]*domain.Channel, error)
	DeleteFunc       func(ctx context.Context, id int64) error
	UpdateFunc       func(ctx context.Context, channel *domain.Channel) error
}

func (m *MockChannelRepository) GetByID(ctx context.Context, id int64) (*domain.Channel, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, id)
	}
	return nil, nil
}

func (m *MockChannelRepository) Create(ctx context.Context, channel *domain.Channel) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, channel)
	}
	return nil
}

func (m *MockChannelRepository) GetAll(ctx context.Context) ([]*domain.Channel, error) {
	if m.GetAllFunc != nil {
		return m.GetAllFunc(ctx)
	}
	return nil, nil
}

func (m *MockChannelRepository) GetByGroupID(ctx context.Context, groupID int64) ([]*domain.Channel, error) {
	if m.GetByGroupIDFunc != nil {
		return m.GetByGroupIDFunc(ctx, groupID)
	}
	return nil, nil
}

func (m *MockChannelRepository) Delete(ctx context.Context, id int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, id)
	}
	return nil
}

func (m *MockChannelRepository) Update(ctx context.Context, channel *domain.Channel) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, channel)
	}
	return nil
}

// MockUserGroupRepository is a mock implementation of IUserGroupRepository
type MockUserGroupRepository struct {
	CreateFunc          func(ctx context.Context, userGroup *domain.UserGroup) error
	GetByIDFunc         func(ctx context.Context, userGroupID int64) (*domain.UserGroup, error)
	GetGroupMembersFunc func(ctx context.Context, groupID int64) ([]*domain.UserGroup, error)
	GetUserGroupsFunc   func(ctx context.Context, userID int64) ([]*domain.UserGroup, error)
	ExistsFunc          func(ctx context.Context, userID, groupID int64) (bool, error)
	DeleteFunc          func(ctx context.Context, userGroupID int64) error
	UpdateFunc          func(ctx context.Context, userGroup *domain.UserGroup) error
}

func (m *MockUserGroupRepository) Create(ctx context.Context, userGroup *domain.UserGroup) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, userGroup)
	}
	return nil
}

func (m *MockUserGroupRepository) GetByID(ctx context.Context, userGroupID int64) (*domain.UserGroup, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(ctx, userGroupID)
	}
	return nil, nil
}

func (m *MockUserGroupRepository) GetGroupMembers(ctx context.Context, groupID int64) ([]*domain.UserGroup, error) {
	if m.GetGroupMembersFunc != nil {
		return m.GetGroupMembersFunc(ctx, groupID)
	}
	return nil, nil
}

func (m *MockUserGroupRepository) GetUserGroups(ctx context.Context, userID int64) ([]*domain.UserGroup, error) {
	if m.GetUserGroupsFunc != nil {
		return m.GetUserGroupsFunc(ctx, userID)
	}
	return nil, nil
}

func (m *MockUserGroupRepository) Exists(ctx context.Context, userID, groupID int64) (bool, error) {
	if m.ExistsFunc != nil {
		return m.ExistsFunc(ctx, userID, groupID)
	}
	return false, nil
}

func (m *MockUserGroupRepository) Delete(ctx context.Context, userGroupID int64) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, userGroupID)
	}
	return nil
}

func (m *MockUserGroupRepository) Update(ctx context.Context, userGroup *domain.UserGroup) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, userGroup)
	}
	return nil
}

// MockInviteRepository is a mock implementation of IInviteRepository
type MockInviteRepository struct {
	CreateFunc             func(ctx context.Context, invite *domain.Invite) error
	GetByHashFunc          func(ctx context.Context, hash string) (*domain.Invite, error)
	GetByHashWithGroupFunc func(ctx context.Context, hash string) (*domain.Invite, error)
	UpdateFunc             func(ctx context.Context, invite *domain.Invite) error
	DeleteFunc             func(ctx context.Context, hash string) error
}

func (m *MockInviteRepository) Create(ctx context.Context, invite *domain.Invite) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(ctx, invite)
	}
	return nil
}

func (m *MockInviteRepository) GetByHash(ctx context.Context, hash string) (*domain.Invite, error) {
	if m.GetByHashFunc != nil {
		return m.GetByHashFunc(ctx, hash)
	}
	return nil, nil
}

func (m *MockInviteRepository) GetByHashWithGroup(ctx context.Context, hash string) (*domain.Invite, error) {
	if m.GetByHashWithGroupFunc != nil {
		return m.GetByHashWithGroupFunc(ctx, hash)
	}
	return nil, nil
}

func (m *MockInviteRepository) Update(ctx context.Context, invite *domain.Invite) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(ctx, invite)
	}
	return nil
}

func (m *MockInviteRepository) Delete(ctx context.Context, hash string) error {
	if m.DeleteFunc != nil {
		return m.DeleteFunc(ctx, hash)
	}
	return nil
}
