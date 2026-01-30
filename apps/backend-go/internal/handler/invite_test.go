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

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service/mocks"
)

func TestInviteHandler_SendInvite(t *testing.T) {
	mockService := &mocks.MockInviteService{
		SendInviteFunc: func(ctx context.Context, groupID, userID, invitedBy int64) (*domain.Invite, error) {
			return &domain.Invite{
				ID:        1,
				GroupID:   groupID,
				UserID:    userID,
				InvitedBy: invitedBy,
				Status:    "pending",
			}, nil
		},
	}

	body, _ := json.Marshal(map[string]interface{}{
		"groupID": 1,
		"userID":  2,
	})

	req := httptest.NewRequest(http.MethodPost, "/api/invites", bytes.NewBuffer(body))
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupInviteRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestInviteHandler_GetInvites(t *testing.T) {
	mockService := &mocks.MockInviteService{
		GetInvitesFunc: func(ctx context.Context, userID int64) ([]*domain.Invite, error) {
			return []*domain.Invite{}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/invites", nil)
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupInviteRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
