package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"

	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/domain"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
)

// SetupAuthRoutes sets up authentication routes (public, no auth required)
func SetupAuthRoutes(router *mux.Router, authServiceClient service.IAuthServiceClient) {
	router.HandleFunc("/api/auth/signup", AdaptController(signupController(authServiceClient))).Methods("POST")
	router.HandleFunc("/api/auth/login", AdaptController(loginController(authServiceClient))).Methods("POST")
	router.HandleFunc("/api/auth/verify/{otpHash}", AdaptController(verifyOTPController(authServiceClient))).Methods("POST")
}

// SetupAuthProtectedRoutes sets up authenticated auth routes
func SetupAuthProtectedRoutes(protectedRouter *mux.Router, authServiceClient service.IAuthServiceClient) {
	protectedRouter.HandleFunc("/api/auth/logout", AdaptController(logoutController(authServiceClient))).Methods("POST")
}

func signupController(authServiceClient service.IAuthServiceClient) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		var req dto.SignupRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return &domain.ValidationError{Message: "invalid request body"}
		}

		// Validate input
		if req.Email == "" || req.Password == "" {
			return &domain.ValidationError{Message: "email and password are required"}
		}

		// Call auth service to signup
		signupResp, err := authServiceClient.Signup(r.Context(), req.Email, req.Password)
		if err != nil {
			// Check error message for specific error types
			errMsg := err.Error()
			if strings.Contains(errMsg, "already exists") || strings.Contains(errMsg, "conflict") {
				return &domain.ConflictError{Message: "email already registered"}
			}
			if strings.Contains(errMsg, "validation") {
				return &domain.ValidationError{Message: errMsg}
			}
			return &domain.InternalError{Message: "signup failed", Err: err}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		return json.NewEncoder(w).Encode(dto.SignupResponseDTO{
			Message: signupResp.Message,
			OtpHash: signupResp.OtpHash,
		})
	}
}

func loginController(authServiceClient service.IAuthServiceClient) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		var req dto.LoginRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return &domain.ValidationError{Message: "invalid request body"}
		}

		// Validate input
		if req.Email == "" || req.Password == "" {
			return &domain.ValidationError{Message: "email and password are required"}
		}

		// Call auth service to login
		loginResp, err := authServiceClient.Login(r.Context(), req.Email, req.Password)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "unauthorized") || strings.Contains(errMsg, "not verified") {
				return &domain.UnauthorizedError{Message: "invalid email or password"}
			}
			if strings.Contains(errMsg, "validation") {
				return &domain.ValidationError{Message: errMsg}
			}
			return &domain.InternalError{Message: "login failed", Err: err}
		}

		// Calculate cookie max age in seconds
		maxAge := 30 * 60 // 30 minutes default
		if loginResp.ExpiresAt != nil {
			expiresAtMs := loginResp.ExpiresAt.AsTime().UnixMilli()
			nowMs := int64(0) // Will be set by system
			maxAge = int((expiresAtMs - nowMs) / 1000)
			if maxAge < 0 {
				maxAge = 0
			}
		}

		cfg, err := config.Load()
		if err != nil {
			log.Fatalf("failed to load config: %v", err)
		}

		// Set session token as HttpOnly Secure cookie
		http.SetCookie(w, &http.Cookie{
			Name:     cfg.AuthCookieName,
			Value:    loginResp.SessionToken,
			Path:     "/",
			MaxAge:   maxAge,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode, // Using Lax instead of Strict for CORS compatibility
		})

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(dto.LoginResponseDTO{
			Message: "login successful",
		})
	}
}

func verifyOTPController(authServiceClient service.IAuthServiceClient) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		vars := mux.Vars(r)
		otpHash := vars["otpHash"]

		var req dto.VerifyOTPRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return &domain.ValidationError{Message: "invalid request body"}
		}

		// Validate input
		if otpHash == "" || req.Code == "" {
			return &domain.ValidationError{Message: "otp hash and code are required"}
		}

		// Call auth service to verify OTP
		verifyResp, err := authServiceClient.VerifyOTP(r.Context(), otpHash, req.Code)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "invalid") || strings.Contains(errMsg, "expired") {
				return &domain.UnauthorizedError{Message: "invalid or expired otp code"}
			}
			if strings.Contains(errMsg, "not found") {
				return &domain.NotFoundError{Message: "otp not found"}
			}
			if strings.Contains(errMsg, "validation") {
				return &domain.ValidationError{Message: errMsg}
			}
			return &domain.InternalError{Message: "verification failed", Err: err}
		}

		// Get auth cookie name from environment or use default
		authCookieName := "auth_token"

		// Set session token as HttpOnly Secure cookie
		http.SetCookie(w, &http.Cookie{
			Name:     authCookieName,
			Value:    verifyResp.SessionToken,
			Path:     "/",
			MaxAge:   30 * 60, // 30 minutes
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
		})

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(dto.VerifyOTPResponseDTO{
			Message: "verification successful",
		})
	}
}

func logoutController(authServiceClient service.IAuthServiceClient) ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		// Get the session token from the cookie
		cfg, err := config.Load()
		if err != nil {
			log.Fatalf("failed to load config: %v", err)
		}

		cookie, err := r.Cookie(cfg.AuthCookieName)
		if err != nil {
			return &domain.UnauthorizedError{Message: "no session token found"}
		}

		sessionToken := cookie.Value

		// Call auth service to logout
		_, err = authServiceClient.Logout(r.Context(), sessionToken)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") || strings.Contains(errMsg, "invalid") {
				return &domain.UnauthorizedError{Message: "invalid or expired session"}
			}
			return &domain.InternalError{Message: "logout failed", Err: err}
		}

		// Clear the session cookie by setting MaxAge to -1
		http.SetCookie(w, &http.Cookie{
			Name:     cfg.AuthCookieName,
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
		})

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(map[string]string{
			"message": "logout successful",
		})
	}
}
