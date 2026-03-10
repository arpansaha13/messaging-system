package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port          int
	ServerId      string
	ClientDomain  string
	RabbitMQHost  string
	RabbitMQPort  int
	RabbitMQUser  string
	RabbitMQPass  string
	MemcachedHost string
	MemcachedPort string
	LogLevel      string
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
		Port:          port,
		ServerId:      getEnv("SERVER_ID", "server-1"),
		ClientDomain:  os.Getenv("CLIENT_DOMAIN"),
		RabbitMQHost:  getEnv("RABBITMQ_HOST", "localhost"),
		RabbitMQPort:  rabbitPort,
		RabbitMQUser:  getEnv("RABBITMQ_USER", "guest"),
		RabbitMQPass:  getEnv("RABBITMQ_PASS", "guest"),
		MemcachedHost: getEnv("MEMCACHED_HOST", "memcached"),
		MemcachedPort: getEnv("MEMCACHED_PORT", "11211"),
		LogLevel:      getEnv("LOG_LEVEL", "info"),
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
