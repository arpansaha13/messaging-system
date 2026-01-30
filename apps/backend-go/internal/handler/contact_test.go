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

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service/mocks"
)

func TestContactHandler_AddContact(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		requestBody   *dto.AddContactRequestDTO
		mockFunc      func() *mocks.MockContactService
		expectedError bool
		validateResp  func(t *testing.T, contact *domain.Contact)
	}{
		{
			name:   "successful add contact",
			userID: 1,
			requestBody: &dto.AddContactRequestDTO{
				UserIDInContact: 2,
			},
			mockFunc: func() *mocks.MockContactService {
				return &mocks.MockContactService{
					AddContactFunc: func(ctx context.Context, userID, userIDInContact int64) (*domain.Contact, error) {
						return &domain.Contact{
							ID:              1,
							UserID:          userID,
							UserIDInContact: userIDInContact,
							Alias:           "",
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, contact *domain.Contact) {
				assert.Equal(t, int64(1), contact.ID)
				assert.Equal(t, int64(1), contact.UserID)
				assert.Equal(t, int64(2), contact.UserIDInContact)
			},
		},
		{
			name:   "user not found error",
			userID: 1,
			requestBody: &dto.AddContactRequestDTO{
				UserIDInContact: 999,
			},
			mockFunc: func() *mocks.MockContactService {
				return &mocks.MockContactService{
					AddContactFunc: func(ctx context.Context, userID, userIDInContact int64) (*domain.Contact, error) {
						return nil, &domain.NotFoundError{Message: "user not found"}
					},
				}
			},
			expectedError: true,
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
			ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
			req = req.WithContext(ctx)

			w := httptest.NewRecorder()

			// Call the handler function directly
			handler := addContactHandler(mockService)
			handler(w, req)

			if tt.expectedError {
				assert.NotEqual(t, http.StatusCreated, w.Code)
			} else {
				assert.Equal(t, http.StatusCreated, w.Code)
				var resp dto.ContactResponseDTO
				err := json.NewDecoder(w.Body).Decode(&resp)
				require.NoError(t, err)
				assert.Equal(t, int64(2), resp.UserID) // The UserIDInContact from the request
			}
		})
	}
}

func TestContactHandler_GetContacts(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		mockFunc      func() *mocks.MockContactService
		expectedError bool
		validateResp  func(t *testing.T, contacts []dto.ContactResponseDTO)
	}{
		{
			name:   "successful get contacts",
			userID: 1,
			mockFunc: func() *mocks.MockContactService {
				return &mocks.MockContactService{
					GetContactsFunc: func(ctx context.Context, userID int64) ([]*repository.ContactWithUserInfo, error) {
						return []*repository.ContactWithUserInfo{}, nil
					},
				}
			},
			expectedError: false,
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
			ctx := context.WithValue(req.Context(), middleware.UserIDContextKey, "1")
			req = req.WithContext(ctx)

			w := httptest.NewRecorder()

			handler := getContactsHandler(mockService)
			handler(w, req)

			if tt.expectedError {
				assert.NotEqual(t, http.StatusOK, w.Code)
			} else {
				assert.Equal(t, http.StatusOK, w.Code)
			}
		})
	}
}
