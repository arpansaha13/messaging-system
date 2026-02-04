package tests

import (
	"strconv"
	"testing"

	"github.com/arpansaha13/messaging-system/apps/backend/internal/domain"
	"github.com/stretchr/testify/suite"
)

// ChannelTestSuite is a test suite for channel endpoints
type ChannelTestSuite struct {
	BaseTestSuite
}

// SetupTest prepares each test (cleans tables)
func (s *ChannelTestSuite) SetupTest() {
	s.CleanupTablesForSuite()
}

// TestCreateChannel tests the POST /api/groups/{id}/channels endpoint
func (s *ChannelTestSuite) TestCreateChannel() {
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
				s.Require().NoError(err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				s.Require().NoError(err)

				s.Require().NotEmpty(groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))

				req := map[string]any{
					"name": "Test Channel",
				}

				channelResp, err := f.HTTPClient.POST("/api/groups/"+strconv.FormatInt(groupID, 10)+"/channels", req)
				s.Require().NoError(err)

				s.Require().Equal(201, channelResp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(channelResp, &result)
				s.Require().NoError(err)

				s.Require().Equal("Test Channel", result["name"])

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
				s.Require().NoError(err)

				// Accept any error status
				s.Require().True(resp.StatusCode < 200 || resp.StatusCode >= 300, "expected error status")

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
				s.Require().NoError(err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				s.Require().NoError(err)

				s.Require().NotEmpty(groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))

				req := map[string]any{
					"name": "",
				}

				channelResp, err := f.HTTPClient.POST("/api/groups/"+strconv.FormatInt(groupID, 10)+"/channels", req)
				s.Require().NoError(err)

				s.Require().Equal(400, channelResp.StatusCode)

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

			if tt.Verify != nil {
				if err := tt.Verify(fixture); err != nil {
					s.T().Errorf("verification failed: %v", err)
				}
			}
		})
	}
}

// TestGetChannels tests the GET /api/groups/{id}/channels endpoint
func (s *ChannelTestSuite) TestGetChannels() {
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

				if _, err := f.TestDB.CreateTestChannel(group.ID, "Test Channel 1"); err != nil {
					return err
				}

				_, err = f.TestDB.CreateTestChannel(group.ID, "Test Channel 2")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/groups")
				s.Require().NoError(err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				s.Require().NoError(err)

				s.Require().NotEmpty(groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))

				channelResp, err := f.HTTPClient.GET("/api/groups/" + strconv.FormatInt(groupID, 10) + "/channels")
				s.Require().NoError(err)

				s.Require().Equal(200, channelResp.StatusCode)

				var channels []any
				err = ReadResponseBody(channelResp, &channels)
				s.Require().NoError(err)

				s.Require().NotEmpty(channels, "expected channels in response")

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

			if tt.Verify != nil {
				if err := tt.Verify(fixture); err != nil {
					s.T().Errorf("verification failed: %v", err)
				}
			}
		})
	}
}

// TestGetChannelInfo tests the GET /api/channels/{id} endpoint
func (s *ChannelTestSuite) TestGetChannelInfo() {
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
				s.Require().NoError(err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				s.Require().NoError(err)

				s.Require().NotEmpty(groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))

				channelListResp, err := f.HTTPClient.GET("/api/groups/" + strconv.FormatInt(groupID, 10) + "/channels")
				s.Require().NoError(err)

				var channels []map[string]any
				err = ReadResponseBody(channelListResp, &channels)
				s.Require().NoError(err)

				s.Require().NotEmpty(channels, "no channels found")

				channelID := int64(channels[0]["id"].(float64))

				// Get channel info
				infoResp, err := f.HTTPClient.GET("/api/channels/" + strconv.FormatInt(channelID, 10))
				s.Require().NoError(err)

				s.Require().Equal(200, infoResp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(infoResp, &result)
				s.Require().NoError(err)

				s.Require().Equal("Test Channel", result["name"])

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
				s.Require().NoError(err)

				// Accept any error status
				s.Require().True(resp.StatusCode < 200 || resp.StatusCode >= 300, "expected error status")

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

			if tt.Verify != nil {
				if err := tt.Verify(fixture); err != nil {
					s.T().Errorf("verification failed: %v", err)
				}
			}
		})
	}
}

// TestChannelService runs all channel tests
func TestChannelService(t *testing.T) {
	suite.Run(t, new(ChannelTestSuite))
}
