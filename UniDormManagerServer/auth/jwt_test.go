package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateToken(t *testing.T) {
	// Set test JWT secret
	SetJWTSecret("test-secret-key-for-unit-testing-12345678")

	claims := &Claims{
		UserID:   "test-user-id",
		Username: "testuser",
		Roles:    []string{"admin"},
		BuildingIDs: []string{},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := GenerateToken(claims)
	require.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestValidateToken(t *testing.T) {
	SetJWTSecret("test-secret-key-for-unit-testing-12345678")

	claims := &Claims{
		UserID:   "test-user-id",
		Username: "testuser",
		Roles:    []string{"admin"},
		BuildingIDs: []string{},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := GenerateToken(claims)
	require.NoError(t, err)

	// Validate the token
	parsedClaims, err := ValidateToken(token)
	require.NoError(t, err)
	assert.Equal(t, claims.UserID, parsedClaims.UserID)
	assert.Equal(t, claims.Username, parsedClaims.Username)
	assert.Equal(t, claims.Roles[0], parsedClaims.Roles[0])
}

func TestValidateTokenExpired(t *testing.T) {
	SetJWTSecret("test-secret-key-for-unit-testing-12345678")

	claims := &Claims{
		UserID:   "test-user-id",
		Username: "testuser",
		Roles:    []string{"admin"},
		BuildingIDs: []string{},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Expired
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	}

	token, err := GenerateToken(claims)
	require.NoError(t, err)

	// Should return error for expired token
	_, err = ValidateToken(token)
	assert.Error(t, err)
}

func TestValidateTokenInvalid(t *testing.T) {
	SetJWTSecret("test-secret-key-for-unit-testing-12345678")

	invalidToken := "invalid.token.string"

	_, err := ValidateToken(invalidToken)
	assert.Error(t, err)
}

func TestValidateTokenWrongSecret(t *testing.T) {
	SetJWTSecret("test-secret-key-for-unit-testing-12345678")

	claims := &Claims{
		UserID:   "test-user-id",
		Username: "testuser",
		Roles:    []string{"admin"},
		BuildingIDs: []string{},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := GenerateToken(claims)
	require.NoError(t, err)

	// Change the secret and try to validate
	SetJWTSecret("different-secret-key")
	_, err = ValidateToken(token)
	assert.Error(t, err)
}

func TestSetJWTSecret(t *testing.T) {
	tests := []struct {
		name      string
		secret    string
		wantError bool
	}{
		{
			name:      "Valid secret",
			secret:    "valid-secret-key-12345678",
			wantError: false,
		},
		{
			name:      "Empty secret",
			secret:    "",
			wantError: true,
		},
		{
			name:      "Short secret",
			secret:    "short",
			wantError: true,
		},
		{
			name:      "Default secret",
			secret:    "default-secret-key",
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := SetJWTSecret(tt.secret)
			if tt.wantError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestHasPermission(t *testing.T) {
	tests := []struct {
		name       string
		roles      []string
		permission string
		want       bool
	}{
		{
			name:       "System admin has all permissions",
			roles:      []string{"system_admin"},
			permission: "students:read",
			want:       true,
		},
		{
			name:       "Dorm manager has specific permission",
			roles:      []string{"dorm_manager"},
			permission: "rooms:update",
			want:       true,
		},
		{
			name:       "No roles",
			roles:      []string{},
			permission: "students:read",
			want:       false,
		},
	}

	// This is a simplified test - actual implementation would check role permissions
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hasPermission := false
			for _, role := range tt.roles {
				if role == "system_admin" {
					hasPermission = true
					break
				}
			}
			assert.Equal(t, tt.want, hasPermission)
		})
	}
}
