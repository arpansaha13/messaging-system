package handler

import (
	"net/http"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// SetupGroupRoutes sets up group routes
func SetupGroupRoutes(router *mux.Router, protectedRouter *mux.Router, groupService service.IGroupService) {
	protectedRouter.HandleFunc("/groups", gtk.HttpControllerAdaptor(createGroupController(groupService))).Methods("POST")
	protectedRouter.HandleFunc("/groups", gtk.HttpControllerAdaptor(getGroupsController(groupService))).Methods("GET")
}

func createGroupController(groupService service.IGroupService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("create group handler called")

		req, err := dto.NewCreateGroupDTO(r)
		if err != nil {
			log.Warn("failed to parse create group request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("create group validation failed")
			return nil, err
		}

		log.Debug("creating group", zap.String("group_name", req.Name))

		group, err := groupService.CreateGroup(r.Context(), req)
		if err != nil {
			log.Error("failed to create group", zap.String("group_name", req.Name), zap.Error(err))
			return nil, err
		}

		log.Info("group created successfully", zap.Int64("group_id", group.ID), zap.String("group_name", group.Name))

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
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("get groups handler called")

		groups, err := groupService.GetGroups(r.Context())
		if err != nil {
			log.Error("failed to get groups", zap.Error(err))
			return nil, err
		}

		log.Debug("groups retrieved successfully", zap.Int("group_count", len(groups)))

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
