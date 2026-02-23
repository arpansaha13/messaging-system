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

// SetupMessageRoutes sets up message routes
func SetupMessageRoutes(router *mux.Router, protectedRouter *mux.Router, messageService service.IMessageService) {
	protectedRouter.HandleFunc("/api/messages/send/personal", AdaptController(sendPersonalMessageController(messageService))).Methods("POST")
	protectedRouter.HandleFunc("/api/messages/send/group", AdaptController(sendGroupMessageController(messageService))).Methods("POST")
	protectedRouter.HandleFunc("/api/messages/{receiverID}", AdaptController(getMessagesController(messageService))).Methods("GET")
	protectedRouter.HandleFunc("/api/channels/{channelID}/messages", AdaptController(getChannelMessagesController(messageService))).Methods("GET")
	protectedRouter.HandleFunc("/api/messages/status/delivered", AdaptController(handleDeliveredController(messageService))).Methods("POST")
	protectedRouter.HandleFunc("/api/messages/status/read", AdaptController(handleReadController(messageService))).Methods("POST")
}

func sendPersonalMessageController(messageService service.IMessageService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("send personal message handler called")

		var req dto.SendPersonalMessageDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body for send message", zap.Error(err))
			return &domain.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		senderID, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("sending personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID))

		if err := messageService.SendPersonalMessage(r.Context(), senderID, req.ReceiverID, req.Content, req.Hash); err != nil {
			log.Error("failed to send personal message", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return err
		}

		log.Info("personal message sent successfully", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", req.ReceiverID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		return json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func sendGroupMessageController(messageService service.IMessageService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("send group message handler called")

		var req dto.SendGroupMessageDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body for send group message", zap.Error(err))
			return &domain.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		senderID, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("sending group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID))

		if err := messageService.SendGroupMessage(r.Context(), senderID, req.GroupID, req.ChannelID, req.Content, req.Hash); err != nil {
			log.Error("failed to send group message", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID), zap.Error(err))
			return err
		}

		log.Info("group message sent successfully", zap.Int64("sender_id", senderID), zap.Int64("group_id", req.GroupID), zap.Int64("channel_id", req.ChannelID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		return json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func getMessagesController(messageService service.IMessageService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("get messages handler called")

		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			log.Warn("invalid receiver id in get messages request", zap.String("receiver_id_str", vars["receiverID"]))
			return &domain.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		senderID, _ := strconv.ParseInt(userID, 10, 64)

		limit := 50
		offset := 0
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil {
				limit = parsed
			}
		}
		if o := r.URL.Query().Get("offset"); o != "" {
			if parsed, err := strconv.Atoi(o); err == nil {
				offset = parsed
			}
		}

		log.Debug("fetching messages", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Int("limit", limit), zap.Int("offset", offset))

		messages, err := messageService.GetMessages(r.Context(), senderID, receiverID, limit, offset)
		if err != nil {
			log.Error("failed to get messages", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Error(err))
			return err
		}

		log.Debug("messages retrieved successfully", zap.Int64("sender_id", senderID), zap.Int64("receiver_id", receiverID), zap.Int("message_count", len(messages)))

		messageResponses := make([]dto.MessageResponseDTO, len(messages))
		for i, msg := range messages {
			messageResponses[i] = dto.MessageResponseDTO{
				ID:        msg.ID,
				SenderID:  msg.SenderID,
				Content:   msg.Content,
				Status:    msg.Status,
				CreatedAt: msg.CreatedAt,
				UpdatedAt: msg.UpdatedAt,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(messageResponses)
	}
}

func handleDeliveredController(messageService service.IMessageService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("handle delivered handler called")

		var req dto.HandleDeliveredDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in handle delivered", zap.Error(err))
			return &domain.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		receiverID, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("marking message as delivered", zap.Int64("message_id", req.MessageID), zap.Int64("receiver_id", receiverID), zap.Int64("sender_id", req.SenderID))

		if err := messageService.MarkMessageAsDelivered(r.Context(), req.MessageID, receiverID, req.SenderID); err != nil {
			log.Error("failed to mark message as delivered", zap.Int64("message_id", req.MessageID), zap.Error(err))
			return err
		}

		log.Info("message marked as delivered successfully", zap.Int64("message_id", req.MessageID))

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func handleReadController(messageService service.IMessageService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("handle read handler called")

		var req dto.HandleReadMultipleDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in handle read", zap.Error(err))
			return &domain.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		receiverID, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("marking messages as read", zap.Int64("receiver_id", receiverID), zap.Int("message_count", len(req.Messages)))

		// Convert HandleReadDTO to ReadPayload and set receiverID
		readPayloads := make([]service.ReadPayload, len(req.Messages))
		for i, msg := range req.Messages {
			readPayloads[i] = service.ReadPayload{
				MessageID:  msg.MessageID,
				SenderID:   msg.SenderID,
				ReceiverID: receiverID,
			}
		}

		if err := messageService.MarkMessageAsRead(r.Context(), readPayloads); err != nil {
			log.Error("failed to mark messages as read", zap.Int64("receiver_id", receiverID), zap.Int("message_count", len(readPayloads)), zap.Error(err))
			return err
		}

		log.Info("messages marked as read successfully", zap.Int64("receiver_id", receiverID), zap.Int("message_count", len(readPayloads)))

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func getChannelMessagesController(messageService service.IMessageService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("get channel messages handler called")

		vars := mux.Vars(r)
		channelID, err := strconv.ParseInt(vars["channelID"], 10, 64)
		if err != nil {
			log.Warn("invalid channel id in get channel messages request", zap.String("channel_id_str", vars["channelID"]))
			return &domain.ValidationError{Message: "invalid channel id"}
		}

		limit := 50
		offset := 0
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil {
				limit = parsed
			}
		}
		if o := r.URL.Query().Get("offset"); o != "" {
			if parsed, err := strconv.Atoi(o); err == nil {
				offset = parsed
			}
		}

		log.Debug("fetching channel messages", zap.Int64("channel_id", channelID), zap.Int("limit", limit), zap.Int("offset", offset))

		messages, err := messageService.GetChannelMessages(r.Context(), channelID, limit, offset)
		if err != nil {
			log.Error("failed to get channel messages", zap.Int64("channel_id", channelID), zap.Error(err))
			return err
		}

		messageResponses := make([]dto.MessageResponseDTO, len(messages))
		for i, msg := range messages {
			messageResponses[i] = dto.MessageResponseDTO{
				ID:        msg.ID,
				SenderID:  msg.SenderID,
				Content:   msg.Content,
				CreatedAt: msg.CreatedAt,
				UpdatedAt: msg.UpdatedAt,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(messageResponses)
	}
}
