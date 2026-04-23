package tests

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/suite"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// InviteTestSuite is a test suite for invite endpoints
type InviteTestSuite struct {
	BaseTestSuite
}

// SetupTest prepares each test (cleans tables)
func (s *InviteTestSuite) SetupTest() {
	s.CleanupTablesForSuite()
}

// TestFindByHash tests the GET /api/invites/:hash endpoint
func (s *InviteTestSuite) TestFindByHash() {
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
				s.Require().NoError(err)
				s.Require().Equal(200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				s.Require().Equal("abc123", result["hash"], "expected hash to match")

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

// TestAcceptInvite tests the POST /api/invites/:hash/accept endpoint
func (s *InviteTestSuite) TestAcceptInvite() {
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
				s.Require().NoError(err)
				s.Require().Equal(200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				s.Require().NotEmpty(result["groupId"], "expected group ID in response")

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
				s.Require().NoError(err)
				s.Require().GreaterOrEqual(resp.StatusCode, 400, "expected error status")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Accept expired invite returns 400",
			Setup: func(f *TestFixture) error {
				senderID := int64(4014)
				recipientID := int64(4015)
				f.SetUserID(recipientID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender 7"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(recipientID, "Recipient 7"); err != nil {
					return err
				}
				group, err := f.TestDB.CreateTestGroup("Expired Invite Group", senderID)
				if err != nil {
					return err
				}

				// Insert invite with a past expiry directly — CreateTestInvite always sets +24h
				expiresAt := time.Now().Add(-1 * time.Hour)
				invite := &domain.Invite{
					Hash:      "hashexpired",
					InviterID: senderID,
					GroupID:   &group.ID,
					ExpiresAt: &expiresAt,
				}
				return f.TestDB.DB.Create(invite).Error
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.POST("/api/invites/hashexpired/accept", nil)
				s.Require().NoError(err)
				s.Require().Equal(400, resp.StatusCode, "expected 400 for expired invite")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Accept invite when user already in group returns 400",
			Setup: func(f *TestFixture) error {
				senderID := int64(4016)
				recipientID := int64(4017)
				f.SetUserID(recipientID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender 8"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(recipientID, "Recipient 8"); err != nil {
					return err
				}
				group, err := f.TestDB.CreateTestGroup("Already Member Group", senderID)
				if err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestInvite(group.ID, senderID, "hashalreadymember"); err != nil {
					return err
				}
				// Add recipient to the group before they try to accept the invite
				_, err = f.TestDB.CreateTestUserGroup(recipientID, group.ID, "MEMBER")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.POST("/api/invites/hashalreadymember/accept", nil)
				s.Require().NoError(err)
				s.Require().Equal(400, resp.StatusCode, "expected 400 when user is already in group")

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

// TestCreateInvite tests the POST /api/groups/:groupId/invites endpoint
func (s *InviteTestSuite) TestCreateInvite() {
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
				s.Require().NoError(err)

				var groups []map[string]any
				err = ReadResponseBody(resp, &groups)
				s.Require().NoError(err)
				s.Require().NotEmpty(groups, "no groups found")

				groupID := int64(groups[0]["id"].(float64))
				groupIDStr := fmt.Sprintf("%d", groupID)

				inviteResp, err := f.HTTPClient.POST("/api/groups/"+groupIDStr+"/invites", nil)
				s.Require().NoError(err)
				s.Require().Equal(201, inviteResp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(inviteResp, &result)
				s.Require().NoError(err)
				s.Require().NotEmpty(result["hash"], "expected hash in response")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Create invite as non-member returns forbidden",
			Setup: func(f *TestFixture) error {
				founderID := int64(4052)
				outsiderID := int64(4053)
				f.SetUserID(outsiderID)

				if _, err := f.TestDB.CreateTestUserProfile(founderID, "Founder 10"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(outsiderID, "Outsider 10"); err != nil {
					return err
				}

				_, err := f.TestDB.CreateTestGroup("Invite Protected Group", founderID)
				return err
			},
			Test: func(f *TestFixture) error {
				var group domain.Group
				if err := f.DB.Where("name = ?", "Invite Protected Group").First(&group).Error; err != nil {
					return err
				}

				resp, err := f.HTTPClient.POST("/api/groups/"+fmt.Sprintf("%d", group.ID)+"/invites", nil)
				s.Require().NoError(err)
				s.Require().Equal(403, resp.StatusCode, "expected 403 for non-member invite creation")

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Create invite for non-existent group returns 404",
			Setup: func(f *TestFixture) error {
				userID := int64(4051)
				f.SetUserID(userID)
				_, err := f.TestDB.CreateTestUserProfile(userID, "Sender 9")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.POST("/api/groups/999999/invites", nil)
				s.Require().NoError(err)
				s.Require().Equal(404, resp.StatusCode, "expected 404 for non-existent group")

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

// TestJoinGroup tests the POST /api/groups/join endpoint
func (s *InviteTestSuite) TestJoinGroup() {
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
				s.Require().NoError(err)
				s.Require().Equal(200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				s.Require().NotEmpty(result["groupId"], "expected group ID in response")

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

// TestInviteService runs all invite tests
func TestInviteService(t *testing.T) {
	suite.Run(t, new(InviteTestSuite))
}
