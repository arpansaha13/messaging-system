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

func TestUserGroupHandler_AddUserToGroup(t *testing.T) {
	mockService := &mocks.MockUserGroupService{
		AddUserToGroupFunc: func(ctx context.Context, userID, groupID int64) (*domain.UserGroup, error) {
			return &domain.UserGroup{
				ID:      1,
				UserID:  userID,
				GroupID: groupID,
				Role:    "member",
			}, nil
		},
	}

	body, _ := json.Marshal(map[string]interface{}{
		"userID": 2,
	})

	req := httptest.NewRequest(http.MethodPost, "/api/groups/1/members", bytes.NewBuffer(body))
	req = mux.SetURLVars(req, map[string]string{"groupID": "1"})

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupUserGroupRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestUserGroupHandler_GetGroupMembers(t *testing.T) {
	mockService := &mocks.MockUserGroupService{
		GetGroupMembersFunc: func(ctx context.Context, groupID int64) ([]*domain.UserGroup, error) {
			return []*domain.UserGroup{}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/groups/1/members", nil)
	req = mux.SetURLVars(req, map[string]string{"groupID": "1"})

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupUserGroupRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestUserGroupHandler_GetUserGroups(t *testing.T) {
	mockService := &mocks.MockUserGroupService{
		GetUserGroupsFunc: func(ctx context.Context, userID int64) ([]*domain.UserGroup, error) {
			return []*domain.UserGroup{}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/users/groups", nil)
	ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	router := mux.NewRouter()
	SetupUserGroupRoutes(router, router, mockService)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
