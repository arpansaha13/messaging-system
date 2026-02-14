package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

func TestUserGroupHandler_GetGroupMembers(t *testing.T) {
	mockService := &mocks.MockUserGroupService{
		GetGroupMembersFunc: func(ctx context.Context, groupID int64) ([]*domain.UserGroup, error) {
			return []*domain.UserGroup{}, nil
		},
	}

	req := httptest.NewRequest(http.MethodGet, "/api/groups/1/members", nil)
	req = mux.SetURLVars(req, map[string]string{"groupID": "1"})

	w := httptest.NewRecorder()

	controller := getGroupMembersController(mockService)
	err := controller(w, req)

	require.NoError(t, err)
}
