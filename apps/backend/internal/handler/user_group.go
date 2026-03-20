package handler

import (
	"net/http"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
)

// SetupUserGroupRoutes sets up user group routes
func SetupUserGroupRoutes(router *mux.Router, protectedRouter *mux.Router, userGroupService service.IUserGroupService) {
	protectedRouter.HandleFunc("/groups/{groupID}/members", gtk.HttpControllerAdaptor(getGroupMembersController(userGroupService))).Methods("GET")
}

func getGroupMembersController(userGroupService service.IUserGroupService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("get group members handler called")

		req, err := dto.NewGetGroupMembersDTO(r)
		if err != nil {
			log.Warn("failed to parse get group members request", zap.Error(err))
			return nil, err
		}

		log.Debug("fetching group members", zap.Int64("group_id", req.GroupID))

		members, err := userGroupService.GetGroupMembers(r.Context(), req)
		if err != nil {
			log.Error("failed to get group members", zap.Int64("group_id", req.GroupID), zap.Error(err))
			return nil, err
		}

		log.Debug("group members retrieved successfully", zap.Int64("group_id", req.GroupID), zap.Int("member_count", len(members)))

		memberResponses := make([]dto.UserGroupResponseDTO, len(members))
		for i, member := range members {
			userProfile := dto.UserProfileResponseDTO{
				ID:         member.User.ID,
				GlobalName: member.User.GlobalName,
				DP:         member.User.DP,
				Bio:        member.User.Bio,
			}
			memberResponses[i] = dto.UserGroupResponseDTO{
				ID:        member.ID,
				User:      userProfile,
				GroupID:   member.GroupID,
				Role:      member.Role,
				CreatedAt: member.CreatedAt,
				UpdatedAt: member.UpdatedAt,
			}
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       memberResponses,
		}, nil
	}
}
