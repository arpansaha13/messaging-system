package handler

import (
	"net/http"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/user/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/user/internal/service"
	"github.com/gorilla/mux"
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
			return nil, err
		}
		if err := req.Validate(); err != nil {
			return nil, err
		}

		contact, err := contactService.AddContact(r.Context(), req)
		if err != nil {
			return nil, err
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.ContactResponseDTO{
				ID:     contact.ID,
				Alias:  contact.Alias,
				UserID: contact.UserIDInContact,
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
			return nil, err
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       contacts,
		}, nil
	}
}

func updateContactAliasController(contactService service.IContactService) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := gtk.LoggerFromContext(r.Context())
		log.Debug("update contact alias handler called")

		req, err := dto.NewUpdateContactAliasDTO(r)
		if err != nil {
			return nil, err
		}
		if err := req.Validate(); err != nil {
			return nil, err
		}

		contact, err := contactService.UpdateContactAlias(r.Context(), req)
		if err != nil {
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
			return nil, err
		}

		if err := contactService.DeleteContact(r.Context(), req); err != nil {
			return nil, err
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusNoContent,
			Body:       nil,
		}, nil
	}
}
