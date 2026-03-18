package app

import (
	"context"

	"go.uber.org/zap"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/arpansaha13/gotoolkit"
)

// SetupPostgres connects to Postgres with exponential backoff and returns the GORM DB instance.
func SetupPostgres(ctx context.Context, databaseURL string, zapLogger *zap.Logger) (*gorm.DB, error) {
	gormCfg := gorm.Config{
		Logger: gotoolkit.NewGormLogger(zapLogger, gormlogger.Warn),
	}
	return gotoolkit.ConnectPostgresWithBackoff(ctx, databaseURL, &gormCfg)
}
