package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
)

// SetupUserRoutes sets up user routes
func SetupUserRoutes(router *mux.Router, protectedRouter *mux.Router, userService service.IUserService) {
	protectedRouter.HandleFunc("/api/users/me", AdaptController(getUserMeController(userService))).Methods("GET")
	protectedRouter.HandleFunc("/api/users/me", AdaptController(updateUserMeController(userService))).Methods("PATCH")
	protectedRouter.HandleFunc("/api/users/search", AdaptController(searchUserProfilesController(userService))).Methods("GET")
	protectedRouter.HandleFunc("/api/users/{id}", AdaptController(getUserProfileByIDController(userService))).Methods("GET")
}

// getUserMeController returns the authenticated user's auth details
func getUserMeController(userService service.IUserService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("get user me handler called")

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			log.Warn("user not authenticated in get user me request")
			return &gotoolkit.UnauthorizedError{Message: "unauthorized"}
		}

		log.Debug("fetching user profile", zap.Int64("user_id", authUser.UserID), zap.String("email", authUser.Email))

		userProfile, err := userService.GetUserProfile(r.Context(), authUser.UserID)
		if err != nil {
			log.Error("failed to get user profile", zap.Int64("user_id", authUser.UserID), zap.Error(err))
			return err
		}

		log.Debug("user profile retrieved successfully", zap.Int64("user_id", authUser.UserID))

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(dto.AuthUserResponseDTO{
			ID:         authUser.UserID,
			Email:      authUser.Email,
			Username:   authUser.Username,
			GlobalName: userProfile.GlobalName,
			DP:         userProfile.DP,
			Bio:        userProfile.Bio,
		})
	}
}

// updateUserMeController updates the authenticated user's profile
func updateUserMeController(userService service.IUserService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("update user me handler called")

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			log.Warn("user not authenticated in update user me request")
			return &gotoolkit.UnauthorizedError{Message: "unauthorized"}
		}

		var req dto.UpdateUserRequestDTO
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in update user me", zap.Error(err))
			return &gotoolkit.ValidationError{Message: "invalid request body"}
		}

		log.Debug("updating user profile", zap.Int64("user_id", authUser.UserID))

		// Update the user profile
		updatedProfile, err := userService.UpdateUserProfile(r.Context(), authUser.UserID, req.GlobalName, req.Bio, req.DP)
		if err != nil {
			log.Error("failed to update user profile", zap.Int64("user_id", authUser.UserID), zap.Error(err))
			return err
		}

		log.Info("user profile updated successfully", zap.Int64("user_id", authUser.UserID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		return json.NewEncoder(w).Encode(dto.AuthUserResponseDTO{
			ID:         authUser.UserID,
			Email:      authUser.Email,
			Username:   authUser.Username,
			GlobalName: updatedProfile.GlobalName,
			DP:         updatedProfile.DP,
			Bio:        updatedProfile.Bio,
		})
	}
}

// searchUserProfilesController searches for user profiles
func searchUserProfilesController(userService service.IUserService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("search user profiles handler called")

		query := r.URL.Query().Get("q")
		if query == "" {
			log.Debug("empty search query, returning empty results")
			w.Header().Set("Content-Type", "application/json")
			return json.NewEncoder(w).Encode([]any{})
		}

		log.Debug("searching user profiles", zap.String("query", query))

		userProfiles, err := userService.SearchUserProfiles(r.Context(), query)
		if err != nil {
			log.Error("failed to search user profiles", zap.String("query", query), zap.Error(err))
			return err
		}

		log.Debug("user profiles search completed", zap.String("query", query), zap.Int("result_count", len(userProfiles)))

		profileResponses := make([]dto.UserProfileResponseDTO, len(userProfiles))
		for i, profile := range userProfiles {
			profileResponses[i] = dto.UserProfileResponseDTO{
				ID:         profile.ID,
				GlobalName: profile.GlobalName,
				DP:         profile.DP,
				Bio:        profile.Bio,
				Contact:    nil,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(profileResponses)
	}
}

// getUserProfileByIDController retrieves a user profile by ID
func getUserProfileByIDController(userService service.IUserService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context()).Ctx(r.Context())
		log.Debug("get user profile by id handler called")

		vars := mux.Vars(r)
		id, err := strconv.ParseInt(vars["id"], 10, 64)
		if err != nil {
			log.Warn("invalid user id in get profile request", zap.String("id_str", vars["id"]))
			return &gotoolkit.ValidationError{Message: "invalid user id"}
		}

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			log.Warn("user not authenticated in get user profile request")
			return &gotoolkit.UnauthorizedError{Message: "unauthorized"}
		}

		log.Debug("fetching user profile", zap.Int64("requested_user_id", id), zap.Int64("auth_user_id", authUser.UserID))

		userProfile, contact, err := userService.GetUserProfileWithContact(r.Context(), authUser.UserID, id)
		if err != nil {
			log.Error("failed to get user profile", zap.Int64("requested_user_id", id), zap.Error(err))
			return err
		}

		log.Debug("user profile retrieved successfully", zap.Int64("requested_user_id", id), zap.Bool("is_contact", contact != nil))

		var contactInfo *dto.ContactInfoDTO
		if contact != nil {
			contactInfo = &dto.ContactInfoDTO{
				ID:    contact.ID,
				Alias: contact.Alias,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(dto.UserProfileResponseDTO{
			ID:         userProfile.ID,
			GlobalName: userProfile.GlobalName,
			DP:         userProfile.DP,
			Bio:        userProfile.Bio,
			Contact:    contactInfo,
		})
	}
}
