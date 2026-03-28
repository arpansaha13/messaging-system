package handler

import (
	"net/http"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
)

// SetupChannelRoutes sets up channel routes
func SetupChannelRoutes(router *mux.Router, protectedRouter *mux.Router, channelService service.IChannelService) {
	protectedRouter.HandleFunc("/groups/{groupID}/channels", gtk.HttpControllerAdaptor(createChannelController(channelService))).Methods("POST")
	protectedRouter.HandleFunc("/groups/{groupID}/channels", gtk.HttpControllerAdaptor(getGroupChannelsController(channelService))).Methods("GET")
	protectedRouter.HandleFunc("/channels/{channelID}", gtk.HttpControllerAdaptor(getChannelInfoController(channelService))).Methods("GET")
}

func createChannelController(channelService service.IChannelService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("create channel handler called")

		req, err := dto.NewCreateChannelDTO(r)
		if err != nil {
			log.Warn("failed to parse create channel request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("create channel validation failed", zap.Int64("group_id", req.GroupID))
			return nil, err
		}

		log.Debug("creating channel", zap.Int64("group_id", req.GroupID), zap.String("channel_name", req.Name))

		channel, err := channelService.CreateChannel(r.Context(), req)
		if err != nil {
			log.Error("failed to create channel", zap.Int64("group_id", req.GroupID), zap.String("channel_name", req.Name), zap.Error(err))
			return nil, err
		}

		log.Info("channel created successfully", zap.Int64("channel_id", channel.ID), zap.String("channel_name", channel.Name), zap.Int64("group_id", req.GroupID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.ChannelResponseDTO{
				ID:        channel.ID,
				Name:      channel.Name,
				GroupID:   channel.GroupID,
				CreatedAt: channel.CreatedAt,
				UpdatedAt: channel.UpdatedAt,
			},
		}, nil
	}
}

func getGroupChannelsController(channelService service.IChannelService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("get group channels handler called")

		req, err := dto.NewGetGroupChannelsDTO(r)
		if err != nil {
			log.Warn("failed to parse get group channels request", zap.Error(err))
			return nil, err
		}

		log.Debug("fetching channels for group", zap.Int64("group_id", req.GroupID))

		channels, err := channelService.GetChannelsByGroupID(r.Context(), req)
		if err != nil {
			log.Error("failed to get channels for group", zap.Int64("group_id", req.GroupID), zap.Error(err))
			return nil, err
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

		log.Debug("successfully fetched channels", zap.Int64("group_id", req.GroupID), zap.Int("channel_count", len(channels)))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       channelResponses,
		}, nil
	}
}

func getChannelInfoController(channelService service.IChannelService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("get channel info handler called")

		req, err := dto.NewGetChannelInfoDTO(r)
		if err != nil {
			log.Warn("failed to parse get channel info request", zap.Error(err))
			return nil, err
		}

		log.Debug("fetching channel info", zap.Int64("channel_id", req.ChannelID))

		channel, err := channelService.GetChannelByID(r.Context(), req)
		if err != nil {
			log.Error("failed to get channel info", zap.Int64("channel_id", req.ChannelID), zap.Error(err))
			return nil, err
		}

		log.Debug("channel info retrieved successfully", zap.Int64("channel_id", req.ChannelID), zap.String("channel_name", channel.Name))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.ChannelResponseDTO{
				ID:        channel.ID,
				Name:      channel.Name,
				GroupID:   channel.GroupID,
				CreatedAt: channel.CreatedAt,
				UpdatedAt: channel.UpdatedAt,
			},
		}, nil
	}
}
