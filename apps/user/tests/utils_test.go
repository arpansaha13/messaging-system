package tests

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/arpansaha13/goauthkit/pb"
	"github.com/arpansaha13/messaging-system/apps/user/internal/dto"
	"github.com/stretchr/testify/mock"
)

// performRequest performs an HTTP request and returns the response
func (s *BaseTestSuite) performRequest(method, path string, body interface{}, token string) *http.Response {
	var bodyReader io.Reader
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		bodyReader = bytes.NewBuffer(jsonBody)
	}

	req, _ := http.NewRequest(method, s.HTTPServerAddr+path, bodyReader)
	if token != "" {
		req.Header.Set("Cookie", "auth_token="+token)
	}

	resp, err := http.DefaultClient.Do(req)
	s.Require().NoError(err)
	return resp
}

// setupAuthMock sets up the auth mock to return a valid session
func (s *BaseTestSuite) setupAuthMock(token string, userID int64, username, email string) {
	s.AuthMock.On("ValidateSession", mock.Anything, token).Return(&pb.ValidateSessionResponse{
		Valid:  true,
		UserId: userID,
	}, nil).Maybe()

	s.AuthMock.On("GetUser", mock.Anything, userID, token).Return(&pb.GetUserResponse{
		User: &pb.UserData{
			UserId:   userID,
			Username: username,
			Email:    email,
		},
	}, nil).Maybe()
}

func (s *BaseTestSuite) decodeUserProfile(resp *http.Response) dto.UserProfileResponseDTO {
	var profile dto.UserProfileResponseDTO
	err := json.NewDecoder(resp.Body).Decode(&profile)
	s.Require().NoError(err)
	return profile
}

func (s *BaseTestSuite) decodeAuthUser(resp *http.Response) dto.AuthUserResponseDTO {
	var user dto.AuthUserResponseDTO
	err := json.NewDecoder(resp.Body).Decode(&user)
	s.Require().NoError(err)
	return user
}

func (s *BaseTestSuite) decodeContact(resp *http.Response) dto.ContactResponseDTO {
	var contact dto.ContactResponseDTO
	err := json.NewDecoder(resp.Body).Decode(&contact)
	s.Require().NoError(err)
	return contact
}

func (s *BaseTestSuite) decodeContacts(resp *http.Response) []dto.ContactResponseDTO {
	var contacts []dto.ContactResponseDTO
	err := json.NewDecoder(resp.Body).Decode(&contacts)
	s.Require().NoError(err)
	return contacts
}
