package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
)

// SetupUserGroupRoutes sets up user group routes
func SetupUserGroupRoutes(router *mux.Router, protectedRouter *mux.Router, userGroupService service.IUserGroupService) {
	protectedRouter.HandleFunc("/api/groups/{groupID}/members", gtk.HttpControllerAdaptor(getGroupMembersController(userGroupService))).Methods("GET")
}

func getGroupMembersController(userGroupService service.IUserGroupService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("get group members handler called")

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		vars := mux.Vars(r)
		groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
		if err != nil {
			log.Warn("invalid group id in get members request", zap.String("group_id_str", vars["groupID"]), zap.Int64("user_id", userIDInt))
			return &gtk.ValidationError{Message: "invalid group id"}
		}

		log.Debug("fetching group members", zap.Int64("user_id", userIDInt), zap.Int64("group_id", groupID))

		members, err := userGroupService.GetGroupMembers(r.Context(), groupID)
		if err != nil {
			log.Error("failed to get group members", zap.Int64("user_id", userIDInt), zap.Int64("group_id", groupID), zap.Error(err))
			return err
		}

		log.Debug("group members retrieved successfully", zap.Int64("user_id", userIDInt), zap.Int64("group_id", groupID), zap.Int("member_count", len(members)))

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

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(memberResponses)
	}
}
