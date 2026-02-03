package tests

import (
	"testing"

	"github.com/stretchr/testify/require"
)

// TestChatGet tests the GET /api/chats endpoint
func TestChatService_GetChats(t *testing.T) {
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
				require.NoError(f.T, err)
				require.Equal(f.T, 200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)

				unarchived, ok := result["unarchived"].([]any)
				require.True(f.T, ok, "expected unarchived array in response")
				require.NotEmpty(f.T, unarchived, "expected chats in response")
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
				require.NoError(f.T, err)
				require.Equal(f.T, 200, resp.StatusCode)

				var result map[string]any
				err = ReadResponseBody(resp, &result)
				require.NoError(f.T, err)

				unarchived, ok := result["unarchived"].([]any)
				require.True(f.T, ok, "expected unarchived array in response")
				require.Empty(f.T, unarchived, "expected empty unarchived array")
				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			fixture := NewTestFixture(t)
			fixture.Setup()

			err := tt.Setup(fixture)
			require.NoError(t, err, "setup failed")

			err = tt.Test(fixture)
			if tt.ExpectError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}

			if tt.Verify != nil {
				if err := tt.Verify(fixture); err != nil {
					t.Errorf("verification failed: %v", err)
				}
			}
		})
	}
}

// TestChatPin tests the PATCH /api/chats/{id}/pin endpoint
func TestChatService_PinChat(t *testing.T) {
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
				require.NoError(f.T, err)
				require.Equal(f.T, 204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2101, 2102)
				require.NoError(f.T, err)
				require.True(f.T, chat.Pinned, "expected chat to be pinned")
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
				require.NoError(f.T, err)
				require.Greater(f.T, resp.StatusCode, 399, "expected error status")
				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			fixture := NewTestFixture(t)
			fixture.Setup()

			err := tt.Setup(fixture)
			require.NoError(t, err, "setup failed")

			err = tt.Test(fixture)
			if tt.ExpectError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}

			if tt.Verify != nil {
				err = tt.Verify(fixture)
				require.NoError(t, err, "verification failed")
			}
		})
	}
}

// TestChatUnpin tests the PATCH /api/chats/{id}/unpin endpoint
func TestChatService_UnpinChat(t *testing.T) {
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
				require.NoError(f.T, err)
				require.Equal(f.T, 204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2501, 2502)
				require.NoError(f.T, err)
				require.False(f.T, chat.Pinned, "expected chat to be unpinned")
				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			fixture := NewTestFixture(t)
			fixture.Setup()

			err := tt.Setup(fixture)
			require.NoError(t, err, "setup failed")

			err = tt.Test(fixture)
			if tt.ExpectError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}

			if tt.Verify != nil {
				err = tt.Verify(fixture)
				require.NoError(t, err, "verification failed")
			}
		})
	}
}

// TestChatArchive tests the PATCH /api/chats/{id}/archive endpoint
func TestChatService_ArchiveChat(t *testing.T) {
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
				require.NoError(f.T, err)
				require.Equal(f.T, 204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2201, 2202)
				require.NoError(f.T, err)
				require.True(f.T, chat.Archived, "expected chat to be archived")
				require.False(f.T, chat.Pinned, "expected pin to be removed when archiving")
				return nil
			},
			ExpectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			fixture := NewTestFixture(t)
			fixture.Setup()

			err := tt.Setup(fixture)
			require.NoError(t, err, "setup failed")

			err = tt.Test(fixture)
			if tt.ExpectError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}

			if tt.Verify != nil {
				err = tt.Verify(fixture)
				require.NoError(t, err, "verification failed")
			}
		})
	}
}

// TestChatUnarchive tests the PATCH /api/chats/{id}/unarchive endpoint
func TestChatService_UnarchiveChat(t *testing.T) {
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
				require.NoError(f.T, err)
				require.Equal(f.T, 204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2601, 2602)
				require.NoError(f.T, err)
				require.False(f.T, chat.Archived, "expected chat to be unarchived")
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

// TestChatDelete tests the DELETE /api/chats/{id}/delete endpoint
func TestChatService_DeleteChat(t *testing.T) {
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
				require.NoError(f.T, err)
				require.Equal(f.T, 204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2301, 2302)
				require.True(f.T, chat == nil || err != nil, "expected chat to be deleted or not found")
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

// TestChatClear tests the DELETE /api/chats/{id}/clear endpoint
func TestChatService_ClearChat(t *testing.T) {
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
				require.NoError(f.T, err)
				require.Equal(f.T, 204, resp.StatusCode)
				return nil
			},
			Verify: func(f *TestFixture) error {
				chat, err := f.TestDB.ChatRepo.GetByUsers(f.Ctx, 2401, 2402)
				require.NoError(f.T, err)
				require.NotNil(f.T, chat.ClearedAt, "expected ClearedAt to be set")
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
