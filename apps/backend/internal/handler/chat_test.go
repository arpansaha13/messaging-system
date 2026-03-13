package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
)

func TestChatHandler_GetUserUnarchivedChats(t *testing.T) {
	mockService := &mocks.MockChatService{
		GetUserUnarchivedChatsFunc: func(ctx context.Context, userID int64) ([]*service.ChatItemDTO, error) {
			return []*service.ChatItemDTO{}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/chats", nil)
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := getUserUnarchivedChatsController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestChatHandler_GetUserArchivedChats(t *testing.T) {
	mockService := &mocks.MockChatService{
		GetUserArchivedChatsFunc: func(ctx context.Context, userID int64) ([]*service.ChatItemDTO, error) {
			return []*service.ChatItemDTO{}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/chats/archived", nil)
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := getUserArchivedChatsController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusOK, resp.StatusCode)
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
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusNoContent, resp.StatusCode)
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
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusNoContent, resp.StatusCode)
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
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusNoContent, resp.StatusCode)
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
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusNoContent, resp.StatusCode)
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
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusNoContent, resp.StatusCode)
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
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusNoContent, resp.StatusCode)
}
