package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
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
		log := logger.FromContext(r.Context())
		log.Debug("signup request handler called")

		var req dto.SignupRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body for signup", zap.Error(err))
			return &gotoolkit.ValidationError{Message: "invalid request body"}
		}

		// Validate input
		if req.Email == "" || req.Password == "" {
			log.Warn("signup validation failed", zap.String("email", req.Email))
			return &gotoolkit.ValidationError{Message: "email and password are required"}
		}

		log.Debug("signup validation passed", zap.String("email", req.Email))

		// Call auth service to signup
		signupResp, err := authServiceClient.Signup(r.Context(), req.Email, req.Password)
		if err != nil {
			// Check error message for specific error types
			errMsg := err.Error()
			if strings.Contains(errMsg, "already exists") || strings.Contains(errMsg, "conflict") {
				log.Warn("signup conflict", zap.String("email", req.Email))
				return &gotoolkit.ConflictError{Message: "email already registered"}
			}
			if strings.Contains(errMsg, "validation") {
				log.Warn("signup validation error", zap.String("email", req.Email), zap.Error(err))
				return &gotoolkit.ValidationError{Message: errMsg}
			}
			log.Error("signup service failed", zap.String("email", req.Email), zap.Error(err))
			return &gotoolkit.InternalError{Message: "signup failed", Err: err}
		}

		log.Info("signup successful", zap.String("email", req.Email))

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
		log := logger.FromContext(r.Context())
		log.Debug("login request handler called")

		var req dto.LoginRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body for login", zap.Error(err))
			return &gotoolkit.ValidationError{Message: "invalid request body"}
		}

		// Validate input
		if req.Email == "" || req.Password == "" {
			log.Warn("login validation failed", zap.String("email", req.Email))
			return &gotoolkit.ValidationError{Message: "email and password are required"}
		}

		log.Debug("login validation passed", zap.String("email", req.Email))

		// Call auth service to login
		loginResp, err := authServiceClient.Login(r.Context(), req.Email, req.Password)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "unauthorized") || strings.Contains(errMsg, "not verified") {
				log.Warn("login unauthorized", zap.String("email", req.Email))
				return &gotoolkit.UnauthorizedError{Message: "invalid email or password"}
			}
			if strings.Contains(errMsg, "validation") {
				log.Warn("login validation error", zap.String("email", req.Email), zap.Error(err))
				return &gotoolkit.ValidationError{Message: errMsg}
			}
			log.Error("login service failed", zap.String("email", req.Email), zap.Error(err))
			return &gotoolkit.InternalError{Message: "login failed", Err: err}
		}

		log.Info("login successful", zap.String("email", req.Email))

		// Calculate cookie max age in seconds
		maxAge := 30 * 60 // 30 minutes default
		if loginResp.ExpiresAt != nil {
			expiresAtMs := loginResp.ExpiresAt.AsTime().UnixMilli()
			nowMs := int64(0) // Will be set by system
			maxAge = max(int((expiresAtMs-nowMs)/1000), 0)
		}

		cfg, err := config.Load()
		if err != nil {
			log.Error("failed to load config", zap.Error(err))
			return &gotoolkit.InternalError{Message: "failed to load config", Err: err}
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
		log := logger.FromContext(r.Context())
		log.Debug("verify otp handler called")

		vars := mux.Vars(r)
		otpHash := vars["otpHash"]

		var req dto.VerifyOTPRequestDTO

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Warn("invalid request body for verify otp", zap.Error(err))
			return &gotoolkit.ValidationError{Message: "invalid request body"}
		}

		// Validate input
		if otpHash == "" || req.Code == "" {
			log.Warn("verify otp validation failed", zap.String("otp_hash", otpHash), zap.String("code", req.Code))
			return &gotoolkit.ValidationError{Message: "otp hash and code are required"}
		}

		log.Debug("verifying otp", zap.String("otp_hash", otpHash))

		// Call auth service to verify OTP
		verifyResp, err := authServiceClient.VerifyOTP(r.Context(), otpHash, req.Code)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "invalid") || strings.Contains(errMsg, "expired") {
				log.Warn("verify otp invalid or expired", zap.String("otp_hash", otpHash))
				return &gotoolkit.UnauthorizedError{Message: "invalid or expired otp code"}
			}
			if strings.Contains(errMsg, "not found") {
				log.Warn("verify otp not found", zap.String("otp_hash", otpHash))
				return &gotoolkit.NotFoundError{Message: "otp not found"}
			}
			if strings.Contains(errMsg, "validation") {
				log.Warn("verify otp validation error", zap.String("otp_hash", otpHash), zap.Error(err))
				return &gotoolkit.ValidationError{Message: errMsg}
			}
			log.Error("verify otp service failed", zap.String("otp_hash", otpHash), zap.Error(err))
			return &gotoolkit.InternalError{Message: "verification failed", Err: err}
		}

		log.Info("otp verified successfully", zap.String("otp_hash", otpHash))

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
		log := logger.FromContext(r.Context())
		log.Debug("logout handler called")

		// Get the session token from the cookie
		cfg, err := config.Load()
		if err != nil {
			log.Error("failed to load config", zap.Error(err))
			return &gotoolkit.InternalError{Message: "failed to load config", Err: err}
		}

		cookie, err := r.Cookie(cfg.AuthCookieName)
		if err != nil {
			log.Warn("no session cookie found in logout request")
			return &gotoolkit.UnauthorizedError{Message: "no session token found"}
		}

		sessionToken := cookie.Value

		log.Debug("logging out user")

		// Call auth service to logout
		_, err = authServiceClient.Logout(r.Context(), sessionToken)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") || strings.Contains(errMsg, "invalid") {
				log.Warn("logout failed: invalid or expired session")
				return &gotoolkit.UnauthorizedError{Message: "invalid or expired session"}
			}
			log.Error("logout service failed", zap.Error(err))
			return &gotoolkit.InternalError{Message: "logout failed", Err: err}
		}

		log.Info("user logged out successfully")

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
