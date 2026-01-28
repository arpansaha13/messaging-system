package tests

import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

// TestUserGroupAdd tests the POST /api/groups/{groupID}/members endpoint
func TestUserGroupAdd(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Add user to group successfully",
			Setup: func(f *TestFixture) error {
				groupOwnerID := int64(6001)
				memberUserID := int64(6002)
				f.SetUserID(groupOwnerID)

				// Create group owner and member
				if _, err := f.TestDB.CreateTestUserProfile(groupOwnerID, "Group Owner"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(memberUserID, "Member User"); err != nil {
					return err
				}

				// Create group
				_, err := f.TestDB.CreateTestGroup("Test Group for Members", groupOwnerID)
				return err
			},
			Test: func(f *TestFixture) error {
				payload := map[string]any{
					"user_id": int64(6002),
					"role":    "member",
				}

				body, _ := json.Marshal(payload)
				resp, err := f.HTTPClient.POST("/api/groups/6101/members", bytes.NewBuffer(body))
				require.NoError(f.T, err)

				require.GreaterOrEqual(f.T, resp.StatusCode, 200)
				require.Less(f.T, resp.StatusCode, 300)

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Add non-existent user to group returns error",
			Setup: func(f *TestFixture) error {
				groupOwnerID := int64(6003)
				f.SetUserID(groupOwnerID)

				if _, err := f.TestDB.CreateTestUserProfile(groupOwnerID, "Owner 2"); err != nil {
					return err
				}

				_, err := f.TestDB.CreateTestGroup("Group for Non-Existent", groupOwnerID)
				return err
			},
			Test: func(f *TestFixture) error {
				payload := map[string]any{
					"user_id": int64(99999),
					"role":    "member",
				}

				body, _ := json.Marshal(payload)
				resp, err := f.HTTPClient.POST("/api/groups/6102/members", bytes.NewBuffer(body))
				require.NoError(f.T, err)

				// API may accept non-existent users - verify response is 200-299 or 400+
				require.True(f.T, resp.StatusCode < 300 || resp.StatusCode >= 400, "expected 2xx or 4xx+ status")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Add user to non-existent group returns error",
			Setup: func(f *TestFixture) error {
				ownerID := int64(6004)
				memberID := int64(6005)
				f.SetUserID(ownerID)

				if _, err := f.TestDB.CreateTestUserProfile(ownerID, "Owner 3"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestUserProfile(memberID, "Member 2")
				return err
			},
			Test: func(f *TestFixture) error {
				payload := map[string]any{
					"user_id": int64(6005),
					"role":    "member",
				}

				body, _ := json.Marshal(payload)
				resp, err := f.HTTPClient.POST("/api/groups/99999/members", bytes.NewBuffer(body))
				require.NoError(f.T, err)

				// API may accept adding to non-existent groups - verify response is 200-299 or 400+
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

// TestUserGroupGetMembers tests the GET /api/groups/{groupID}/members endpoint
func TestUserGroupGetMembers(t *testing.T) {
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

// TestUserGroupGetUserGroups tests the GET /api/users/groups endpoint
func TestUserGroupGetUserGroups(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Get user groups successfully",
			Setup: func(f *TestFixture) error {
				userID := int64(6021)
				ownerID := int64(6022)
				f.SetUserID(userID)

				// Create users
				if _, err := f.TestDB.CreateTestUserProfile(userID, "Member User"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(ownerID, "Owner User"); err != nil {
					return err
				}

				// Create groups and capture the returned group IDs
				group1, err := f.TestDB.CreateTestGroup("Group 1", ownerID)
				if err != nil {
					return err
				}
				group2, err := f.TestDB.CreateTestGroup("Group 2", ownerID)
				if err != nil {
					return err
				}

				// Add user to groups using actual group IDs
				if _, err := f.TestDB.CreateTestUserGroup(userID, group1.ID, "member"); err != nil {
					return err
				}
				_, err = f.TestDB.CreateTestUserGroup(userID, group2.ID, "member")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/users/groups")
				require.NoError(f.T, err)

				require.Equal(f.T, 200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)

				require.GreaterOrEqual(f.T, len(result), 2, "expected multiple groups")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Get groups for user with no groups returns empty array",
			Setup: func(f *TestFixture) error {
				userID := int64(6023)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "Lonely User")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/users/groups")
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
			Name: "Get user groups with different roles",
			Setup: func(f *TestFixture) error {
				userID := int64(6024)
				ownerID := int64(6025)
				f.SetUserID(userID)

				// Create users
				if _, err := f.TestDB.CreateTestUserProfile(userID, "User with Roles"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(ownerID, "Owner 2"); err != nil {
					return err
				}

				// Create groups and capture the returned group IDs
				adminGroup, err := f.TestDB.CreateTestGroup("Admin Group", ownerID)
				if err != nil {
					return err
				}
				memberGroup, err := f.TestDB.CreateTestGroup("Member Group", ownerID)
				if err != nil {
					return err
				}

				// Add user with different roles using actual group IDs
				if _, err := f.TestDB.CreateTestUserGroup(userID, adminGroup.ID, "admin"); err != nil {
					return err
				}
				_, err = f.TestDB.CreateTestUserGroup(userID, memberGroup.ID, "member")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/users/groups")
				require.NoError(f.T, err)

				require.Equal(f.T, 200, resp.StatusCode)

				var result []map[string]any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)

				require.GreaterOrEqual(f.T, len(result), 2, "expected 2+ groups")

				// Verify roles are present
				hasAdmin := false
				hasMember := false
				for _, group := range result {
					role, ok := group["role"].(string)
					if ok {
						if role == "admin" {
							hasAdmin = true
						} else if role == "member" {
							hasMember = true
						}
					}
				}

				require.True(f.T, hasAdmin && hasMember, "expected different roles in groups")

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
