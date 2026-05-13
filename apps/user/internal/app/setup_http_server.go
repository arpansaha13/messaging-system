package app

import (
	"fmt"
	"net/http"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/user/internal/config"
	"github.com/arpansaha13/messaging-system/apps/user/internal/handler"
	"github.com/arpansaha13/messaging-system/apps/user/internal/middleware"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// SetupHTTPServer configures the HTTP server.
func SetupHTTPServer(cfg *config.Config, deps *Dependencies, zapLogger *zap.Logger) *http.Server {
	router := SetupRouter(deps, zapLogger)

	return &http.Server{
		Addr:    ":" + cfg.HTTPPort(),
		Handler: router,
	}
}

// SetupRouter configures the HTTP router.
func SetupRouter(deps *Dependencies, zapLogger *zap.Logger) *mux.Router {
	router := mux.NewRouter()

	// Base middleware
	router.Use(gtk.HttpRecoveryMiddleware)
	router.Use(gtk.HttpLoggerMiddleware(zapLogger))
	router.Use(gtk.HttpErrorMiddleware)

	// Public routes
	router.HandleFunc("/livez", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "OK")
	}).Methods("GET")

	// All user service routes are under the /api prefix
	apiRouter := router.PathPrefix("/api").Subrouter()

	// Protected routes
	protectedRouter := apiRouter.PathPrefix("").Subrouter()
	protectedRouter.Use(middleware.AuthMiddleware(deps.AuthClient))

	handler.SetupUserRoutes(apiRouter, protectedRouter, deps.UserProfileService, deps.ContactRepo)
	handler.SetupContactRoutes(apiRouter, protectedRouter, deps.ContactService)

	return router
}
