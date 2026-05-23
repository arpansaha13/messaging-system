package testdeps

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const (
	EnvDepsMode    = "TEST_DEPS_MODE"
	modeContainer  = "container"
	modeExternal   = "external"
	defaultPGPort  = "5432/tcp"
	defaultPGImage = "postgres:16-alpine"
	defaultTimeout = 60 * time.Second
)

type DepsMode string

const (
	DepsModeContainer DepsMode = modeContainer
	DepsModeExternal  DepsMode = modeExternal
)

type PostgresConfig struct {
	ServiceName    string
	Image          string
	DBUser         string
	DBPassword     string
	DBName         string
	Port           string
	StartupTimeout time.Duration
}

type ResolvedDeps struct {
	Mode        DepsMode
	PostgresDSN string
	PostgresURL string
}

type DependencyProvider interface {
	Setup(ctx context.Context) (ResolvedDeps, error)
	Teardown(ctx context.Context) error
}

type ResolvedDependencySet struct {
	Deps     ResolvedDeps
	provider DependencyProvider
}

func (s *ResolvedDependencySet) Teardown(ctx context.Context) error {
	if s == nil || s.provider == nil {
		return nil
	}
	return s.provider.Teardown(ctx)
}

func ResolveTestDependencies(ctx context.Context, cfg PostgresConfig) (*ResolvedDependencySet, error) {
	mode, err := ResolveDepsMode()
	if err != nil {
		return nil, err
	}

	provider, err := providerForMode(mode, cfg)
	if err != nil {
		return nil, err
	}

	deps, err := provider.Setup(ctx)
	if err != nil {
		return nil, err
	}

	return &ResolvedDependencySet{Deps: deps, provider: provider}, nil
}

func ResolveDepsMode() (DepsMode, error) {
	raw := strings.TrimSpace(strings.ToLower(os.Getenv(EnvDepsMode)))
	if raw == "" {
		return DepsModeContainer, nil
	}

	switch raw {
	case modeContainer:
		return DepsModeContainer, nil
	case modeExternal:
		return DepsModeExternal, nil
	default:
		return "", fmt.Errorf("invalid %s value %q: expected one of [%s,%s]", EnvDepsMode, raw, modeContainer, modeExternal)
	}
}

func providerForMode(mode DepsMode, cfg PostgresConfig) (DependencyProvider, error) {
	normalized := normalizePostgresConfig(cfg)

	switch mode {
	case DepsModeContainer:
		return &containerPostgresProvider{cfg: normalized}, nil
	case DepsModeExternal:
		return &externalPostgresProvider{cfg: normalized}, nil
	default:
		return nil, fmt.Errorf("unsupported deps mode %q", mode)
	}
}

func normalizePostgresConfig(cfg PostgresConfig) PostgresConfig {
	if cfg.Image == "" {
		cfg.Image = defaultPGImage
	}
	if cfg.Port == "" {
		cfg.Port = defaultPGPort
	}
	if cfg.StartupTimeout <= 0 {
		cfg.StartupTimeout = defaultTimeout
	}
	return cfg
}

type containerPostgresProvider struct {
	cfg       PostgresConfig
	container testcontainers.Container
}

func (p *containerPostgresProvider) Setup(ctx context.Context) (ResolvedDeps, error) {
	req := testcontainers.ContainerRequest{
		Image:        p.cfg.Image,
		ExposedPorts: []string{p.cfg.Port},
		Env: map[string]string{
			"POSTGRES_USER":     p.cfg.DBUser,
			"POSTGRES_PASSWORD": p.cfg.DBPassword,
			"POSTGRES_DB":       p.cfg.DBName,
		},
		WaitingFor: wait.ForListeningPort(p.cfg.Port).WithStartupTimeout(p.cfg.StartupTimeout),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		return ResolvedDeps{}, fmt.Errorf("start postgres testcontainer: %w", err)
	}
	p.container = container

	host, err := container.Host(ctx)
	if err != nil {
		return ResolvedDeps{}, fmt.Errorf("resolve postgres testcontainer host: %w", err)
	}

	port, err := container.MappedPort(ctx, p.cfg.Port)
	if err != nil {
		return ResolvedDeps{}, fmt.Errorf("resolve postgres testcontainer port: %w", err)
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port.Port(), p.cfg.DBUser, p.cfg.DBPassword, p.cfg.DBName)
	url := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", p.cfg.DBUser, p.cfg.DBPassword, host, port.Port(), p.cfg.DBName)

	return ResolvedDeps{Mode: DepsModeContainer, PostgresDSN: dsn, PostgresURL: url}, nil
}

func (p *containerPostgresProvider) Teardown(ctx context.Context) error {
	if p.container == nil {
		return nil
	}
	return p.container.Terminate(ctx)
}

type externalPostgresProvider struct {
	cfg PostgresConfig
}

func (p *externalPostgresProvider) Setup(ctx context.Context) (ResolvedDeps, error) {
	dsn, err := p.resolveExternalDSN()
	if err != nil {
		return ResolvedDeps{}, err
	}

	if err := healthCheckPostgres(ctx, dsn); err != nil {
		return ResolvedDeps{}, fmt.Errorf("external postgres health check failed: %w", err)
	}

	return ResolvedDeps{Mode: DepsModeExternal, PostgresDSN: dsn, PostgresURL: dsn}, nil
}

func (p *externalPostgresProvider) Teardown(context.Context) error {
	return nil
}

func (p *externalPostgresProvider) resolveExternalDSN() (string, error) {
	normalizedService := strings.ToUpper(strings.ReplaceAll(p.cfg.ServiceName, "-", "_"))
	serviceKey := fmt.Sprintf("TEST_POSTGRES_DSN_%s", normalizedService)

	if dsn := strings.TrimSpace(os.Getenv(serviceKey)); dsn != "" {
		return dsn, nil
	}
	return "", fmt.Errorf("missing external postgres DSN: set %s", serviceKey)
}

func healthCheckPostgres(ctx context.Context, dsn string) error {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	defer func() { _ = sqlDB.Close() }()

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(pingCtx); err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			return fmt.Errorf("ping timeout: %w", err)
		}
		return err
	}

	return nil
}
