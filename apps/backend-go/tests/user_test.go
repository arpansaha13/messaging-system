package tests

import (
	"strconv"
	"testing"

	"github.com/stretchr/testify/require"
)

// TestUserGetMe tests the GET /api/users/me endpoint
func TestUserService_GetMe(t *testing.T) {
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
				require.NoError(f.T, err)

				require.Equal(f.T, 200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)

				require.Equal(f.T, "Test User Me", result["globalName"])

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

// TestUserSearch tests the GET /api/users/search endpoint
func TestUserService_SearchUsers(t *testing.T) {
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
				require.NoError(f.T, err)

				require.Equal(f.T, 200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)

				require.NotEmpty(f.T, result, "expected users in search results")

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
				require.NoError(f.T, err)

				require.Equal(f.T, 200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)
				require.NotNil(f.T, result, "expected array response")

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
				require.NoError(f.T, err)

				require.Equal(f.T, 200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)

				// Empty array is acceptable
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

// TestUserGetProfile tests the GET /api/users/{id} endpoint
func TestUserService_GetProfile(t *testing.T) {
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
				require.NoError(f.T, err)

				require.Equal(f.T, 200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)

				require.Equal(f.T, "Profile User", result["globalName"])

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
				require.NoError(f.T, err)

				require.GreaterOrEqual(f.T, resp.StatusCode, 400, "expected error status for non-existent user")

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
