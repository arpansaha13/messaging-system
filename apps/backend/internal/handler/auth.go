package handler

import (
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	gtk "github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/config"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/dto"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
	"github.com/arpansaha13/messaging-system/apps/common/constants"
)

// SetupAuthRoutes sets up authentication routes (public, no auth required)
func SetupAuthRoutes(router *mux.Router, authServiceClient service.IAuthServiceClient) {
	router.HandleFunc("/auth/signup", gtk.HttpControllerAdaptor(signupController(authServiceClient))).Methods("POST")
	router.HandleFunc("/auth/login", gtk.HttpControllerAdaptor(loginController(authServiceClient))).Methods("POST")
	router.HandleFunc("/auth/verify/{otpHash}", gtk.HttpControllerAdaptor(verifyOTPController(authServiceClient))).Methods("POST")
}

// SetupAuthProtectedRoutes sets up authenticated auth routes
func SetupAuthProtectedRoutes(protectedRouter *mux.Router, authServiceClient service.IAuthServiceClient) {
	protectedRouter.HandleFunc("/auth/logout", gtk.HttpControllerAdaptor(logoutController(authServiceClient))).Methods("POST")
}

func signupController(authServiceClient service.IAuthServiceClient) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("signup request handler called")

		req, err := dto.NewSignupDTO(r)
		if err != nil {
			log.Warn("failed to parse signup request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("signup validation failed", zap.String("email", req.Email))
			return nil, err
		}

		log.Debug("signup validation passed", zap.String("email", req.Email))

		signupResp, err := authServiceClient.Signup(r.Context(), req.Email, req.Password)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "already exists") || strings.Contains(errMsg, "conflict") {
				log.Warn("signup conflict", zap.String("email", req.Email))
				return nil, &gtk.ConflictError{Message: "email already registered"}
			}
			if strings.Contains(errMsg, "validation") {
				log.Warn("signup validation error", zap.String("email", req.Email), zap.Error(err))
				return nil, &gtk.ValidationError{Message: errMsg}
			}
			log.Error("signup service failed", zap.String("email", req.Email), zap.Error(err))
			return nil, &gtk.InternalError{Message: "signup failed", Err: err}
		}

		log.Info("signup successful", zap.String("email", req.Email))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusCreated,
			Body: dto.SignupResponseDTO{
				Message: signupResp.Message,
				OtpHash: signupResp.OtpHash,
			},
		}, nil
	}
}

func loginController(authServiceClient service.IAuthServiceClient) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("login request handler called")

		req, err := dto.NewLoginDTO(r)
		if err != nil {
			log.Warn("failed to parse login request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("login validation failed", zap.String("email", req.Email))
			return nil, err
		}

		log.Debug("login validation passed", zap.String("email", req.Email))

		loginResp, err := authServiceClient.Login(r.Context(), req.Email, req.Password)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "unauthorized") || strings.Contains(errMsg, "not verified") {
				log.Warn("login unauthorized", zap.String("email", req.Email))
				return nil, &gtk.UnauthorizedError{Message: "invalid email or password"}
			}
			if strings.Contains(errMsg, "validation") {
				log.Warn("login validation error", zap.String("email", req.Email), zap.Error(err))
				return nil, &gtk.ValidationError{Message: errMsg}
			}
			log.Error("login service failed", zap.String("email", req.Email), zap.Error(err))
			return nil, &gtk.InternalError{Message: "login failed", Err: err}
		}

		log.Info("login successful", zap.String("email", req.Email))

		maxAge := 30 * 60 // 30 minutes default
		if loginResp.ExpiresAt != nil {
			expiresAtMs := loginResp.ExpiresAt.AsTime().UnixMilli()
			nowMs := int64(0)
			maxAge = max(int((expiresAtMs-nowMs)/1000), 0)
		}

		cfg, _ := config.Load()

		http.SetCookie(w, &http.Cookie{
			Name:     cfg.AuthCookieName(),
			Value:    loginResp.SessionToken,
			Path:     "/",
			MaxAge:   maxAge,
			HttpOnly: true,
			Secure:   cfg.Environment() == constants.EnvProduction,
			SameSite: http.SameSiteLaxMode,
		})

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.LoginResponseDTO{
				Message: "login successful",
			},
		}, nil
	}
}

func verifyOTPController(authServiceClient service.IAuthServiceClient) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("verify otp handler called")

		req, err := dto.NewVerifyOTPDTO(r)
		if err != nil {
			log.Warn("failed to parse verify otp request", zap.Error(err))
			return nil, err
		}
		if err := req.Validate(); err != nil {
			log.Warn("verify otp validation failed", zap.String("otp_hash", req.OtpHash))
			return nil, err
		}

		log.Debug("verifying otp", zap.String("otp_hash", req.OtpHash))

		verifyResp, err := authServiceClient.VerifyOTP(r.Context(), req.OtpHash, req.Code)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "expired") {
				log.Warn("verify otp expired", zap.String("otp_hash", req.OtpHash))
				return nil, &gtk.UnauthorizedError{Message: "otp expired"}
			}
			if strings.Contains(errMsg, "invalid") {
				log.Warn("verify otp invalid", zap.String("otp_hash", req.OtpHash))
				return nil, &gtk.UnauthorizedError{Message: "invalid otp code"}
			}
			if strings.Contains(errMsg, "not found") {
				log.Warn("verify otp not found", zap.String("otp_hash", req.OtpHash))
				return nil, &gtk.NotFoundError{Message: "otp not found"}
			}
			if strings.Contains(errMsg, "validation") {
				log.Warn("verify otp validation error", zap.String("otp_hash", req.OtpHash), zap.Error(err))
				return nil, &gtk.ValidationError{Message: errMsg}
			}
			log.Error("verify otp service failed", zap.String("otp_hash", req.OtpHash), zap.Error(err))
			return nil, &gtk.InternalError{Message: "verification failed", Err: err}
		}

		log.Info("otp verified successfully", zap.String("otp_hash", req.OtpHash))

		cfg, _ := config.Load()

		http.SetCookie(w, &http.Cookie{
			Name:     cfg.AuthCookieName(),
			Value:    verifyResp.SessionToken,
			Path:     "/",
			MaxAge:   30 * 60,
			HttpOnly: true,
			Secure:   cfg.Environment() == constants.EnvProduction,
			SameSite: http.SameSiteLaxMode,
		})

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: dto.VerifyOTPResponseDTO{
				Message: "verification successful",
			},
		}, nil
	}
}

func logoutController(authServiceClient service.IAuthServiceClient) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		log := logger.FromContext(r.Context())
		log.Debug("logout handler called")

		cfg, _ := config.Load()

		cookie, err := r.Cookie(cfg.AuthCookieName())
		if err != nil || cookie.Value == "" {
			log.Warn("no session cookie found in logout request")
			clearSessionCookie(w)
			return &gtk.ControllerResponse{
				StatusCode: http.StatusOK,
				Body: map[string]string{
					"message": "logout successful",
				},
			}, nil
		}

		sessionToken := cookie.Value

		log.Debug("logging out user")

		_, err = authServiceClient.Logout(r.Context(), sessionToken)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") || strings.Contains(errMsg, "invalid") {
				log.Warn("logout failed: invalid or expired session")
				clearSessionCookie(w)
				return &gtk.ControllerResponse{
					StatusCode: http.StatusOK,
					Body: map[string]string{
						"message": "logout successful",
					},
				}, nil
			}
			log.Error("logout service failed", zap.Error(err))
			clearSessionCookie(w)
			return nil, &gtk.InternalError{Message: "logout failed", Err: err}
		}

		log.Info("user logged out successfully")
		clearSessionCookie(w)

		return &gtk.ControllerResponse{
			StatusCode: http.StatusOK,
			Body: map[string]string{
				"message": "logout successful",
			},
		}, nil
	}
}

func clearSessionCookie(w http.ResponseWriter) {
	cfg, _ := config.Load()
	http.SetCookie(w, &http.Cookie{
		Name:     cfg.AuthCookieName(),
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   cfg.Environment() == constants.EnvProduction,
		SameSite: http.SameSiteLaxMode,
	})
}
