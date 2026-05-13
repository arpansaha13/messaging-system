package app

import (
	"net/http"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/broker"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/cache"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/service"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/store"
	"github.com/arpansaha13/messaging-system/apps/socket/internal/ws"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// Deps contains all dependencies needed to assemble the socket server.
type Deps struct {
	Logger           *zap.Logger
	Hub              *ws.Hub
	ChatBroker       broker.ChatBroker
	ChatsStore       *store.ChatsStore
	MemcachedService *cache.MemcachedService
	// GroupHandlers is created in main before SetupChatBroker (consumer callbacks need it).
	GroupHandlers *ws.GroupHandlers
	AuthClient    service.IAuthServiceClient
	ClientDomain  string
}

// SetupRouter assembles all WebSocket components and returns a configured router.
func SetupRouter(deps Deps) *mux.Router {
	log := deps.Logger

	// Create WebSocket upgrader
	upgrader := ws.NewUpgrader(deps.ClientDomain)

	// PersonalHandlers is wired here from injected deps
	personalHandlers := ws.NewPersonalHandlers(
		deps.ChatsStore,
		deps.MemcachedService,
		deps.ChatBroker,
		deps.Hub,
		log,
	)

	// Build message dispatcher
	dispatch := ws.BuildDispatcher(personalHandlers, deps.GroupHandlers, log)

	// Setup HTTP router
	router := mux.NewRouter()

	// Apply middlewares
	router.Use(gtk.HttpRecoveryMiddleware)
	router.Use(gtk.HttpLoggerMiddleware(log))
	router.Use(gtk.HttpErrorMiddleware)

	// All socket routes are under the /ws prefix
	wsRouter := router.PathPrefix("/ws").Subrouter()

	// Liveness probe — no auth, no dependencies
	wsRouter.HandleFunc("/livez", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}).Methods(http.MethodGet)

	// Protected sub-router — requires valid session
	protectedRouter := wsRouter.PathPrefix("").Subrouter()
	protectedRouter.Use(middleware.AuthMiddleware(deps.AuthClient))

	// WebSocket endpoint
	protectedRouter.HandleFunc("/socket", func(w http.ResponseWriter, r *http.Request) {
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

	return router
}
