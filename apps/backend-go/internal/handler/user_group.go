package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
)

// SetupUserGroupRoutes sets up user group routes
func SetupUserGroupRoutes(router *mux.Router, protectedRouter *mux.Router, userGroupService service.IUserGroupService) {
	protectedRouter.HandleFunc("/api/groups/{groupID}/members", getGroupMembersHandler(userGroupService)).Methods("GET")
}

func getGroupMembersHandler(userGroupService service.IUserGroupService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid group id"})
			return
		}

		members, err := userGroupService.GetGroupMembers(r.Context(), groupID)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

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
		json.NewEncoder(w).Encode(memberResponses)
	}
}
