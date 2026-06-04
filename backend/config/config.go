package config

import "os"

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Environment string
	Port        string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/catering_db?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "super-secret-jwt-key-change-in-production-min-32-chars"),
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
