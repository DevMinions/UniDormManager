package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"unidorm-manager-server/auth"
	"unidorm-manager-server/config"
	"unidorm-manager-server/database"
)

func main() {
	// 加载配置
	cfg := config.LoadConfig()

	// 初始化数据库
	if err := database.InitDatabase(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDatabase()

	// 生成管理员密码哈希
	password := "admin123"
	if len(os.Args) > 1 {
		password = os.Args[1]
	}

	passwordHash, err := auth.HashPassword(password)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	ctx := context.Background()

	// 检查管理员是否已存在
	var exists bool
	err = database.DB.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE username = 'admin')").Scan(&exists)
	if err != nil {
		log.Fatalf("Failed to check admin user: %v", err)
	}

	if exists {
		// 更新密码
		_, err = database.DB.Exec(ctx,
			"UPDATE users SET password_hash = $1 WHERE username = 'admin'",
			passwordHash)
		if err != nil {
			log.Fatalf("Failed to update admin password: %v", err)
		}
		fmt.Println("Admin password updated successfully")
	} else {
		// 创建管理员用户
		adminID := uuid.New().String()
		_, err = database.DB.Exec(ctx,
			`INSERT INTO users (id, username, password_hash, email, real_name, status) 
			 VALUES ($1, 'admin', $2, 'admin@unidorm.edu', '系统管理员', 'Active')`,
			adminID, passwordHash)
		if err != nil {
			log.Fatalf("Failed to create admin user: %v", err)
		}

		// 分配系统管理员角色
		_, err = database.DB.Exec(ctx,
			"INSERT INTO user_roles (user_id, role_id) VALUES ($1, 'role-system-admin')",
			adminID)
		if err != nil {
			log.Fatalf("Failed to assign role: %v", err)
		}

		fmt.Println("Admin user created successfully")
	}

	fmt.Printf("Username: admin\n")
	fmt.Printf("Password: %s\n", password)
	fmt.Println("\nPlease change the password after first login!")
}

