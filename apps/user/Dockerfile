FROM golang:1.25-alpine AS builder

# Add required build dependencies
RUN apk add --no-cache gcc musl-dev git

WORKDIR /app/common
COPY apps/common ./

WORKDIR /app/user

ENV CGO_ENABLED=1
ENV GOCACHE=/go-cache
ENV GOMODCACHE=/gomod-cache
ENV GOPROXY=direct
ENV GOSUMDB=off

COPY apps/user/go.mod apps/user/go.sum ./
COPY apps/user/cmd/ ./cmd/
COPY apps/user/internal/ ./internal/
COPY apps/user/migrations/ ./migrations/

RUN --mount=type=cache,target=/gomod-cache \
  --mount=type=cache,target=/go-cache \
  go build -ldflags="-w -s" \
  -o server ./cmd/main.go

FROM alpine:3.22.0

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary and migrations from builder
COPY --from=builder /app/user/server .
COPY --from=builder /app/user/migrations ./migrations

EXPOSE 4000 50051

CMD ["./server"]
