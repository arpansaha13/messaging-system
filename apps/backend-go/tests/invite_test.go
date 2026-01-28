package tests

import (
	"testing"

	"github.com/stretchr/testify/require"
)

// TestInviteSend tests the POST /api/invites endpoint
func TestInviteSend(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Send invite successfully",
			Setup: func(f *TestFixture) error {
				senderID := int64(4001)
				recipientID := int64(4002)
				f.SetUserID(senderID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(recipientID, "Recipient"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestGroup("Test Group", senderID)
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

				req := map[string]any{
					"group_id": groupID,
					"user_id":  int64(4002),
				}

				inviteResp, err := f.HTTPClient.POST("/api/invites", req)
				require.NoError(f.T, err)
				require.Equal(f.T, 201, inviteResp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(inviteResp, &result)
				require.NoError(f.T, err)
				require.Equal(f.T, "pending", result["status"], "expected status to be pending")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Send invite with invalid group ID returns error",
			Setup: func(f *TestFixture) error {
				senderID := int64(4003)
				recipientID := int64(4004)
				f.SetUserID(senderID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender 2"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestUserProfile(recipientID, "Recipient 2")
				return err
			},
			Test: func(f *TestFixture) error {
				req := map[string]any{
					"group_id": int64(99999),
					"user_id":  int64(4004),
				}

				resp, err := f.HTTPClient.POST("/api/invites", req)
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

// TestInviteGet tests the GET /api/invites endpoint
func TestInviteGet(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Get pending invites for user",
			Setup: func(f *TestFixture) error {
				recipientID := int64(4011)
				senderID := int64(4012)
				f.SetUserID(recipientID)

				if _, err := f.TestDB.CreateTestUserProfile(recipientID, "Recipient 3"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender 3"); err != nil {
					return err
				}
				group, err := f.TestDB.CreateTestGroup("Group for Invite", senderID)
				if err != nil {
					return err
				}
				_, err = f.TestDB.CreateTestInvite(group.ID, recipientID, senderID, "pending")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/invites")
				require.NoError(f.T, err)
				require.Equal(f.T, 200, resp.StatusCode)

				var result []any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)
				require.NotEmpty(f.T, result, "expected invites in response")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Get invites returns empty array when user has no invites",
			Setup: func(f *TestFixture) error {
				userID := int64(4013)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "User with no invites")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/invites")
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
