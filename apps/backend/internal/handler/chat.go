package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// SetupChatRoutes sets up chat routes
func SetupChatRoutes(router *mux.Router, protectedRouter *mux.Router, chatService service.IChatService) {
	protectedRouter.HandleFunc("/api/chats", AdaptController(getUserChatsController(chatService))).Methods("GET")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/pin", AdaptController(pinChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/unpin", AdaptController(unpinChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/archive", AdaptController(archiveChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/unarchive", AdaptController(unarchiveChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/clear", AdaptController(clearChatController(chatService))).Methods("DELETE")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/delete", AdaptController(deleteChatController(chatService))).Methods("DELETE")
}

func getUserChatsController(chatService service.IChatService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		chatsResponse, err := chatService.GetUserChats(r.Context(), userIDInt)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(chatsResponse)
	}
}

func pinChatController(chatService service.IChatService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.PinChat(r.Context(), userIDInt, receiverID); err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func unpinChatController(chatService service.IChatService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.UnpinChat(r.Context(), userIDInt, receiverID); err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func archiveChatController(chatService service.IChatService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.ArchiveChat(r.Context(), userIDInt, receiverID); err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func unarchiveChatController(chatService service.IChatService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.UnarchiveChat(r.Context(), userIDInt, receiverID); err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func clearChatController(chatService service.IChatService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.ClearChat(r.Context(), userIDInt, receiverID); err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func deleteChatController(chatService service.IChatService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := chatService.DeleteChat(r.Context(), userIDInt, receiverID); err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}
