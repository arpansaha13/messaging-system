package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// SetupChannelRoutes sets up channel routes
func SetupChannelRoutes(router *mux.Router, protectedRouter *mux.Router, channelService service.IChannelService) {
	protectedRouter.HandleFunc("/api/groups/{groupID}/channels", AdaptController(createChannelController(channelService))).Methods("POST")
	protectedRouter.HandleFunc("/api/groups/{groupID}/channels", AdaptController(getGroupChannelsController(channelService))).Methods("GET")
	protectedRouter.HandleFunc("/api/channels/{channelID}", AdaptController(getChannelInfoController(channelService))).Methods("GET")
}

func createChannelController(channelService service.IChannelService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid group id"}
		}

		var req dto.CreateChannelRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return &domain.ValidationError{Message: "invalid request body"}
		}

		if req.Name == "" {
			return &domain.ValidationError{Message: "channel name is required"}
		}

		channel, err := channelService.CreateChannel(r.Context(), req.Name, groupID)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		return json.NewEncoder(w).Encode(dto.ChannelResponseDTO{
			ID:        channel.ID,
			Name:      channel.Name,
			GroupID:   channel.GroupID,
			CreatedAt: channel.CreatedAt,
			UpdatedAt: channel.UpdatedAt,
		})
	}
}

func getGroupChannelsController(channelService service.IChannelService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid group id"}
		}

		channels, err := channelService.GetChannelsByGroupID(r.Context(), groupID)
		if err != nil {
			return err
		}

		channelResponses := make([]dto.ChannelResponseDTO, len(channels))
		for i, channel := range channels {
			channelResponses[i] = dto.ChannelResponseDTO{
				ID:        channel.ID,
				Name:      channel.Name,
				GroupID:   channel.GroupID,
				CreatedAt: channel.CreatedAt,
				UpdatedAt: channel.UpdatedAt,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(channelResponses)
	}
}

func getChannelInfoController(channelService service.IChannelService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		channelID, err := strconv.ParseInt(vars["channelID"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid channel id"}
		}

		channel, err := channelService.GetChannelByID(r.Context(), channelID)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(dto.ChannelResponseDTO{
			ID:        channel.ID,
			Name:      channel.Name,
			GroupID:   channel.GroupID,
			CreatedAt: channel.CreatedAt,
			UpdatedAt: channel.UpdatedAt,
		})
	}
}
