APP_NAME := bea-guru-api

-include .env
export

.PHONY: run build test tidy sqlc db-ping migrate-up migrate-down migrate-status \
	seed-scale seed-scale-visible cleanup-scale cleanup-except-admin cleanup-prod-keep-argha sync-r2-static

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

cleanup-except-admin:
	$(MAKE) db-ping
	psql "$$DATABASE_URL" -f scripts/cleanup-all-except-admin.sql

cleanup-prod-keep-argha:
	@if [ "$$CONFIRM_CLEANUP" != "YES" ]; then echo "Set CONFIRM_CLEANUP=YES"; exit 1; fi
	$(MAKE) db-ping
	psql "$$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cleanup-all-except-admin-and-argha.sql

sync-r2-static:
	go run ./cmd/r2static
