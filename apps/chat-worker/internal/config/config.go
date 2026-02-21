package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all application configuration
type Config struct {
	LogLevel          string
	KafkaLogChanSize  int
	KafkaBrokers      string
	KafkaTopic        string
	RabbitMQHost      string
	RabbitMQPort      int
	RabbitMQUser      string
	RabbitMQPass      string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		LogLevel:         getEnv("LOG_LEVEL", "info"),
		KafkaLogChanSize: getEnvInt("KAFKA_LOG_CHANNEL_SIZE", 1000),
		KafkaBrokers:     getEnv("KAFKA_BROKERS", "kafka:9092"),
		KafkaTopic:       getEnv("KAFKA_TOPIC", "application-logs"),
		RabbitMQHost:     getEnv("RABBITMQ_HOST", "localhost"),
		RabbitMQPort:     getEnvInt("RABBITMQ_PORT", 5672),
		RabbitMQUser:     getEnv("RABBITMQ_USER", "guest"),
		RabbitMQPass:     getEnv("RABBITMQ_PASS", "guest"),
	}

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.RabbitMQUser == "" {
		return fmt.Errorf("RABBITMQ_USER is required")
	}
	if c.RabbitMQPass == "" {
		return fmt.Errorf("RABBITMQ_PASS is required")
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
