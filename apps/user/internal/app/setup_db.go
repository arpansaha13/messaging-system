package app

import (
	"context"

	"github.com/arpansaha13/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/user/internal/config"
	"go.uber.org/zap"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// SetupDB initializes the database connection.
func SetupDB(ctx context.Context, cfg *config.Config, zapLogger *zap.Logger) (*gorm.DB, error) {
	gormCfg := gorm.Config{
		Logger: gtk.NewGormLogger(zapLogger, gormlogger.Warn),
	}
	db, err := gtk.ConnectPostgresWithBackoff(ctx, cfg.DatabaseURL(), &gormCfg)
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(cfg.DatabaseMaxConnections())

	return db, nil
}
