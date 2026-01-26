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

// SetupChannelRoutes sets up channel routes
func SetupChannelRoutes(router *mux.Router, protectedRouter *mux.Router, channelService *service.ChannelService) {
	protectedRouter.HandleFunc("/api/groups/{groupID}/channels", createChannelHandler(channelService)).Methods("POST")
	protectedRouter.HandleFunc("/api/groups/{groupID}/channels", getGroupChannelsHandler(channelService)).Methods("GET")
	protectedRouter.HandleFunc("/api/channels/{channelID}", getChannelInfoHandler(channelService)).Methods("GET")
}

func createChannelHandler(channelService *service.ChannelService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid group id"})
			return
		}

		var req dto.CreateChannelRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		if req.Name == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "channel name is required"})
			return
		}

		channel, err := channelService.CreateChannel(r.Context(), req.Name, groupID)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(dto.ChannelResponseDTO{
			ID:        channel.ID,
			Name:      channel.Name,
			GroupID:   channel.GroupID,
			CreatedAt: channel.CreatedAt,
			UpdatedAt: channel.UpdatedAt,
		})
	}
}

func getGroupChannelsHandler(channelService *service.ChannelService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid group id"})
			return
		}

		channels, err := channelService.GetChannelsByGroupID(r.Context(), groupID)
		if err != nil {
			middleware.WriteError(w, err)
			return
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
		json.NewEncoder(w).Encode(channelResponses)
	}
}

func getChannelInfoHandler(channelService *service.ChannelService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		channelID, err := strconv.ParseInt(vars["channelID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid channel id"})
			return
		}

		channel, err := channelService.GetChannelByID(r.Context(), channelID)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(dto.ChannelResponseDTO{
			ID:        channel.ID,
			Name:      channel.Name,
			GroupID:   channel.GroupID,
			CreatedAt: channel.CreatedAt,
			UpdatedAt: channel.UpdatedAt,
		})
	}
}
