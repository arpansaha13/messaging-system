package tests

import (
	"strconv"
	"testing"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"github.com/stretchr/testify/suite"
)

// MessageTestSuite is a test suite for message endpoints
type MessageTestSuite struct {
	BaseTestSuite
}

// SetupTest prepares each test (cleans tables)
func (s *MessageTestSuite) SetupTest() {
	s.CleanupTablesForSuite()
}

// TestGetMessages tests the GET /api/messages/{id} endpoint
func (s *MessageTestSuite) TestGetMessages() {
	tests := []TableDrivenTestCase{
		{
			Name: "Get personal messages between users",
			Setup: func(f *TestFixture) error {
				senderID := int64(1201)
				receiverID := int64(1202)
				f.SetUserID(senderID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(receiverID, "Receiver"); err != nil {
					return err
				}

				msg1, err := f.TestDB.CreateTestMessage(senderID, "Message 1")
				if err != nil {
					return err
				}
				msg2, err := f.TestDB.CreateTestMessage(senderID, "Message 2")
				if err != nil {
					return err
				}

				if _, err := f.TestDB.CreateTestMessageRecipient(msg1.ID, receiverID, domain.MessageStatusSent); err != nil {
					return err
				}
				_, err = f.TestDB.CreateTestMessageRecipient(msg2.ID, receiverID, domain.MessageStatusSent)
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/messages/" + strconv.FormatInt(1202, 10))
				s.Require().NoError(err)
				s.Require().Equal(200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				messages := result["messages"].([]any)
				s.Require().NotEmpty(messages, "expected messages in response")
				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Get messages returns empty array when no messages",
			Setup: func(f *TestFixture) error {
				senderID := int64(1211)
				receiverID := int64(1212)
				f.SetUserID(senderID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestUserProfile(receiverID, "Receiver")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/messages/" + strconv.FormatInt(1212, 10))
				s.Require().NoError(err)
				s.Require().Equal(200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				messages := result["messages"].([]any)
				s.Require().NotNil(messages, "expected messages field in response")
				s.Require().Empty(messages, "expected empty messages array")

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

// TestMarkDelivered tests the POST /api/messages/status/delivered endpoint
func (s *MessageTestSuite) TestMarkDelivered() {
	tests := []TableDrivenTestCase{
		{
			Name: "Mark message as delivered (RabbitMQ unavailable returns 500)",
			Setup: func(f *TestFixture) error {
				senderID := int64(1301)
				receiverID := int64(1302)
				f.SetUserID(receiverID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(receiverID, "Receiver"); err != nil {
					return err
				}

				msg, err := f.TestDB.CreateTestMessage(senderID, "Test message")
				if err != nil {
					return err
				}

				_, err = f.TestDB.CreateTestMessageRecipient(msg.ID, receiverID, domain.MessageStatusSent)
				return err
			},
			Test: func(f *TestFixture) error {
				req := map[string]any{
					"message_id": int64(1),
				}

				resp, err := f.HTTPClient.POST("/api/messages/status/delivered", req)
				s.Require().NoError(err)
				s.Require().Equal(500, resp.StatusCode, "expected status 500 when RabbitMQ unavailable")
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

// TestMarkRead tests the POST /api/messages/status/read endpoint
func (s *MessageTestSuite) TestMarkRead() {
	tests := []TableDrivenTestCase{
		{
			Name: "Mark message as read (RabbitMQ unavailable returns 500)",
			Setup: func(f *TestFixture) error {
				senderID := int64(1401)
				receiverID := int64(1402)
				f.SetUserID(receiverID)

				if _, err := f.TestDB.CreateTestUserProfile(senderID, "Sender"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(receiverID, "Receiver"); err != nil {
					return err
				}

				msg, err := f.TestDB.CreateTestMessage(senderID, "Test message")
				if err != nil {
					return err
				}

				_, err = f.TestDB.CreateTestMessageRecipient(msg.ID, receiverID, domain.MessageStatusDelivered)
				return err
			},
			Test: func(f *TestFixture) error {
				req := map[string]any{
					"message_id": int64(1),
				}

				resp, err := f.HTTPClient.POST("/api/messages/status/read", req)
				s.Require().NoError(err)
				s.Require().Equal(500, resp.StatusCode, "expected status 500 when RabbitMQ unavailable")
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

// TestSendGroupMessageAuthorization verifies non-members cannot send group messages
func (s *MessageTestSuite) TestSendGroupMessageAuthorization() {
	tests := []TableDrivenTestCase{
		{
			Name: "Non-member cannot send group message",
			Setup: func(f *TestFixture) error {
				founderID := int64(1451)
				outsiderID := int64(1452)
				f.SetUserID(outsiderID)

				if _, err := f.TestDB.CreateTestUserProfile(founderID, "Group Founder"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(outsiderID, "Group Outsider"); err != nil {
					return err
				}

				group, err := f.TestDB.CreateTestGroup("Group Send Protected", founderID)
				if err != nil {
					return err
				}

				_, err = f.TestDB.CreateTestChannel(group.ID, "Group Send Channel")
				return err
			},
			Test: func(f *TestFixture) error {
				var group domain.Group
				if err := f.DB.Where("name = ?", "Group Send Protected").First(&group).Error; err != nil {
					return err
				}

				var channel domain.Channel
				if err := f.DB.Where("name = ?", "Group Send Channel").First(&channel).Error; err != nil {
					return err
				}

				req := map[string]any{
					"groupId":   group.ID,
					"channelId": channel.ID,
					"content":   "Unauthorized attempt",
					"hash":      "group-send-hash",
				}

				resp, err := f.HTTPClient.POST("/api/messages/send/group", req)
				s.Require().NoError(err)
				s.Require().Equal(403, resp.StatusCode)

				return nil
			},
			ExpectError: false,
		},
		{
			Name: "MessageService.SendGroupMessage rejects channel/group mismatch",
			Setup: func(f *TestFixture) error {
				memberID := int64(1453)
				otherFounderID := int64(1454)
				f.SetUserID(memberID)

				if _, err := f.TestDB.CreateTestUserProfile(memberID, "Member User"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(otherFounderID, "Other Founder"); err != nil {
					return err
				}

				if _, err := f.TestDB.CreateTestGroup("Sender Group", memberID); err != nil {
					return err
				}

				otherGroup, err := f.TestDB.CreateTestGroup("Other Group", otherFounderID)
				if err != nil {
					return err
				}

				_, err = f.TestDB.CreateTestChannel(otherGroup.ID, "Other Group Channel")
				return err
			},
			Test: func(f *TestFixture) error {
				var senderGroup domain.Group
				if err := f.DB.Where("name = ?", "Sender Group").First(&senderGroup).Error; err != nil {
					return err
				}

				var otherGroupChannel domain.Channel
				if err := f.DB.Where("name = ?", "Other Group Channel").First(&otherGroupChannel).Error; err != nil {
					return err
				}

				req := map[string]any{
					"groupId":   senderGroup.ID,
					"channelId": otherGroupChannel.ID,
					"content":   "Cross-group mismatch attempt",
					"hash":      "group-send-mismatch-hash",
				}

				resp, err := f.HTTPClient.POST("/api/messages/send/group", req)
				s.Require().NoError(err)
				s.Require().Equal(403, resp.StatusCode, "expected mismatch to be rejected")

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

// TestGetChannelMessagesAuthorization verifies channel-message read authorization behavior.
func (s *MessageTestSuite) TestGetChannelMessagesAuthorization() {
	tests := []TableDrivenTestCase{
		{
			Name: "MessageRepository.GetMessagesByChannelID denies non-member channel reads",
			Setup: func(f *TestFixture) error {
				founderID := int64(1461)
				outsiderID := int64(1462)
				f.SetUserID(outsiderID)

				if _, err := f.TestDB.CreateTestUserProfile(founderID, "Channel Founder"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(outsiderID, "Channel Outsider"); err != nil {
					return err
				}

				group, err := f.TestDB.CreateTestGroup("Channel Read Protected Group", founderID)
				if err != nil {
					return err
				}

				channel, err := f.TestDB.CreateTestChannel(group.ID, "Channel Read Protected")
				if err != nil {
					return err
				}

				channelID := channel.ID
				message := &domain.Message{
					SenderID:  founderID,
					ChannelID: &channelID,
					Content:   "Private channel message",
				}

				return f.DB.Create(message).Error
			},
			Test: func(f *TestFixture) error {
				var channel domain.Channel
				if err := f.DB.Where("name = ?", "Channel Read Protected").First(&channel).Error; err != nil {
					return err
				}

				resp, err := f.HTTPClient.GET("/api/channels/" + strconv.FormatInt(channel.ID, 10) + "/messages")
				s.Require().NoError(err)
				s.Require().Equal(403, resp.StatusCode, "expected non-member read to be rejected")

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

// TestMessageService runs all message tests
func TestMessageService(t *testing.T) {
	suite.Run(t, new(MessageTestSuite))
}
