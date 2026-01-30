package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service/mocks"
)

func TestMessageHandler_SendPersonalMessage(t *testing.T) {
	mockService := &mocks.MockMessageService{
		SendPersonalMessageFunc: func(ctx context.Context, senderID, receiverID int64, content, hash string) error {
			return nil
		},
	}

	body, _ := json.Marshal(&dto.SendPersonalMessageDTO{
		ReceiverID: 2,
		Content:    "Hello World",
		Hash:       "hash123",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/messages/send/personal", bytes.NewBuffer(body))
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupMessageRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusAccepted, w.Code)
}

func TestMessageHandler_SendGroupMessage(t *testing.T) {
	mockService := &mocks.MockMessageService{
		SendGroupMessageFunc: func(ctx context.Context, senderID, groupID, channelID int64, content, hash string) error {
			return nil
		},
	}

	body, _ := json.Marshal(&dto.SendGroupMessageDTO{
		GroupID:   1,
		ChannelID: 1,
		Content:   "Hello Group",
		Hash:      "hash123",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/messages/send/group", bytes.NewBuffer(body))
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupMessageRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusAccepted, w.Code)
}
