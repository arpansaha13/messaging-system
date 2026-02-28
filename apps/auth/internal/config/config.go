package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds all application configuration
type Config struct {
	// Database
	DatabaseURL string

	// gRPC
	GRPCHost string
	GRPCPort string

	// Session
	SessionTTL             time.Duration
	SessionCleanupInterval time.Duration

	// Security
	SecretKey string
	JWTSecret string

	// Email
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	EmailFrom    string

	// Environment
	Environment string
	LogLevel    string

	// OTP
	OTPExpiry time.Duration
	OTPLength int

	// Worker Pool
	EmailWorkerPoolSize int
	EmailTaskQueueSize  int
}

// Load loads configuration from environment variables
func Load() (*Config, error) {

	cfg := &Config{
		DatabaseURL:         getEnv("DATABASE_URL", ""),
		GRPCHost:            getEnv("GRPC_HOST", "0.0.0.0"),
		GRPCPort:            getEnv("GRPC_PORT", "50051"),
		SecretKey:           getEnv("SECRET_KEY", ""),
		JWTSecret:           getEnv("JWT_SECRET", ""),
		SMTPHost:            getEnv("SMTP_HOST", "localhost"),
		SMTPPort:            getEnvInt("SMTP_PORT", 587),
		SMTPUser:            getEnv("SMTP_USER", ""),
		SMTPPassword:        getEnv("SMTP_PASSWORD", ""),
		EmailFrom:           getEnv("EMAIL_FROM", "noreply@example.com"),
		Environment:         getEnv("ENVIRONMENT", "development"),
		LogLevel:            getEnv("LOG_LEVEL", "info"),
		OTPLength:           getEnvInt("OTP_LENGTH", 6),
		EmailWorkerPoolSize: getEnvInt("EMAIL_WORKER_POOL_SIZE", 5),
		EmailTaskQueueSize:  getEnvInt("EMAIL_TASK_QUEUE_SIZE", 100),
	}

	// Parse durations
	sessionTTLMins := getEnvInt("SESSION_TTL_MINUTES", 30)
	cfg.SessionTTL = time.Duration(sessionTTLMins) * time.Minute

	cleanupIntervalMins := getEnvInt("SESSION_CLEANUP_INTERVAL_MINUTES", 5)
	cfg.SessionCleanupInterval = time.Duration(cleanupIntervalMins) * time.Minute

	otpExpiryMins := getEnvInt("OTP_EXPIRY_MINUTES", 10)
	cfg.OTPExpiry = time.Duration(otpExpiryMins) * time.Minute

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
	if c.SecretKey == "" {
		return fmt.Errorf("SECRET_KEY is required")
	}
	if len(c.SecretKey) < 32 {
		return fmt.Errorf("SECRET_KEY must be at least 32 characters")
	}
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	return nil
}

// getEnv retrieves an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// getEnvInt retrieves an integer environment variable with a default value
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
