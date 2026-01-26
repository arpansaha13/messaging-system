package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	command := os.Args[1]

	switch command {
	case "up":
		migrateUp()
	case "down":
		migrateDown()
	case "status":
		migrateStatus()
	default:
		fmt.Printf("Unknown command: %s\n\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println(`Usage: go run cmd/migrate/main.go [command]

Commands:
  up       - Apply all pending migrations
  down     - Rollback the last migration
  status   - Show migration status

Environment:
  DATABASE_URL - PostgreSQL connection string (required)

Example:
  DATABASE_URL="postgres://user:pass@localhost:5432/messaging" go run cmd/migrate/main.go up`)
}

func migrateUp() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	migrationsDir := "migrations"
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("Failed to read migrations directory: %v", err)
	}

	upFiles := []string{}
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".up.sql") {
			upFiles = append(upFiles, file.Name())
		}
	}

	if len(upFiles) == 0 {
		log.Println("No migrations to apply")
		return
	}

	for _, file := range upFiles {
		path := filepath.Join(migrationsDir, file)
		log.Printf("Applying migration: %s", file)

		cmd := exec.Command("psql", dbURL, "-f", path)
		if output, err := cmd.CombinedOutput(); err != nil {
			log.Fatalf("Failed to apply migration %s: %v\n%s", file, err, output)
		}

		log.Printf("Successfully applied: %s", file)
	}

	log.Println("All migrations applied successfully!")
}

func migrateDown() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	fmt.Println("Rolling back the last migration...")
	fmt.Println("This will execute: migrations/0001_initial_schema.down.sql")

	path := filepath.Join("migrations", "0001_initial_schema.down.sql")

	cmd := exec.Command("psql", dbURL, "-f", path)
	if output, err := cmd.CombinedOutput(); err != nil {
		log.Fatalf("Failed to rollback: %v\n%s", err, output)
	}

	log.Println("Successfully rolled back!")
}

func migrateStatus() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Simple status check: list tables
	query := `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`

	cmd := exec.Command("psql", dbURL, "-c", query)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Fatalf("Failed to get status: %v", err)
	}

	fmt.Println("Database tables:")
	fmt.Println(string(output))
}
