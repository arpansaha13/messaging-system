package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
)

// SetupInviteRoutes sets up invite routes
func SetupInviteRoutes(router *mux.Router, protectedRouter *mux.Router, inviteService *service.InviteService) {
	protectedRouter.HandleFunc("/api/invites", sendInviteHandler(inviteService)).Methods("POST")
	protectedRouter.HandleFunc("/api/invites", getInvitesHandler(inviteService)).Methods("GET")
}

func sendInviteHandler(inviteService *service.InviteService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.SendInviteRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		invite, err := inviteService.SendInvite(r.Context(), req.GroupID, req.UserID, userIDInt)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(dto.InviteResponseDTO{
			ID:        invite.ID,
			GroupID:   invite.GroupID,
			UserID:    invite.UserID,
			InvitedBy: invite.InvitedBy,
			Status:    invite.Status,
			CreatedAt: invite.CreatedAt,
			UpdatedAt: invite.UpdatedAt,
		})
	}
}

func getInvitesHandler(inviteService *service.InviteService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		invites, err := inviteService.GetInvites(r.Context(), userIDInt)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		inviteResponses := make([]dto.InviteResponseDTO, len(invites))
		for i, invite := range invites {
			inviteResponses[i] = dto.InviteResponseDTO{
				ID:        invite.ID,
				GroupID:   invite.GroupID,
				UserID:    invite.UserID,
				InvitedBy: invite.InvitedBy,
				Status:    invite.Status,
				CreatedAt: invite.CreatedAt,
				UpdatedAt: invite.UpdatedAt,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(inviteResponses)
	}
}
