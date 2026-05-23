package app

import (
	"github.com/arpansaha13/goauthkit"
	"github.com/arpansaha13/messaging-system/apps/common/pb"
)

// Dependencies holds the shared dependencies for gRPC and HTTP servers.
type Dependencies struct {
	AuthService        goauthkit.IAuthService
	UserProfileClient  pb.UserProfileServiceClient
	Validator          *goauthkit.Validator
	EmailPool          *goauthkit.EmailWorkerPool
	EmailProvider      goauthkit.EmailProvider
}
