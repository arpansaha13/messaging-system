#!/bin/bash

# Script to generate Go protobuf code from .proto files
# Usage: ./scripts/protoc-gen.sh

set -e

echo "Generating protobuf Go code..."

# Check if protoc is installed
if ! command -v protoc &> /dev/null; then
    echo "Error: protoc is not installed. Please install protoc first."
    echo "Visit: https://github.com/protocolbuffers/protobuf/releases"
    exit 1
fi

# Check if protoc-gen-go is installed
if ! command -v protoc-gen-go &> /dev/null; then
    echo "Installing protoc-gen-go..."
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
fi

# Check if protoc-gen-go-grpc is installed
if ! command -v protoc-gen-go-grpc &> /dev/null; then
    echo "Installing protoc-gen-go-grpc..."
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
fi

# Generate Go code from proto files
PROTO_DIR="proto"
OUT_DIR="pb"

# Create output directory if it doesn't exist
mkdir -p "$OUT_DIR"

# Generate code for each proto file
for proto_file in "$PROTO_DIR"/*.proto; do
    if [ -f "$proto_file" ]; then
        echo "Processing $proto_file..."
        protoc \
            --proto_path=proto \
            --go_out="./$OUT_DIR" \
            --go-grpc_out="./$OUT_DIR" \
            --go_opt=paths=source_relative \
            --go-grpc_opt=paths=source_relative \
            "$proto_file"
    fi
done

echo "Protobuf code generation completed successfully!"
echo "Generated files are in the '$OUT_DIR' directory"
