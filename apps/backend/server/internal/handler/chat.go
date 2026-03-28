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

// SetupChatRoutes sets up chat routes
func SetupChatRoutes(router *mux.Router, protectedRouter *mux.Router, chatService service.IChatService) {
	protectedRouter.HandleFunc("/chats", gtk.HttpControllerAdaptor(getUserUnarchivedChatsController(chatService))).Methods("GET")
	protectedRouter.HandleFunc("/chats/archived", gtk.HttpControllerAdaptor(getUserArchivedChatsController(chatService))).Methods("GET")
	protectedRouter.HandleFunc("/chats/{receiverID}/pin", gtk.HttpControllerAdaptor(pinChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/chats/{receiverID}/unpin", gtk.HttpControllerAdaptor(unpinChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/chats/{receiverID}/archive", gtk.HttpControllerAdaptor(archiveChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/chats/{receiverID}/unarchive", gtk.HttpControllerAdaptor(unarchiveChatController(chatService))).Methods("PATCH")
	protectedRouter.HandleFunc("/chats/{receiverID}/clear", gtk.HttpControllerAdaptor(clearChatController(chatService))).Methods("DELETE")
	protectedRouter.HandleFunc("/chats/{receiverID}/delete", gtk.HttpControllerAdaptor(deleteChatController(chatService))).Methods("DELETE")
}

func getUserUnarchivedChatsController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("get unarchived chats handler called")

		chatsResponse, err := chatService.GetUserUnarchivedChats(r.Context())
		if err != nil {
			log.Error("failed to get unarchived user chats", zap.Error(err))
			return nil, err
		}

		log.Debug("unarchived chats retrieved successfully")

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       chatsResponse,
		}, nil
	}
}

func getUserArchivedChatsController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("get archived chats handler called")

		chatsResponse, err := chatService.GetUserArchivedChats(r.Context())
		if err != nil {
			log.Error("failed to get archived user chats", zap.Error(err))
			return nil, err
		}

		log.Debug("archived chats retrieved successfully")

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       chatsResponse,
		}, nil
	}
}

func pinChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("pin chat handler called")

		req, err := dto.NewPinChatDTO(r)
		if err != nil {
			log.Warn("failed to parse pin chat request", zap.Error(err))
			return nil, err
		}

		log.Debug("pinning chat", zap.Int64("receiver_id", req.ReceiverID))

		if err := chatService.PinChat(r.Context(), req); err != nil {
			log.Error("failed to pin chat", zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return nil, err
		}

		log.Info("chat pinned successfully", zap.Int64("receiver_id", req.ReceiverID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusNoContent,
			Body:       nil,
		}, nil
	}
}

func unpinChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("unpin chat handler called")

		req, err := dto.NewUnpinChatDTO(r)
		if err != nil {
			log.Warn("failed to parse unpin chat request", zap.Error(err))
			return nil, err
		}

		log.Debug("unpinning chat", zap.Int64("receiver_id", req.ReceiverID))

		if err := chatService.UnpinChat(r.Context(), req); err != nil {
			log.Error("failed to unpin chat", zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return nil, err
		}

		log.Info("chat unpinned successfully", zap.Int64("receiver_id", req.ReceiverID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusNoContent,
			Body:       nil,
		}, nil
	}
}

func archiveChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("archive chat handler called")

		req, err := dto.NewArchiveChatDTO(r)
		if err != nil {
			log.Warn("failed to parse archive chat request", zap.Error(err))
			return nil, err
		}

		log.Debug("archiving chat", zap.Int64("receiver_id", req.ReceiverID))

		if err := chatService.ArchiveChat(r.Context(), req); err != nil {
			log.Error("failed to archive chat", zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return nil, err
		}

		log.Info("chat archived successfully", zap.Int64("receiver_id", req.ReceiverID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusNoContent,
			Body:       nil,
		}, nil
	}
}

func unarchiveChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("unarchive chat handler called")

		req, err := dto.NewUnarchiveChatDTO(r)
		if err != nil {
			log.Warn("failed to parse unarchive chat request", zap.Error(err))
			return nil, err
		}

		log.Debug("unarchiving chat", zap.Int64("receiver_id", req.ReceiverID))

		if err := chatService.UnarchiveChat(r.Context(), req); err != nil {
			log.Error("failed to unarchive chat", zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return nil, err
		}

		log.Info("chat unarchived successfully", zap.Int64("receiver_id", req.ReceiverID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusNoContent,
			Body:       nil,
		}, nil
	}
}

func clearChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("clear chat handler called")

		req, err := dto.NewClearChatDTO(r)
		if err != nil {
			log.Warn("failed to parse clear chat request", zap.Error(err))
			return nil, err
		}

		log.Debug("clearing chat history", zap.Int64("receiver_id", req.ReceiverID))

		if err := chatService.ClearChat(r.Context(), req); err != nil {
			log.Error("failed to clear chat", zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return nil, err
		}

		log.Info("chat cleared successfully", zap.Int64("receiver_id", req.ReceiverID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusNoContent,
			Body:       nil,
		}, nil
	}
}

func deleteChatController(chatService service.IChatService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("delete chat handler called")

		req, err := dto.NewDeleteChatDTO(r)
		if err != nil {
			log.Warn("failed to parse delete chat request", zap.Error(err))
			return nil, err
		}

		log.Debug("deleting chat", zap.Int64("receiver_id", req.ReceiverID))

		if err := chatService.DeleteChat(r.Context(), req); err != nil {
			log.Error("failed to delete chat", zap.Int64("receiver_id", req.ReceiverID), zap.Error(err))
			return nil, err
		}

		log.Info("chat deleted successfully", zap.Int64("receiver_id", req.ReceiverID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusNoContent,
			Body:       nil,
		}, nil
	}
}
