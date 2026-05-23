package connect

import "go.uber.org/zap/zapcore"

// BackoffOption is a functional option for configuring backoff behavior
type BackoffOption func(*backoffConfig)

// backoffConfig holds the configuration for exponential backoff retry logic
type backoffConfig struct {
	maxRetries             int           // 0 = unlimited (bounded by MaxElapsedTime)
	permanentErrorLogLevel zapcore.Level // default: zapcore.FatalLevel
}

// defaultBackoffConfig returns the default backoff configuration
func defaultBackoffConfig() *backoffConfig {
	return &backoffConfig{
		maxRetries:             0, // unlimited by retry count (bounded by MaxElapsedTime)
		permanentErrorLogLevel: zapcore.FatalLevel,
	}
}

// WithMaxRetries sets the maximum number of retry attempts
// If maxRetries > 0, backoff will stop after that many attempts
// If 0, retry is bounded only by MaxElapsedTime (default 15 minutes)
func WithMaxRetries(n int) BackoffOption {
	return func(cfg *backoffConfig) {
		cfg.maxRetries = n
	}
}

// WithPermanentErrorLogLevel sets the log level for permanent errors
// (when MaxElapsedTime exhausted, ctx cancelled, or Permanent returned)
// Default is FatalLevel
func WithPermanentErrorLogLevel(level zapcore.Level) BackoffOption {
	return func(cfg *backoffConfig) {
		cfg.permanentErrorLogLevel = level
	}
}

// applyOptions applies all options to create a final backoffConfig
func applyOptions(opts []BackoffOption) *backoffConfig {
	cfg := defaultBackoffConfig()
	for _, opt := range opts {
		opt(cfg)
	}
	return cfg
}
