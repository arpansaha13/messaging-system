package controller

import (
	// "context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"

	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/domain"
	"github.com/arpansaha13/messaging-system/packages/goauthkit/internal/service"
	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
)

// ProviderConfig holds configuration for an OAuth2/OIDC provider
type ProviderConfig struct {
	ID           domain.ProviderType
	ClientID     string
	ClientSecret string
	RedirectURI  string
	Scopes       []string
	Issuer       string
}

// NewOAuthLoginController returns a controller that initiates the OAuth flow
func NewOAuthLoginController(providerCfg ProviderConfig) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		ctx := r.Context()
		provider, err := oidc.NewProvider(ctx, providerCfg.Issuer)
		if err != nil {
			return nil, &gtk.InternalError{Message: "failed to initialize oidc provider", Err: err}
		}

		config := &oauth2.Config{
			ClientID:     providerCfg.ClientID,
			ClientSecret: providerCfg.ClientSecret,
			Endpoint:     provider.Endpoint(),
			RedirectURL:  providerCfg.RedirectURI,
			Scopes:       providerCfg.Scopes,
		}

		state, _ := generateRandomString(32)
		nonce, _ := generateRandomString(32)

		// Store state and nonce in cookies
		setSecureCookie(w, "oauth_state", state, 15*time.Minute)
		setSecureCookie(w, "oauth_nonce", nonce, 15*time.Minute)

		authURL := config.AuthCodeURL(state, oidc.Nonce(nonce))

		return &gtk.ControllerResponse{
			StatusCode: http.StatusFound,
			Headers:    map[string]string{"Location": authURL},
		}, nil
	}
}

// NewOAuthCallbackController returns a controller that handles the OAuth callback
func NewOAuthCallbackController(authService service.IAuthService, providerCfg ProviderConfig, cookieConfig CookieConfig) gtk.ControllerFunc {
	return func(w http.ResponseWriter, r *http.Request) (*gtk.ControllerResponse, error) {
		ctx := r.Context()

		// Validate state
		state := r.URL.Query().Get("state")
		storedState, err := r.Cookie("oauth_state")
		if err != nil || state != storedState.Value {
			return nil, &gtk.UnauthorizedError{Message: "invalid oauth state"}
		}

		// Validate nonce
		storedNonce, err := r.Cookie("oauth_nonce")
		if err != nil {
			return nil, &gtk.UnauthorizedError{Message: "missing oauth nonce"}
		}

		code := r.URL.Query().Get("code")
		if code == "" {
			return nil, &gtk.ValidationError{Message: "missing oauth code"}
		}

		provider, err := oidc.NewProvider(ctx, providerCfg.Issuer)
		if err != nil {
			return nil, &gtk.InternalError{Message: "failed to initialize oidc provider", Err: err}
		}

		config := &oauth2.Config{
			ClientID:     providerCfg.ClientID,
			ClientSecret: providerCfg.ClientSecret,
			Endpoint:     provider.Endpoint(),
			RedirectURL:  providerCfg.RedirectURI,
		}

		verifier := provider.Verifier(&oidc.Config{ClientID: providerCfg.ClientID})

		req := service.ExchangeOAuthCodeRequest{
			ProviderID:  providerCfg.ID,
			Code:        code,
			RedirectURI: providerCfg.RedirectURI,
			Nonce:       storedNonce.Value,
			OAuthConfig: config,
			Verifier:    verifier,
		}

		resp, err := authService.ExchangeOAuthCode(ctx, req)
		if err != nil {
			if gtk.IsConflict(err) {
				// Redirect to frontend login with error param
				return &gtk.ControllerResponse{
					StatusCode: http.StatusFound,
					Headers:    map[string]string{"Location": "/auth/login?error=account_exists"},
				}, nil
			}
			return nil, err
		}

		// Clear OAuth cookies
		clearCookie(w, "oauth_state")
		clearCookie(w, "oauth_nonce")

		// Set session cookie
		setSessionCookie(w, cookieConfig, resp.SessionToken, resp.ExpiresAt)

		// Redirect to frontend home or dashboard
		return &gtk.ControllerResponse{
			StatusCode: http.StatusFound,
			Headers:    map[string]string{"Location": "/"},
		}, nil
	}
}

func generateRandomString(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func setSecureCookie(w http.ResponseWriter, name, value string, ttl time.Duration) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Expires:  time.Now().Add(ttl),
		HttpOnly: true,
		Secure:   true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})
}

func clearCookie(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
