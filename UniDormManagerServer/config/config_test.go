package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsProduction(t *testing.T) {
	assert.True(t, (&Config{Env: "production"}).IsProduction())
	assert.False(t, (&Config{Env: "development"}).IsProduction())
	assert.False(t, (&Config{Env: ""}).IsProduction())
}

func TestLoadConfigEnvDefault(t *testing.T) {
	os.Unsetenv("APP_ENV")
	assert.Equal(t, "development", LoadConfig().Env)
	os.Setenv("APP_ENV", "production")
	defer os.Unsetenv("APP_ENV")
	assert.Equal(t, "production", LoadConfig().Env)
}
