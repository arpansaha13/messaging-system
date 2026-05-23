package controller

import (
	"context"

	"github.com/arpansaha13/messaging-system/apps/common/pb"
	"github.com/arpansaha13/messaging-system/apps/user/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/user/internal/service"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// UserProfileController implements the UserProfileService gRPC server.
type UserProfileController struct {
	pb.UnimplementedUserProfileServiceServer
	service service.IUserProfileService
}

// NewUserProfileController creates a new UserProfileController.
func NewUserProfileController(service service.IUserProfileService) *UserProfileController {
	return &UserProfileController{service: service}
}

func (c *UserProfileController) CreateUserProfile(ctx context.Context, req *pb.CreateUserProfileRequest) (*pb.CreateUserProfileResponse, error) {
	profile, err := c.service.Create(ctx, req.UserId, req.GlobalName)
	if err != nil {
		return nil, err
	}
	return &pb.CreateUserProfileResponse{
		Profile: mapDomainToProto(profile),
	}, nil
}

func (c *UserProfileController) GetUserProfile(ctx context.Context, req *pb.GetUserProfileRequest) (*pb.GetUserProfileResponse, error) {
	profile, err := c.service.GetByID(ctx, req.UserId)
	if err != nil {
		return nil, err
	}
	return &pb.GetUserProfileResponse{
		Profile: mapDomainToProto(profile),
	}, nil
}

func (c *UserProfileController) GetUserProfiles(ctx context.Context, req *pb.GetUserProfilesRequest) (*pb.GetUserProfilesResponse, error) {
	profiles, err := c.service.GetByIDs(ctx, req.UserIds)
	if err != nil {
		return nil, err
	}
	pbProfiles := make(map[int64]*pb.UserProfileData, len(profiles))
	for id, p := range profiles {
		pbProfiles[id] = mapDomainToProto(p)
	}
	return &pb.GetUserProfilesResponse{
		Profiles: pbProfiles,
	}, nil
}

func (c *UserProfileController) UpdateUserProfile(ctx context.Context, req *pb.UpdateUserProfileRequest) (*pb.UpdateUserProfileResponse, error) {
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
	return &pb.UpdateUserProfileResponse{
		Profile: mapDomainToProto(profile),
	}, nil
}

func (c *UserProfileController) SearchUserProfiles(ctx context.Context, req *pb.SearchUserProfilesRequest) (*pb.SearchUserProfilesResponse, error) {
	profiles, err := c.service.Search(ctx, req.Query, int(req.Limit))
	if err != nil {
		return nil, err
	}
	pbProfiles := make([]*pb.UserProfileData, len(profiles))
	for i, p := range profiles {
		pbProfiles[i] = mapDomainToProto(p)
	}
	return &pb.SearchUserProfilesResponse{
		Profiles: pbProfiles,
	}, nil
}

func mapDomainToProto(p *domain.UserProfile) *pb.UserProfileData {
	if p == nil {
		return nil
	}
	dp := ""
	if p.DP != nil {
		dp = *p.DP
	}
	return &pb.UserProfileData{
		UserId:     p.ID,
		GlobalName: p.GlobalName,
		Dp:         dp,
		Bio:        p.Bio,
		CreatedAt:  timestamppb.New(p.CreatedAt),
		UpdatedAt:  timestamppb.New(p.UpdatedAt),
	}
}
