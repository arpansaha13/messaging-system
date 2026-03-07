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

// SetupGroupRoutes sets up group routes
func SetupGroupRoutes(router *mux.Router, protectedRouter *mux.Router, groupService service.IGroupService) {
	protectedRouter.HandleFunc("/api/groups", gtk.HttpControllerAdaptor(createGroupController(groupService))).Methods("POST")
	protectedRouter.HandleFunc("/api/groups", gtk.HttpControllerAdaptor(getGroupsController(groupService))).Methods("GET")
}

func createGroupController(groupService service.IGroupService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("create group handler called")

		var req dto.CreateGroupRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in create group", zap.Error(err))
			return nil, &gtk.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("creating group", zap.Int64("founder_id", userIDInt), zap.String("group_name", req.Name))

		group, err := groupService.CreateGroup(r.Context(), req.Name, userIDInt)
		if err != nil {
			log.Error("failed to create group", zap.Int64("founder_id", userIDInt), zap.String("group_name", req.Name), zap.Error(err))
			return nil, err
		}

		log.Info("group created successfully", zap.Int64("group_id", group.ID), zap.String("group_name", group.Name), zap.Int64("founder_id", userIDInt))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.GroupResponseDTO{
				ID:        group.ID,
				Name:      group.Name,
				FounderID: group.FounderID,
				CreatedAt: group.CreatedAt,
				UpdatedAt: group.UpdatedAt,
			},
		}, nil
	}
}

func getGroupsController(groupService service.IGroupService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("get groups handler called")

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("fetching groups for user", zap.Int64("user_id", userIDInt))

		groups, err := groupService.GetGroups(r.Context(), userIDInt)
		if err != nil {
			log.Error("failed to get groups", zap.Int64("user_id", userIDInt), zap.Error(err))
			return nil, err
		}

		log.Debug("groups retrieved successfully", zap.Int64("user_id", userIDInt), zap.Int("group_count", len(groups)))

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

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       groupResponses,
		}, nil
	}
}
