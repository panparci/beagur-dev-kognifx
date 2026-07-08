FROM golang:1.26-alpine AS build

WORKDIR /src
RUN apk add --no-cache build-base

COPY be/go.mod be/go.sum ./
RUN go mod download

COPY be/ ./
RUN CGO_ENABLED=1 GOOS=linux go build -o /out/api ./cmd/api
RUN CGO_ENABLED=1 GOOS=linux go build -o /out/migrate ./cmd/migrate

FROM alpine:3.22

RUN apk add --no-cache ca-certificates wget

WORKDIR /app
COPY --from=build /out/api /app/api
COPY --from=build /out/migrate /app/migrate
COPY be/migrations /app/migrations

EXPOSE 8080
CMD ["/app/api"]
