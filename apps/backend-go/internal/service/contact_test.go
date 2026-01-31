package service_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
	"github.com/arpansaha13/messaging-system/apps/backend-go/tests/mocks"
)

func TestContactServiceAddContact(t *testing.T) {
	tests := []struct {
		name              string
		userID            int64
		userIDInContact   int64
		mockContactRepo   func() *mocks.MockContactRepository
		mockUserRepo      func() *mocks.MockUserRepository
		expectedError     bool
		expectedErrorType string
		validateResp      func(t *testing.T, contact *domain.Contact)
	}{
		{
			name:            "successful add contact",
			userID:          1,
			userIDInContact: 2,
			mockContactRepo: func() *mocks.MockContactRepository {
				return &mocks.MockContactRepository{
					CreateFunc: func(ctx context.Context, contact *domain.Contact) error {
						return nil
					},
				}
			},
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return &domain.UserProfile{
							ID:         id,
							GlobalName: "User" + string(rune(id)),
							Bio:        "Bio",
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, contact *domain.Contact) {
				assert.NotNil(t, contact)
				assert.Equal(t, int64(1), contact.UserID)
				assert.Equal(t, int64(2), contact.UserIDInContact)
			},
		},
		{
			name:            "contact user not found",
			userID:          1,
			userIDInContact: 999,
			mockContactRepo: func() *mocks.MockContactRepository {
				return &mocks.MockContactRepository{}
			},
			mockUserRepo: func() *mocks.MockUserRepository {
				return &mocks.MockUserRepository{
					GetByIDFunc: func(ctx context.Context, id int64) (*domain.UserProfile, error) {
						return nil, &domain.NotFoundError{Message: "user not found"}
					},
				}
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockContactRepo := tt.mockContactRepo()
			mockUserRepo := tt.mockUserRepo()
			svc := service.NewContactService(mockContactRepo, mockUserRepo)

			contact, err := svc.AddContact(context.Background(), tt.userID, tt.userIDInContact)

			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, contact)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, contact)
			}
		})
	}
}

func TestContactServiceGetContacts(t *testing.T) {
	tests := []struct {
		name          string
		userID        int64
		mockFunc      func() *mocks.MockContactRepository
		expectedError bool
		validateResp  func(t *testing.T, contacts any)
	}{
		{
			name:   "successful get contacts",
			userID: 1,
			mockFunc: func() *mocks.MockContactRepository {
				return &mocks.MockContactRepository{
					GetUserContactsFunc: func(ctx context.Context, userID int64) ([]*repository.ContactWithUserInfo, error) {
						// Returns mock contacts with user info
						return []*repository.ContactWithUserInfo{
							{
								ID:              1,
								UserID:          1,
								UserIDInContact: 2,
								Alias:           "Friend 1",
								GlobalName:      "User Two",
								DP:              nil,
								Bio:             "Test bio",
							},
						}, nil
					},
				}
			},
			expectedError: false,
			validateResp: func(t *testing.T, contacts any) {
				assert.NotNil(t, contacts)
				contactSlice, ok := contacts.([]*repository.ContactWithUserInfo)
				assert.True(t, ok)
				assert.Len(t, contactSlice, 1)
				assert.Equal(t, "Friend 1", contactSlice[0].Alias)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.mockFunc()
			svc := service.NewContactService(mockRepo, &mocks.MockUserRepository{})

			contacts, err := svc.GetContacts(context.Background(), tt.userID)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				tt.validateResp(t, contacts)
			}
		})
	}
}
