package app

import (
	"context"

	"go.uber.org/zap"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/arpansaha13/gotoolkit"
	"github.com/arpansaha13/messaging-system/apps/auth/internal/config"
)

// SetupPostgres connects to Postgres with exponential backoff and returns the GORM DB instance.
func SetupPostgres(ctx context.Context, zapLogger *zap.Logger) (*gorm.DB, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}
	gormCfg := gorm.Config{
		Logger: gotoolkit.NewGormLogger(zapLogger, gormlogger.Warn),
	}
	db, err := gotoolkit.ConnectPostgresWithBackoff(ctx, cfg.DatabaseURL(), &gormCfg)
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
