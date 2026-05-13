package dto

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/gorilla/mux"
)

// ContactInfoDTO represents contact-specific info for a user profile
type ContactInfoDTO struct {
	ID    int64  `json:"id"`
	Alias string `json:"alias"`
}

// UserProfileResponseDTO represents a user profile in responses
type UserProfileResponseDTO struct {
	ID         int64           `json:"id"`
	GlobalName string          `json:"globalName"`
	DP         *string         `json:"dp"`
	Bio        string          `json:"bio"`
	Contact    *ContactInfoDTO `json:"contact,omitempty"`
}

// AuthUserResponseDTO represents authenticated user data (profile part)
type AuthUserResponseDTO struct {
	ID         int64   `json:"id"`
	Email      string  `json:"email"`
	Username   string  `json:"username"`
	GlobalName string  `json:"globalName"`
	DP         *string `json:"dp"`
	Bio        string  `json:"bio"`
}

// UpdateUserDTO represents the request to update a user profile
type UpdateUserDTO struct {
	GlobalName *string `json:"globalName"`
	DP         *string `json:"dp"`
	Bio        *string `json:"bio"`
}

func NewUpdateUserDTO(r *http.Request) (*UpdateUserDTO, error) {
	var dto UpdateUserDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return &dto, nil
}

func (d *UpdateUserDTO) Validate() error {
	return nil
}

// GetUserByIDDTO represents the request to get a user by ID
type GetUserByIDDTO struct {
	ID int64
}

func NewGetUserByIDDTO(r *http.Request) (*GetUserByIDDTO, error) {
	vars := mux.Vars(r)
	idStr, ok := vars["id"]
	if !ok {
		return nil, &gtk.ValidationError{Message: "missing user id"}
	}
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return nil, &gtk.ValidationError{Message: "invalid user id"}
	}
	return &GetUserByIDDTO{ID: id}, nil
}

// SearchUsersDTO represents the search request
type SearchUsersDTO struct {
	Q     string
	Limit int
}

func NewSearchUsersDTO(r *http.Request) (*SearchUsersDTO, error) {
	q := r.URL.Query().Get("q")
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}
	return &SearchUsersDTO{Q: q, Limit: limit}, nil
}
