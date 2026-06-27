package response

import (
	"net/http"
	"reflect"

	"github.com/gin-gonic/gin"
)

type Envelope struct {
	Data any `json:"data"`
}

type ErrorEnvelope struct {
	Error APIError `json:"error"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// normalizeNilSlice ensures empty Go slices encode as JSON [] instead of null.
func normalizeNilSlice(data any) any {
	if data == nil {
		return []any{}
	}
	v := reflect.ValueOf(data)
	if v.Kind() == reflect.Slice && v.IsNil() {
		return reflect.MakeSlice(v.Type(), 0, 0).Interface()
	}
	return data
}

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Envelope{Data: normalizeNilSlice(data)})
}

func Error(c *gin.Context, status int, code string, message string) {
	c.JSON(status, ErrorEnvelope{
		Error: APIError{
			Code:    code,
			Message: message,
		},
	})
}
