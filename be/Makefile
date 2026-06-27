APP_NAME := bea-guru-api

-include .env
export

.PHONY: run build test tidy sqlc db-ping migrate-up migrate-down migrate-status \
	seed-scale seed-scale-visible cleanup-scale

run:
	go run ./cmd/api

build:
	go build -o bin/$(APP_NAME) ./cmd/api

test:
	go test ./...

tidy:
	go mod tidy

sqlc:
	sqlc generate

db-ping:
	psql "$$DATABASE_URL" -c "select current_database() as db, current_user as user_name;"

migrate-up:
	$(MAKE) db-ping
	go run ./cmd/migrate up

migrate-down:
	$(MAKE) db-ping
	go run ./cmd/migrate down

migrate-status:
	$(MAKE) db-ping
	go run ./cmd/migrate status

seed-scale:
	$(MAKE) db-ping
	psql "$$DATABASE_URL" -f scripts/seed-scale-data.sql

seed-scale-visible:
	$(MAKE) db-ping
	psql "$$DATABASE_URL" -f scripts/seed-scale-visible.sql

cleanup-scale:
	$(MAKE) db-ping
	psql "$$DATABASE_URL" -f scripts/cleanup-scale-data.sql
