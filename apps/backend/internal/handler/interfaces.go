package handler

import "net/http"

// ControllerFunc is the common signature for all HTTP controllers.
// Controllers are responsible for writing successful responses directly
// to the ResponseWriter. On error, they MUST NOT write anything and
// instead return a custom error value which will be handled centrally.
type ControllerFunc func(w http.ResponseWriter, r *http.Request) error

// AdaptController converts a ControllerFunc into a standard http.HandlerFunc.
// It calls the controller and, if a non-nil error is returned, panics with it.
// The global error middleware is responsible for recovering from this panic
// and translating the error into an HTTP response.
func AdaptController(c ControllerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := c(w, r); err != nil {
			panic(err)
		}
	}
}
