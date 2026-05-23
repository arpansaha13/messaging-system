package app

import (
	"net/http"

	"github.com/arpansaha13/messaging-system/packages/goauthkit"
	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/config"
	"github.com/arpansaha13/messaging-system/apps/common/constants"
	"github.com/gorilla/mux"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.uber.org/zap"
)

// SetupHTTPServer configures the HTTP server for authentication endpoints.
func SetupHTTPServer(deps *Dependencies, zapLogger *zap.Logger) *http.Server {
	cfg, _ := config.Load()

	router := mux.NewRouter()

	router.Use(gtk.HttpTraceMiddleware)
	router.Use(gtk.HttpRecoveryMiddleware)
	router.Use(gtk.HttpLoggerMiddleware(zapLogger))
	router.Use(gtk.HttpErrorMiddleware)

	apiRouter := router.PathPrefix("/api").Subrouter()

	authRouter := apiRouter.PathPrefix("/auth").Subrouter()

	cookieConfig := goauthkit.CookieConfig{
		Name:     cfg.AuthCookieName(),
		Path:     "/",
		HttpOnly: true,
		Secure:   cfg.Environment() == constants.EnvProduction,
		SameSite: http.SameSiteLaxMode,
	}

	// Public routes
	authRouter.HandleFunc("/signup", gtk.HttpControllerAdaptor(goauthkit.NewSignupController(deps.AuthService, deps.Validator))).Methods("POST")
	authRouter.HandleFunc("/login", gtk.HttpControllerAdaptor(goauthkit.NewLoginController(deps.AuthService, deps.Validator, cookieConfig))).Methods("POST")
	authRouter.HandleFunc("/verify/{otpHash}", gtk.HttpControllerAdaptor(goauthkit.NewVerifyOTPController(deps.AuthService, deps.Validator, cookieConfig))).Methods("POST")

	// Google OAuth routes
	googleProviderCfg := goauthkit.ProviderConfig{
		ID:           goauthkit.ProviderTypeGoogle,
		ClientID:     cfg.GoogleClientID(),
		ClientSecret: cfg.GoogleClientSecret(),
		RedirectURI:  cfg.GoogleRedirectURI(),
		Scopes:       []string{"openid", "profile", "email"},
		Issuer:       "https://accounts.google.com",
	}

	authRouter.HandleFunc("/google", gtk.HttpControllerAdaptor(goauthkit.NewOAuthLoginController(googleProviderCfg))).Methods("GET")
	authRouter.HandleFunc("/google/callback", gtk.HttpControllerAdaptor(goauthkit.NewOAuthCallbackController(deps.AuthService, googleProviderCfg, cookieConfig))).Methods("GET")

	// 5. Protected routes
	protectedAuthRouter := authRouter.NewRoute().Subrouter()
	protectedAuthRouter.Use(goauthkit.NewAuthMiddleware(deps.AuthService, cfg.AuthCookieName()))
	protectedAuthRouter.HandleFunc("/logout", gtk.HttpControllerAdaptor(goauthkit.NewLogoutController(deps.AuthService, cookieConfig))).Methods("POST")

	return &http.Server{
		Addr:    ":" + cfg.HTTPPort(),
		Handler: otelhttp.NewHandler(router, "auth-http"),
	}
}
