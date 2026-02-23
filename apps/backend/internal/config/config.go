package config

import (
	"fmt"
	"os"
	"strconv"
)

const DefaultMessagesPageSize = 50

// Config holds all application configuration
type Config struct {
	// Database
	DatabaseURL string

	// HTTP Server
	APIPort int

	// Auth System gRPC
	AuthSystemHost string

	// JWT
	JWTSecret string

	// Cookies
	AuthCookieName string

	// Environment
	Environment string
	LogLevel    string

	// RabbitMQ (optional for messaging)
	RabbitMQHost string
	RabbitMQPort int
	RabbitMQUser string
	RabbitMQPass string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		APIPort:        getEnvInt("API_PORT", 4000),
		AuthSystemHost: getEnv("AUTH_SYSTEM_HOST", "localhost:50051"),
		JWTSecret:      getEnv("JWT_SECRET", "secret"),
		AuthCookieName: getEnv("AUTH_COOKIE_NAME", "auth_token"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		RabbitMQHost:   getEnv("RABBITMQ_HOST", "localhost"),
		RabbitMQPort:   getEnvInt("RABBITMQ_PORT", 5672),
		RabbitMQUser:   getEnv("RABBITMQ_USER", "guest"),
		RabbitMQPass:   getEnv("RABBITMQ_PASS", "guest"),
	}

	// If DATABASE_URL is not set, build from individual DB env vars
	if cfg.DatabaseURL == "" {
		dbHost := getEnv("DB_HOST", "localhost")
		dbPort := getEnvInt("DB_PORT", 5432)
		dbUser := getEnv("DB_USERNAME", "user")
		dbPass := getEnv("DB_PASSWORD", "password")
		dbName := getEnv("DB_NAME", "messaging")
		cfg.DatabaseURL = fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable", dbUser, dbPass, dbHost, dbPort, dbName)
	}

	// Validate required fields
	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if c.AuthSystemHost == "" {
		return fmt.Errorf("AUTH_SYSTEM_HOST is required")
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
