package dto

// RequestDTO is the common interface for all request DTOs.
// Each DTO loads its data from *http.Request in its constructor,
// and validates that data via Validate.
type RequestDTO interface {
	Validate() error
}
