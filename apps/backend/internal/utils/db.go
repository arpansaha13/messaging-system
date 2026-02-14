package utils

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/arpansaha13/messaging-system/apps/common/domain"
)

// InitDB initializes and returns a database connection
func InitDB(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto-migrate models
	if err := db.AutoMigrate(
		&domain.UserProfile{},
		&domain.Message{},
		&domain.MessageRecipient{},
		&domain.Chat{},
		&domain.Channel{},
		&domain.Contact{},
		&domain.Group{},
		&domain.UserGroup{},
		&domain.Invite{},
	); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return db, nil
}
