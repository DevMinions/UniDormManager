package main

import (
	"fmt"
	"unidorm-manager-server/auth"
)

func main() {
	hash, err := auth.HashPassword("admin123")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	fmt.Printf("Hash: %s\n", hash)
	
	valid := auth.CheckPassword("admin123", hash)
	fmt.Printf("Password check: %v\n", valid)
}

