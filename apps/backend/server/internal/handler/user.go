package handler

import (
	"net/http"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// SetupUserRoutes sets up user routes
func SetupUserRoutes(router *mux.Router, protectedRouter *mux.Router, userService service.IUserService) {
	protectedRouter.HandleFunc("/users/me", gtk.HttpControllerAdaptor(getUserMeController(userService))).Methods("GET")
	protectedRouter.HandleFunc("/users/me", gtk.HttpControllerAdaptor(updateUserMeController(userService))).Methods("PATCH")
	protectedRouter.HandleFunc("/users/search", gtk.HttpControllerAdaptor(searchUserProfilesController(userService))).Methods("GET")
	protectedRouter.HandleFunc("/users/{id}", gtk.HttpControllerAdaptor(getUserProfileByIDController(userService))).Methods("GET")
}

// getUserMeController returns the authenticated user's auth details
func getUserMeController(userService service.IUserService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("get user me handler called")

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			log.Warn("user not authenticated in get user me request")
			return nil, &gtk.UnauthorizedError{Message: "unauthorized"}
		}

		log.Debug("fetching user profile", zap.Int64("user_id", authUser.UserID), zap.String("email", authUser.Email))

		userProfile, err := userService.GetUserProfile(r.Context())
		if err != nil {
			log.Error("failed to get user profile", zap.Int64("user_id", authUser.UserID), zap.Error(err))
			return nil, err
		}

		log.Debug("user profile retrieved successfully", zap.Int64("user_id", authUser.UserID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.AuthUserResponseDTO{
				ID:         authUser.UserID,
				Email:      authUser.Email,
				Username:   authUser.Username,
				GlobalName: userProfile.GlobalName,
				DP:         userProfile.DP,
				Bio:        userProfile.Bio,
			},
		}, nil
	}
}

// updateUserMeController updates the authenticated user's profile
func updateUserMeController(userService service.IUserService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("update user me handler called")

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			log.Warn("user not authenticated in update user me request")
			return nil, &gtk.UnauthorizedError{Message: "unauthorized"}
		}

		req, err := dto.NewUpdateUserDTO(r)
		if err != nil {
			log.Warn("failed to parse update user request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			return nil, err
		}

		log.Debug("updating user profile", zap.Int64("user_id", authUser.UserID))

		updatedProfile, err := userService.UpdateUserProfile(r.Context(), req)
		if err != nil {
			log.Error("failed to update user profile", zap.Int64("user_id", authUser.UserID), zap.Error(err))
			return nil, err
		}

		log.Info("user profile updated successfully", zap.Int64("user_id", authUser.UserID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.AuthUserResponseDTO{
				ID:         authUser.UserID,
				Email:      authUser.Email,
				Username:   authUser.Username,
				GlobalName: updatedProfile.GlobalName,
				DP:         updatedProfile.DP,
				Bio:        updatedProfile.Bio,
			},
		}, nil
	}
}

// searchUserProfilesController searches for user profiles
func searchUserProfilesController(userService service.IUserService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("search user profiles handler called")

		req, _ := dto.NewSearchUsersDTO(r)

		if req.Q == "" {
			log.Debug("empty search query, returning empty results")
			return &gtk.ControllerResponse{
				StatusCode: http.StatusOK,
				Body:       []dto.UserProfileResponseDTO{},
			}, nil
		}

		log.Debug("searching user profiles", zap.String("query", req.Q))

		// TODO: Why is auth middleware not catching this unauthorized error?
		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			log.Warn("user not authenticated in search user profiles request")
			return nil, &gtk.UnauthorizedError{Message: "unauthorized"}
		}

		userProfiles, err := userService.SearchUserProfiles(r.Context(), req)
		if err != nil {
			log.Error("failed to search user profiles", zap.String("query", req.Q), zap.Error(err))
			return nil, err
		}

		log.Debug("user profiles search completed", zap.String("query", req.Q), zap.Int("result_count", len(userProfiles)))

		profileResponses := make([]dto.UserProfileResponseDTO, len(userProfiles))
		for i, profile := range userProfiles {
			_, contact, err := userService.GetUserProfileWithContact(r.Context(), &dto.GetUserByIDDTO{ID: profile.ID})
			if err != nil {
				log.Error("failed to resolve contact info", zap.Int64("profile_id", profile.ID), zap.Error(err))
				return nil, err
			}

			var contactInfo *dto.ContactInfoDTO
			if contact != nil {
				contactInfo = &dto.ContactInfoDTO{
					ID:    contact.ID,
					Alias: contact.Alias,
				}
			}

			profileResponses[i] = dto.UserProfileResponseDTO{
				ID:         profile.ID,
				GlobalName: profile.GlobalName,
				DP:         profile.DP,
				Bio:        profile.Bio,
				Contact:    contactInfo,
			}
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       profileResponses,
		}, nil
	}
}

// getUserProfileByIDController retrieves a user profile by ID
func getUserProfileByIDController(userService service.IUserService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("get user profile by id handler called")

		req, err := dto.NewGetUserByIDDTO(r)
		if err != nil {
			log.Warn("invalid user id in get profile request", zap.Error(err))
			return nil, err
		}

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			log.Warn("user not authenticated in get user profile request")
			return nil, &gtk.UnauthorizedError{Message: "unauthorized"}
		}

		log.Debug("fetching user profile", zap.Int64("requested_user_id", req.ID), zap.Int64("auth_user_id", authUser.UserID))

		userProfile, contact, err := userService.GetUserProfileWithContact(r.Context(), req)
		if err != nil {
			log.Error("failed to get user profile", zap.Int64("requested_user_id", req.ID), zap.Error(err))
			return nil, err
		}

		log.Debug("user profile retrieved successfully", zap.Int64("requested_user_id", req.ID), zap.Bool("is_contact", contact != nil))

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
				ID:         userProfile.ID,
				GlobalName: userProfile.GlobalName,
				DP:         userProfile.DP,
				Bio:        userProfile.Bio,
				Contact:    contactInfo,
			},
		}, nil
	}
}
