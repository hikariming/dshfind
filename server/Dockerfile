# syntax=docker/dockerfile:1
FROM golang:1.25-alpine AS build
WORKDIR /app
# Railway 由仓库根目录的 railway.json 选中本 Dockerfile，因此 build context
# 是仓库根目录；只复制 server 子目录，避免把前端源码带进 Go 构建层。
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /api ./cmd/api

# distroless/static 而非 scratch:自带 CA 证书(Turso 走 TLS 必需)+ nonroot 用户
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /api /api
EXPOSE 8080
ENTRYPOINT ["/api"]
