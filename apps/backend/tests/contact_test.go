package tests

import (
	"testing"

	"github.com/stretchr/testify/suite"
)

// ContactTestSuite is a test suite for contact endpoints
type ContactTestSuite struct {
	BaseTestSuite
}

// SetupTest prepares each test (cleans tables)
func (s *ContactTestSuite) SetupTest() {
	s.CleanupTablesForSuite()
}

// TestAddContact tests the POST /api/contacts endpoint
func (s *ContactTestSuite) TestAddContact() {
	tests := []TableDrivenTestCase{
		{
			Name: "Add contact successfully",
			Setup: func(f *TestFixture) error {
				userID := int64(3001)
				contactUserID := int64(3002)
				f.SetUserID(userID)

				if _, err := f.TestDB.CreateTestUserProfile(userID, "User A"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestUserProfile(contactUserID, "User B")
				return err
			},
			Test: func(f *TestFixture) error {
				req := map[string]any{
					"contact_id": int64(3002),
				}

				resp, err := f.HTTPClient.POST("/api/contacts", req)
				s.Require().NoError(err)
				s.Require().Equal(201, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				s.Require().NotNil(result["id"], "expected contact in response")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Add contact with invalid user ID returns error",
			Setup: func(f *TestFixture) error {
				userID := int64(3003)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "User C")
				return err
			},
			Test: func(f *TestFixture) error {
				req := map[string]any{
					"contact_id": int64(99999),
				}

				resp, err := f.HTTPClient.POST("/api/contacts", req)
				s.Require().NoError(err)
				s.Require().GreaterOrEqual(resp.StatusCode, 400, "expected error status")

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

// TestGetContacts tests the GET /api/contacts endpoint
func (s *ContactTestSuite) TestGetContacts() {
	tests := []TableDrivenTestCase{
		{
			Name: "Get contacts for user with contacts",
			Setup: func(f *TestFixture) error {
				userID := int64(3011)
				contactID := int64(3012)
				f.SetUserID(userID)

				if _, err := f.TestDB.CreateTestUserProfile(userID, "User D"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(contactID, "User E"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestContact(userID, contactID)
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/contacts")
				s.Require().NoError(err)
				s.Require().Equal(200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				s.Require().NotEmpty(result, "expected contacts in response")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Get contacts returns empty array when user has no contacts",
			Setup: func(f *TestFixture) error {
				userID := int64(3013)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "User F")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/contacts")
				s.Require().NoError(err)
				s.Require().Equal(200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
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

// TestContactService runs all contact tests
func TestContactService(t *testing.T) {
	suite.Run(t, new(ContactTestSuite))
}
