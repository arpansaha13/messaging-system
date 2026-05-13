package config

import (
	"fmt"
	"os"
	"strconv"
	"sync"

	"github.com/arpansaha13/messaging-system/apps/common/constants"
)

// Config holds all application configuration.
type Config struct {
	databaseURL         string
	dbMaxConnections    int
	grpcHost            string
	grpcPort            string
	httpPort            string
	authCookieName      string
	metricsPort         int
	otlpEndpoint        string
	authServiceGRPCAddr string
	environment         constants.Environment
	logLevel            string
}

func (c *Config) DatabaseURL() string                { return c.databaseURL }
func (c *Config) DatabaseMaxConnections() int        { return c.dbMaxConnections }
func (c *Config) GRPCHost() string                   { return c.grpcHost }
func (c *Config) GRPCPort() string                   { return c.grpcPort }
func (c *Config) HTTPPort() string                   { return c.httpPort }
func (c *Config) AuthCookieName() string             { return c.authCookieName }
func (c *Config) MetricsPort() int                   { return c.metricsPort }
func (c *Config) OTLPEndpoint() string               { return c.otlpEndpoint }
func (c *Config) AuthServiceGRPCAddr() string        { return c.authServiceGRPCAddr }
func (c *Config) Environment() constants.Environment { return c.environment }
func (c *Config) LogLevel() string                   { return c.logLevel }

var (
	instance *Config
	once     sync.Once
	loadErr  error
)

// Load loads configuration from environment variables exactly once.
func Load() (*Config, error) {
	once.Do(func() {
		instance, loadErr = load()
	})
	return instance, loadErr
}

func load() (*Config, error) {
	environment := os.Getenv("ENVIRONMENT")
	if environment == "" {
		return nil, fmt.Errorf("ENVIRONMENT is required")
	}

	env := constants.Environment(environment)
	if err := env.Validate(); err != nil {
		return nil, err
	}

	cfg := &Config{
		databaseURL:         getEnv("USER_DB_URL", ""),
		dbMaxConnections:    getEnvInt("USER_DB_MAX_CONNECTIONS", 100),
		grpcHost:            getEnv("GRPC_HOST", "0.0.0.0"),
		grpcPort:            getEnv("GRPC_PORT", "50051"),
		httpPort:            getEnv("HTTP_PORT", "4000"), // Default to 4000 inside container
		authCookieName:      getEnv("AUTH_COOKIE_NAME", ""),
		metricsPort:         getEnvInt("METRICS_PORT", 9091),
		otlpEndpoint:        getEnv("OTLP_ENDPOINT", ""),
		authServiceGRPCAddr: getEnv("AUTH_SERVICE_GRPC_ADDR", "auth-service:50051"),
		environment:         env,
		logLevel:            getEnv("LOG_LEVEL", "info"),
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) validate() error {
	if c.environment != constants.EnvTest && c.databaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.authCookieName == "" {
		return fmt.Errorf("AUTH_COOKIE_NAME is required")
	}
	return nil
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	value := getEnv(key, "")
	if value == "" {
		return defaultValue
	}
	intVal, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return intVal
}
