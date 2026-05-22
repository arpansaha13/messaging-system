package service

import (
	"context"
	"fmt"
	"sync"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/common/coalesce"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	commonpb "github.com/arpansaha13/messaging-system/apps/common/pb"
	"github.com/sony/gobreaker/v2"
	"go.uber.org/zap"
	"golang.org/x/sync/singleflight"
	"google.golang.org/grpc"
)

// UserServiceClient provides gRPC client methods for the user service (profiles/contacts)
type UserServiceClient struct {
	conn          *grpc.ClientConn
	profileClient commonpb.UserProfileServiceClient
	cb            *gobreaker.CircuitBreaker[any]
	mu            sync.RWMutex
	sf            singleflight.Group
}

// NewUserServiceClient creates a new user service client
func NewUserServiceClient(conn *grpc.ClientConn, profileClient commonpb.UserProfileServiceClient, cb *gobreaker.CircuitBreaker[any]) *UserServiceClient {
	svc := &UserServiceClient{
		cb: cb,
	}
	svc.SetConnection(conn, profileClient)
	return svc
}

// SetConnection swaps the underlying gRPC connection and client.
func (s *UserServiceClient) SetConnection(conn *grpc.ClientConn, profileClient commonpb.UserProfileServiceClient) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.conn = conn
	s.profileClient = profileClient
}

func (s *UserServiceClient) getProfileClient() commonpb.UserProfileServiceClient {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.profileClient
}

// GetUserProfiles retrieves profile information for multiple users from the user service
func (s *UserServiceClient) GetUserProfiles(ctx context.Context, userIDs []int64) (*commonpb.GetUserProfilesResponse, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("get user profiles request received", zap.Int64s("user_ids", userIDs))

	client := s.getProfileClient()
	if client == nil {
		return nil, fmt.Errorf("user profile service client not connected")
	}

	key := coalesce.GetUserProfilesKey(userIDs)

	ch := s.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)
		detachedCtx, cancel := context.WithTimeout(detachedCtx, defaultTimeout)
		defer cancel()

		req := &commonpb.GetUserProfilesRequest{UserIds: userIDs}

		return s.cb.Execute(func() (any, error) {
			return client.GetUserProfiles(detachedCtx, req)
		})
	})

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			log.Error("failed to get user profiles", zap.Int64s("user_ids", userIDs), zap.Error(res.Err))
			return nil, fmt.Errorf("failed to get user profiles: %w", res.Err)
		}
		resp := res.Val.(*commonpb.GetUserProfilesResponse)
		log.Debug("user profiles retrieved successfully", zap.Int("count", len(resp.Profiles)))
		return resp, nil
	}
}

// GetDomainProfiles retrieves multiple user profiles and converts them to domain models
func (s *UserServiceClient) GetDomainProfiles(ctx context.Context, userIDs []int64) (map[int64]*domain.UserProfile, error) {
	resp, err := s.GetUserProfiles(ctx, userIDs)
	if err != nil {
		return nil, err
	}

	domainProfiles := make(map[int64]*domain.UserProfile, len(resp.Profiles))
	for userID, p := range resp.Profiles {
		domainProfiles[userID] = ToDomainProfile(p)
	}
	return domainProfiles, nil
}

// GetUserProfile retrieves profile information for a single user from the user service
func (s *UserServiceClient) GetUserProfile(ctx context.Context, userID int64) (*commonpb.UserProfileData, error) {
	resp, err := s.GetUserProfiles(ctx, []int64{userID})
	if err != nil {
		return nil, err
	}

	if profile, ok := resp.Profiles[userID]; ok {
		return profile, nil
	}

	return nil, fmt.Errorf("profile not found for user %d", userID)
}

// GetDomainProfile retrieves a single user profile as a domain model
func (s *UserServiceClient) GetDomainProfile(ctx context.Context, userID int64) (*domain.UserProfile, error) {
	p, err := s.GetUserProfile(ctx, userID)
	if err != nil {
		return nil, err
	}
	return ToDomainProfile(p), nil
}

// SearchUserProfiles searches user profiles by query
func (s *UserServiceClient) SearchUserProfiles(ctx context.Context, query string, limit int32) (*commonpb.SearchUserProfilesResponse, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("search user profiles request received", zap.String("query", query))

	client := s.getProfileClient()
	if client == nil {
		return nil, fmt.Errorf("user profile service client not connected")
	}

	key := coalesce.SearchUserProfilesKey(query, limit)

	ch := s.sf.DoChan(key, func() (any, error) {
		detachedCtx := context.WithoutCancel(ctx)
		detachedCtx, cancel := context.WithTimeout(detachedCtx, defaultTimeout)
		defer cancel()

		req := &commonpb.SearchUserProfilesRequest{
			Query: query,
			Limit: limit,
		}

		return s.cb.Execute(func() (any, error) {
			return client.SearchUserProfiles(detachedCtx, req)
		})
	})

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case res := <-ch:
		if res.Err != nil {
			log.Error("failed to search user profiles", zap.String("query", query), zap.Error(res.Err))
			return nil, fmt.Errorf("failed to search user profiles: %w", res.Err)
		}
		resp := res.Val.(*commonpb.SearchUserProfilesResponse)
		log.Debug("user profiles search successfully", zap.Int("count", len(resp.Profiles)))
		return resp, nil
	}
}

// UpdateUserProfile updates user profile fields via gRPC
func (s *UserServiceClient) UpdateUserProfile(ctx context.Context, req *commonpb.UpdateUserProfileRequest) (*commonpb.UpdateUserProfileResponse, error) {
	log := gtk.LoggerFromContext(ctx)
	log.Debug("update user profile request received", zap.Int64("user_id", req.UserId))

	client := s.getProfileClient()
	if client == nil {
		return nil, fmt.Errorf("user profile service client not connected")
	}

	ctx, cancel := context.WithTimeout(ctx, defaultTimeout)
	defer cancel()

	result, err := s.cb.Execute(func() (any, error) {
		return client.UpdateUserProfile(ctx, req)
	})

	if err != nil {
		log.Error("failed to update user profile", zap.Int64("user_id", req.UserId), zap.Error(err))
		return nil, fmt.Errorf("failed to update user profile: %w", err)
	}

	resp := result.(*commonpb.UpdateUserProfileResponse)
	log.Debug("user profile updated successfully", zap.Int64("user_id", req.UserId))
	return resp, nil
}

// Close closes the gRPC connection
func (s *UserServiceClient) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.conn != nil {
		if err := s.conn.Close(); err != nil {
			return err
		}
	}
	s.conn = nil
	s.profileClient = nil
	return nil
}

// ToDomainProfile converts a protobuf UserProfileData to a domain.UserProfile
func ToDomainProfile(p *commonpb.UserProfileData) *domain.UserProfile {
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

var _ IUserServiceClient = (*UserServiceClient)(nil)
