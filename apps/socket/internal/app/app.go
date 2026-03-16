package app

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/cache"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/service"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/store"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/ws"
)

// Deps contains all dependencies needed to assemble the socket server.
type Deps struct {
	Logger           *zap.Logger
	Hub              *ws.Hub
	RabbitBroker     *broker.RabbitMQBroker
	ChatsStore       *store.ChatsStore
	MemcachedService *cache.MemcachedService
	// GroupHandlers is created in main before setupRabbitMQ (consumer callbacks need it).
	GroupHandlers *ws.GroupHandlers
	AuthClient    service.IAuthServiceClient
	ClientDomain  string
	Port          int
}

// New assembles all WebSocket components and returns a configured HTTP server.
func New(deps Deps) *http.Server {
	log := deps.Logger

	// Create WebSocket upgrader
	upgrader := ws.NewUpgrader(deps.ClientDomain)

	// PersonalHandlers is wired here from injected deps
	personalHandlers := ws.NewPersonalHandlers(
		deps.ChatsStore,
		deps.MemcachedService,
		deps.RabbitBroker,
		deps.Hub,
		log,
	)

	// Build message dispatcher
	dispatch := ws.BuildDispatcher(personalHandlers, deps.GroupHandlers, log)

	// Setup HTTP router
	router := mux.NewRouter()

	// Apply middlewares
	router.Use(gotoolkit.HttpRecoveryMiddleware)
	router.Use(logger.HttpMiddleware(log))
	router.Use(gotoolkit.HttpErrorMiddleware)

	// Liveness probe — no auth, no dependencies
	router.HandleFunc("/ws/livez", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}).Methods(http.MethodGet)

	// Protected sub-router — requires valid session
	protectedRouter := router.PathPrefix("").Subrouter()
	protectedRouter.Use(middleware.AuthMiddleware(deps.AuthClient))

	// WebSocket endpoint
	protectedRouter.HandleFunc("/ws/socket", func(w http.ResponseWriter, r *http.Request) {
		log.Debug("WebSocket connection request", zap.String("remote_addr", r.RemoteAddr))
		ws.ServeWs(
			deps.Hub,
			deps.ChatsStore,
			dispatch,
			personalHandlers.HandleConnect,
			personalHandlers.HandleDisconnect,
			upgrader,
			log,
			w,
			r,
		)
	}).Methods(http.MethodGet)

	// Create HTTP server
	httpServer := &http.Server{
		Addr:         fmt.Sprintf(":%d", deps.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return httpServer
}
