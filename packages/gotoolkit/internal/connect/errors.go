package connect

import "errors"

// ConnectionManager error definitions
var (
	ErrConnectionManagerAlreadyRunning = errors.New("connection manager is already running")
	ErrConnectionManagerNotRunning     = errors.New("connection manager is not running")
)
