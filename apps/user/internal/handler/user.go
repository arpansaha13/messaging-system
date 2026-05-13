package handler

import (
	"net/http"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/user/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/user/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/user/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/user/internal/service"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// SetupUserRoutes sets up user routes
func SetupUserRoutes(router *mux.Router, protectedRouter *mux.Router, userService service.IUserProfileService, contactRepo repository.IContactRepository) {
	protectedRouter.HandleFunc("/users/me", gtk.HttpControllerAdaptor(getUserMeController(userService))).Methods("GET")
	protectedRouter.HandleFunc("/users/me", gtk.HttpControllerAdaptor(updateUserMeController(userService))).Methods("PATCH")
	protectedRouter.HandleFunc("/users/search", gtk.HttpControllerAdaptor(searchUserProfilesController(userService, contactRepo))).Methods("GET")
	protectedRouter.HandleFunc("/users/{id}", gtk.HttpControllerAdaptor(getUserProfileByIDController(userService, contactRepo))).Methods("GET")
}

func getUserMeController(userService service.IUserProfileService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			return nil, &gtk.UnauthorizedError{Message: "unauthorized"}
		}

		profile, err := userService.GetByID(r.Context(), authUser.UserID)
		if err != nil {
			return nil, err
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.AuthUserResponseDTO{
				ID:         authUser.UserID,
				Email:      authUser.Email,
				Username:   authUser.Username,
				GlobalName: profile.GlobalName,
				DP:         profile.DP,
				Bio:        profile.Bio,
			},
		}, nil
	}
}

func updateUserMeController(userService service.IUserProfileService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			return nil, &gtk.UnauthorizedError{Message: "unauthorized"}
		}

		req, err := dto.NewUpdateUserDTO(r)
		if err != nil {
			return nil, err
		}

		log.Debug("updating user profile", zap.Int64("user_id", authUser.UserID))

		profile, err := userService.Update(r.Context(), authUser.UserID, req.GlobalName, req.DP, req.Bio)
		if err != nil {
			return nil, err
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.AuthUserResponseDTO{
				ID:         authUser.UserID,
				Email:      authUser.Email,
				Username:   authUser.Username,
				GlobalName: profile.GlobalName,
				DP:         profile.DP,
				Bio:        profile.Bio,
			},
		}, nil
	}
}

func searchUserProfilesController(userService service.IUserProfileService, contactRepo repository.IContactRepository) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		req, _ := dto.NewSearchUsersDTO(r)

		if req.Q == "" {
			return &gtk.ControllerResponse{
				StatusCode: http.StatusOK,
				Body:       []dto.UserProfileResponseDTO{},
			}, nil
		}

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			return nil, &gtk.UnauthorizedError{Message: "unauthorized"}
		}

		log.Debug("searching user profiles", zap.String("query", req.Q))

		profiles, err := userService.Search(r.Context(), req.Q, req.Limit)
		if err != nil {
			return nil, err
		}

		responses := make([]dto.UserProfileResponseDTO, len(profiles))
		for i, p := range profiles {
			contact, err := contactRepo.GetContactByUserIds(r.Context(), authUser.UserID, p.ID)
			if err != nil {
				log.Warn("failed to resolve contact info", zap.Int64("profile_id", p.ID), zap.Error(err))
			}

			var contactInfo *dto.ContactInfoDTO
			if contact != nil {
				contactInfo = &dto.ContactInfoDTO{
					ID:    contact.ID,
					Alias: contact.Alias,
				}
			}

			responses[i] = dto.UserProfileResponseDTO{
				ID:         p.ID,
				GlobalName: p.GlobalName,
				DP:         p.DP,
				Bio:        p.Bio,
				Contact:    contactInfo,
			}
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       responses,
		}, nil
	}
}

func getUserProfileByIDController(userService service.IUserProfileService, contactRepo repository.IContactRepository) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		req, err := dto.NewGetUserByIDDTO(r)
		if err != nil {
			return nil, err
		}

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			return nil, &gtk.UnauthorizedError{Message: "unauthorized"}
		}

		profile, err := userService.GetByID(r.Context(), req.ID)
		if err != nil {
			return nil, err
		}

		contact, err := contactRepo.GetContactByUserIds(r.Context(), authUser.UserID, req.ID)
		if err != nil {
			log.Warn("failed to resolve contact info", zap.Int64("profile_id", req.ID), zap.Error(err))
		}

		var contactInfo *dto.ContactInfoDTO
		if contact != nil {
			contactInfo = &dto.ContactInfoDTO{
				ID:    contact.ID,
				Alias: contact.Alias,
			}
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.UserProfileResponseDTO{
				ID:         profile.ID,
				GlobalName: profile.GlobalName,
				DP:         profile.DP,
				Bio:        profile.Bio,
				Contact:    contactInfo,
			},
		}, nil
	}
}
