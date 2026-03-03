package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
)

// SetupInviteRoutes sets up invite routes
func SetupInviteRoutes(router *mux.Router, protectedRouter *mux.Router, inviteService service.IInviteService) {
	router.HandleFunc("/api/invites/{hash}", gtk.HttpControllerAdaptor(findInviteController(inviteService))).Methods("GET")
	protectedRouter.HandleFunc("/api/invites/{hash}/accept", gtk.HttpControllerAdaptor(acceptInviteController(inviteService))).Methods("POST")
	protectedRouter.HandleFunc("/api/groups/{groupId}/invites", gtk.HttpControllerAdaptor(createInviteController(inviteService))).Methods("POST")
	protectedRouter.HandleFunc("/api/groups/join", gtk.HttpControllerAdaptor(joinGroupController(inviteService))).Methods("POST")
}

func findInviteController(inviteService service.IInviteService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("find invite handler called")

		vars := mux.Vars(r)
		hash := vars["hash"]

		if hash == "" {
			log.Warn("hash parameter is empty in find invite request")
			return &gtk.ValidationError{Message: "hash parameter is required"}
		}

		hashDisplay := hash
		if len(hash) > 8 {
			hashDisplay = hash[:8]
		}
		log.Debug("finding invite", zap.String("hash", hashDisplay)) // Log only first 8 chars for privacy

		invite, err := inviteService.FindByHash(r.Context(), hash)
		if err != nil {
			log.Warn("invite not found", zap.String("hash", hashDisplay), zap.Error(err))
			return err
		}

		groupID := int64(0)
		if invite.GroupID != nil {
			groupID = *invite.GroupID
		}
		log.Debug("invite found successfully", zap.Int64("group_id", groupID), zap.Int64("inviter_id", invite.InviterID))

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

func acceptInviteController(inviteService service.IInviteService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("accept invite handler called")

		vars := mux.Vars(r)
		hash := vars["hash"]

		if hash == "" {
			log.Warn("hash parameter is empty in accept invite request")
			return &gtk.ValidationError{Message: "hash parameter is required"}
		}

		userID := middleware.GetUserIDFromContext(r)
		if userID == "" {
			log.Warn("user not authenticated in accept invite request")
			return &gtk.ValidationError{Message: "user not authenticated"}
		}

		parsedUserID := parseUserID(userID)
		hashDisplay := hash
		if len(hash) > 8 {
			hashDisplay = hash[:8]
		}
		log.Debug("accepting invite", zap.Int64("user_id", parsedUserID), zap.String("hash", hashDisplay))

		result, err := inviteService.AcceptInvite(r.Context(), parsedUserID, hash)
		if err != nil {
			log.Error("failed to accept invite", zap.Int64("user_id", parsedUserID), zap.Error(err))
			return err
		}

		log.Info("invite accepted successfully", zap.Int64("user_id", parsedUserID), zap.Int64("group_id", result.GroupID))

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(result)
	}
}

func createInviteController(inviteService service.IInviteService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("create invite handler called")

		vars := mux.Vars(r)
		groupID := parseGroupID(vars["groupId"])

		if groupID == 0 {
			log.Warn("group_id parameter is empty or invalid in create invite request", zap.String("group_id_str", vars["groupId"]))
			return &gtk.ValidationError{Message: "group_id parameter is required"}
		}

		userID := middleware.GetUserIDFromContext(r)
		if userID == "" {
			log.Warn("user not authenticated in create invite request")
			return &gtk.ValidationError{Message: "user not authenticated"}
		}

		parsedUserID := parseUserID(userID)
		log.Debug("creating invite", zap.Int64("inviter_id", parsedUserID), zap.Int64("group_id", groupID))

		invite, err := inviteService.CreateInvite(r.Context(), parsedUserID, groupID)
		if err != nil {
			log.Error("failed to create invite", zap.Int64("inviter_id", parsedUserID), zap.Int64("group_id", groupID), zap.Error(err))
			return err
		}

		inviteHashDisplay := invite.Hash
		if len(invite.Hash) > 8 {
			inviteHashDisplay = invite.Hash[:8]
		}
		log.Info("invite created successfully", zap.Int64("inviter_id", parsedUserID), zap.Int64("group_id", groupID), zap.String("invite_hash", inviteHashDisplay))

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

func joinGroupController(inviteService service.IInviteService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("join group handler called")

		var req dto.JoinGroupDTO
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in join group", zap.Error(err))
			return &gtk.ValidationError{Message: "invalid request body"}
		}

		if req.InviteHash == "" {
			log.Warn("inviteHash is empty in join group request")
			return &gtk.ValidationError{Message: "inviteHash is required"}
		}

		userID := middleware.GetUserIDFromContext(r)
		if userID == "" {
			log.Warn("user not authenticated in join group request")
			return &gtk.ValidationError{Message: "user not authenticated"}
		}

		parsedUserID := parseUserID(userID)
		hashDisplay := req.InviteHash
		if len(req.InviteHash) > 8 {
			hashDisplay = req.InviteHash[:8]
		}
		log.Debug("joining group", zap.Int64("user_id", parsedUserID), zap.String("invite_hash", hashDisplay))

		result, err := inviteService.AcceptInvite(r.Context(), parsedUserID, req.InviteHash)
		if err != nil {
			log.Error("failed to join group", zap.Int64("user_id", parsedUserID), zap.Error(err))
			return err
		}

		log.Info("user joined group successfully", zap.Int64("user_id", parsedUserID), zap.Int64("group_id", result.GroupID))

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(result)
	}
}
