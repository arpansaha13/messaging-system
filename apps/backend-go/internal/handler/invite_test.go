package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend-go/tests/mocks"
)

func TestInviteHandler_FindByHash(t *testing.T) {
	groupID := int64(1)
	expiresAt := time.Now().Add(24 * time.Hour)
	mockService := &mocks.MockInviteService{
		FindByHashFunc: func(ctx context.Context, hash string) (*domain.Invite, error) {
			return &domain.Invite{
				Hash:      hash,
				InviterID: 1,
				GroupID:   &groupID,
				ExpiresAt: &expiresAt,
			}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/invites/abc123", nil)
	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupInviteRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var result dto.InviteResponseDTO
	json.NewDecoder(w.Body).Decode(&result)
	assert.Equal(t, "abc123", result.Hash)
}

func TestInviteHandler_AcceptInvite(t *testing.T) {
	mockService := &mocks.MockInviteService{
		AcceptInviteFunc: func(ctx context.Context, userID int64, inviteHash string) (*service.AcceptInviteResponseDTO, error) {
			return &service.AcceptInviteResponseDTO{
				GroupID:  1,
				Channels: []int64{1, 2},
			}, nil
		},
	}

	req := httptest.NewRequest(http.MethodPost, "/api/invites/abc123/accept", nil)
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "2")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupInviteRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var result service.AcceptInviteResponseDTO
	json.NewDecoder(w.Body).Decode(&result)
	assert.Equal(t, int64(1), result.GroupID)
	assert.Equal(t, 2, len(result.Channels))
}

func TestInviteHandler_CreateInvite(t *testing.T) {
	mockService := &mocks.MockInviteService{
		CreateInviteFunc: func(ctx context.Context, inviterID, groupID int64) (*domain.Invite, error) {
			groupIDPtr := groupID
			expiresAt := time.Now().Add(24 * time.Hour)
			return &domain.Invite{
				Hash:      "newhash",
				InviterID: inviterID,
				GroupID:   &groupIDPtr,
				ExpiresAt: &expiresAt,
			}, nil
		},
	}

	req := httptest.NewRequest(http.MethodPost, "/api/groups/1/invites", nil)
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupInviteRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var result dto.InviteResponseDTO
	json.NewDecoder(w.Body).Decode(&result)
	assert.Equal(t, "newhash", result.Hash)
}

func TestInviteHandler_JoinGroup(t *testing.T) {
	mockService := &mocks.MockInviteService{
		AcceptInviteFunc: func(ctx context.Context, userID int64, inviteHash string) (*service.AcceptInviteResponseDTO, error) {
			return &service.AcceptInviteResponseDTO{
				GroupID:  1,
				Channels: []int64{1},
			}, nil
		},
	}

	body, _ := json.Marshal(map[string]interface{}{
		"inviteHash": "abc123",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/groups/join", bytes.NewBuffer(body))
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "2")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupInviteRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var result service.AcceptInviteResponseDTO
	json.NewDecoder(w.Body).Decode(&result)
	assert.Equal(t, int64(1), result.GroupID)
}
