package app

import (
	"github.com/arpansaha13/messaging-system/apps/user/internal/repository"
	"github.com/arpansaha13/messaging-system/apps/user/internal/service"
)

// Dependencies holds shared dependencies.
type Dependencies struct {
	UserProfileService service.IUserProfileService
	ContactService     service.IContactService
	AuthClient         service.IAuthServiceClient
	ContactRepo        repository.IContactRepository // Needed for some profile handlers
}
