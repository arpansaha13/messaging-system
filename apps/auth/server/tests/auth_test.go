package tests

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/arpansaha13/messaging-system/packages/goauthkit"
	"github.com/stretchr/testify/suite"
)

func TestAuthSuite(t *testing.T) {
	suite.Run(t, new(AuthTestSuite))
}

func (s *AuthTestSuite) TestAuthFlows() {
	testCases := []TableDrivenTestCase{
		{
			Name: "Full Auth Flow",
			Test: func(f *TestFixture) error {
				email := "test@example.com"
				password := "Password123!"

				// 1. Signup
				signupPayload := map[string]string{
					"email":           email,
					"password":        password,
					"confirmPassword": password,
					"globalName":      "Test User",
				}
				resp, err := f.HTTPClient.POST("/api/auth/signup", signupPayload)
				s.Require().NoError(err)
				s.Require().Equal(http.StatusCreated, resp.StatusCode)

				var signupResp struct {
					Message string `json:"message"`
					OtpHash string `json:"otpHash"`
				}
				err = json.NewDecoder(resp.Body).Decode(&signupResp)
				resp.Body.Close()
				s.Require().NoError(err)
				s.Require().NotEmpty(signupResp.OtpHash)

				// Wait for email to be processed (it's async)
				time.Sleep(1 * time.Second)

				// Get OTP code from mock email provider
				mockEmailProvider, ok := f.Deps.EmailProvider.(*goauthkit.MockEmailProvider)
				s.Require().True(ok, "EmailProvider should be MockEmailProvider")
				emails := mockEmailProvider.GetSentEmails()
				s.Require().NotEmpty(emails)

				var otpCode string
				for _, e := range emails {
					if e.To == email {
						parts := strings.Split(e.Body, ": ")
						if len(parts) > 1 {
							otpCode = parts[1][:6]
							break
						}
					}
				}
				s.Require().NotEmpty(otpCode)

				// 2. Verify OTP
				verifyPayload := map[string]string{
					"otpHash": signupResp.OtpHash,
					"code":    otpCode,
				}
				resp, err = f.HTTPClient.POST("/api/auth/verify/"+signupResp.OtpHash, verifyPayload)
				s.Require().NoError(err)
				s.Require().Equal(http.StatusOK, resp.StatusCode)

				var verifyResp struct {
					Message  string `json:"message"`
					Username string `json:"username"`
				}
				err = json.NewDecoder(resp.Body).Decode(&verifyResp)
				resp.Body.Close()
				s.Require().NoError(err)
				s.Require().NotEmpty(verifyResp.Username)

				// Check if user is verified in DB
				var verified bool
				f.DB.Table("users").Select("verified").Where("email = ?", email).Scan(&verified)
				s.Require().True(verified)

				// 3. Login
				loginPayload := map[string]string{
					"email":    email,
					"password": password,
				}
				resp, err = f.HTTPClient.POST("/api/auth/login", loginPayload)
				s.Require().NoError(err)
				s.Require().Equal(http.StatusOK, resp.StatusCode)

				// Check cookie
				cookies := resp.Cookies()
				var authCookie *http.Cookie
				for _, c := range cookies {
					if c.Name == os.Getenv("AUTH_COOKIE_NAME") {
						authCookie = c
						break
					}
				}
				s.Require().NotNil(authCookie)
				resp.Body.Close()

				// 4. Logout
				resp, err = f.HTTPClient.POSTWithCookie("/api/auth/logout", nil, authCookie)
				s.Require().NoError(err)
				s.Require().Equal(http.StatusOK, resp.StatusCode)
				resp.Body.Close()
				return nil
			},
		},
		{
			Name: "Login and Logout",
			Test: func(f *TestFixture) error {
				email := "login@example.com"
				password := "Password123!"

				// Manually create a verified user via signup and DB update
				signupPayload := map[string]string{
					"email":           email,
					"password":        password,
					"confirmPassword": password,
					"globalName":      "Test User",
				}
				resp, err := f.HTTPClient.POST("/api/auth/signup", signupPayload)
				s.Require().NoError(err)
				s.Require().Equal(http.StatusCreated, resp.StatusCode)
				resp.Body.Close()

				f.DB.Exec("UPDATE users SET verified = true WHERE email = ?", email)

				// Ensure user exists and is verified
				var count int64
				f.DB.Table("users").Where("email = ? AND verified = true", email).Count(&count)
				s.Require().Equal(int64(1), count)

				// 2. Login
				loginPayload := map[string]string{
					"email":    email,
					"password": password,
				}
				resp, err = f.HTTPClient.POST("/api/auth/login", loginPayload)
				s.Require().NoError(err)
				s.Require().Equal(http.StatusOK, resp.StatusCode)

				// Check cookie
				cookies := resp.Cookies()
				var authCookie *http.Cookie
				for _, c := range cookies {
					if c.Name == os.Getenv("AUTH_COOKIE_NAME") {
						authCookie = c
						break
					}
				}
				s.Require().NotNil(authCookie)
				resp.Body.Close()

				// 3. Logout
				resp, err = f.HTTPClient.POSTWithCookie("/api/auth/logout", nil, authCookie)
				s.Require().NoError(err)
				s.Require().Equal(http.StatusOK, resp.StatusCode)

				// Check cookie is cleared
				cookies = resp.Cookies()
				var cleared bool
				for _, c := range cookies {
					if c.Name == os.Getenv("AUTH_COOKIE_NAME") && (c.Value == "" || c.MaxAge < 0) {
						cleared = true
						break
					}
				}
				s.Require().True(cleared)
				resp.Body.Close()
				return nil
			},
		},
	}

	for _, tc := range testCases {
		s.Run(tc.Name, func() {
			s.SetupTest() // Reuse cleanup from SetupTest
			if tc.Setup != nil {
				s.Require().NoError(tc.Setup(s.Fixture))
			}
			s.Require().NoError(tc.Test(s.Fixture))
			if tc.Verify != nil {
				s.Require().NoError(tc.Verify(s.Fixture))
			}
		})
	}
}
