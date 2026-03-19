package config

import (
	"fmt"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/arpansaha13/messaging-system/apps/common/constants"
)

// Config holds all application configuration. Fields are private; use getters to read them.
type Config struct {
	databaseURL             string
	grpcHost                string
	grpcPort                string
	metricsPort             int
	otlpEndpoint            string
	secretKey               string
	jwtSecret               string
	smtpHost                string
	smtpPort                int
	smtpUser                string
	smtpPassword            string
	emailFrom               string
	environment             constants.Environment
	logLevel                string
	otpExpiry               time.Duration
	otpLength               int
	emailWorkerPoolSize     int
	emailTaskQueueSize      int
	sessionTTL              time.Duration
	sessionCleanupInterval  time.Duration
}

func (c *Config) DatabaseURL() string                { return c.databaseURL }
func (c *Config) GRPCHost() string                   { return c.grpcHost }
func (c *Config) GRPCPort() string                   { return c.grpcPort }
func (c *Config) MetricsPort() int                   { return c.metricsPort }
func (c *Config) OTLPEndpoint() string               { return c.otlpEndpoint }
func (c *Config) SecretKey() string                  { return c.secretKey }
func (c *Config) JWTSecret() string                  { return c.jwtSecret }
func (c *Config) SMTPHost() string                   { return c.smtpHost }
func (c *Config) SMTPPort() int                      { return c.smtpPort }
func (c *Config) SMTPUser() string                   { return c.smtpUser }
func (c *Config) SMTPPassword() string               { return c.smtpPassword }
func (c *Config) EmailFrom() string                  { return c.emailFrom }
func (c *Config) Environment() constants.Environment { return c.environment }
func (c *Config) LogLevel() string                   { return c.logLevel }
func (c *Config) OTPExpiry() time.Duration           { return c.otpExpiry }
func (c *Config) OTPLength() int                     { return c.otpLength }
func (c *Config) EmailWorkerPoolSize() int           { return c.emailWorkerPoolSize }
func (c *Config) EmailTaskQueueSize() int            { return c.emailTaskQueueSize }
func (c *Config) SessionTTL() time.Duration          { return c.sessionTTL }
func (c *Config) SessionCleanupInterval() time.Duration { return c.sessionCleanupInterval }

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
		databaseURL:         getEnv("DATABASE_URL", ""),
		grpcHost:            getEnv("GRPC_HOST", "0.0.0.0"),
		grpcPort:            getEnv("GRPC_PORT", "50051"),
		metricsPort:         getEnvInt("METRICS_PORT", 9090),
		otlpEndpoint:        getEnv("OTLP_ENDPOINT", ""),
		secretKey:           getEnv("SECRET_KEY", ""),
		jwtSecret:           getEnv("JWT_SECRET", ""),
		smtpHost:            getEnv("SMTP_HOST", "localhost"),
		smtpPort:            getEnvInt("SMTP_PORT", 587),
		smtpUser:            getEnv("SMTP_USER", ""),
		smtpPassword:        getEnv("SMTP_PASSWORD", ""),
		emailFrom:           getEnv("EMAIL_FROM", "noreply@example.com"),
		environment:         env,
		logLevel:            getEnv("LOG_LEVEL", "info"),
		otpLength:           getEnvInt("OTP_LENGTH", 6),
		emailWorkerPoolSize: getEnvInt("EMAIL_WORKER_POOL_SIZE", 5),
		emailTaskQueueSize:  getEnvInt("EMAIL_TASK_QUEUE_SIZE", 100),
	}

	sessionTTLMins := getEnvInt("SESSION_TTL_MINUTES", 30)
	cfg.sessionTTL = time.Duration(sessionTTLMins) * time.Minute

	cleanupIntervalMins := getEnvInt("SESSION_CLEANUP_INTERVAL_MINUTES", 5)
	cfg.sessionCleanupInterval = time.Duration(cleanupIntervalMins) * time.Minute

	otpExpiryMins := getEnvInt("OTP_EXPIRY_MINUTES", 10)
	cfg.otpExpiry = time.Duration(otpExpiryMins) * time.Minute

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) validate() error {
	if c.environment != constants.EnvTest && c.databaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if c.secretKey == "" {
		return fmt.Errorf("SECRET_KEY is required")
	}
	if len(c.secretKey) < 32 {
		return fmt.Errorf("SECRET_KEY must be at least 32 characters")
	}
	if c.jwtSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
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
