package app

import (
	"net/http"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/circuits"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/handler"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/middleware"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/service"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// Deps contains all dependencies needed to assemble the server
type Deps struct {
	DB         *gorm.DB
	RabbitMQ   *service.RabbitMQService
	AuthClient service.IAuthServiceClient
	Circuits   *circuits.Circuits
	Logger     *zap.Logger
}

// SetupRouter assembles all components and returns a configured router.
func SetupRouter(deps Deps) *mux.Router {
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
	messageService := service.NewMessageService(messageRepo, messageRecipientRepo, chatRepo, userGroupRepo, deps.RabbitMQ, deps.DB, deps.Circuits.Postgres)
	channelService := service.NewChannelService(channelRepo, groupRepo, userGroupRepo)
	contactService := service.NewContactService(contactRepo, userRepo)
	groupService := service.NewGroupService(groupRepo, userGroupRepo, userRepo)
	inviteService := service.NewInviteService(inviteRepo, groupRepo, userGroupRepo, channelRepo)
	userGroupService := service.NewUserGroupService(userGroupRepo, userRepo, groupRepo)

	// Setup HTTP router
	router := mux.NewRouter()

	// Apply middlewares
	router.Use(gtk.HttpRecoveryMiddleware)
	router.Use(gtk.HttpLoggerMiddleware(deps.Logger))
	router.Use(gtk.HttpErrorMiddleware)

	// All backend routes are under the /api prefix
	apiRouter := router.PathPrefix("/api").Subrouter()

	// Authentication middleware for protected routes
	protectedRouter := apiRouter.PathPrefix("").Subrouter()
	protectedRouter.Use(middleware.AuthMiddleware(deps.AuthClient))

	// Liveness probe — no auth, no dependencies
	apiRouter.HandleFunc("/livez", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}).Methods(http.MethodGet)

	// Setup routes - user group routes must be registered before user routes
	// to ensure /users/groups matches before /users/{id}
	handler.SetupAuthRoutes(apiRouter, deps.AuthClient)
	handler.SetupAuthProtectedRoutes(protectedRouter, deps.AuthClient)
	handler.SetupUserGroupRoutes(apiRouter, protectedRouter, userGroupService)
	handler.SetupUserRoutes(apiRouter, protectedRouter, userService)
	handler.SetupMessageRoutes(apiRouter, protectedRouter, messageService)
	handler.SetupChatRoutes(apiRouter, protectedRouter, chatService)
	handler.SetupChannelRoutes(apiRouter, protectedRouter, channelService)
	handler.SetupContactRoutes(apiRouter, protectedRouter, contactService)
	handler.SetupGroupRoutes(apiRouter, protectedRouter, groupService)
	handler.SetupInviteRoutes(apiRouter, protectedRouter, inviteService)

	return router
}
