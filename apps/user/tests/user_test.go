package tests

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/stretchr/testify/suite"
)

type UserTestSuite struct {
	BaseTestSuite
}

func (s *UserTestSuite) SetupTest() {
	s.CleanupTablesForSuite()
}

func (s *UserTestSuite) TestGetMe() {
	userID := int64(5001)
	token := "valid-token"

	s.setupAuthMock(token, userID, "testuser", "test@example.com")

	// Create profile
	profile := &domain.UserProfile{
		ID:         userID,
		GlobalName: "Test User Me",
	}
	s.DB.Create(profile)

	resp := s.performRequest("GET", "/api/users/me", nil, token)
	s.Require().Equal(http.StatusOK, resp.StatusCode)

	user := s.decodeAuthUser(resp)
	s.Require().Equal("Test User Me", user.GlobalName)
	s.Require().Equal("testuser", user.Username)
}

func (s *UserTestSuite) TestSearchUsers() {
	userID := int64(5011)
	token := "search-token"

	s.setupAuthMock(token, userID, "searcher", "searcher@example.com")

	// Create profiles
	s.DB.Create(&domain.UserProfile{ID: userID, GlobalName: "Searcher User"})
	s.DB.Create(&domain.UserProfile{ID: 5012, GlobalName: "Target User"})

	resp := s.performRequest("GET", "/api/users/search?q=Target", nil, token)
	s.Require().Equal(http.StatusOK, resp.StatusCode)
}

func (s *UserTestSuite) TestGetProfile() {
	userID := int64(5021)
	profileID := int64(5022)
	token := "profile-token"

	s.setupAuthMock(token, userID, "viewer", "viewer@example.com")

	s.DB.Create(&domain.UserProfile{ID: userID, GlobalName: "Viewer User"})
	s.DB.Create(&domain.UserProfile{ID: profileID, GlobalName: "Profile User"})

	resp := s.performRequest("GET", fmt.Sprintf("/api/users/%d", profileID), nil, token)
	s.Require().Equal(http.StatusOK, resp.StatusCode)

	profile := s.decodeUserProfile(resp)
	s.Require().Equal("Profile User", profile.GlobalName)
}

func TestUserService(t *testing.T) {
	suite.Run(t, new(UserTestSuite))
}
