.PHONY: bootstrap up down clean dev seed ingest typecheck test

bootstrap:
	@echo "==> Installing dependencies"
	pnpm install
	@echo "==> Starting infra"
	docker compose up -d
	@echo "==> Waiting for Postgres"
	@sleep 8
	@echo "==> Migrating DB"
	pnpm db:migrate
	@echo "==> Generating Prisma client"
	pnpm db:generate
	@echo "==> Seeding"
	pnpm db:seed
	@echo "==> Bootstrap complete. Run 'make dev' to start."

up:
	docker compose up -d

down:
	docker compose down

dev:
	pnpm dev

seed:
	pnpm db:seed

ingest:
	pnpm ingest:ebay

typecheck:
	pnpm typecheck

test:
	pnpm test

clean:
	docker compose down -v
	pnpm clean
