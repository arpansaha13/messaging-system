#!/bin/bash
set -e

# List of databases you want to create
databases=("auth_e2e_db" "auth_load_db")

# Loop through and create each database
for db in "${databases[@]}"; do
    echo "Creating database: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE "$db";
EOSQL
done
