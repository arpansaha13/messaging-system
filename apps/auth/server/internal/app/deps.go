package app

import (
	"github.com/arpansaha13/goauthkit"
)

// Dependencies holds the shared dependencies for gRPC and HTTP servers.
type Dependencies struct {
	AuthService   goauthkit.IAuthService
	Validator     *goauthkit.Validator
	EmailPool     *goauthkit.EmailWorkerPool
	EmailProvider goauthkit.EmailProvider
}
