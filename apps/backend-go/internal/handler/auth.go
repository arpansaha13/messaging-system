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
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend-go/internal/service"
)

// SetupAuthRoutes sets up authentication routes (public, no auth required)
func SetupAuthRoutes(router *mux.Router, authServiceClient *service.AuthServiceClient) {
	router.HandleFunc("/api/auth/signup", signupHandler(authServiceClient)).Methods("POST")
	router.HandleFunc("/api/auth/login", loginHandler(authServiceClient)).Methods("POST")
	router.HandleFunc("/api/auth/verify/{otpHash}", verifyOTPHandler(authServiceClient)).Methods("POST")
}

func signupHandler(authServiceClient *service.AuthServiceClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.SignupRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		// Validate input
		if req.Email == "" || req.Password == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "email and password are required"})
			return
		}

		// Call auth service to signup
		signupResp, err := authServiceClient.Signup(r.Context(), req.Email, req.Password)
		if err != nil {
			// Check error message for specific error types
			errMsg := err.Error()
			if strings.Contains(errMsg, "already exists") || strings.Contains(errMsg, "conflict") {
				middleware.WriteError(w, &domain.ConflictError{Message: "email already registered"})
				return
			}
			if strings.Contains(errMsg, "validation") {
				middleware.WriteError(w, &domain.ValidationError{Message: errMsg})
				return
			}
			middleware.WriteError(w, &domain.InternalError{Message: "signup failed", Err: err})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(dto.SignupResponseDTO{
			Message: signupResp.Message,
			OtpHash: signupResp.OtpHash,
		})
	}
}

func loginHandler(authServiceClient *service.AuthServiceClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.LoginRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		// Validate input
		if req.Email == "" || req.Password == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "email and password are required"})
			return
		}

		// Call auth service to login
		loginResp, err := authServiceClient.Login(r.Context(), req.Email, req.Password)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "unauthorized") || strings.Contains(errMsg, "not verified") {
				middleware.WriteError(w, &domain.UnauthorizedError{Message: "invalid email or password"})
				return
			}
			if strings.Contains(errMsg, "validation") {
				middleware.WriteError(w, &domain.ValidationError{Message: errMsg})
				return
			}
			middleware.WriteError(w, &domain.InternalError{Message: "login failed", Err: err})
			return
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
		json.NewEncoder(w).Encode(dto.LoginResponseDTO{
			Message: "login successful",
		})
	}
}

func verifyOTPHandler(authServiceClient *service.AuthServiceClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		otpHash := vars["otpHash"]

		var req dto.VerifyOTPRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.WriteError(w, &domain.ValidationError{Message: "invalid request body"})
			return
		}

		// Validate input
		if otpHash == "" || req.Code == "" {
			middleware.WriteError(w, &domain.ValidationError{Message: "otp hash and code are required"})
			return
		}

		// Call auth service to verify OTP
		verifyResp, err := authServiceClient.VerifyOTP(r.Context(), otpHash, req.Code)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "invalid") || strings.Contains(errMsg, "expired") {
				middleware.WriteError(w, &domain.UnauthorizedError{Message: "invalid or expired otp code"})
				return
			}
			if strings.Contains(errMsg, "not found") {
				middleware.WriteError(w, &domain.NotFoundError{Message: "otp not found"})
				return
			}
			if strings.Contains(errMsg, "validation") {
				middleware.WriteError(w, &domain.ValidationError{Message: errMsg})
				return
			}
			middleware.WriteError(w, &domain.InternalError{Message: "verification failed", Err: err})
			return
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
		json.NewEncoder(w).Encode(dto.VerifyOTPResponseDTO{
			Message: "verification successful",
		})
	}
}
