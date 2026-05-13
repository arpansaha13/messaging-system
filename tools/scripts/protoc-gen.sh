#!/bin/bash

# Usage: ./tools/scripts/protoc-gen.sh (run from project root)

set -e

echo "Generating protobuf Go code for apps/common..."

if ! command -v protoc &> /dev/null; then
    echo "Error: protoc is not installed."
    echo "Visit: https://github.com/protocolbuffers/protobuf/releases"
    exit 1
fi

if ! command -v protoc-gen-go &> /dev/null; then
    echo "Error: protoc-gen-go is not installed."
    echo "Run: go install google.golang.org/protobuf/cmd/protoc-gen-go@latest"
    exit 1
fi

if ! command -v protoc-gen-go-grpc &> /dev/null; then
    echo "Error: protoc-gen-go-grpc is not installed."
    echo "Run: go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest"
    exit 1
fi

cd apps/common

PROTO_DIR="proto"
OUT_DIR="pb"

mkdir -p "$OUT_DIR"

for proto_file in "$PROTO_DIR"/*.proto; do
    if [ -f "$proto_file" ]; then
        echo "Processing $proto_file..."
        protoc \
            --proto_path="$PROTO_DIR" \
            --go_out="./$OUT_DIR" \
            --go-grpc_out="./$OUT_DIR" \
            --go_opt=paths=source_relative \
            --go-grpc_opt=paths=source_relative \
            "$proto_file"
    fi
done

echo "Protobuf code generation completed successfully!"
echo "Generated files are in the '$OUT_DIR' directory"
