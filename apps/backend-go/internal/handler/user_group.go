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
	protectedRouter.HandleFunc("/api/groups/{groupID}/members", addUserToGroupHandler(userGroupService)).Methods("POST")
	protectedRouter.HandleFunc("/api/groups/{groupID}/members", getGroupMembersHandler(userGroupService)).Methods("GET")
	protectedRouter.HandleFunc("/api/users/groups", getUserGroupsHandler(userGroupService)).Methods("GET")
}

func addUserToGroupHandler(userGroupService service.IUserGroupService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid group id"})
			return
		}

		var req dto.AddUserToGroupRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		userGroup, err := userGroupService.AddUserToGroup(r.Context(), req.UserID, groupID)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(dto.UserGroupResponseDTO{
			ID:        userGroup.ID,
			UserID:    userGroup.UserID,
			GroupID:   userGroup.GroupID,
			Role:      userGroup.Role,
			CreatedAt: userGroup.CreatedAt,
			UpdatedAt: userGroup.UpdatedAt,
		})
	}
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
			memberResponses[i] = dto.UserGroupResponseDTO{
				ID:        member.ID,
				UserID:    member.UserID,
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

func getUserGroupsHandler(userGroupService service.IUserGroupService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		groups, err := userGroupService.GetUserGroups(r.Context(), userIDInt)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		groupResponses := make([]dto.UserGroupResponseDTO, len(groups))
		for i, group := range groups {
			groupResponses[i] = dto.UserGroupResponseDTO{
				ID:        group.ID,
				UserID:    group.UserID,
				GroupID:   group.GroupID,
				Role:      group.Role,
				CreatedAt: group.CreatedAt,
				UpdatedAt: group.UpdatedAt,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(groupResponses)
	}
}
