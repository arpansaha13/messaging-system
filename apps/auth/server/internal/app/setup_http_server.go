package app

import (
	"net/http"

	"github.com/arpansaha13/gotoolkit/gtk"
	goauthkit "github.com/arpansaha13/goauthkit/pkg"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/config"
	"github.com/arpansaha13/messaging-system/apps/common/constants"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// SetupHTTPServer configures the HTTP server for authentication endpoints.
func SetupHTTPServer(deps *Dependencies, zapLogger *zap.Logger) *http.Server {
	cfg, _ := config.Load()

	router := mux.NewRouter()

	// 1. Root middlewares (Same as backend)
	router.Use(gtk.HttpRecoveryMiddleware)
	router.Use(gtk.HttpLoggerMiddleware(zapLogger))
	router.Use(gtk.HttpErrorMiddleware)

	// 2. API subrouter
	apiRouter := router.PathPrefix("/api").Subrouter()

	// 3. Auth subrouter
	authRouter := apiRouter.PathPrefix("/auth").Subrouter()

	cookieConfig := goauthkit.CookieConfig{
		Name:     cfg.AuthCookieName(),
		Path:     "/",
		HttpOnly: true,
		Secure:   cfg.Environment() == constants.EnvProduction,
		SameSite: http.SameSiteLaxMode,
	}

	// 4. Public routes
	authRouter.HandleFunc("/signup", gtk.HttpControllerAdaptor(goauthkit.NewSignupController(deps.AuthService, deps.Validator))).Methods("POST")
	authRouter.HandleFunc("/login", gtk.HttpControllerAdaptor(goauthkit.NewLoginController(deps.AuthService, deps.Validator, cookieConfig))).Methods("POST")
	authRouter.HandleFunc("/verify/{otpHash}", gtk.HttpControllerAdaptor(goauthkit.NewVerifyOTPController(deps.AuthService, deps.Validator, cookieConfig))).Methods("POST")

	// 5. Protected routes (using Logout as example)
	protectedAuthRouter := authRouter.NewRoute().Subrouter()
	protectedAuthRouter.Use(goauthkit.NewAuthMiddleware(deps.AuthService, cfg.AuthCookieName()))
	protectedAuthRouter.HandleFunc("/logout", gtk.HttpControllerAdaptor(goauthkit.NewLogoutController(deps.AuthService, cookieConfig))).Methods("POST")

	return &http.Server{
		Addr:    ":" + cfg.HTTPPort(),
		Handler: router,
	}
}
