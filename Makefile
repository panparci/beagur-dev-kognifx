FE_DIR := fe
BE_DIR := be

.PHONY: run run-fe run-be install install-fe build build-fe build-be \
	db-ping migrate-up migrate-down migrate-status clean \
	docker-up docker-down docker-wait setup dev stop \
	seed-scale cleanup-scale seed-scale-visible loadtest audit-rbac

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
	sleep 1; \
	/usr/bin/curl -sf http://localhost:3001/healthz >/dev/null || (echo "ERROR: Auth server :3001 tidak jalan. Coba: make stop && make run" && exit 1); \
	(cd $(BE_DIR) && $(MAKE) run) & \
	(cd $(FE_DIR) && npm run dev -- --host 0.0.0.0) & \
	wait

run-fe:
	cd $(FE_DIR) && npm run dev -- --host 0.0.0.0

run-be:
	cd $(BE_DIR) && $(MAKE) run

install: install-fe

install-fe:
	cd $(FE_DIR) && npm install

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

clean:
	rm -rf $(FE_DIR)/dist
