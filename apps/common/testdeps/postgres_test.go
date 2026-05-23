package testdeps

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestResolveDepsMode_DefaultsToContainer(t *testing.T) {
	t.Setenv(EnvDepsMode, "")

	mode, err := ResolveDepsMode()
	require.NoError(t, err)
	require.Equal(t, DepsModeContainer, mode)
}

func TestResolveDepsMode_InvalidMode(t *testing.T) {
	t.Setenv(EnvDepsMode, "bad-mode")

	_, err := ResolveDepsMode()
	require.Error(t, err)
	require.Contains(t, err.Error(), "invalid TEST_DEPS_MODE")
}

func TestExternalProvider_MissingDSN(t *testing.T) {
	t.Setenv(EnvDepsMode, modeExternal)
	t.Setenv("TEST_POSTGRES_DSN_AUTH", "")

	provider := &externalPostgresProvider{cfg: PostgresConfig{ServiceName: "auth"}}
	_, err := provider.Setup(context.Background())
	require.Error(t, err)
	require.Contains(t, err.Error(), "missing external postgres DSN")
}

func TestExternalProvider_UnreachableDSN(t *testing.T) {
	t.Setenv("TEST_POSTGRES_DSN_AUTH", "host=127.0.0.1 port=1 user=x password=x dbname=x sslmode=disable connect_timeout=1")

	provider := &externalPostgresProvider{cfg: PostgresConfig{ServiceName: "auth"}}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	_, err := provider.Setup(ctx)
	require.Error(t, err)
	require.Contains(t, err.Error(), "external postgres health check failed")
}

func TestExternalProvider_ServiceSpecificDSN(t *testing.T) {
	os.Unsetenv("TEST_POSTGRES_DSN_AUTH")
	t.Setenv("TEST_POSTGRES_DSN_CHAT_WORKER", "host=127.0.0.1 port=1 user=x password=x dbname=x sslmode=disable connect_timeout=1")

	provider := &externalPostgresProvider{cfg: PostgresConfig{ServiceName: "chat-worker"}}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	_, err := provider.Setup(ctx)
	require.Error(t, err)
	require.Contains(t, err.Error(), "external postgres health check failed")
}
