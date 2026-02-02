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

// SetupContactRoutes sets up contact routes
func SetupContactRoutes(router *mux.Router, protectedRouter *mux.Router, contactService service.IContactService) {
	protectedRouter.HandleFunc("/api/contacts", AdaptController(addContactController(contactService))).Methods("POST")
	protectedRouter.HandleFunc("/api/contacts", AdaptController(getContactsController(contactService))).Methods("GET")
}

func addContactController(contactService service.IContactService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		var req dto.AddContactRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return &domain.ValidationError{Message: "invalid request body"}
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		contact, err := contactService.AddContact(r.Context(), userIDInt, req.UserIDInContact)
		if err != nil {
			return err
		}

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

func getContactsController(contactService service.IContactService) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		contacts, err := contactService.GetContacts(r.Context(), userIDInt)
		if err != nil {
			return err
		}

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
