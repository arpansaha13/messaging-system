package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
)

// SetupContactRoutes sets up contact routes
func SetupContactRoutes(router *mux.Router, protectedRouter *mux.Router, contactService service.IContactService) {
	protectedRouter.HandleFunc("/contacts", gtk.HttpControllerAdaptor(addContactController(contactService))).Methods("POST")
	protectedRouter.HandleFunc("/contacts", gtk.HttpControllerAdaptor(getContactsController(contactService))).Methods("GET")
	protectedRouter.HandleFunc("/contacts/{id}", gtk.HttpControllerAdaptor(updateContactAliasController(contactService))).Methods("PATCH")
	protectedRouter.HandleFunc("/contacts/{id}", gtk.HttpControllerAdaptor(deleteContactController(contactService))).Methods("DELETE")
}

func addContactController(contactService service.IContactService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("add contact handler called")

		var req dto.AddContactRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in add contact", zap.Error(err))
			return nil, &gtk.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if req.UserIDToAdd == 0 {
			log.Warn("missing contact user id in add contact request")
			return nil, &gtk.ValidationError{Message: "contact user id is required"}
		}

		log.Debug("adding contact", zap.Int64("user_id", userIDInt), zap.Int64("contact_user_id", req.UserIDToAdd))

		contact, err := contactService.AddContact(r.Context(), userIDInt, req.UserIDToAdd, req.Alias)
		if err != nil {
			log.Error("failed to add contact", zap.Int64("user_id", userIDInt), zap.Int64("contact_user_id", req.UserIDToAdd), zap.Error(err))
			return nil, err
		}

		log.Info("contact added successfully", zap.Int64("user_id", userIDInt), zap.Int64("contact_id", contact.ID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.ContactResponseDTO{
				ID:         contact.ID,
				Alias:      contact.Alias,
				GlobalName: "", // This would be populated when fetching contacts via GetContacts
				DP:         nil,
				Bio:        "",
				UserID:     contact.UserIDInContact,
			},
		}, nil
	}
}

func getContactsController(contactService service.IContactService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("get contacts handler called")

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("fetching contacts for user", zap.Int64("user_id", userIDInt))

		contacts, err := contactService.GetContacts(r.Context(), userIDInt)
		if err != nil {
			log.Error("failed to get contacts", zap.Int64("user_id", userIDInt), zap.Error(err))
			return nil, err
		}

		log.Debug("contacts retrieved successfully", zap.Int64("user_id", userIDInt), zap.Int("contact_count", len(contacts)))

		contactResponses := make([]dto.ContactResponseDTO, len(contacts))
		for i, contact := range contacts {
			contactResponses[i] = dto.ContactResponseDTO{
				ID:         contact.ID,
				Alias:      contact.Alias,
				GlobalName: contact.GlobalName,
				DP:         contact.DP,
				Bio:        contact.Bio,
				UserID:     contact.UserIDInContact,
			}
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       contactResponses,
		}, nil
	}
}

func updateContactAliasController(contactService service.IContactService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("update contact alias handler called")

		vars := mux.Vars(r)
		contactID, err := strconv.ParseInt(vars["id"], 10, 64)
		if err != nil {
			log.Warn("invalid contact id in update contact alias request", zap.String("contact_id_str", vars["id"]))
			return nil, &gtk.ValidationError{Message: "invalid contact id"}
		}

		var req dto.UpdateContactAliasRequestDTO
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in update contact alias", zap.Error(err))
			return nil, &gtk.ValidationError{Message: "invalid request body"}
		}

		newAlias := strings.TrimSpace(req.NewAlias)
		if newAlias == "" {
			return nil, &gtk.ValidationError{Message: "alias is required"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		contact, err := contactService.UpdateContactAlias(r.Context(), userIDInt, contactID, newAlias)
		if err != nil {
			log.Error("failed to update contact alias", zap.Int64("contact_id", contactID), zap.Error(err))
			return nil, err
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.ContactResponseDTO{
				ID:     contact.ID,
				Alias:  contact.Alias,
				UserID: contact.UserIDInContact,
			},
		}, nil
	}
}

func deleteContactController(contactService service.IContactService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("delete contact handler called")

		vars := mux.Vars(r)
		contactID, err := strconv.ParseInt(vars["id"], 10, 64)
		if err != nil {
			log.Warn("invalid contact id in delete contact request", zap.String("contact_id_str", vars["id"]))
			return nil, &gtk.ValidationError{Message: "invalid contact id"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		if err := contactService.DeleteContact(r.Context(), userIDInt, contactID); err != nil {
			log.Error("failed to delete contact", zap.Int64("contact_id", contactID), zap.Error(err))
			return nil, err
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusNoContent,
			Body:       nil,
		}, nil
	}
}
