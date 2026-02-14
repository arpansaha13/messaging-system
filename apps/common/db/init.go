package db

import (
	"fmt"
	"os"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB initializes a GORM database connection using environment variables
func InitDB() (*gorm.DB, error) {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	user := os.Getenv("DB_USERNAME")
	if user == "" {
		user = "postgres"
	}

	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "postgres"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "messaging_db"
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbName,
	)

	logLevel := logger.Silent
	if os.Getenv("DB_LOGGING") == "true" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return db, nil
}

// Migrate runs all migrations for shared domain models
func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&domain.UserProfile{},
		&domain.Message{},
		&domain.MessageRecipient{},
		&domain.Chat{},
		&domain.Group{},
		&domain.Channel{},
		&domain.UserGroup{},
		&domain.Contact{},
		&domain.Invite{},
	)
}
