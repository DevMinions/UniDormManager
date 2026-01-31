package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"unidorm-manager-server/auth"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func init() {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	auth.SetJWTSecret("test-secret-key-for-unit-testing-12345678")
}

func TestAuthMiddleware(t *testing.T) {
	tests := []struct {
		name       string
		token      string
		wantStatus int
		wantBody   string
	}{
		{
			name:       "Valid token",
			token:      generateValidToken(),
			wantStatus: http.StatusOK,
			wantBody:   "success",
		},
		{
			name:       "Missing token",
			token:      "",
			wantStatus: http.StatusUnauthorized,
			wantBody:   "unauthorized",
		},
		{
			name:       "Invalid token",
			token:      "invalid.token.string",
			wantStatus: http.StatusUnauthorized,
			wantBody:   "unauthorized",
		},
		{
			name:       "Expired token",
			token:      generateExpiredToken(),
			wantStatus: http.StatusUnauthorized,
			wantBody:   "unauthorized",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(AuthMiddleware())
			router.GET("/test", func(c *gin.Context) {
				c.String(http.StatusOK, "success")
			})

			req := httptest.NewRequest("GET", "/test", nil)
			if tt.token != "" {
				req.Header.Set("Authorization", "Bearer "+tt.token)
			}
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.wantStatus, w.Code)
			assert.Contains(t, w.Body.String(), tt.wantBody)
		})
	}
}

func TestRequirePermission(t *testing.T) {
	tests := []struct {
		name       string
		token      string
		permission string
		wantStatus int
	}{
		{
			name:       "Has permission",
			token:      generateValidToken(),
			permission: "students:read",
			wantStatus: http.StatusOK,
		},
		{
			name:       "No permission",
			token:      generateValidToken(),
			permission: "admin:delete",
			wantStatus: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(AuthMiddleware())
			router.GET("/test", RequirePermission(tt.permission), func(c *gin.Context) {
				c.String(http.StatusOK, "success")
			})

			req := httptest.NewRequest("GET", "/test", nil)
			req.Header.Set("Authorization", "Bearer "+tt.token)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.wantStatus, w.Code)
		})
	}
}

func TestCORSMiddleware(t *testing.T) {
	router := gin.New()
	router.Use(CORS())
	router.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "success")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Check CORS headers
	assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "GET, POST, PUT, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	assert.Equal(t, "Content-Type, Authorization", w.Header().Get("Access-Control-Allow-Headers"))
}

func TestCORSPreflight(t *testing.T) {
	router := gin.New()
	router.Use(CORS())
	router.OPTIONS("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "success")
	})

	req := httptest.NewRequest("OPTIONS", "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
}

// Helper functions
func generateValidToken() string {
	token, _ := auth.GenerateToken(&auth.Claims{
		UserID:   "test-user-id",
		Username: "testuser",
		Roles:    []string{"admin"},
		BuildingIDs: []string{},
		RegisteredClaims: auth.GetDefaultClaims(),
	})
	return token
}

func generateExpiredToken() string {
	token, _ := auth.GenerateToken(&auth.Claims{
		UserID:   "test-user-id",
		Username: "testuser",
		Roles:    []string{"admin"},
		BuildingIDs: []string{},
		RegisteredClaims: auth.GetExpiredClaims(),
	})
	return token
}
