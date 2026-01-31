package tests

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
)

// TestInviteFindByHash tests the GET /api/invites/:hash endpoint
func TestInviteFindByHash(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Find invite by hash successfully",
			Setup: func(f *TestFixture) error {
				senderID := int64(4001)
				f.SetUserID(senderID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender"); err != nil {
					return err
				}
				group, err := f.TestDB.CreateTestGroup("Test Group", senderID)
				if err != nil {
					return err
				}
				// Create invite using the test DB helper
				_, err = f.TestDB.CreateTestInvite(group.ID, senderID, "abc123")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/invites/abc123")
				require.NoError(f.T, err)
				require.Equal(f.T, 200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)
				require.Equal(f.T, "abc123", result["hash"], "expected hash to match")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Find invalid invite returns not found",
			Setup: func(f *TestFixture) error {
				senderID := int64(4002)
				f.SetUserID(senderID)
				_, err := f.TestDB.CreateTestUserProfile(senderID, "Sender 2")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/invites/invaldhash")
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

// TestInviteAccept tests the POST /api/invites/:hash/accept endpoint
func TestInviteAccept(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Accept invite successfully",
			Setup: func(f *TestFixture) error {
				senderID := int64(4011)
				recipientID := int64(4012)
				f.SetUserID(recipientID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender 3"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(recipientID, "Recipient 3"); err != nil {
					return err
				}
				group, err := f.TestDB.CreateTestGroup("Group for Invite Accept", senderID)
				if err != nil {
					return err
				}
				_, err = f.TestDB.CreateTestInvite(group.ID, senderID, "hashaccept")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.POST("/api/invites/hashaccept/accept", nil)
				require.NoError(f.T, err)
				require.Equal(f.T, 200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)
				require.NotEmpty(f.T, result["groupId"], "expected group ID in response")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Accept invite with invalid hash returns error",
			Setup: func(f *TestFixture) error {
				userID := int64(4013)
				f.SetUserID(userID)
				_, err := f.TestDB.CreateTestUserProfile(userID, "User 4")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.POST("/api/invites/invalidhash/accept", nil)
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

// TestCreateInvite tests the POST /api/groups/:groupId/invites endpoint
func TestCreateInvite(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Create invite successfully",
			Setup: func(f *TestFixture) error {
				senderID := int64(4021)
				f.SetUserID(senderID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender 5"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestGroup("Test Group for Create", senderID)
				return err
			},
			Test: func(f *TestFixture) error {
				// Get group ID from database
				resp, err := f.HTTPClient.GET("/api/groups")
				require.NoError(f.T, err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				require.NoError(f.T, err)
				require.NotEmpty(f.T, groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))
				groupIDStr := fmt.Sprintf("%d", groupID)

				inviteResp, err := f.HTTPClient.POST("/api/groups/"+groupIDStr+"/invites", nil)
				require.NoError(f.T, err)
				require.Equal(f.T, 201, inviteResp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(inviteResp, &result)
				require.NoError(f.T, err)
				require.NotEmpty(f.T, result["hash"], "expected hash in response")

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

// TestJoinGroup tests the POST /api/groups/join endpoint
func TestJoinGroup(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Join group successfully with invite hash",
			Setup: func(f *TestFixture) error {
				senderID := int64(4031)
				recipientID := int64(4032)
				f.SetUserID(recipientID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender 6"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(recipientID, "Recipient 6"); err != nil {
					return err
				}
				group, err := f.TestDB.CreateTestGroup("Group for Join", senderID)
				if err != nil {
					return err
				}
				_, err = f.TestDB.CreateTestInvite(group.ID, senderID, "hashjoin")
				return err
			},
			Test: func(f *TestFixture) error {
				req := map[string]any{
					"inviteHash": "hashjoin",
				}

				resp, err := f.HTTPClient.POST("/api/groups/join", req)
				require.NoError(f.T, err)
				require.Equal(f.T, 200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)
				require.NotEmpty(f.T, result["groupId"], "expected group ID in response")

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
