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
	"github.com/arpansaha13/messaging-system/apps/backend-go/tests/mocks"
)

func TestGroupHandler_CreateGroup(t *testing.T) {
	mockService := &mocks.MockGroupService{
		CreateGroupFunc: func(ctx context.Context, name string, founderID int64) (*domain.Group, error) {
			return &domain.Group{
				ID:        1,
				Name:      name,
				FounderID: founderID,
			}, nil
		},
	}

	body, _ := json.Marshal(map[string]interface{}{
		"name": "Test Group",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/groups", bytes.NewBuffer(body))
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupGroupRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestGroupHandler_GetGroups(t *testing.T) {
	mockService := &mocks.MockGroupService{
		GetGroupsFunc: func(ctx context.Context, userID int64) ([]*domain.Group, error) {
			return []*domain.Group{}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/groups", nil)
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupGroupRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
