package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

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
	protectedRouter.HandleFunc("/api/contacts", gtk.HttpControllerAdaptor(addContactController(contactService))).Methods("POST")
	protectedRouter.HandleFunc("/api/contacts", gtk.HttpControllerAdaptor(getContactsController(contactService))).Methods("GET")
}

func addContactController(contactService service.IContactService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("add contact handler called")

		var req dto.AddContactRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body in add contact", zap.Error(err))
			return &gtk.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("adding contact", zap.Int64("user_id", userIDInt), zap.Int64("contact_user_id", req.UserIDInContact))

		contact, err := contactService.AddContact(r.Context(), userIDInt, req.UserIDInContact)
		if err != nil {
			log.Error("failed to add contact", zap.Int64("user_id", userIDInt), zap.Int64("contact_user_id", req.UserIDInContact), zap.Error(err))
			return err
		}

		log.Info("contact added successfully", zap.Int64("user_id", userIDInt), zap.Int64("contact_id", contact.ID))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		return json.NewEncoder(w).Encode(dto.ContactResponseDTO{
			ID:         contact.ID,
			GlobalName: "", // This would be populated when fetching contacts via GetContacts
			DP:         nil,
			Bio:        "",
			UserID:     contact.UserIDInContact,
		})
	}
}

func getContactsController(contactService service.IContactService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		log := logger.FromContext(r.Context())
		log.Debug("get contacts handler called")

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		log.Debug("fetching contacts for user", zap.Int64("user_id", userIDInt))

		contacts, err := contactService.GetContacts(r.Context(), userIDInt)
		if err != nil {
			log.Error("failed to get contacts", zap.Int64("user_id", userIDInt), zap.Error(err))
			return err
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

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(contactResponses)
	}
}
