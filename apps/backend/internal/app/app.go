package app

import (
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/gotoolkit/logger"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/handler"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/internal/service"
)

// Deps contains all dependencies needed to assemble the server
type Deps struct {
	DB          *gorm.DB
	RabbitMQ    *service.RabbitMQService // nil-safe: message service guards nil channel internally
	AuthClient  service.IAuthServiceClient
	Circuits    *circuits.Circuits
	Logger      *zap.Logger
	ServiceName string
	Addr        string
}

// New assembles all components and returns a configured HTTP server
func New(deps Deps) *http.Server {
	// Initialize repositories
	userRepo := repository.NewUserRepository(deps.DB, deps.Circuits.Postgres)
	messageRepo := repository.NewMessageRepository(deps.DB, deps.Circuits.Postgres)
	chatRepo := repository.NewChatRepository(deps.DB, deps.Circuits.Postgres)
	channelRepo := repository.NewChannelRepository(deps.DB, deps.Circuits.Postgres)
	contactRepo := repository.NewContactRepository(deps.DB, deps.Circuits.Postgres)
	groupRepo := repository.NewGroupRepository(deps.DB, deps.Circuits.Postgres)
	inviteRepo := repository.NewInviteRepository(deps.DB, deps.Circuits.Postgres)
	userGroupRepo := repository.NewUserGroupRepository(deps.DB, deps.Circuits.Postgres)
	messageRecipientRepo := repository.NewMessageRecipientRepository(deps.DB, deps.Circuits.Postgres)

	// Initialize services
	userService := service.NewUserService(userRepo, contactRepo)
	chatService := service.NewChatService(chatRepo, messageRepo)
	messageService := service.NewMessageService(messageRepo, messageRecipientRepo, chatRepo, deps.RabbitMQ)
	channelService := service.NewChannelService(channelRepo, groupRepo)
	contactService := service.NewContactService(contactRepo, userRepo)
	groupService := service.NewGroupService(groupRepo, userGroupRepo, userRepo)
	inviteService := service.NewInviteService(inviteRepo, groupRepo, userGroupRepo, channelRepo)
	userGroupService := service.NewUserGroupService(userGroupRepo, userRepo, groupRepo)

	// Setup HTTP router
	router := mux.NewRouter()

	// Apply middlewares
	router.Use(gotoolkit.HttpRecoveryMiddleware)
	router.Use(logger.HttpMiddleware(deps.Logger))
	router.Use(gotoolkit.HttpErrorMiddleware)

	// Authentication middleware for protected routes
	protectedRouter := router.PathPrefix("").Subrouter()
	protectedRouter.Use(middleware.AuthMiddleware(deps.AuthClient))

	// Liveness probe — no auth, no dependencies
	router.HandleFunc("/livez", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}).Methods(http.MethodGet)

	// Setup routes - user group routes must be registered before user routes
	// to ensure /api/users/groups matches before /api/users/{id}
	handler.SetupAuthRoutes(router, deps.AuthClient)
	handler.SetupAuthProtectedRoutes(protectedRouter, deps.AuthClient)
	handler.SetupUserGroupRoutes(router, protectedRouter, userGroupService)
	handler.SetupUserRoutes(router, protectedRouter, userService)
	handler.SetupMessageRoutes(router, protectedRouter, messageService)
	handler.SetupChatRoutes(router, protectedRouter, chatService)
	handler.SetupChannelRoutes(router, protectedRouter, channelService)
	handler.SetupContactRoutes(router, protectedRouter, contactService)
	handler.SetupGroupRoutes(router, protectedRouter, groupService)
	handler.SetupInviteRoutes(router, protectedRouter, inviteService)

	// Create HTTP server
	httpHandler := otelhttp.NewHandler(router, deps.ServiceName)
	httpServer := &http.Server{
		Addr:         deps.Addr,
		Handler:      httpHandler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return httpServer
}
