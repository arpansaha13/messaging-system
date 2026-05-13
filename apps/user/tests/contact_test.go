package tests

import (
	"net/http"
	"testing"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/stretchr/testify/suite"
)

type ContactTestSuite struct {
	BaseTestSuite
}

func (s *ContactTestSuite) SetupTest() {
	s.CleanupTablesForSuite()
}

func (s *ContactTestSuite) TestAddContact() {
	userID := int64(3001)
	contactUserID := int64(3002)
	token := "add-contact-token"

	s.setupAuthMock(token, userID, "usera", "usera@example.com")

	s.DB.Create(&domain.UserProfile{ID: userID, GlobalName: "User A"})
	s.DB.Create(&domain.UserProfile{ID: contactUserID, GlobalName: "User B"})

	req := map[string]any{
		"user_id": contactUserID,
		"alias":   "My Friend",
	}

	resp := s.performRequest("POST", "/api/contacts", req, token)
	s.Require().Equal(http.StatusCreated, resp.StatusCode)

	contact := s.decodeContact(resp)
	s.Require().Equal("My Friend", contact.Alias)
	s.Require().Equal(contactUserID, contact.UserID)
}

func (s *ContactTestSuite) TestGetContacts() {
	userID := int64(3011)
	contactUserID := int64(3012)
	token := "get-contacts-token"

	s.setupAuthMock(token, userID, "userd", "userd@example.com")

	s.DB.Create(&domain.UserProfile{ID: userID, GlobalName: "User D"})
	s.DB.Create(&domain.UserProfile{ID: contactUserID, GlobalName: "User E"})
	s.DB.Create(&domain.Contact{UserID: userID, UserIDInContact: contactUserID, Alias: "Friend E"})

	resp := s.performRequest("GET", "/api/contacts", nil, token)
	s.Require().Equal(http.StatusOK, resp.StatusCode)

	contacts := s.decodeContacts(resp)
	s.Require().NotEmpty(contacts)
	s.Require().Equal("Friend E", contacts[0].Alias)
}

func TestContactService(t *testing.T) {
	suite.Run(t, new(ContactTestSuite))
}
