package handler

import (
	"net/http"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// SetupInviteRoutes sets up invite routes
func SetupInviteRoutes(router *mux.Router, protectedRouter *mux.Router, inviteService service.IInviteService) {
	router.HandleFunc("/invites/{hash}", gtk.HttpControllerAdaptor(findInviteController(inviteService))).Methods("GET")
	protectedRouter.HandleFunc("/invites/{hash}/accept", gtk.HttpControllerAdaptor(acceptInviteController(inviteService))).Methods("POST")
	protectedRouter.HandleFunc("/groups/{groupId}/invites", gtk.HttpControllerAdaptor(createInviteController(inviteService))).Methods("POST")
	protectedRouter.HandleFunc("/groups/join", gtk.HttpControllerAdaptor(joinGroupController(inviteService))).Methods("POST")
}

func findInviteController(inviteService service.IInviteService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("find invite handler called")

		req, err := dto.NewFindInviteDTO(r)
		if err != nil {
			log.Warn("failed to parse find invite request", zap.Error(err))
			return nil, err
		}

		hashDisplay := req.Hash
		if len(req.Hash) > 8 {
			hashDisplay = req.Hash[:8]
		}
		log.Debug("finding invite", zap.String("hash", hashDisplay))

		invite, err := inviteService.FindByHash(r.Context(), req)
		if err != nil {
			log.Warn("invite not found", zap.String("hash", hashDisplay), zap.Error(err))
			return nil, err
		}

		groupID := int64(0)
		if invite.GroupID != nil {
			groupID = *invite.GroupID
		}
		log.Debug("invite found successfully", zap.Int64("group_id", groupID), zap.Int64("inviter_id", invite.InviterID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.InviteResponseDTO{
				Hash:      invite.Hash,
				InviterID: invite.InviterID,
				GroupID:   invite.GroupID,
				CreatedAt: invite.CreatedAt,
				UpdatedAt: invite.UpdatedAt,
				ExpiresAt: invite.ExpiresAt,
			},
		}, nil
	}
}

func acceptInviteController(inviteService service.IInviteService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("accept invite handler called")

		req, err := dto.NewAcceptInviteDTO(r)
		if err != nil {
			log.Warn("failed to parse accept invite request", zap.Error(err))
			return nil, err
		}

		hashDisplay := req.Hash
		if len(req.Hash) > 8 {
			hashDisplay = req.Hash[:8]
		}
		log.Debug("accepting invite", zap.String("hash", hashDisplay))

		result, err := inviteService.AcceptInvite(r.Context(), &dto.AcceptInviteInput{InviteHash: req.Hash})
		if err != nil {
			log.Error("failed to accept invite", zap.String("hash", hashDisplay), zap.Error(err))
			return nil, err
		}

		log.Info("invite accepted successfully", zap.Int64("group_id", result.GroupID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       result,
		}, nil
	}
}

func createInviteController(inviteService service.IInviteService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("create invite handler called")

		req, err := dto.NewCreateInviteDTO(r)
		if err != nil {
			log.Warn("failed to parse create invite request", zap.Error(err))
			return nil, err
		}

		log.Debug("creating invite", zap.Int64("group_id", req.GroupID))

		invite, err := inviteService.CreateInvite(r.Context(), req)
		if err != nil {
			log.Error("failed to create invite", zap.Int64("group_id", req.GroupID), zap.Error(err))
			return nil, err
		}

		inviteHashDisplay := invite.Hash
		if len(invite.Hash) > 8 {
			inviteHashDisplay = invite.Hash[:8]
		}
		log.Info("invite created successfully", zap.Int64("group_id", req.GroupID), zap.String("invite_hash", inviteHashDisplay))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.InviteResponseDTO{
				Hash:      invite.Hash,
				InviterID: invite.InviterID,
				GroupID:   invite.GroupID,
				CreatedAt: invite.CreatedAt,
				UpdatedAt: invite.UpdatedAt,
				ExpiresAt: invite.ExpiresAt,
			},
		}, nil
	}
}

func joinGroupController(inviteService service.IInviteService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("join group handler called")

		req, err := dto.NewJoinGroupDTO(r)
		if err != nil {
			log.Warn("failed to parse join group request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("join group validation failed")
			return nil, err
		}

		hashDisplay := req.InviteHash
		if len(req.InviteHash) > 8 {
			hashDisplay = req.InviteHash[:8]
		}
		log.Debug("joining group", zap.String("invite_hash", hashDisplay))

		result, err := inviteService.AcceptInvite(r.Context(), &dto.AcceptInviteInput{InviteHash: req.InviteHash})
		if err != nil {
			log.Error("failed to join group", zap.Error(err))
			return nil, err
		}

		log.Info("user joined group successfully", zap.Int64("group_id", result.GroupID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       result,
		}, nil
	}
}
