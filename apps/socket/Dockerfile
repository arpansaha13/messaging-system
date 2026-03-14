FROM golang:1.25-alpine AS builder

WORKDIR /app/common

COPY apps/common ./

WORKDIR /app/socket

# https://medium.com/@marcin.niemira/optimise-docker-build-for-go-c03d6eb8b4b

ENV CGO_ENABLED=0
ENV GOCACHE=/go-cache
ENV GOMODCACHE=/gomod-cache

COPY apps/socket/go.mod apps/socket/go.sum ./
COPY apps/socket/cmd/ ./cmd/
COPY apps/socket/internal/ ./internal/

RUN --mount=type=cache,target=/gomod-cache \
	--mount=type=cache,target=/go-cache \
	go build -ldflags="-w -s" \
	-o socket ./cmd/server

FROM alpine:3.22.0

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/socket/socket .

EXPOSE 4000

CMD ["./socket"]
