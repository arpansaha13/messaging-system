package app

import (
	"github.com/arpansaha13/messaging-system/apps/user/internal/config"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// SetupDB initializes the database connection.
func SetupDB(cfg *config.Config, zapLogger *zap.Logger) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		zapLogger.Fatal("failed to connect to database", zap.Error(err))
	}

	sqlDB, err := db.DB()
	if err != nil {
		zapLogger.Fatal("failed to get sql db", zap.Error(err))
	}

	sqlDB.SetMaxOpenConns(cfg.DatabaseMaxConnections())

	return db
}
