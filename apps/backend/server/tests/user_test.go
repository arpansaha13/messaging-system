package tests

import (
	"strconv"
	"testing"

	"github.com/stretchr/testify/suite"
)

// UserTestSuite is a test suite for user endpoints
type UserTestSuite struct {
	BaseTestSuite
}

// SetupTest prepares each test (cleans tables)
func (s *UserTestSuite) SetupTest() {
	s.CleanupTablesForSuite()
}

// TestGetMe tests the GET /api/users/me endpoint
func (s *UserTestSuite) TestGetMe() {
	tests := []TableDrivenTestCase{
		{
			Name: "Get authenticated user profile",
			Setup: func(f *TestFixture) error {
				userID := int64(5001)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "Test User Me")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/users/me")
				s.Require().NoError(err)

				s.Require().Equal(200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)

				s.Require().Equal("Test User Me", result["globalName"])

				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		s.Run(tt.Name, func() {
			fixture := NewTestFixture(s.T(), s.DB, s.HTTPServerAddr, s.AuthServiceMock)
			fixture.Setup()

			if err := tt.Setup(fixture); err != nil {
				s.T().Fatalf("setup failed: %v", err)
			}

			err := tt.Test(fixture)
			if (err != nil) != tt.ExpectError {
				s.T().Errorf("test failed: got error %v, want error %v", err, tt.ExpectError)
			}
		})
	}
}

// TestSearchUsers tests the GET /api/users/search endpoint
func (s *UserTestSuite) TestSearchUsers() {
	tests := []TableDrivenTestCase{
		{
			Name: "Search user profiles successfully",
			Setup: func(f *TestFixture) error {
				userID := int64(5011)
				f.SetUserID(userID)

				if _, err := f.TestDB.CreateTestUserProfile(userID, "Test Search User"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestUserProfile(int64(5012), "Another Searchable User")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/users/search?q=Search")
				s.Require().NoError(err)

				s.Require().Equal(200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)

				s.Require().NotEmpty(result, "expected users in search results")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Search with empty query returns empty array",
			Setup: func(f *TestFixture) error {
				userID := int64(5013)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "User for Empty Query")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/users/search?q=")
				s.Require().NoError(err)

				s.Require().Equal(200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				s.Require().NotNil(result, "expected array response")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Search with no matches returns empty array",
			Setup: func(f *TestFixture) error {
				userID := int64(5014)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "User Without Match")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/users/search?q=NonexistentUser123")
				s.Require().NoError(err)

				s.Require().Equal(200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)

				// Empty array is acceptable
				s.Require().NotNil(result, "expected empty array, not nil")

				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		s.Run(tt.Name, func() {
			fixture := NewTestFixture(s.T(), s.DB, s.HTTPServerAddr, s.AuthServiceMock)
			fixture.Setup()

			if err := tt.Setup(fixture); err != nil {
				s.T().Fatalf("setup failed: %v", err)
			}

			err := tt.Test(fixture)
			if (err != nil) != tt.ExpectError {
				s.T().Errorf("test failed: got error %v, want error %v", err, tt.ExpectError)
			}
		})
	}
}

// TestGetProfile tests the GET /api/users/{id} endpoint
func (s *UserTestSuite) TestGetProfile() {
	tests := []TableDrivenTestCase{
		{
			Name: "Get user profile by ID successfully",
			Setup: func(f *TestFixture) error {
				userID := int64(5021)
				profileUserID := int64(5022)
				f.SetUserID(userID)

				if _, err := f.TestDB.CreateTestUserProfile(userID, "Viewer User"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestUserProfile(profileUserID, "Profile User")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/users/" + strconv.FormatInt(5022, 10))
				s.Require().NoError(err)

				s.Require().Equal(200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)

				s.Require().Equal("Profile User", result["globalName"])

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Get non-existent user profile returns error",
			Setup: func(f *TestFixture) error {
				userID := int64(5023)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "Viewer 2")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/users/" + strconv.FormatInt(99999, 10))
				s.Require().NoError(err)

				s.Require().GreaterOrEqual(resp.StatusCode, 400, "expected error status for non-existent user")

				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		s.Run(tt.Name, func() {
			fixture := NewTestFixture(s.T(), s.DB, s.HTTPServerAddr, s.AuthServiceMock)
			fixture.Setup()

			if err := tt.Setup(fixture); err != nil {
				s.T().Fatalf("setup failed: %v", err)
			}

			err := tt.Test(fixture)
			if (err != nil) != tt.ExpectError {
				s.T().Errorf("test failed: got error %v, want error %v", err, tt.ExpectError)
			}
		})
	}
}

// TestUserService runs all user tests
func TestUserService(t *testing.T) {
	suite.Run(t, new(UserTestSuite))
}
