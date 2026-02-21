package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
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
		log := logger.FromContext(r.Context())
		log.Debug("create channel handler called")

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		vars := mux.Vars(r)
		groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
		if err != nil {
			log.Warn("invalid group id in create channel request", zap.String("group_id_str", vars["groupID"]), zap.Int64("user_id", userIDInt))
			return &domain.ValidationError{Message: "invalid group id"}
		}

		var req dto.CreateChannelRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in create channel", zap.Int64("user_id", userIDInt), zap.Error(err))
			return &domain.ValidationError{Message: "invalid request body"}
		}

		if req.Name == "" {
			log.Warn("channel name is empty in create channel request", zap.Int64("user_id", userIDInt), zap.Int64("group_id", groupID))
			return &domain.ValidationError{Message: "channel name is required"}
		}

		log.Debug("creating channel", zap.Int64("user_id", userIDInt), zap.Int64("group_id", groupID), zap.String("channel_name", req.Name))

		channel, err := channelService.CreateChannel(r.Context(), req.Name, groupID)
		if err != nil {
			log.Error("failed to create channel", zap.Int64("user_id", userIDInt), zap.Int64("group_id", groupID), zap.String("channel_name", req.Name), zap.Error(err))
			return err
		}

		log.Info("channel created successfully", zap.Int64("user_id", userIDInt), zap.Int64("channel_id", channel.ID), zap.String("channel_name", channel.Name), zap.Int64("group_id", groupID))

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
		log := logger.FromContext(r.Context())
		log.Debug("get group channels handler called")

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		vars := mux.Vars(r)
		groupID, err := strconv.ParseInt(vars["groupID"], 10, 64)
		if err != nil {
			log.Warn("invalid group id in get channels request", zap.String("group_id_str", vars["groupID"]), zap.Int64("user_id", userIDInt))
			return &domain.ValidationError{Message: "invalid group id"}
		}

		log.Debug("fetching channels for group", zap.Int64("user_id", userIDInt), zap.Int64("group_id", groupID))

		channels, err := channelService.GetChannelsByGroupID(r.Context(), groupID)
		if err != nil {
			log.Error("failed to get channels for group", zap.Int64("user_id", userIDInt), zap.Int64("group_id", groupID), zap.Error(err))
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

		log.Debug("successfully fetched channels", zap.Int64("user_id", userIDInt), zap.Int64("group_id", groupID), zap.Int("channel_count", len(channels)))

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(channelResponses)
	}
}

func getChannelInfoController(channelService service.IChannelService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("get channel info handler called")

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		vars := mux.Vars(r)
		channelID, err := strconv.ParseInt(vars["channelID"], 10, 64)
		if err != nil {
			log.Warn("invalid channel id in get channel info request", zap.String("channel_id_str", vars["channelID"]), zap.Int64("user_id", userIDInt))
			return &domain.ValidationError{Message: "invalid channel id"}
		}

		log.Debug("fetching channel info", zap.Int64("user_id", userIDInt), zap.Int64("channel_id", channelID))

		channel, err := channelService.GetChannelByID(r.Context(), channelID)
		if err != nil {
			log.Error("failed to get channel info", zap.Int64("user_id", userIDInt), zap.Int64("channel_id", channelID), zap.Error(err))
			return err
		}

		log.Debug("channel info retrieved successfully", zap.Int64("user_id", userIDInt), zap.Int64("channel_id", channelID), zap.String("channel_name", channel.Name))

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
