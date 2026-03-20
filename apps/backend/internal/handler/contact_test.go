package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/utils"
	"github.com/arpansaha13/messaging-system/apps/backend/tests/mocks"
	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

func TestContactHandler_AddContact(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		requestBody   *dto.AddContactDTO
		mockFunc      func() *mocks.MockContactService
		expectedError error
		validateResp  func(t *testing.T, contact *domain.Contact)
	}{
		{
			name:   "successful add contact",
			userID: 1,
			requestBody: &dto.AddContactDTO{
				UserIDToAdd: 2,
				Alias:       "Friend",
			},
			mockFunc: func() *mocks.MockContactService {
				return &mocks.MockContactService{
					AddContactFunc: func(ctx context.Context, req *dto.AddContactDTO) (*domain.Contact, error) {
						return &domain.Contact{
							ID:              1,
							UserID:          1,
							UserIDInContact: req.UserIDToAdd,
							Alias:           req.Alias,
						}, nil
					},
				}
			},
			expectedError: nil,
			validateResp: func(t *testing.T, contact *domain.Contact) {
				assert.Equal(t, int64(1), contact.ID)
				assert.Equal(t, int64(1), contact.UserID)
				assert.Equal(t, int64(2), contact.UserIDInContact)
			},
		},
		{
			name:   "user not found error",
			userID: 1,
			requestBody: &dto.AddContactDTO{
				UserIDToAdd: 999,
			},
			mockFunc: func() *mocks.MockContactService {
				return &mocks.MockContactService{
					AddContactFunc: func(ctx context.Context, req *dto.AddContactDTO) (*domain.Contact, error) {
						return nil, &gtk.NotFoundError{Message: "user not found"}
					},
				}
			},
			expectedError: &gtk.NotFoundError{Message: "user not found"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			// Marshal request body
			body, err := json.Marshal(tt.requestBody)
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPost, "/api/contacts", bytes.NewBuffer(body))
			// Add userID to context
			ctx := context.WithValue(req.Context(), utils.UserIDContextKey, "1")
			req = req.WithContext(ctx)

			w := httptest.NewRecorder()

			// Call the controller function directly
			controller := addContactController(mockService)
			resp, err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, utils.Ptr(gtk.NotFoundError{Message: "user not found"}).Error(), err.Error())
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, http.StatusCreated, resp.StatusCode)
				contactResp, ok := resp.Body.(dto.ContactResponseDTO)
				require.True(t, ok, "response body should be ContactResponseDTO")
				assert.Equal(t, int64(2), contactResp.UserID) // The UserIDInContact from the request
			}
		})
	}
}

func TestContactHandler_GetContacts(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		mockFunc      func() *mocks.MockContactService
		expectedError error
		validateResp  func(t *testing.T, contacts []dto.ContactResponseDTO)
	}{
		{
			name:   "successful get contacts",
			userID: 1,
			mockFunc: func() *mocks.MockContactService {
				return &mocks.MockContactService{
					GetContactsFunc: func(ctx context.Context) ([]*repository.ContactWithUserInfo, error) {
						return []*repository.ContactWithUserInfo{}, nil
					},
				}
			},
			expectedError: nil,
			validateResp: func(t *testing.T, contacts []dto.ContactResponseDTO) {
				// Validate response structure
				assert.NotNil(t, contacts)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.mockFunc()

			req := httptest.NewRequest(http.MethodGet, "/api/contacts", nil)
			ctx := context.WithValue(req.Context(), utils.UserIDContextKey, "1")
			req = req.WithContext(ctx)

			w := httptest.NewRecorder()

			controller := getContactsController(mockService)
			resp, err := controller(w, req)

			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, http.StatusOK, resp.StatusCode)
			}
		})
	}
}
