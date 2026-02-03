package tests

import (
	"testing"

	"github.com/stretchr/testify/require"
)

// TestContactAdd tests the POST /api/contacts endpoint
func TestContactService_AddContact(t *testing.T) {
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
				require.NoError(f.T, err)
				require.Equal(f.T, 201, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)
				require.NotNil(f.T, result["id"], "expected contact in response")

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
				require.NoError(f.T, err)
				require.GreaterOrEqual(f.T, resp.StatusCode, 400, "expected error status")

				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			fixture := NewTestFixture(t)
			fixture.Setup()

			if err := tt.Setup(fixture); err != nil {
				t.Fatalf("setup failed: %v", err)
			}

			err := tt.Test(fixture)
			if (err != nil) != tt.ExpectError {
				t.Errorf("test failed: got error %v, want error %v", err, tt.ExpectError)
			}
		})
	}
}

// TestContactGet tests the GET /api/contacts endpoint
func TestContactService_GetContacts(t *testing.T) {
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
				require.NoError(f.T, err)
				require.Equal(f.T, 200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)
				require.NotEmpty(f.T, result, "expected contacts in response")

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
				require.NoError(f.T, err)
				require.Equal(f.T, 200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)
				require.NotNil(f.T, result, "expected empty array, not nil")

				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			fixture := NewTestFixture(t)
			fixture.Setup()

			if err := tt.Setup(fixture); err != nil {
				t.Fatalf("setup failed: %v", err)
			}

			err := tt.Test(fixture)
			if (err != nil) != tt.ExpectError {
				t.Errorf("test failed: got error %v, want error %v", err, tt.ExpectError)
			}
		})
	}
}
