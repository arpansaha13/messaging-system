package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/arpansaha13/messaging-system/apps/common/constants"
)

const DefaultMessagesPageSize = 50

// RabbitMQCreds holds RabbitMQ connection credentials.
type RabbitMQCreds struct {
	Host string
	Port int
	User string
	Pass string
}

// GetUrl constructs the AMQP connection URL from the credentials.
func (c RabbitMQCreds) GetUrl() string {
	return fmt.Sprintf("amqp://%s:%s@%s:%d/", c.User, c.Pass, c.Host, c.Port)
}

// Config holds all application configuration
type Config struct {
	// Database
	DatabaseURL string

	// HTTP Server
	APIPort     int
	MetricsPort int

	// Auth System gRPC
	AuthSystemHost string

	// JWT
	JWTSecret string

	// Cookies
	AuthCookieName string

	// Environment
	Environment constants.Environment
	LogLevel    string

	// RabbitMQ
	RabbitMQ RabbitMQCreds
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	environment := os.Getenv("ENVIRONMENT")
	if environment == "" {
		return nil, fmt.Errorf("ENVIRONMENT is required")
	}

	env := constants.Environment(environment)
	if err := env.Validate(); err != nil {
		return nil, err
	}

	cfg := &Config{
		APIPort:        getEnvInt("API_PORT", 4000),
		MetricsPort:    getEnvInt("METRICS_PORT", 9090),
		AuthCookieName: getEnv("AUTH_COOKIE_NAME", "auth_token"),
		Environment:    env,
		LogLevel:       getEnv("LOG_LEVEL", "info"),
	}

	// Load database URL - either single DATABASE_URL or build from individual vars
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
	cfg.DatabaseURL = databaseURL

	// Validate and load RabbitMQ env vars
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

	cfg.RabbitMQ = RabbitMQCreds{
		Host: rabbitmqHost,
		Port: rabbitmqPort,
		User: rabbitmqUser,
		Pass: rabbitmqPass,
	}

	authSystemHost := os.Getenv("AUTH_SYSTEM_HOST")
	if authSystemHost == "" {
		authSystemHost = "auth:50051" // Default for Docker
	}
	cfg.AuthSystemHost = authSystemHost

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}
	cfg.JWTSecret = jwtSecret

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// Validate validates the configuration.
// All critical validation is done during Load(), this is a sanity check.
func (c *Config) Validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DatabaseURL must be set")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWTSecret must be set")
	}
	if c.AuthSystemHost == "" {
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
