package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend-go/tests/mocks"
)

func TestChatHandler_GetUserChats(t *testing.T) {
	mockService := &mocks.MockChatService{
		GetUserChatsFunc: func(ctx context.Context, userID int64) (*service.ChatsResponseDTO, error) {
			return &service.ChatsResponseDTO{
				Unarchived: []*service.ChatItemDTO{},
				Archived:   []*service.ChatItemDTO{},
			}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/chats", nil)
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := getUserChatsController(mockService)
	err := controller(w, req)

	require.NoError(t, err)
}

func TestChatHandler_PinChat(t *testing.T) {
	mockService := &mocks.MockChatService{
		PinChatFunc: func(ctx context.Context, userID, receiverID int64) error {
			return nil
		},
	}

	req := httptest.NewRequest(http.MethodPatch, "/api/chats/2/pin", nil)
	req = mux.SetURLVars(req, map[string]string{"receiverID": "2"})
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := pinChatController(mockService)
	err := controller(w, req)

	require.NoError(t, err)
}

func TestChatHandler_UnpinChat(t *testing.T) {
	mockService := &mocks.MockChatService{
		UnpinChatFunc: func(ctx context.Context, userID, receiverID int64) error {
			return nil
		},
	}

	req := httptest.NewRequest(http.MethodPatch, "/api/chats/2/unpin", nil)
	req = mux.SetURLVars(req, map[string]string{"receiverID": "2"})
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := unpinChatController(mockService)
	err := controller(w, req)

	require.NoError(t, err)
}

func TestChatHandler_ArchiveChat(t *testing.T) {
	mockService := &mocks.MockChatService{
		ArchiveChatFunc: func(ctx context.Context, userID, receiverID int64) error {
			return nil
		},
	}

	req := httptest.NewRequest(http.MethodPatch, "/api/chats/2/archive", nil)
	req = mux.SetURLVars(req, map[string]string{"receiverID": "2"})
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := archiveChatController(mockService)
	err := controller(w, req)

	require.NoError(t, err)
}

func TestChatHandler_UnarchiveChat(t *testing.T) {
	mockService := &mocks.MockChatService{
		UnarchiveChatFunc: func(ctx context.Context, userID, receiverID int64) error {
			return nil
		},
	}

	req := httptest.NewRequest(http.MethodPatch, "/api/chats/2/unarchive", nil)
	req = mux.SetURLVars(req, map[string]string{"receiverID": "2"})
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := unarchiveChatController(mockService)
	err := controller(w, req)

	require.NoError(t, err)
}

func TestChatHandler_ClearChat(t *testing.T) {
	mockService := &mocks.MockChatService{
		ClearChatFunc: func(ctx context.Context, userID, receiverID int64) error {
			return nil
		},
	}

	req := httptest.NewRequest(http.MethodDelete, "/api/chats/2/clear", nil)
	req = mux.SetURLVars(req, map[string]string{"receiverID": "2"})
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := clearChatController(mockService)
	err := controller(w, req)

	require.NoError(t, err)
}

func TestChatHandler_DeleteChat(t *testing.T) {
	mockService := &mocks.MockChatService{
		DeleteChatFunc: func(ctx context.Context, userID, receiverID int64) error {
			return nil
		},
	}

	req := httptest.NewRequest(http.MethodDelete, "/api/chats/2/delete", nil)
	req = mux.SetURLVars(req, map[string]string{"receiverID": "2"})
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := deleteChatController(mockService)
	err := controller(w, req)

	require.NoError(t, err)
}
