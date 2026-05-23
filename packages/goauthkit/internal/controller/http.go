package controller

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/utils"
	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/gorilla/mux"
)

// CookieConfig holds settings for session cookies
type CookieConfig struct {
	Name     string
	Domain   string
	Path     string
	Secure   bool
	HttpOnly bool
	SameSite http.SameSite
}

// NewSignupController returns a controller for user registration
func NewSignupController(authService service.IAuthService, validator *utils.Validator) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		var payload utils.SignupPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			return nil, &gtk.ValidationError{Message: "invalid request body", Field: "body"}
		}

		if err := validator.Validate(payload); err != nil {
			return nil, &gtk.ValidationError{Message: err.Error()}
		}

		req := service.SignupRequest{
			Email:      payload.Email,
			Password:   payload.Password,
			GlobalName: payload.GlobalName,
		}

		resp, err := authService.Signup(r.Context(), req)
		if err != nil {
			return nil, err
		}

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body:       resp,
		}, nil
	}
}

// NewLoginController returns a controller for user login
func NewLoginController(authService service.IAuthService, validator *utils.Validator, cookieConfig CookieConfig) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		var payload utils.LoginPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			return nil, &gtk.ValidationError{Message: "invalid request body", Field: "body"}
		}

		if err := validator.Validate(payload); err != nil {
			return nil, &gtk.ValidationError{Message: err.Error()}
		}

		req := service.LoginRequest{
			Email:    payload.Email,
			Password: payload.Password,
		}

		resp, err := authService.Login(r.Context(), req)
		if err != nil {
			return nil, err
		}

		setSessionCookie(w, cookieConfig, resp.SessionToken, resp.ExpiresAt)

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       resp,
		}, nil
	}
}

// NewVerifyOTPController returns a controller for OTP verification
func NewVerifyOTPController(authService service.IAuthService, validator *utils.Validator, cookieConfig CookieConfig) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		var payload utils.VerifyOTPPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			return nil, &gtk.ValidationError{Message: "invalid request body", Field: "body"}
		}

		if err := validator.Validate(payload); err != nil {
			// If validation failed, check if hash is in URL params
			vars := mux.Vars(r)
			if vars["otpHash"] != "" {
				payload.OTPHash = vars["otpHash"]
				// Re-validate
				if err := validator.Validate(payload); err != nil {
					return nil, &gtk.ValidationError{Message: err.Error()}
				}
			} else {
				return nil, &gtk.ValidationError{Message: err.Error()}
			}
		}

		req := service.VerifyOTPRequest{
			OTPHash: payload.OTPHash,
			Code:    payload.Code,
		}

		resp, err := authService.VerifyOTP(r.Context(), req)
		if err != nil {
			return nil, err
		}

		setSessionCookie(w, cookieConfig, resp.SessionToken, resp.ExpiresAt)

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       resp,
		}, nil
	}
}

// NewLogoutController returns a controller for user logout
func NewLogoutController(authService service.IAuthService, cookieConfig CookieConfig) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		// Token is extracted by middleware and put into context
		token, ok := r.Context().Value("authorization").(string)
		if !ok || token == "" {
			return nil, &gtk.UnauthorizedError{Message: "missing authorization token"}
		}

		req := service.LogoutRequest{
			Token: token,
		}

		resp, err := authService.Logout(r.Context(), req)
		if err != nil {
			return nil, err
		}

		// Clear cookie
		clearSessionCookie(w, cookieConfig)

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body:       resp,
		}, nil
	}
}

func setSessionCookie(w http.ResponseWriter, cfg CookieConfig, token string, expiresAt time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     cfg.Name,
		Value:    token,
		Path:     cfg.Path,
		Domain:   cfg.Domain,
		Expires:  expiresAt,
		Secure:   cfg.Secure,
		HttpOnly: cfg.HttpOnly,
		SameSite: cfg.SameSite,
	})
}

func clearSessionCookie(w http.ResponseWriter, cfg CookieConfig) {
	http.SetCookie(w, &http.Cookie{
		Name:     cfg.Name,
		Value:    "",
		Path:     cfg.Path,
		Domain:   cfg.Domain,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		Secure:   cfg.Secure,
		HttpOnly: cfg.HttpOnly,
		SameSite: cfg.SameSite,
	})
}
