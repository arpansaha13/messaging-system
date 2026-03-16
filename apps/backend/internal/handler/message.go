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
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// SetupMessageRoutes sets up message routes
func SetupMessageRoutes(router *mux.Router, protectedRouter *mux.Router, messageService service.IMessageService) {
	protectedRouter.HandleFunc("/api/messages/send/personal", gtk.HttpControllerAdaptor(sendPersonalMessageController(messageService))).Methods("POST")
	protectedRouter.HandleFunc("/api/messages/send/group", gtk.HttpControllerAdaptor(sendGroupMessageController(messageService))).Methods("POST")
	protectedRouter.HandleFunc("/api/messages/{receiverID}", gtk.HttpControllerAdaptor(getMessagesController(messageService))).Methods("GET")
	protectedRouter.HandleFunc("/api/channels/{channelID}/messages", gtk.HttpControllerAdaptor(getChannelMessagesController(messageService))).Methods("GET")
	protectedRouter.HandleFunc("/api/messages/status/delivered", gtk.HttpControllerAdaptor(handleDeliveredController(messageService))).Methods("POST")
	protectedRouter.HandleFunc("/api/messages/status/read", gtk.HttpControllerAdaptor(handleReadController(messageService))).Methods("POST")
}

func sendPersonalMessageController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("send personal message handler called")

		var req dto.SendPersonalMessageDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body for send message", zap.Error(err))
			return nil, &gtk.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		senderID, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("sending personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID))

		messageID, createdAt, err := messageService.SendPersonalMessage(r.Context(), senderID, req.ReceiverID, req.Content, req.Hash)
		if err != nil {
			log.Error("failed to send personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return nil, err
		}

		log.Info("personal message sent successfully", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID), zap.Int64("message_id", messageID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.SendPersonalMessageResponseDTO{
				ID:        messageID,
				Hash:      req.Hash,
				Content:   req.Content,
				SenderID:  senderID,
				CreatedAt: createdAt,
				Status:    domain.MessageStatusSent,
			},
		}, nil
	}
}

func sendGroupMessageController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("send group message handler called")

		var req dto.SendGroupMessageDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body for send group message", zap.Error(err))
			return nil, &gtk.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		senderID, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("sending group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID))

		messageID, createdAt, err := messageService.SendGroupMessage(r.Context(), senderID, req.GroupID, req.ChannelID, req.Content, req.Hash)
		if err != nil {
			log.Error("failed to send group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID), zap.Error(err))
			return nil, err
		}

		log.Info("group message sent successfully", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID), zap.Int64("message_id", messageID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.SendGroupMessageResponseDTO{
				ID:        messageID,
				Hash:      req.Hash,
				Content:   req.Content,
				SenderID:  senderID,
				ChannelID: req.ChannelID,
				CreatedAt: createdAt,
				Status:    domain.MessageStatusSent,
			},
		}, nil
	}
}

func getMessagesController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("get messages handler called")

		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			log.Warn("invalid receiver id in get messages request", zap.String("receiver_id_str", vars["receiverID"]))
			return nil, &gtk.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		senderID, _ := strconv.ParseInt(userID, 10, 64)

		// Parse cursor parameters
		var before, after *int64
		if b := r.URL.Query().Get("before"); b != "" {
			if parsed, err := strconv.ParseInt(b, 10, 64); err == nil {
				before = &parsed
			}
		}
		if a := r.URL.Query().Get("after"); a != "" {
			if parsed, err := strconv.ParseInt(a, 10, 64); err == nil {
				after = &parsed
			}
		}

		// Validate that both cursors are not provided
		if before != nil && after != nil {
			log.Warn("both before and after cursors provided", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID))
			return nil, &gtk.ValidationError{Message: "cannot specify both 'before' and 'after'"}
		}

		log.Debug("fetching messages", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID))

		page, err := messageService.GetMessages(r.Context(), senderID, receiverID, before, after)
		if err != nil {
			log.Error("failed to get messages", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Error(err))
			return nil, err
		}

		log.Debug("messages retrieved successfully", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Int("message_count", len(page.Messages)))

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

		response := dto.PaginatedMessagesResponseDTO{
			Messages:  messageResponses,
			HasBefore: page.HasBefore,
			HasAfter:  page.HasAfter,
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       response,
		}, nil
	}
}

func handleDeliveredController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("handle delivered handler called")

		var req dto.HandleDeliveredDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in handle delivered", zap.Error(err))
			return nil, &gtk.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		receiverID, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("marking message as delivered", zap.Int64("message_id", req.MessageID), zap.Int64("receiver_id", receiverID))

		if err := messageService.MarkMessageAsDelivered(r.Context(), req.MessageID, receiverID); err != nil {
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
		log := logger.FromContext(r.Context())
		log.Debug("handle read handler called")

		var req dto.HandleReadMultipleDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in handle read", zap.Error(err))
			return nil, &gtk.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		receiverID, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("marking messages as read", zap.Int64("receiver_id", receiverID), zap.Int("message_count", len(req.Messages)))

		inputs := make([]service.MarkReadInput, len(req.Messages))
		for i, msg := range req.Messages {
			inputs[i] = service.MarkReadInput{
				MessageID:  msg.MessageID,
				ReceiverID: receiverID,
			}
		}

		if err := messageService.MarkMessageAsRead(r.Context(), inputs); err != nil {
			log.Error("failed to mark messages as read", zap.Int64("receiver_id", receiverID), zap.Int("message_count", len(inputs)), zap.Error(err))
			return nil, err
		}

		log.Info("messages marked as read successfully", zap.Int64("receiver_id", receiverID), zap.Int("message_count", len(inputs)))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       map[string]bool{"success": true},
		}, nil
	}
}

func getChannelMessagesController(messageService service.IMessageService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("get channel messages handler called")

		vars := mux.Vars(r)
		channelID, err := strconv.ParseInt(vars["channelID"], 10, 64)
		if err != nil {
			log.Warn("invalid channel id in get channel messages request", zap.String("channel_id_str", vars["channelID"]))
			return nil, &gtk.ValidationError{Message: "invalid channel id"}
		}

		// Parse cursor parameters
		var before, after *int64
		if b := r.URL.Query().Get("before"); b != "" {
			if parsed, err := strconv.ParseInt(b, 10, 64); err == nil {
				before = &parsed
			}
		}
		if a := r.URL.Query().Get("after"); a != "" {
			if parsed, err := strconv.ParseInt(a, 10, 64); err == nil {
				after = &parsed
			}
		}

		// Validate that both cursors are not provided
		if before != nil && after != nil {
			log.Warn("both before and after cursors provided", zap.Int64("channel_id", channelID))
			return nil, &gtk.ValidationError{Message: "cannot specify both 'before' and 'after'"}
		}

		log.Debug("fetching channel messages", zap.Int64("channel_id", channelID))

		page, err := messageService.GetChannelMessages(r.Context(), channelID, before, after)
		if err != nil {
			log.Error("failed to get channel messages", zap.Int64("channel_id", channelID), zap.Error(err))
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

		response := dto.PaginatedMessagesResponseDTO{
			Messages:  messageResponses,
			HasBefore: page.HasBefore,
			HasAfter:  page.HasAfter,
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       response,
		}, nil
	}
}
