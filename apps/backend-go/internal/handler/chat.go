package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
)

// SetupChatRoutes sets up chat routes
func SetupChatRoutes(router *mux.Router, protectedRouter *mux.Router, chatService service.IChatService) {
	protectedRouter.HandleFunc("/api/chats", getUserChatsHandler(chatService)).Methods("GET")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/pin", pinChatHandler(chatService)).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/unpin", unpinChatHandler(chatService)).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/archive", archiveChatHandler(chatService)).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/unarchive", unarchiveChatHandler(chatService)).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/clear", clearChatHandler(chatService)).Methods("DELETE")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/delete", deleteChatHandler(chatService)).Methods("DELETE")
}

func getUserChatsHandler(chatService service.IChatService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		chatsResponse, err := chatService.GetUserChats(r.Context(), userIDInt)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(chatsResponse)
	}
}

func pinChatHandler(chatService service.IChatService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid receiver id"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.PinChat(r.Context(), userIDInt, receiverID); err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
	}
}

func unpinChatHandler(chatService service.IChatService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid receiver id"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.UnpinChat(r.Context(), userIDInt, receiverID); err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
	}
}

func archiveChatHandler(chatService service.IChatService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid receiver id"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.ArchiveChat(r.Context(), userIDInt, receiverID); err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
	}
}

func unarchiveChatHandler(chatService service.IChatService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid receiver id"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.UnarchiveChat(r.Context(), userIDInt, receiverID); err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
	}
}

func clearChatHandler(chatService service.IChatService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid receiver id"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.ClearChat(r.Context(), userIDInt, receiverID); err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
	}
}

func deleteChatHandler(chatService service.IChatService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid receiver id"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.DeleteChat(r.Context(), userIDInt, receiverID); err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
	}
}
