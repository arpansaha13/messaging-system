package app

import (
	"context"

	"github.com/arpansaha13/messaging-system/packages/gotoolkit/gtk"
	"github.com/arpansaha13/messaging-system/apps/auth/server/internal/config"
	"go.uber.org/zap"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// SetupPostgres connects to Postgres with exponential backoff and returns the GORM DB instance.
func SetupPostgres(ctx context.Context, zapLogger *zap.Logger) (*gorm.DB, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}
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
