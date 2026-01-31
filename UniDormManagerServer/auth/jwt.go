package auth

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// JWT 密钥（生产环境应从环境变量读取）
	jwtSecret = []byte("your-secret-key-change-in-production")
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

// SetJWTSecret 设置 JWT 密钥（从环境变量读取）
func SetJWTSecret(secret string) error {
	fmt.Printf("🔐 JWT Secret Attempt: secret length=%d\n", len(secret))

	if err := validateJWTSecret(secret); err != nil {
		fmt.Printf("❌ JWT Secret validation failed: %v\n", err)
		// 尝试从环境变量读取
		envSecret := os.Getenv("JWT_SECRET")
		fmt.Printf("🔍 Environment JWT_SECRET length=%d\n", len(envSecret))
		if envSecret != "" {
			if err := validateJWTSecret(envSecret); err == nil {
				jwtSecret = []byte(envSecret)
				fmt.Println("✅ JWT密钥已从环境变量加载")
				return nil
			} else {
				fmt.Printf("❌ Environment JWT Secret validation failed: %v\n", err)
			}
		}
		// 生成随机密钥作为最后手段
		fmt.Println("⚠️  警告: 使用随机生成的JWT密钥，重启服务后将失效")
		fmt.Println("⚠️  请设置环境变量 JWT_SECRET 来持久化密钥")
		jwtSecret = []byte(generateRandomSecret())
		return err
	}
	jwtSecret = []byte(secret)
	fmt.Printf("✅ JWT Secret set successfully: length=%d\n", len(secret))
	return nil
}

// generateRandomSecret 生成随机密钥（仅用于开发环境）
func generateRandomSecret() string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
	result := make([]byte, 64)
	for i := range result {
		result[i] = chars[i%len(chars)]
	}
	return string(result)
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

