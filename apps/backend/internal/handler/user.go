package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
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
		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			return &domain.UnauthorizedError{Message: "unauthorized"}
		}

		userProfile, err := userService.GetUserProfile(r.Context(), authUser.UserID)
		if err != nil {
			return err
		}

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
		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			return &domain.UnauthorizedError{Message: "unauthorized"}
		}

		var req dto.UpdateUserRequestDTO
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return &domain.ValidationError{Message: "invalid request body"}
		}

		// Update the user profile
		updatedProfile, err := userService.UpdateUserProfile(r.Context(), authUser.UserID, req.GlobalName, req.Bio, req.DP)
		if err != nil {
			return err
		}

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
		query := r.URL.Query().Get("q")
		if query == "" {
			w.Header().Set("Content-Type", "application/json")
			return json.NewEncoder(w).Encode([]any{})
		}

		userProfiles, err := userService.SearchUserProfiles(r.Context(), query)
		if err != nil {
			return err
		}

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
		vars := mux.Vars(r)
		id, err := strconv.ParseInt(vars["id"], 10, 64)
		if err != nil {
			return &domain.ValidationError{Message: "invalid user id"}
		}

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			return &domain.UnauthorizedError{Message: "unauthorized"}
		}

		userProfile, contact, err := userService.GetUserProfileWithContact(r.Context(), authUser.UserID, id)
		if err != nil {
			return err
		}

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
