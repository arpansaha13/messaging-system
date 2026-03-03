package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
)

// SetupChatRoutes sets up chat routes
func SetupChatRoutes(router *mux.Router, protectedRouter *mux.Router, chatService service.IChatService) {
	protectedRouter.HandleFunc("/api/chats", gtk.HttpControllerAdaptor(getUserChatsController(chatService))).Methods("GET")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/pin", gtk.HttpControllerAdaptor(pinChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/unpin", gtk.HttpControllerAdaptor(unpinChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/archive", gtk.HttpControllerAdaptor(archiveChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/unarchive", gtk.HttpControllerAdaptor(unarchiveChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/clear", gtk.HttpControllerAdaptor(clearChatController(chatService))).Methods("DELETE")
	protectedRouter.HandleFunc("/api/chats/{receiverID}/delete", gtk.HttpControllerAdaptor(deleteChatController(chatService))).Methods("DELETE")
}

func getUserChatsController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("get user chats handler called")

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("fetching chats for user", zap.Int64("user_id", userIDInt))

		chatsResponse, err := chatService.GetUserChats(r.Context(), userIDInt)
		if err != nil {
			log.Error("failed to get user chats", zap.Int64("user_id", userIDInt), zap.Error(err))
			return err
		}

		log.Debug("user chats retrieved successfully", zap.Int64("user_id", userIDInt))

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(chatsResponse)
	}
}

func pinChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("pin chat handler called")

		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			log.Warn("invalid receiver id in pin chat request", zap.String("receiver_id_str", vars["receiverID"]))
			return &gtk.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("pinning chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		if err := chatService.PinChat(r.Context(), userIDInt, receiverID); err != nil {
			log.Error("failed to pin chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID), zap.Error(err))
			return err
		}

		log.Info("chat pinned successfully", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func unpinChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("unpin chat handler called")

		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			log.Warn("invalid receiver id in unpin chat request", zap.String("receiver_id_str", vars["receiverID"]))
			return &gtk.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("unpinning chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		if err := chatService.UnpinChat(r.Context(), userIDInt, receiverID); err != nil {
			log.Error("failed to unpin chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID), zap.Error(err))
			return err
		}

		log.Info("chat unpinned successfully", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func archiveChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("archive chat handler called")

		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			log.Warn("invalid receiver id in archive chat request", zap.String("receiver_id_str", vars["receiverID"]))
			return &gtk.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("archiving chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		if err := chatService.ArchiveChat(r.Context(), userIDInt, receiverID); err != nil {
			log.Error("failed to archive chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID), zap.Error(err))
			return err
		}

		log.Info("chat archived successfully", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func unarchiveChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("unarchive chat handler called")

		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			log.Warn("invalid receiver id in unarchive chat request", zap.String("receiver_id_str", vars["receiverID"]))
			return &gtk.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("unarchiving chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		if err := chatService.UnarchiveChat(r.Context(), userIDInt, receiverID); err != nil {
			log.Error("failed to unarchive chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID), zap.Error(err))
			return err
		}

		log.Info("chat unarchived successfully", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func clearChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("clear chat handler called")

		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			log.Warn("invalid receiver id in clear chat request", zap.String("receiver_id_str", vars["receiverID"]))
			return &gtk.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("clearing chat history", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		if err := chatService.ClearChat(r.Context(), userIDInt, receiverID); err != nil {
			log.Error("failed to clear chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID), zap.Error(err))
			return err
		}

		log.Info("chat cleared successfully", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}

func deleteChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("delete chat handler called")

		vars := mux.Vars(r)
		receiverID, err := strconv.ParseInt(vars["receiverID"], 10, 64)
		if err != nil {
			log.Warn("invalid receiver id in delete chat request", zap.String("receiver_id_str", vars["receiverID"]))
			return &gtk.ValidationError{Message: "invalid receiver id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("deleting chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		if err := chatService.DeleteChat(r.Context(), userIDInt, receiverID); err != nil {
			log.Error("failed to delete chat", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID), zap.Error(err))
			return err
		}

		log.Info("chat deleted successfully", zap.Int64("user_id", userIDInt), zap.Int64("receiver_id", receiverID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNoContent)
		return nil
	}
}
