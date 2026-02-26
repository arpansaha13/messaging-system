FROM golang:1.25-alpine AS builder

# Add required build dependencies
RUN apk add --no-cache gcc musl-dev

WORKDIR /app/common

COPY apps/common ./

WORKDIR /app/auth

# https://medium.com/@marcin.niemira/optimise-docker-build-for-go-c03d6eb8b4b

ENV CGO_ENABLED=1
ENV GOCACHE=/go-cache
ENV GOMODCACHE=/gomod-cache

COPY apps/auth/go.mod apps/auth/go.sum ./
COPY apps/auth/cmd/ ./cmd/
COPY apps/auth/internal/ ./internal/

RUN --mount=type=cache,target=/gomod-cache \
  --mount=type=cache,target=/go-cache \
  go build -ldflags="-w -s" \
  -o server ./cmd/server

FROM alpine:3.22.0

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/auth/server .

EXPOSE 4000

CMD ["./server"]
