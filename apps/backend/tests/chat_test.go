package tests

import (
	"testing"

	"github.com/stretchr/testify/suite"
)

// ChatTestSuite is a test suite for chat endpoints
type ChatTestSuite struct {
	BaseTestSuite
}

// SetupTest prepares each test (cleans tables)
func (s *ChatTestSuite) SetupTest() {
	s.CleanupTablesForSuite()
}

// TestGetChats tests the GET /api/chats endpoint
func (s *ChatTestSuite) TestGetChats() {
	tests := []TableDrivenTestCase{
		{
			Name: "Get chats for user with multiple conversations",
			Setup: func(f *TestFixture) error {
				f.SetUserID(2001)
				if _, err := f.TestDB.CreateTestUserProfile(2001, "User 1"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(2002, "User 2"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(2003, "User 3"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestChat(2001, 2002); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestChat(2001, 2003)
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/chats")
				s.Require().NoError(err)
				s.Require().Equal(200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)

				unarchived, ok := result["unarchived"].([]any)
				s.Require().True(ok, "expected unarchived array in response")
				s.Require().NotEmpty(unarchived, "expected chats in response")
				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Get chats returns empty array when no chats",
			Setup: func(f *TestFixture) error {
				f.SetUserID(2010)
				_, err := f.TestDB.CreateTestUserProfile(2010, "User 10")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.GET("/api/chats")
				s.Require().NoError(err)
				s.Require().Equal(200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				s.Require().NoError(err)

				unarchived, ok := result["unarchived"].([]any)
				s.Require().True(ok, "expected unarchived array in response")
				s.Require().Empty(unarchived, "expected empty unarchived array")
				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		s.Run(tt.Name, func() {
			fixture := NewTestFixture(s.T(), s.DB, s.HTTPServerAddr, s.AuthServiceMock)
			fixture.Setup()

			err := tt.Setup(fixture)
			s.Require().NoError(err, "setup failed")

			err = tt.Test(fixture)
			if tt.ExpectError {
				s.Require().Error(err)
			} else {
				s.Require().NoError(err)
			}

			if tt.Verify != nil {
				if err := tt.Verify(fixture); err != nil {
					s.T().Errorf("verification failed: %v", err)
				}
			}
		})
	}
}

// TestPinChat tests the PATCH /api/chats/{id}/pin endpoint
func (s *ChatTestSuite) TestPinChat() {
	tests := []TableDrivenTestCase{
		{
			Name: "Pin chat successfully",
			Setup: func(f *TestFixture) error {
				if _, err := f.TestDB.CreateTestUserProfile(2101, "User 1"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(2102, "User 2"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestChat(2101, 2102)
				f.SetUserID(2101)
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.PATCH("/api/chats/2102/pin", nil)
				s.Require().NoError(err)
				s.Require().Equal(204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2101, 2102)
				s.Require().NoError(err)
				s.Require().True(chat.Pinned, "expected chat to be pinned")
				return nil
			},
			ExpectError: false,
		},
		{
			Name: "Pin non-existent chat returns error",
			Setup: func(f *TestFixture) error {
				f.SetUserID(2111)
				_, err := f.TestDB.CreateTestUserProfile(2111, "User 11")
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.PATCH("/api/chats/99999/pin", nil)
				s.Require().NoError(err)
				s.Require().Greater(resp.StatusCode, 399, "expected error status")
				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		s.Run(tt.Name, func() {
			fixture := NewTestFixture(s.T(), s.DB, s.HTTPServerAddr, s.AuthServiceMock)
			fixture.Setup()

			err := tt.Setup(fixture)
			s.Require().NoError(err, "setup failed")

			err = tt.Test(fixture)
			if tt.ExpectError {
				s.Require().Error(err)
			} else {
				s.Require().NoError(err)
			}

			if tt.Verify != nil {
				err = tt.Verify(fixture)
				s.Require().NoError(err, "verification failed")
			}
		})
	}
}

// TestUnpinChat tests the PATCH /api/chats/{id}/unpin endpoint
func (s *ChatTestSuite) TestUnpinChat() {
	tests := []TableDrivenTestCase{
		{
			Name: "Unpin pinned chat successfully",
			Setup: func(f *TestFixture) error {
				if _, err := f.TestDB.CreateTestUserProfile(2501, "User 1"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(2502, "User 2"); err != nil {
					return err
				}
				chat, err := f.TestDB.CreateTestChat(2501, 2502)
				if err != nil {
					return err
				}
				chat.Pinned = true
				if err := f.TestDB.ChatRepo.Update(f.Ctx, chat); err != nil {
					return err
				}
				f.SetUserID(2501)
				return nil
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.PATCH("/api/chats/2502/unpin", nil)
				s.Require().NoError(err)
				s.Require().Equal(204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2501, 2502)
				s.Require().NoError(err)
				s.Require().False(chat.Pinned, "expected chat to be unpinned")
				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		s.Run(tt.Name, func() {
			fixture := NewTestFixture(s.T(), s.DB, s.HTTPServerAddr, s.AuthServiceMock)
			fixture.Setup()

			err := tt.Setup(fixture)
			s.Require().NoError(err, "setup failed")

			err = tt.Test(fixture)
			if tt.ExpectError {
				s.Require().Error(err)
			} else {
				s.Require().NoError(err)
			}

			if tt.Verify != nil {
				err = tt.Verify(fixture)
				s.Require().NoError(err, "verification failed")
			}
		})
	}
}

// TestArchiveChat tests the PATCH /api/chats/{id}/archive endpoint
func (s *ChatTestSuite) TestArchiveChat() {
	tests := []TableDrivenTestCase{
		{
			Name: "Archive chat successfully and verify pin is removed",
			Setup: func(f *TestFixture) error {
				if _, err := f.TestDB.CreateTestUserProfile(2201, "User 1"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(2202, "User 2"); err != nil {
					return err
				}
				chat, err := f.TestDB.CreateTestChat(2201, 2202)
				if err != nil {
					return err
				}
				chat.Pinned = true
				if err := f.TestDB.ChatRepo.Update(f.Ctx, chat); err != nil {
					return err
				}
				f.SetUserID(2201)
				return nil
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.PATCH("/api/chats/2202/archive", nil)
				s.Require().NoError(err)
				s.Require().Equal(204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2201, 2202)
				s.Require().NoError(err)
				s.Require().True(chat.Archived, "expected chat to be archived")
				s.Require().False(chat.Pinned, "expected pin to be removed when archiving")
				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		s.Run(tt.Name, func() {
			fixture := NewTestFixture(s.T(), s.DB, s.HTTPServerAddr, s.AuthServiceMock)
			fixture.Setup()

			err := tt.Setup(fixture)
			s.Require().NoError(err, "setup failed")

			err = tt.Test(fixture)
			if tt.ExpectError {
				s.Require().Error(err)
			} else {
				s.Require().NoError(err)
			}

			if tt.Verify != nil {
				err = tt.Verify(fixture)
				s.Require().NoError(err, "verification failed")
			}
		})
	}
}

// TestUnarchiveChat tests the PATCH /api/chats/{id}/unarchive endpoint
func (s *ChatTestSuite) TestUnarchiveChat() {
	tests := []TableDrivenTestCase{
		{
			Name: "Unarchive archived chat successfully",
			Setup: func(f *TestFixture) error {
				if _, err := f.TestDB.CreateTestUserProfile(2601, "User 1"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(2602, "User 2"); err != nil {
					return err
				}
				chat, err := f.TestDB.CreateTestChat(2601, 2602)
				if err != nil {
					return err
				}
				chat.Archived = true
				if err := f.TestDB.ChatRepo.Update(f.Ctx, chat); err != nil {
					return err
				}
				f.SetUserID(2601)
				return nil
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.PATCH("/api/chats/2602/unarchive", nil)
				s.Require().NoError(err)
				s.Require().Equal(204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2601, 2602)
				s.Require().NoError(err)
				s.Require().False(chat.Archived, "expected chat to be unarchived")
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

// TestDeleteChat tests the DELETE /api/chats/{id}/delete endpoint
func (s *ChatTestSuite) TestDeleteChat() {
	tests := []TableDrivenTestCase{
		{
			Name: "Delete chat successfully",
			Setup: func(f *TestFixture) error {
				if _, err := f.TestDB.CreateTestUserProfile(2301, "User 1"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(2302, "User 2"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestChat(2301, 2302)
				f.SetUserID(2301)
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.DELETE("/api/chats/2302/delete")
				s.Require().NoError(err)
				s.Require().Equal(204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2301, 2302)
				s.Require().True(chat == nil || err != nil, "expected chat to be deleted or not found")
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

// TestClearChat tests the DELETE /api/chats/{id}/clear endpoint
func (s *ChatTestSuite) TestClearChat() {
	tests := []TableDrivenTestCase{
		{
			Name: "Clear chat message history successfully",
			Setup: func(f *TestFixture) error {
				if _, err := f.TestDB.CreateTestUserProfile(2401, "User 1"); err != nil {
					return err
				}
				if _, err := f.TestDB.CreateTestUserProfile(2402, "User 2"); err != nil {
					return err
				}
				_, err := f.TestDB.CreateTestChat(2401, 2402)
				f.SetUserID(2401)
				return err
			},
			Test: func(f *TestFixture) error {
				resp, err := f.HTTPClient.DELETE("/api/chats/2402/clear")
				s.Require().NoError(err)
				s.Require().Equal(204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2401, 2402)
				s.Require().NoError(err)
				s.Require().NotNil(chat.ClearedAt, "expected ClearedAt to be set")
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

// TestChatService runs all chat tests
func TestChatService(t *testing.T) {
	suite.Run(t, new(ChatTestSuite))
}
