package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/backend/server/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

func TestMessageHandler_SendPersonalMessage(t *testing.T) {
	mockService := &mocks.MockMessageService{
		SendPersonalMessageFunc: func(ctx context.Context, req *dto.SendPersonalMessageDTO) (int64, time.Time, error) {
			return 1, time.Now(), nil
		},
	}

	body, _ := json.Marshal(&dto.SendPersonalMessageDTO{
		ReceiverID: 2,
		Content:    "Hello World",
		Hash:       "hash123",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/messages/send/personal", bytes.NewBuffer(body))
	ctx := context.WithValue(req.Context(), utils.AuthUserContextKey, &domain.AuthUser{UserID: 1})
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := sendPersonalMessageController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
}

func TestMessageHandler_SendGroupMessage(t *testing.T) {
	mockService := &mocks.MockMessageService{
		SendGroupMessageFunc: func(ctx context.Context, req *dto.SendGroupMessageDTO) (int64, time.Time, error) {
			return 1, time.Now(), nil
		},
	}

	body, _ := json.Marshal(&dto.SendGroupMessageDTO{
		GroupID:   1,
		ChannelID: 1,
		Content:   "Hello Group",
		Hash:      "hash123",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/messages/send/group", bytes.NewBuffer(body))
	ctx := context.WithValue(req.Context(), utils.AuthUserContextKey, &domain.AuthUser{UserID: 1})
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := sendGroupMessageController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
}
