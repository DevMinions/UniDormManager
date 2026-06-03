package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// JWT 密钥（必须由 SetJWTSecret 设置；生产无强密钥则拒绝启动）
	jwtSecret []byte
	// Token 过期时间：24小时
	TokenExpiration = 24 * time.Hour
)

// Claims JWT Claims 结构
type Claims struct {
	UserID      string   `json:"userId"`
	Username    string   `json:"username"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
	BuildingIDs []string `json:"buildingIds,omitempty"` // 楼栋管理员关联的楼栋
	StudentID   *string  `json:"studentId,omitempty"`   // 如果是学生
	jwt.RegisteredClaims
}

// validateJWTSecret 验证JWT密钥是否符合安全要求
func validateJWTSecret(secret string) error {
	if secret == "" {
		return errors.New("JWT密钥不能为空")
	}
	if len(secret) < 32 {
		return fmt.Errorf("JWT密钥长度至少需要32个字符，当前长度: %d", len(secret))
	}
	// 检查是否使用默认密钥
	if secret == "your-secret-key-change-in-production" {
		return errors.New("检测到使用默认JWT密钥，请立即更换为安全的密钥")
	}
	return nil
}

// SetJWTSecret 校验并设置 JWT 密钥；不合格返回 error（由调用方决定 fatal 还是回退）
func SetJWTSecret(secret string) error {
	if err := validateJWTSecret(secret); err != nil {
		return err
	}
	jwtSecret = []byte(secret)
	return nil
}

// SetRandomDevSecret 仅非生产环境缺密钥时回退使用
func SetRandomDevSecret() {
	jwtSecret = []byte(generateRandomSecret())
}

// generateRandomSecret 生成密码学安全随机密钥
func generateRandomSecret() string {
	b := make([]byte, 48)
	if _, err := rand.Read(b); err != nil {
		panic("failed to generate random JWT secret: " + err.Error())
	}
	return base64.StdEncoding.EncodeToString(b)
}

// GenerateToken 生成 JWT Token
func GenerateToken(userID, username string, roles, permissions, buildingIDs []string, studentID *string) (string, error) {
	now := time.Now()
	expiresAt := now.Add(TokenExpiration)

	claims := Claims{
		UserID:      userID,
		Username:    username,
		Roles:       roles,
		Permissions: permissions,
		BuildingIDs: buildingIDs,
		StudentID:   studentID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "unidorm-manager",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ParseToken 解析 JWT Token
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// ValidateToken 验证 Token 是否有效
func ValidateToken(tokenString string) (*Claims, error) {
	claims, err := ParseToken(tokenString)
	if err != nil {
		return nil, err
	}

	// 检查是否过期
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, errors.New("token expired")
	}

	return claims, nil
}
