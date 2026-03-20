package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

func TestGroupHandler_CreateGroup(t *testing.T) {
	mockService := &mocks.MockGroupService{
		CreateGroupFunc: func(ctx context.Context, req *dto.CreateGroupDTO) (*domain.Group, error) {
			return &domain.Group{
				ID:        1,
				Name:      req.Name,
				FounderID: 1,
			}, nil
		},
	}

	body, _ := json.Marshal(map[string]interface{}{
		"name": "Test Group",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/groups", bytes.NewBuffer(body))
	ctx := context.WithValue(req.Context(), utils.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := createGroupController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
}

func TestGroupHandler_GetGroups(t *testing.T) {
	mockService := &mocks.MockGroupService{
		GetGroupsFunc: func(ctx context.Context) ([]*domain.Group, error) {
			return []*domain.Group{}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/groups", nil)
	ctx := context.WithValue(req.Context(), utils.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	controller := getGroupsController(mockService)
	resp, err := controller(w, req)

	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusOK, resp.StatusCode)
}
