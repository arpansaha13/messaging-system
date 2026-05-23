package mocks

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/arpansaha13/messaging-system/apps/common/pb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// MockUserService mocks the user service state for testing
type MockUserService struct {
	mu           sync.RWMutex
	userProfiles map[int64]*pb.UserProfileData
}

// NewMockUserService creates a new mock user service
func NewMockUserService() *MockUserService {
	return &MockUserService{
		userProfiles: make(map[int64]*pb.UserProfileData),
	}
}

// SetUserProfile sets the user profile for a specific user ID
func (m *MockUserService) SetUserProfile(userID int64, profile *pb.UserProfileData) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.userProfiles[userID] = profile
}

// GetUserProfile gets user profile by ID (internal helper)
func (m *MockUserService) GetUserProfile(userID int64) (*pb.UserProfileData, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if p, exists := m.userProfiles[userID]; exists {
		return p, true
	}

	return nil, false
}

// MockUserServiceClient wraps the mock user service
type MockUserServiceClient struct {
	mockUser *MockUserService
}

// NewMockUserServiceClient creates a new mock user service client
func NewMockUserServiceClient(mockUser *MockUserService) *MockUserServiceClient {
	return &MockUserServiceClient{
		mockUser: mockUser,
	}
}

// GetUserProfiles retrieves profile information for multiple users
func (c *MockUserServiceClient) GetUserProfiles(ctx context.Context, userIDs []int64) (*pb.GetUserProfilesResponse, error) {
	profiles := make(map[int64]*pb.UserProfileData)
	for _, id := range userIDs {
		p, exists := c.mockUser.GetUserProfile(id)
		if exists {
			profiles[id] = p
		}
	}
	return &pb.GetUserProfilesResponse{Profiles: profiles}, nil
}

// GetUserProfile retrieves profile information for a single user
func (c *MockUserServiceClient) GetUserProfile(ctx context.Context, userID int64) (*pb.UserProfileData, error) {
	p, exists := c.mockUser.GetUserProfile(userID)
	if !exists {
		return nil, fmt.Errorf("profile not found")
	}
	return p, nil
}

// GetDomainProfiles retrieves multiple user profiles and converts them to domain models
func (c *MockUserServiceClient) GetDomainProfiles(ctx context.Context, userIDs []int64) (map[int64]*domain.UserProfile, error) {
	profiles := make(map[int64]*domain.UserProfile)
	for _, id := range userIDs {
		p, exists := c.mockUser.GetUserProfile(id)
		if exists {
			profiles[id] = c.ToDomainProfile(p)
		}
	}
	return profiles, nil
}

// GetDomainProfile retrieves a single user profile as a domain model
func (c *MockUserServiceClient) GetDomainProfile(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	p, exists := c.mockUser.GetUserProfile(userID)
	if !exists {
		return nil, fmt.Errorf("profile not found")
	}
	return c.ToDomainProfile(p), nil
}

// ToDomainProfile converts a protobuf UserProfileData to a domain.UserProfile
func (c *MockUserServiceClient) ToDomainProfile(p *pb.UserProfileData) *domain.UserProfile {
	if p == nil {
		return nil
	}
	var dp *string
	if p.Dp != "" {
		v := p.Dp
		dp = &v
	}
	return &domain.UserProfile{
		ID:         p.UserId,
		GlobalName: p.GlobalName,
		DP:         dp,
		Bio:        p.Bio,
		CreatedAt:  p.CreatedAt.AsTime(),
		UpdatedAt:  p.UpdatedAt.AsTime(),
	}
}

// SearchUserProfiles searches user profiles by query
func (c *MockUserServiceClient) SearchUserProfiles(ctx context.Context, query string, limit int32) (*pb.SearchUserProfilesResponse, error) {
	c.mockUser.mu.RLock()
	defer c.mockUser.mu.RUnlock()

	profiles := []*pb.UserProfileData{}
	query = strings.ToLower(query)

	for _, p := range c.mockUser.userProfiles {
		if query == "" || strings.Contains(strings.ToLower(p.GlobalName), query) {
			profiles = append(profiles, p)
			if int32(len(profiles)) >= limit {
				break
			}
		}
	}
	return &pb.SearchUserProfilesResponse{Profiles: profiles}, nil
}

// UpdateUserProfile updates user profile fields via gRPC
func (c *MockUserServiceClient) UpdateUserProfile(ctx context.Context, req *pb.UpdateUserProfileRequest) (*pb.UpdateUserProfileResponse, error) {
	p, exists := c.mockUser.GetUserProfile(req.UserId)
	if !exists {
		p = &pb.UserProfileData{
			UserId:    req.UserId,
			CreatedAt: timestamppb.New(time.Now()),
		}
	}
	p.UpdatedAt = timestamppb.New(time.Now())
	if req.GlobalName != "" {
		p.GlobalName = req.GlobalName
	}
	if req.Bio != "" {
		p.Bio = req.Bio
	}
	if req.Dp != "" {
		p.Dp = req.Dp
	}
	c.mockUser.SetUserProfile(req.UserId, p)
	return &pb.UpdateUserProfileResponse{Profile: p}, nil
}

// Close is a stub implementation
func (c *MockUserServiceClient) Close() error {
	return nil
}
