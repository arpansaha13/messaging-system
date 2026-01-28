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

// SetupUserRoutes sets up user routes
func SetupUserRoutes(router *mux.Router, protectedRouter *mux.Router, userService service.IUserService) {
	protectedRouter.HandleFunc("/api/users/me", getUserMeHandler(userService)).Methods("GET")
	protectedRouter.HandleFunc("/api/users/search", searchUserProfilesHandler(userService)).Methods("GET")
	protectedRouter.HandleFunc("/api/users/{id}", getUserProfileByIDHandler(userService)).Methods("GET")
}

// getUserMeHandler returns the authenticated user's auth details
func getUserMeHandler(userService service.IUserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			middleware.WriteError(w, &domain.UnauthorizedError{Message: "unauthorized"})
			return
		}

		userProfile, err := userService.GetUserProfile(r.Context(), authUser.UserID)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(dto.AuthUserResponseDTO{
			ID:         authUser.UserID,
			Email:      authUser.Email,
			Username:   authUser.Username,
			GlobalName: userProfile.GlobalName,
			DP:         userProfile.DP,
			Bio:        userProfile.Bio,
		})
	}
}

// searchUserProfilesHandler searches for user profiles
func searchUserProfilesHandler(userService service.IUserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("q")
		if query == "" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode([]any{})
			return
		}

		userProfiles, err := userService.SearchUserProfiles(r.Context(), query)
		if err != nil {
			middleware.WriteError(w, err)
			return
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
		json.NewEncoder(w).Encode(profileResponses)
	}
}

// getUserProfileByIDHandler retrieves a user profile by ID
func getUserProfileByIDHandler(userService service.IUserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id, err := strconv.ParseInt(vars["id"], 10, 64)
		if err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid user id"})
			return
		}

		authUser := middleware.GetAuthUserFromContext(r)
		if authUser == nil {
			middleware.WriteError(w, &domain.UnauthorizedError{Message: "unauthorized"})
			return
		}

		userProfile, contact, err := userService.GetUserProfileWithContact(r.Context(), authUser.UserID, id)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		var contactInfo *dto.ContactInfoDTO
		if contact != nil {
			contactInfo = &dto.ContactInfoDTO{
				ID:    contact.ID,
				Alias: contact.Alias,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(dto.UserProfileResponseDTO{
			ID:         userProfile.ID,
			GlobalName: userProfile.GlobalName,
			DP:         userProfile.DP,
			Bio:        userProfile.Bio,
			Contact:    contactInfo,
		})
	}
}
