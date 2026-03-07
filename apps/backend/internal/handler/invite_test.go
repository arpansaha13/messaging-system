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
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
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
	req = mux.SetURLVars(req, map[string]string{"hash": "abc123"})
	w := httptest.NewRecorder()

	controller := findInviteController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusOK, resp.StatusCode)
	result, ok := resp.Body.(dto.InviteResponseDTO)
	require.True(t, ok, "response body should be InviteResponseDTO")
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
	req = mux.SetURLVars(req, map[string]string{"hash": "abc123"})
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "2")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := acceptInviteController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusOK, resp.StatusCode)
	result, ok := resp.Body.(*service.AcceptInviteResponseDTO)
	require.True(t, ok, "response body should be AcceptInviteResponseDTO")
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
	req = mux.SetURLVars(req, map[string]string{"groupId": "1"})
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := createInviteController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	result, ok := resp.Body.(dto.InviteResponseDTO)
	require.True(t, ok, "response body should be InviteResponseDTO")
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

	controller := joinGroupController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusOK, resp.StatusCode)
	result, ok := resp.Body.(*service.AcceptInviteResponseDTO)
	require.True(t, ok, "response body should be AcceptInviteResponseDTO")
	assert.Equal(t, int64(1), result.GroupID)
}
