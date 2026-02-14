package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// SetupInviteRoutes sets up invite routes
func SetupInviteRoutes(router *mux.Router, protectedRouter *mux.Router, inviteService service.IInviteService) {
	router.HandleFunc("/api/invites/{hash}", AdaptController(findInviteController(inviteService))).Methods("GET")
	protectedRouter.HandleFunc("/api/invites/{hash}/accept", AdaptController(acceptInviteController(inviteService))).Methods("POST")
	protectedRouter.HandleFunc("/api/groups/{groupId}/invites", AdaptController(createInviteController(inviteService))).Methods("POST")
	protectedRouter.HandleFunc("/api/groups/join", AdaptController(joinGroupController(inviteService))).Methods("POST")
}

func findInviteController(inviteService service.IInviteService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		hash := vars["hash"]

		if hash == "" {
			return &domain.ValidationError{Message: "hash parameter is required"}
		}

		invite, err := inviteService.FindByHash(r.Context(), hash)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(dto.InviteResponseDTO{
			Hash:      invite.Hash,
			InviterID: invite.InviterID,
			GroupID:   invite.GroupID,
			CreatedAt: invite.CreatedAt,
			UpdatedAt: invite.UpdatedAt,
			ExpiresAt: invite.ExpiresAt,
		})
	}
}

func acceptInviteController(inviteService service.IInviteService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		hash := vars["hash"]

		if hash == "" {
			return &domain.ValidationError{Message: "hash parameter is required"}
		}

		userID := middleware.GetUserIDFromContext(r)
		if userID == "" {
			return &domain.ValidationError{Message: "user not authenticated"}
		}

		result, err := inviteService.AcceptInvite(r.Context(), parseUserID(userID), hash)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(result)
	}
}

func createInviteController(inviteService service.IInviteService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		groupID := parseGroupID(vars["groupId"])

		if groupID == 0 {
			return &domain.ValidationError{Message: "group_id parameter is required"}
		}

		userID := middleware.GetUserIDFromContext(r)
		if userID == "" {
			return &domain.ValidationError{Message: "user not authenticated"}
		}

		invite, err := inviteService.CreateInvite(r.Context(), parseUserID(userID), groupID)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		return json.NewEncoder(w).Encode(dto.InviteResponseDTO{
			Hash:      invite.Hash,
			InviterID: invite.InviterID,
			GroupID:   invite.GroupID,
			CreatedAt: invite.CreatedAt,
			UpdatedAt: invite.UpdatedAt,
			ExpiresAt: invite.ExpiresAt,
		})
	}
}

func joinGroupController(inviteService service.IInviteService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		var req dto.JoinGroupDTO
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return &domain.ValidationError{Message: "invalid request body"}
		}

		if req.InviteHash == "" {
			return &domain.ValidationError{Message: "inviteHash is required"}
		}

		userID := middleware.GetUserIDFromContext(r)
		if userID == "" {
			return &domain.ValidationError{Message: "user not authenticated"}
		}

		result, err := inviteService.AcceptInvite(r.Context(), parseUserID(userID), req.InviteHash)
		if err != nil {
			return err
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(result)
	}
}
