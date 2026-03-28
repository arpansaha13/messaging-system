package config

import (
	"fmt"
	"os"
	"strconv"
	"sync"

	"github.com/arpansaha13/messaging-system/apps/common/constants"
)

const DefaultMessagesPageSize = 50

type rabbitMQCreds struct {
	host string
	port int
	user string
	pass string
}

func (c rabbitMQCreds) url() string {
	return fmt.Sprintf("amqp://%s:%s@%s:%d/", c.user, c.pass, c.host, c.port)
}

// Config holds all application configuration. Fields are private; use getters to read them.
type Config struct {
	databaseURL    string
	dbMaxConnections int
	apiPort        int
	metricsPort    int
	authSystemHost string
	otlpEndpoint   string
	jwtSecret      string
	authCookieName string
	environment    constants.Environment
	logLevel       string
	rabbitMQ       rabbitMQCreds
}

func (c *Config) DatabaseURL() string                { return c.databaseURL }
func (c *Config) DatabaseMaxConnections() int        { return c.dbMaxConnections }
func (c *Config) APIPort() int                       { return c.apiPort }
func (c *Config) MetricsPort() int                   { return c.metricsPort }
func (c *Config) AuthSystemHost() string             { return c.authSystemHost }
func (c *Config) OTLPEndpoint() string               { return c.otlpEndpoint }
func (c *Config) JWTSecret() string                  { return c.jwtSecret }
func (c *Config) AuthCookieName() string             { return c.authCookieName }
func (c *Config) Environment() constants.Environment { return c.environment }
func (c *Config) LogLevel() string                   { return c.logLevel }
func (c *Config) RabbitMQURL() string                { return c.rabbitMQ.url() }

var (
	instance *Config
	once     sync.Once
	loadErr  error
)

// Load loads configuration from environment variables exactly once.
// Subsequent calls return the same instance without re-reading env vars.
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
		apiPort:        getEnvInt("API_PORT", 4000),
		metricsPort:    getEnvInt("METRICS_PORT", 9090),
		authCookieName: getEnv("AUTH_COOKIE_NAME", "auth_token"),
		environment:    env,
		logLevel:       getEnv("LOG_LEVEL", "info"),
		otlpEndpoint:   getEnv("OTLP_ENDPOINT", ""),
		dbMaxConnections: getEnvInt("DB_MAX_CONNECTIONS", 100),
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		dbHost := os.Getenv("DB_HOST")
		if dbHost == "" {
			return nil, fmt.Errorf("DB_HOST is required")
		}
		dbPortStr := os.Getenv("DB_PORT")
		if dbPortStr == "" {
			return nil, fmt.Errorf("DB_PORT is required")
		}
		dbPort, err := strconv.Atoi(dbPortStr)
		if err != nil {
			return nil, fmt.Errorf("DB_PORT must be a valid integer")
		}
		dbUser := os.Getenv("DB_USERNAME")
		if dbUser == "" {
			return nil, fmt.Errorf("DB_USERNAME is required")
		}
		dbPass := os.Getenv("DB_PASSWORD")
		if dbPass == "" {
			return nil, fmt.Errorf("DB_PASSWORD is required")
		}
		dbName := os.Getenv("DB_NAME")
		if dbName == "" {
			return nil, fmt.Errorf("DB_NAME is required")
		}
		databaseURL = fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable", dbUser, dbPass, dbHost, dbPort, dbName)
	}
	cfg.databaseURL = databaseURL

	rabbitmqHost := os.Getenv("RABBITMQ_HOST")
	if rabbitmqHost == "" {
		return nil, fmt.Errorf("RABBITMQ_HOST is required")
	}
	rabbitmqPortStr := os.Getenv("RABBITMQ_PORT")
	if rabbitmqPortStr == "" {
		return nil, fmt.Errorf("RABBITMQ_PORT is required")
	}
	rabbitmqPort, err := strconv.Atoi(rabbitmqPortStr)
	if err != nil {
		return nil, fmt.Errorf("RABBITMQ_PORT must be a valid integer")
	}
	rabbitmqUser := os.Getenv("RABBITMQ_USER")
	if rabbitmqUser == "" {
		return nil, fmt.Errorf("RABBITMQ_USER is required")
	}
	rabbitmqPass := os.Getenv("RABBITMQ_PASS")
	if rabbitmqPass == "" {
		return nil, fmt.Errorf("RABBITMQ_PASS is required")
	}
	cfg.rabbitMQ = rabbitMQCreds{
		host: rabbitmqHost,
		port: rabbitmqPort,
		user: rabbitmqUser,
		pass: rabbitmqPass,
	}

	authSystemHost := os.Getenv("AUTH_SYSTEM_HOST")
	if authSystemHost == "" {
		authSystemHost = "auth:50051"
	}
	cfg.authSystemHost = authSystemHost

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}
	cfg.jwtSecret = jwtSecret

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) validate() error {
	if c.databaseURL == "" {
		return fmt.Errorf("DatabaseURL must be set")
	}
	if c.dbMaxConnections <= 0 {
		return fmt.Errorf("DatabaseMaxConnections must be greater than 0")
	}
	if c.jwtSecret == "" {
		return fmt.Errorf("JWTSecret must be set")
	}
	if c.authSystemHost == "" {
		return fmt.Errorf("AuthSystemHost must be set")
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
	if value, exists := os.LookupEnv(key); exists {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
