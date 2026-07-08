FE_DIR := fe
BE_DIR := be

.PHONY: run run-fe run-be install install-fe install-be build build-fe build-be \
	db-ping migrate-up migrate-down migrate-status clean \
	docker-up docker-down docker-wait setup dev stop \
	seed-scale cleanup-scale seed-scale-visible loadtest audit-rbac audit-dev \
	cleanup-except-admin reset-data sync-r2-static prod-backup prod-health fix-auth-jwks

# Bebaskan port dev jika proses lama masih nyangkut (penyebab auth/register gagal).
stop:
	@for p in 3001 8080 3000; do \
		pid=$$(lsof -t -iTCP:$$p -sTCP:LISTEN 2>/dev/null || true); \
		if [ -n "$$pid" ]; then echo "Stopping :$$p (pid $$pid)"; kill $$pid 2>/dev/null || true; fi; \
	done
	@sleep 1

run: stop
	@echo "Starting auth (:3001) + backend (:8080) + frontend (:3000) — Ctrl+C stops all"
	@trap 'kill 0' INT TERM EXIT; \
	(cd $(FE_DIR) && npm run dev:auth) & \
	for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do \
		curl -sf http://localhost:3001/healthz >/dev/null && break; sleep 1; \
	done; \
	curl -sf http://localhost:3001/healthz >/dev/null || { echo "ERROR: Auth :3001 tidak jalan setelah 15s. make stop && make run"; exit 1; }; \
	SESSION=$$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3001/api/auth/get-session || echo 000); \
	if [ "$$SESSION" = "500" ]; then \
		echo "WARN: get-session 500 — memperbaiki JWKS (BETTER_AUTH_SECRET mismatch)..."; \
		$(MAKE) fix-auth-jwks; \
		sleep 2; \
	fi; \
	(cd $(BE_DIR) && $(MAKE) build) || { echo "ERROR: Backend gagal compile. cd be && make run"; exit 1; }; \
	(cd $(BE_DIR) && ./bin/bea-guru-api) & \
	for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do \
		curl -sf http://localhost:8080/healthz >/dev/null && break; sleep 1; \
	done; \
	curl -sf http://localhost:8080/healthz >/dev/null || { echo "ERROR: API :8080 tidak jalan setelah 30s. Cek Postgres: make db-ping — lalu cd be && make run"; exit 1; }; \
	(cd $(FE_DIR) && npm run dev -- --host 0.0.0.0) & \
	wait

run-fe:
	cd $(FE_DIR) && npm run dev -- --host 0.0.0.0

run-be:
	cd $(BE_DIR) && $(MAKE) run

install: install-fe install-be

install-fe:
	cd $(FE_DIR) && npm install

install-be:
	cd $(BE_DIR) && go mod download

build: build-fe build-be

build-fe:
	cd $(FE_DIR) && npm run build

build-be:
	cd $(BE_DIR) && $(MAKE) build

db-ping:
	cd $(BE_DIR) && $(MAKE) db-ping

migrate-up:
	cd $(BE_DIR) && $(MAKE) migrate-up

migrate-down:
	cd $(BE_DIR) && $(MAKE) migrate-down

migrate-status:
	cd $(BE_DIR) && $(MAKE) migrate-status

docker-up:
	docker compose up -d postgres

docker-down:
	docker compose down

docker-wait:
	@echo "Waiting for PostgreSQL..."
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do \
		docker compose exec -T postgres pg_isready -U bea_guru_app -d bea_guru >/dev/null 2>&1 && exit 0; \
		sleep 2; \
	done; \
	echo "PostgreSQL not ready"; exit 1

setup: docker-up docker-wait migrate-up install-fe auth-setup build-be build-fe
	@echo "Setup complete. Run: make run"

auth-setup:
	cd $(FE_DIR) && npm run auth:migrate && npm run auth:seed

dev: run

seed-scale:
	cd $(BE_DIR) && $(MAKE) seed-scale

seed-scale-visible:
	cd $(BE_DIR) && $(MAKE) seed-scale-visible

cleanup-scale:
	cd $(BE_DIR) && $(MAKE) cleanup-scale

loadtest:
	BASE_URL=http://localhost:8080 bash $(BE_DIR)/scripts/loadtest.sh

audit-rbac:
	BASE_URL=http://localhost:8080 bash $(BE_DIR)/scripts/audit-rbac.sh

cleanup-except-admin:
	cd $(BE_DIR) && $(MAKE) cleanup-except-admin

reset-data: cleanup-except-admin
	@echo "Data bisnis direset — hanya beaguru07@gmail.com yang tersisa."

sync-r2-static:
	cd $(BE_DIR) && go run ./cmd/r2static

prod-backup:
	ENV_FILE=.env.production bash $(BE_DIR)/scripts/backup-prod.sh

prod-health:
	BASE_URL=$${BASE_URL:-http://localhost} bash $(BE_DIR)/scripts/health-check-prod.sh

audit-dev:
	bash $(BE_DIR)/scripts/audit-dev.sh

fix-auth-jwks:
	@url=$$(grep -E '^DATABASE_URL=' $(BE_DIR)/.env | cut -d= -f2- | tr -d '\r'); \
	if [ -z "$$url" ]; then echo "ERROR: DATABASE_URL tidak ada di be/.env"; exit 1; fi; \
	psql "$$url" -f $(BE_DIR)/scripts/fix-auth-jwks.sql; \
	echo "JWKS cleared — auth akan regenerate key pada request berikutnya"

clean:
	rm -rf $(FE_DIR)/dist
