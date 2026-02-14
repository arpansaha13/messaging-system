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

				var result []any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				s.Require().NotEmpty(result, "expected messages in response")
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

				var result []any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)
				s.Require().NotNil(result, "expected empty array, not nil")

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

// TestMessageService runs all message tests
func TestMessageService(t *testing.T) {
	suite.Run(t, new(MessageTestSuite))
}
