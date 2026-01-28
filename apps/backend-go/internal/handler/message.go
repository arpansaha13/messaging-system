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

// SetupMessageRoutes sets up message routes
func SetupMessageRoutes(router *mux.Router, protectedRouter *mux.Router, messageService service.IMessageService) {
	protectedRouter.HandleFunc("/api/messages/send/personal", sendPersonalMessageHandler(messageService)).Methods("POST")
	protectedRouter.HandleFunc("/api/messages/send/group", sendGroupMessageHandler(messageService)).Methods("POST")
	protectedRouter.HandleFunc("/api/messages/{receiverID}", getMessagesHandler(messageService)).Methods("GET")
	protectedRouter.HandleFunc("/api/channels/{channelID}/messages", getChannelMessagesHandler(messageService)).Methods("GET")
	protectedRouter.HandleFunc("/api/messages/status/delivered", handleDeliveredHandler(messageService)).Methods("POST")
	protectedRouter.HandleFunc("/api/messages/status/read", handleReadHandler(messageService)).Methods("POST")
}

func sendPersonalMessageHandler(messageService service.IMessageService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.SendPersonalMessageDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		senderID, _ := strconv.ParseInt(userID, 10, 64)

		if err := messageService.SendPersonalMessage(r.Context(), senderID, req.ReceiverID, req.Content, req.Hash); err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func sendGroupMessageHandler(messageService service.IMessageService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.SendGroupMessageDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		senderID, _ := strconv.ParseInt(userID, 10, 64)

		if err := messageService.SendGroupMessage(r.Context(), senderID, req.GroupID, req.ChannelID, req.Content, req.Hash); err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func getMessagesHandler(messageService service.IMessageService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid receiver id"})
			return
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

		messages, err := messageService.GetMessages(r.Context(), senderID, receiverID, limit, offset)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

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
		json.NewEncoder(w).Encode(messageResponses)
	}
}

func handleDeliveredHandler(messageService service.IMessageService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.HandleDeliveredDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		receiverID, _ := strconv.ParseInt(userID, 10, 64)

		if err := messageService.MarkMessageAsDelivered(r.Context(), req.MessageID, receiverID, req.SenderID); err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func handleReadHandler(messageService service.IMessageService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.HandleReadMultipleDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		receiverID, _ := strconv.ParseInt(userID, 10, 64)

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
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func getChannelMessagesHandler(messageService service.IMessageService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		channelID, err := strconv.ParseInt(vars["channelID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid channel id"})
			return
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

		messages, err := messageService.GetChannelMessages(r.Context(), channelID, limit, offset)
		if err != nil {
			middleware.WriteError(w, err)
			return
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
		json.NewEncoder(w).Encode(messageResponses)
	}
}

func markMessageReadHandler(messageService service.IMessageService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// This handler is no longer used - status is sent via /api/messages/status/read
		middleware.WriteError(w, &domain.ValidationError{Message: "invalid endpoint - use /api/messages/status/read"})
	}
}
