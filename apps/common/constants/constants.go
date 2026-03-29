package constants

import "fmt"

// Environment represents the application environment
type Environment string

const (
	EnvDevelopment Environment = "development"
	EnvProduction  Environment = "production"
	EnvTest        Environment = "test"
)

// String returns the string representation of the environment
func (e Environment) String() string {
	return string(e)
}

// Validate validates that the environment value is valid
func (e Environment) Validate() error {
	switch e {
	case EnvDevelopment, EnvProduction, EnvTest:
		return nil
	default:
		return fmt.Errorf("invalid ENVIRONMENT: must be 'development', 'production', or 'test', got '%s'", e)
	}
}
