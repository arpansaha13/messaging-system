package config

import (
	"fmt"
	"os"
	"strconv"
)

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

// MemcachedCreds holds Memcached connection credentials.
type MemcachedCreds struct {
	Host string
	Port string
}

// GetUrl constructs the Memcached address string from the credentials.
func (c MemcachedCreds) GetUrl() string {
	return fmt.Sprintf("%s:%s", c.Host, c.Port)
}

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port           int
	ServerId       string
	ClientDomain   string
	AuthSystemHost string
	AuthCookieName string
	LogLevel       string
	RabbitMQ       RabbitMQCreds
	Memcached      MemcachedCreds
}

// Load reads configuration from environment variables and returns a Config.
// Fails fast on invalid or missing required values.
func Load() (*Config, error) {
	port, err := getEnvInt("PORT", 4000)
	if err != nil {
		return nil, fmt.Errorf("invalid PORT: %w", err)
	}

	rabbitPort, err := getEnvInt("RABBITMQ_PORT", 5672)
	if err != nil {
		return nil, fmt.Errorf("invalid RABBITMQ_PORT: %w", err)
	}

	return &Config{
		Port:           port,
		ServerId:       getEnv("SERVER_ID", "server-1"),
		ClientDomain:   os.Getenv("CLIENT_DOMAIN"),
		AuthSystemHost: getEnv("AUTH_SYSTEM_HOST", "auth:50051"),
		AuthCookieName: getEnv("AUTH_COOKIE_NAME", "auth_token"),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		RabbitMQ: RabbitMQCreds{
			Host: getEnv("RABBITMQ_HOST", "localhost"),
			Port: rabbitPort,
			User: getEnv("RABBITMQ_USER", "guest"),
			Pass: getEnv("RABBITMQ_PASS", "guest"),
		},
		Memcached: MemcachedCreds{
			Host: getEnv("MEMCACHED_HOST", "memcached"),
			Port: getEnv("MEMCACHED_PORT", "11211"),
		},
	}, nil
}

func getEnv(key, defaultValue string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) (int, error) {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return defaultValue, nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return 0, err
	}
	return n, nil
}
