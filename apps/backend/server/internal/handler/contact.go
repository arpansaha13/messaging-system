package handler

import (
	"net/http"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
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
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("add contact handler called")

		req, err := dto.NewAddContactDTO(r)
		if err != nil {
			log.Warn("failed to parse add contact request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("add contact validation failed")
			return nil, err
		}

		log.Debug("adding contact", zap.Int64("contact_user_id", req.UserIDToAdd))

		contact, err := contactService.AddContact(r.Context(), req)
		if err != nil {
			log.Error("failed to add contact", zap.Int64("contact_user_id", req.UserIDToAdd), zap.Error(err))
			return nil, err
		}

		log.Info("contact added successfully", zap.Int64("contact_id", contact.ID))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.ContactResponseDTO{
				ID:         contact.ID,
				Alias:      contact.Alias,
				GlobalName: "", // populated when fetching contacts via GetContacts
				DP:         nil,
				Bio:        "",
				UserID:     contact.UserIDInContact,
			},
		}, nil
	}
}

func getContactsController(contactService service.IContactService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("get contacts handler called")

		contacts, err := contactService.GetContacts(r.Context())
		if err != nil {
			log.Error("failed to get contacts", zap.Error(err))
			return nil, err
		}

		log.Debug("contacts retrieved successfully", zap.Int("contact_count", len(contacts)))

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
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("update contact alias handler called")

		req, err := dto.NewUpdateContactAliasDTO(r)
		if err != nil {
			log.Warn("failed to parse update contact alias request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("update contact alias validation failed", zap.Int64("contact_id", req.ID))
			return nil, err
		}

		contact, err := contactService.UpdateContactAlias(r.Context(), req)
		if err != nil {
			log.Error("failed to update contact alias", zap.Int64("contact_id", req.ID), zap.Error(err))
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
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("delete contact handler called")

		req, err := dto.NewDeleteContactDTO(r)
		if err != nil {
			log.Warn("failed to parse delete contact request", zap.Error(err))
			return nil, err
		}

		if err := contactService.DeleteContact(r.Context(), req); err != nil {
			log.Error("failed to delete contact", zap.Int64("contact_id", req.ID), zap.Error(err))
			return nil, err
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusNoContent,
			Body:       nil,
		}, nil
	}
}
