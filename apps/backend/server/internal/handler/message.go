package handler

import (
	"net/http"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// SetupMessageRoutes sets up message routes
func SetupMessageRoutes(router *mux.Router, protectedRouter *mux.Router, messageService service.IMessageService) {
	protectedRouter.HandleFunc("/messages/send/personal", gtk.HttpControllerAdaptor(sendPersonalMessageController(messageService))).Methods("POST")
	protectedRouter.HandleFunc("/messages/send/group", gtk.HttpControllerAdaptor(sendGroupMessageController(messageService))).Methods("POST")
	protectedRouter.HandleFunc("/messages/{receiverID}", gtk.HttpControllerAdaptor(getMessagesController(messageService))).Methods("GET")
	protectedRouter.HandleFunc("/channels/{channelID}/messages", gtk.HttpControllerAdaptor(getChannelMessagesController(messageService))).Methods("GET")
	protectedRouter.HandleFunc("/messages/status/delivered", gtk.HttpControllerAdaptor(handleDeliveredController(messageService))).Methods("POST")
	protectedRouter.HandleFunc("/messages/status/read", gtk.HttpControllerAdaptor(handleReadController(messageService))).Methods("POST")
}

func sendPersonalMessageController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("send personal message handler called")

		req, err := dto.NewSendPersonalMessageDTO(r)
		if err != nil {
			log.Warn("failed to parse send personal message request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("send personal message validation failed")
			return nil, err
		}

		authUser := middleware.GetAuthUserFromContext(r)
		log.Debug("sending personal message", zap.Int64("sender_id", authUser.UserID), zap.Int64("receiver_id", req.ReceiverID))

		messageID, createdAt, err := messageService.SendPersonalMessage(r.Context(), req)
		if err != nil {
			log.Error("failed to send personal message", zap.Int64("sender_id", authUser.UserID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return nil, err
		}

		log.Info("personal message sent successfully", zap.Int64("sender_id", authUser.UserID), zap.Int64("receiver_id", req.ReceiverID), zap.Int64("message_id", messageID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.SendPersonalMessageResponseDTO{
				ID:        messageID,
				Hash:      req.Hash,
				Content:   req.Content,
				SenderID:  authUser.UserID,
				CreatedAt: createdAt,
				Status:    domain.MessageStatusSent,
			},
		}, nil
	}
}

func sendGroupMessageController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("send group message handler called")

		req, err := dto.NewSendGroupMessageDTO(r)
		if err != nil {
			log.Warn("failed to parse send group message request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("send group message validation failed")
			return nil, err
		}

		authUser := middleware.GetAuthUserFromContext(r)
		log.Debug("sending group message", zap.Int64("sender_id", authUser.UserID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID))

		messageID, createdAt, err := messageService.SendGroupMessage(r.Context(), req)
		if err != nil {
			log.Error("failed to send group message", zap.Int64("sender_id", authUser.UserID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID), zap.Error(err))
			return nil, err
		}

		log.Info("group message sent successfully", zap.Int64("sender_id", authUser.UserID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID), zap.Int64("message_id", messageID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.SendGroupMessageResponseDTO{
				ID:        messageID,
				Hash:      req.Hash,
				Content:   req.Content,
				SenderID:  authUser.UserID,
				ChannelID: req.ChannelID,
				CreatedAt: createdAt,
				Status:    domain.MessageStatusSent,
			},
		}, nil
	}
}

func getMessagesController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("get messages handler called")

		req, err := dto.NewGetMessagesDTO(r)
		if err != nil {
			log.Warn("failed to parse get messages request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("get messages validation failed", zap.Int64("receiver_id", req.ReceiverID))
			return nil, err
		}

		log.Debug("fetching messages", zap.Int64("receiver_id", req.ReceiverID))

		page, err := messageService.GetMessages(r.Context(), req)
		if err != nil {
			log.Error("failed to get messages", zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return nil, err
		}

		log.Debug("messages retrieved successfully", zap.Int64("receiver_id", req.ReceiverID), zap.Int("message_count", len(page.Messages)))

		messageResponses := make([]dto.MessageResponseDTO, len(page.Messages))
		for i, msg := range page.Messages {
			messageResponses[i] = dto.MessageResponseDTO{
				ID:        msg.ID,
				SenderID:  msg.SenderID,
				Content:   msg.Content,
				Status:    msg.Status,
				CreatedAt: msg.CreatedAt,
				UpdatedAt: msg.UpdatedAt,
			}
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.PaginatedMessagesResponseDTO{
				Messages:  messageResponses,
				HasBefore: page.HasBefore,
				HasAfter:  page.HasAfter,
			},
		}, nil
	}
}

func handleDeliveredController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("handle delivered handler called")

		req, err := dto.NewHandleDeliveredDTO(r)
		if err != nil {
			log.Warn("failed to parse handle delivered request", zap.Error(err))
			return nil, err
		}

		log.Debug("marking message as delivered", zap.Int64("message_id", req.MessageID))

		if err := messageService.MarkMessageAsDelivered(r.Context(), req); err != nil {
			log.Error("failed to mark message as delivered", zap.Int64("message_id", req.MessageID), zap.Error(err))
			return nil, err
		}

		log.Info("message marked as delivered successfully", zap.Int64("message_id", req.MessageID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       map[string]bool{"success": true},
		}, nil
	}
}

func handleReadController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("handle read handler called")

		req, err := dto.NewHandleReadMultipleDTO(r)
		if err != nil {
			log.Warn("failed to parse handle read request", zap.Error(err))
			return nil, err
		}

		log.Debug("marking messages as read", zap.Int("message_count", len(req.Messages)))

		if err := messageService.MarkMessageAsRead(r.Context(), req); err != nil {
			log.Error("failed to mark messages as read", zap.Int("message_count", len(req.Messages)), zap.Error(err))
			return nil, err
		}

		log.Info("messages marked as read successfully", zap.Int("message_count", len(req.Messages)))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       map[string]bool{"success": true},
		}, nil
	}
}

func getChannelMessagesController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("get channel messages handler called")

		req, err := dto.NewGetChannelMessagesDTO(r)
		if err != nil {
			log.Warn("failed to parse get channel messages request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("get channel messages validation failed", zap.Int64("channel_id", req.ChannelID))
			return nil, err
		}

		log.Debug("fetching channel messages", zap.Int64("channel_id", req.ChannelID))

		page, err := messageService.GetChannelMessages(r.Context(), req)
		if err != nil {
			log.Error("failed to get channel messages", zap.Int64("channel_id", req.ChannelID), zap.Error(err))
			return nil, err
		}

		messageResponses := make([]dto.MessageResponseDTO, len(page.Messages))
		for i, msg := range page.Messages {
			messageResponses[i] = dto.MessageResponseDTO{
				ID:        msg.ID,
				SenderID:  msg.SenderID,
				Content:   msg.Content,
				CreatedAt: msg.CreatedAt,
				UpdatedAt: msg.UpdatedAt,
			}
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.PaginatedMessagesResponseDTO{
				Messages:  messageResponses,
				HasBefore: page.HasBefore,
				HasAfter:  page.HasAfter,
			},
		}, nil
	}
}
