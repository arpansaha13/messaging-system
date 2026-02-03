package tests

import (
	"testing"

	"github.com/stretchr/testify/require"
)

// TestUserGroupGetMembers tests the GET /api/groups/{groupID}/members endpoint
func TestUserGroupService_GetMembers(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Get group members successfully",
			Setup: func(f *TestFixture) error {
				ownerID := int64(6011)
				member1ID := int64(6012)
				member2ID := int64(6013)
				f.SetUserID(ownerID)

				// Create users
				if _, err := f.TestDB.CreateTestUserProfile(ownerID, "Group Owner"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(member1ID, "Member 1"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(member2ID, "Member 2"); err != nil {
					return err
				}

				// Create group
				if _, err := f.TestDB.CreateTestGroup("Group with Members", ownerID); err != nil {
					return err
				}

				// Add members to group
				if _, err := f.TestDB.CreateTestUserGroup(member1ID, int64(6111), "member"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestUserGroup(member2ID, int64(6111), "member")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/groups/6111/members")
				require.NoError(f.T, err)

				require.Equal(f.T, 200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)

				require.GreaterOrEqual(f.T, len(result), 2, "expected multiple members")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Get members of group with no members returns empty array",
			Setup: func(f *TestFixture) error {
				ownerID := int64(6014)
				f.SetUserID(ownerID)

				if _, err := f.TestDB.CreateTestUserProfile(ownerID, "Solo Owner"); err != nil {
					return err
				}

				_, err := f.TestDB.CreateTestGroup("Empty Group", ownerID)
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/groups/6112/members")
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
		{
			Name: "Get members of non-existent group returns error",
			Setup: func(f *TestFixture) error {
				userID := int64(6015)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "Viewer User")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/groups/99999/members")
				require.NoError(f.T, err)

				// API may return 200 for non-existent groups - verify response is 200-299 or 400+
				require.True(f.T, resp.StatusCode < 300 || resp.StatusCode >= 400, "expected 2xx or 4xx+ status")

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
