package tests

import (
	"strconv"
	"testing"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/stretchr/testify/require"
)

// TestChannelService_CreateChannel tests the POST /api/groups/{id}/channels endpoint
func TestChannelService_CreateChannel(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Create channel in group successfully",
			Setup: func(f *TestFixture) error {
				userID := int64(1601)
				f.SetUserID(userID)

				if _, err := f.TestDB.CreateTestUserProfile(userID, "Test User"); err != nil {
					return err
				}

				_, err := f.TestDB.CreateTestGroup("Test Group", userID)
				return err
			},
			Test: func(f *TestFixture) error {
				// First get group ID
				resp, err := f.HTTPClient.GET("/api/groups")
				require.NoError(f.T, err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				require.NoError(f.T, err)

				require.NotEmpty(f.T, groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))

				req := map[string]any{
					"name": "Test Channel",
				}

				channelResp, err := f.HTTPClient.POST("/api/groups/"+strconv.FormatInt(groupID, 10)+"/channels", req)
				require.NoError(f.T, err)

				require.Equal(f.T, 201, channelResp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(channelResp, &result)
				require.NoError(f.T, err)

				require.Equal(f.T, "Test Channel", result["name"])

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Create channel with invalid group ID returns error",
			Setup: func(f *TestFixture) error {
				userID := int64(1602)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "Test User")
				return err
			},
			Test: func(f *TestFixture) error {
				req := map[string]any{
					"name": "Test Channel",
				}

				resp, err := f.HTTPClient.POST("/api/groups/99999/channels", req)
				require.NoError(f.T, err)

				// Accept any error status
				require.True(f.T, resp.StatusCode < 200 || resp.StatusCode >= 300, "expected error status")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Create channel with empty name returns validation error",
			Setup: func(f *TestFixture) error {
				userID := int64(1603)
				f.SetUserID(userID)

				if _, err := f.TestDB.CreateTestUserProfile(userID, "Test User"); err != nil {
					return err
				}

				_, err := f.TestDB.CreateTestGroup("Test Group", userID)
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/groups")
				require.NoError(f.T, err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				require.NoError(f.T, err)

				require.NotEmpty(f.T, groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))

				req := map[string]any{
					"name": "",
				}

				channelResp, err := f.HTTPClient.POST("/api/groups/"+strconv.FormatInt(groupID, 10)+"/channels", req)
				require.NoError(f.T, err)

				require.Equal(f.T, 400, channelResp.StatusCode)

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

			if tt.Verify != nil {
				if err := tt.Verify(fixture); err != nil {
					t.Errorf("verification failed: %v", err)
				}
			}
		})
	}
}

// TestChannelService_GetChannels tests the GET /api/groups/{id}/channels endpoint
func TestChannelService_GetChannels(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Get channels by group ID",
			Setup: func(f *TestFixture) error {
				userID := int64(1604)
				f.SetUserID(userID)

				if _, err := f.TestDB.CreateTestUserProfile(userID, "Test User"); err != nil {
					return err
				}

				group, err := f.TestDB.CreateTestGroup("Test Group", userID)
				if err != nil {
					return err
				}

				if _, err := f.TestDB.CreateTestChannel(group.ID, "Channel 1"); err != nil {
					return err
				}

				_, err = f.TestDB.CreateTestChannel(group.ID, "Channel 2")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/groups")
				require.NoError(f.T, err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				require.NoError(f.T, err)

				require.NotEmpty(f.T, groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))

				channelResp, err := f.HTTPClient.GET("/api/groups/" + strconv.FormatInt(groupID, 10) + "/channels")
				require.NoError(f.T, err)

				require.Equal(f.T, 200, channelResp.StatusCode)

				var channels []any
				err = ReadResponseBody(channelResp, &channels)
				require.NoError(f.T, err)

				require.NotEmpty(f.T, channels, "expected channels in response")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Get channels returns empty array when no channels",
			Setup: func(f *TestFixture) error {
				userID := int64(1614)
				f.SetUserID(userID)

				if _, err := f.TestDB.CreateTestUserProfile(userID, "Test User"); err != nil {
					return err
				}

				_, err := f.TestDB.CreateTestGroup("Empty Group", userID)
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/groups")
				if err != nil {
					return err
				}

				var groups []map[string]any
				if err := ReadResponseBody(resp, &groups); err != nil {
					return err
				}

				if len(groups) == 0 {
					return &domain.ValidationError{Message: "no groups found"}
				}

				groupID := int64(groups[0]["id"].(float64))

				channelResp, err := f.HTTPClient.GET("/api/groups/" + strconv.FormatInt(groupID, 10) + "/channels")
				if err != nil {
					return err
				}

				if channelResp.StatusCode != 200 {
					return &domain.ValidationError{Message: "expected status 200"}
				}

				var channels []any
				if err := ReadResponseBody(channelResp, &channels); err != nil {
					return err
				}

				if channels == nil {
					return &domain.ValidationError{Message: "expected empty array, not nil"}
				}

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

			if tt.Verify != nil {
				if err := tt.Verify(fixture); err != nil {
					t.Errorf("verification failed: %v", err)
				}
			}
		})
	}
}

// TestChannelService_GetChannelInfo tests the GET /api/channels/{id} endpoint
func TestChannelService_GetChannelInfo(t *testing.T) {
	tests := []TableDrivenTestCase{
		{
			Name: "Get channel info by channel ID",
			Setup: func(f *TestFixture) error {
				userID := int64(1605)
				f.SetUserID(userID)

				if _, err := f.TestDB.CreateTestUserProfile(userID, "Test User"); err != nil {
					return err
				}

				group, err := f.TestDB.CreateTestGroup("Test Group", userID)
				if err != nil {
					return err
				}

				_, err = f.TestDB.CreateTestChannel(group.ID, "Test Channel")
				return err
			},
			Test: func(f *TestFixture) error {
				// Get channels
				resp, err := f.HTTPClient.GET("/api/groups")
				require.NoError(f.T, err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				require.NoError(f.T, err)

				require.NotEmpty(f.T, groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))

				channelListResp, err := f.HTTPClient.GET("/api/groups/" + strconv.FormatInt(groupID, 10) + "/channels")
				require.NoError(f.T, err)

				var channels []map[string]any
				err = ReadResponseBody(channelListResp, &channels)
				require.NoError(f.T, err)

				require.NotEmpty(f.T, channels, "no channels found")

				channelID := int64(channels[0]["id"].(float64))

				// Get channel info
				infoResp, err := f.HTTPClient.GET("/api/channels/" + strconv.FormatInt(channelID, 10))
				require.NoError(f.T, err)

				require.Equal(f.T, 200, infoResp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(infoResp, &result)
				require.NoError(f.T, err)

				require.Equal(f.T, "Test Channel", result["name"])

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Get channel info with invalid channel ID returns error",
			Setup: func(f *TestFixture) error {
				userID := int64(1606)
				f.SetUserID(userID)

				_, err := f.TestDB.CreateTestUserProfile(userID, "Test User")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/channels/99999")
				require.NoError(f.T, err)

				// Accept any error status
				require.True(f.T, resp.StatusCode < 200 || resp.StatusCode >= 300, "expected error status")

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

			if tt.Verify != nil {
				if err := tt.Verify(fixture); err != nil {
					t.Errorf("verification failed: %v", err)
				}
			}
		})
	}
}
