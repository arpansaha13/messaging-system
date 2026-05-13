package controller

import (
	"context"

	commonpb "github.com/arpansaha13/messaging-system/apps/common/pb"
	"github.com/arpansaha13/messaging-system/apps/user/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/user/internal/service"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// UserProfileController implements the UserProfileService gRPC server.
type UserProfileController struct {
	commonpb.UnimplementedUserProfileServiceServer
	service service.IUserProfileService
}

// NewUserProfileController creates a new UserProfileController.
func NewUserProfileController(service service.IUserProfileService) *UserProfileController {
	return &UserProfileController{service: service}
}

func (c *UserProfileController) CreateUserProfile(ctx context.Context, req *commonpb.CreateUserProfileRequest) (*commonpb.CreateUserProfileResponse, error) {
	profile, err := c.service.Create(ctx, req.UserId, req.GlobalName)
	if err != nil {
		return nil, err
	}
	return &commonpb.CreateUserProfileResponse{
		Profile: mapDomainToProto(profile),
	}, nil
}

func (c *UserProfileController) GetUserProfile(ctx context.Context, req *commonpb.GetUserProfileRequest) (*commonpb.GetUserProfileResponse, error) {
	profile, err := c.service.GetByID(ctx, req.UserId)
	if err != nil {
		return nil, err
	}
	return &commonpb.GetUserProfileResponse{
		Profile: mapDomainToProto(profile),
	}, nil
}

func (c *UserProfileController) GetUserProfiles(ctx context.Context, req *commonpb.GetUserProfilesRequest) (*commonpb.GetUserProfilesResponse, error) {
	profiles, err := c.service.GetByIDs(ctx, req.UserIds)
	if err != nil {
		return nil, err
	}
	pbProfiles := make(map[int64]*commonpb.UserProfileData, len(profiles))
	for id, p := range profiles {
		pbProfiles[id] = mapDomainToProto(p)
	}
	return &commonpb.GetUserProfilesResponse{
		Profiles: pbProfiles,
	}, nil
}

func (c *UserProfileController) UpdateUserProfile(ctx context.Context, req *commonpb.UpdateUserProfileRequest) (*commonpb.UpdateUserProfileResponse, error) {
	var gn, dp, bio *string
	if req.GlobalName != "" {
		gn = &req.GlobalName
	}
	if req.Dp != "" {
		dp = &req.Dp
	}
	if req.Bio != "" {
		bio = &req.Bio
	}

	profile, err := c.service.Update(ctx, req.UserId, gn, dp, bio)
	if err != nil {
		return nil, err
	}
	return &commonpb.UpdateUserProfileResponse{
		Profile: mapDomainToProto(profile),
	}, nil
}

func (c *UserProfileController) SearchUserProfiles(ctx context.Context, req *commonpb.SearchUserProfilesRequest) (*commonpb.SearchUserProfilesResponse, error) {
	profiles, err := c.service.Search(ctx, req.Query, int(req.Limit))
	if err != nil {
		return nil, err
	}
	pbProfiles := make([]*commonpb.UserProfileData, len(profiles))
	for i, p := range profiles {
		pbProfiles[i] = mapDomainToProto(p)
	}
	return &commonpb.SearchUserProfilesResponse{
		Profiles: pbProfiles,
	}, nil
}

func mapDomainToProto(p *domain.UserProfile) *commonpb.UserProfileData {
	if p == nil {
		return nil
	}
	dp := ""
	if p.DP != nil {
		dp = *p.DP
	}
	return &commonpb.UserProfileData{
		UserId:     p.ID,
		GlobalName: p.GlobalName,
		Dp:         dp,
		Bio:        p.Bio,
		CreatedAt:  timestamppb.New(p.CreatedAt),
		UpdatedAt:  timestamppb.New(p.UpdatedAt),
	}
}
