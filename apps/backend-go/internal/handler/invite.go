package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
)

// SetupInviteRoutes sets up invite routes
func SetupInviteRoutes(router *mux.Router, protectedRouter *mux.Router, inviteService service.IInviteService) {
	router.HandleFunc("/api/invites/{hash}", findInviteHandler(inviteService)).Methods("GET")
	protectedRouter.HandleFunc("/api/invites/{hash}/accept", acceptInviteHandler(inviteService)).Methods("POST")
	protectedRouter.HandleFunc("/api/groups/{groupId}/invites", createInviteHandler(inviteService)).Methods("POST")
	protectedRouter.HandleFunc("/api/groups/join", joinGroupHandler(inviteService)).Methods("POST")
}

func findInviteHandler(inviteService service.IInviteService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		hash := vars["hash"]

		if hash == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "hash parameter is required"})
			return
		}

		invite, err := inviteService.FindByHash(r.Context(), hash)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(dto.InviteResponseDTO{
			Hash:      invite.Hash,
			InviterID: invite.InviterID,
			GroupID:   invite.GroupID,
			CreatedAt: invite.CreatedAt,
			UpdatedAt: invite.UpdatedAt,
			ExpiresAt: invite.ExpiresAt,
		})
	}
}

func acceptInviteHandler(inviteService service.IInviteService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		hash := vars["hash"]

		if hash == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "hash parameter is required"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		if userID == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "user not authenticated"})
			return
		}

		result, err := inviteService.AcceptInvite(r.Context(), parseUserID(userID), hash)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	}
}

func createInviteHandler(inviteService service.IInviteService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		groupID := parseGroupID(vars["groupId"])

		if groupID == 0 {
			middleware.WriteError(w, &domain.ValidationError{Message: "group_id parameter is required"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		if userID == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "user not authenticated"})
			return
		}

		invite, err := inviteService.CreateInvite(r.Context(), parseUserID(userID), groupID)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(dto.InviteResponseDTO{
			Hash:      invite.Hash,
			InviterID: invite.InviterID,
			GroupID:   invite.GroupID,
			CreatedAt: invite.CreatedAt,
			UpdatedAt: invite.UpdatedAt,
			ExpiresAt: invite.ExpiresAt,
		})
	}
}

func joinGroupHandler(inviteService service.IInviteService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.JoinGroupDTO
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		if req.InviteHash == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "inviteHash is required"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		if userID == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "user not authenticated"})
			return
		}

		result, err := inviteService.AcceptInvite(r.Context(), parseUserID(userID), req.InviteHash)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	}
}
