package app

import (
	"net/http"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/backend/server/internal/broker"
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
	ChatBroker broker.ChatBroker
	AuthClient service.IAuthServiceClient
	UserClient service.IUserServiceClient
	Circuits   *circuits.Circuits
	Logger     *zap.Logger
}

// SetupRouter assembles all components and returns a configured router.
func SetupRouter(deps Deps) *mux.Router {
	// Initialize repositories
	messageRepo := repository.NewMessageRepository(deps.DB, deps.Circuits.Postgres)
	chatRepo := repository.NewChatRepository(deps.DB, deps.Circuits.Postgres)
	channelRepo := repository.NewChannelRepository(deps.DB, deps.Circuits.Postgres)
	groupRepo := repository.NewGroupRepository(deps.DB, deps.Circuits.Postgres)
	inviteRepo := repository.NewInviteRepository(deps.DB, deps.Circuits.Postgres)
	userGroupRepo := repository.NewUserGroupRepository(deps.DB, deps.Circuits.Postgres)
	messageRecipientRepo := repository.NewMessageRecipientRepository(deps.DB, deps.Circuits.Postgres)

	// Initialize services
	chatService := service.NewChatService(chatRepo, messageRepo, deps.UserClient)
	messageService := service.NewMessageService(messageRepo, messageRecipientRepo, chatRepo, userGroupRepo, channelRepo, deps.UserClient, deps.ChatBroker, deps.Circuits.Postgres)
	channelService := service.NewChannelService(channelRepo, groupRepo, userGroupRepo)
	groupService := service.NewGroupService(groupRepo, userGroupRepo, deps.UserClient)
	inviteService := service.NewInviteService(inviteRepo, groupRepo, userGroupRepo, channelRepo)
	userGroupService := service.NewUserGroupService(userGroupRepo, deps.UserClient, groupRepo)

	// Setup HTTP router
	router := mux.NewRouter()

	// Apply middlewares
	router.Use(gtk.HttpTraceMiddleware)
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
	handler.SetupUserGroupRoutes(apiRouter, protectedRouter, userGroupService)
	handler.SetupMessageRoutes(apiRouter, protectedRouter, messageService)
	handler.SetupChatRoutes(apiRouter, protectedRouter, chatService)
	handler.SetupChannelRoutes(apiRouter, protectedRouter, channelService)
	handler.SetupGroupRoutes(apiRouter, protectedRouter, groupService)
	handler.SetupInviteRoutes(apiRouter, protectedRouter, inviteService)

	return router
}
