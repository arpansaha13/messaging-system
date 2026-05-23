package dto

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/gorilla/mux"
)

// AddContactDTO defines the request for adding a contact
type AddContactDTO struct {
	UserIDToAdd int64  `json:"user_id"`
	Alias       string `json:"alias"`
}

func NewAddContactDTO(r *http.Request) (*AddContactDTO, error) {
	var dto AddContactDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	return &dto, nil
}

func (d *AddContactDTO) Validate() error {
	if d.UserIDToAdd <= 0 {
		return &gtk.ValidationError{Message: "invalid user_id"}
	}
	return nil
}

// UpdateContactAliasDTO defines the request for updating a contact alias
type UpdateContactAliasDTO struct {
	ID    int64  `json:"-"`
	Alias string `json:"alias"`
}

func NewUpdateContactAliasDTO(r *http.Request) (*UpdateContactAliasDTO, error) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		return nil, &gtk.ValidationError{Message: "invalid contact id"}
	}

	var dto UpdateContactAliasDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		return nil, &gtk.ValidationError{Message: "invalid request body"}
	}
	dto.ID = id
	return &dto, nil
}

func (d *UpdateContactAliasDTO) Validate() error {
	if d.ID <= 0 {
		return &gtk.ValidationError{Message: "invalid contact id"}
	}
	return nil
}

// DeleteContactDTO defines the request for deleting a contact
type DeleteContactDTO struct {
	ID int64
}

func NewDeleteContactDTO(r *http.Request) (*DeleteContactDTO, error) {
	vars := mux.Vars(r)
	id, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		return nil, &gtk.ValidationError{Message: "invalid contact id"}
	}
	return &DeleteContactDTO{ID: id}, nil
}

// ContactResponseDTO defines the response for contact operations
type ContactResponseDTO struct {
	ID         int64   `json:"id"`
	Alias      string  `json:"alias"`
	GlobalName string  `json:"global_name"`
	DP         *string `json:"dp"`
	Bio        string  `json:"bio"`
	UserID     int64   `json:"user_id"`
}
