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

// SetupGroupRoutes sets up group routes
func SetupGroupRoutes(router *mux.Router, protectedRouter *mux.Router, groupService service.IGroupService) {
	protectedRouter.HandleFunc("/api/groups", AdaptController(createGroupController(groupService))).Methods("POST")
	protectedRouter.HandleFunc("/api/groups", AdaptController(getGroupsController(groupService))).Methods("GET")
}

func createGroupController(groupService service.IGroupService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		var req dto.CreateGroupRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return &domain.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		group, err := groupService.CreateGroup(r.Context(), req.Name, userIDInt)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		return json.NewEncoder(w).Encode(dto.GroupResponseDTO{
			ID:        group.ID,
			Name:      group.Name,
			FounderID: group.FounderID,
			CreatedAt: group.CreatedAt,
			UpdatedAt: group.UpdatedAt,
		})
	}
}

func getGroupsController(groupService service.IGroupService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		groups, err := groupService.GetGroups(r.Context(), userIDInt)
		if err != nil {
			return err
		}

		groupResponses := make([]dto.GroupResponseDTO, len(groups))
		for i, group := range groups {
			groupResponses[i] = dto.GroupResponseDTO{
				ID:        group.ID,
				Name:      group.Name,
				FounderID: group.FounderID,
				CreatedAt: group.CreatedAt,
				UpdatedAt: group.UpdatedAt,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(groupResponses)
	}
}
