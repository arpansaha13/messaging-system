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
	protectedRouter.HandleFunc("/api/contacts", addContactHandler(contactService)).Methods("POST")
	protectedRouter.HandleFunc("/api/contacts", getContactsHandler(contactService)).Methods("GET")
}

func addContactHandler(contactService service.IContactService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.AddContactRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		contact, err := contactService.AddContact(r.Context(), userIDInt, req.UserIDInContact)
		if err != nil {
			middleware.WriteError(w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(dto.ContactResponseDTO{
			ID:         contact.ID,
			GlobalName: "", // This would be populated when fetching contacts via GetContacts
			DP:         nil,
			Bio:        "",
			UserID:     contact.UserIDInContact,
		})
	}
}

func getContactsHandler(contactService service.IContactService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.GetUserIDFromContext(r)
		userIDInt, _ := strconv.ParseInt(userID, 10, 64)

		contacts, err := contactService.GetContacts(r.Context(), userIDInt)
		if err != nil {
			middleware.WriteError(w, err)
			return
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
		json.NewEncoder(w).Encode(contactResponses)
	}
}
