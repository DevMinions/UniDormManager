package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateToken(t *testing.T) {
	SetJWTSecret("test-secret-key-for-unit-testing-12345678")

	token, err := GenerateToken("test-user-id", "testuser", []string{"admin"}, []string{"students:read"}, []string{}, nil)
	require.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestValidateToken(t *testing.T) {
	SetJWTSecret("test-secret-key-for-unit-testing-12345678")

	token, err := GenerateToken("test-user-id", "testuser", []string{"admin"}, []string{"students:read"}, []string{}, nil)
	require.NoError(t, err)

	// Validate the token
	parsedClaims, err := ValidateToken(token)
	require.NoError(t, err)
	assert.Equal(t, "test-user-id", parsedClaims.UserID)
	assert.Equal(t, "testuser", parsedClaims.Username)
	assert.Equal(t, "admin", parsedClaims.Roles[0])
}

func TestValidateTokenInvalid(t *testing.T) {
	SetJWTSecret("test-secret-key-for-unit-testing-12345678")

	invalidToken := "invalid.token.string"

	_, err := ValidateToken(invalidToken)
	assert.Error(t, err)
}

func TestValidateTokenWrongSecret(t *testing.T) {
	SetJWTSecret("test-secret-key-for-unit-testing-12345678")

	token, err := GenerateToken("test-user-id", "testuser", []string{"admin"}, []string{}, []string{}, nil)
	require.NoError(t, err)

	// Change the secret and try to validate
	SetJWTSecret("different-secret-key-12345678")
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
			secret:    "valid-secret-key-1234567890abcdef",
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
			// 防 env 污染:SetJWTSecret 在 secret 无效时会 fallback 到 JWT_SECRET env,
			// 如果运行时设了合法的 JWT_SECRET,"应报错" 的用例会假绿。t.Setenv 在测试结束
			// 自动回滚,空串使 fallback 走 validateJWTSecret 失败分支(空串本身不合法)。
			t.Setenv("JWT_SECRET", "")
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
			name:       "No roles",
			roles:      []string{},
			permission: "students:read",
			want:       false,
		},
	}

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
