.PHONY: dev test lint typecheck build e2e

NODE ?= $(shell command -v node 2>/dev/null || command -v /opt/homebrew/bin/node 2>/dev/null || printf node)

dev:
	$(NODE) node_modules/vite/bin/vite.js --host 0.0.0.0

test:
	NODE_OPTIONS=--no-warnings $(NODE) node_modules/vitest/vitest.mjs run

lint:
	$(NODE) check_parse.mjs

typecheck:
	$(NODE) check_parse.mjs

build:
	$(NODE) node_modules/vite/bin/vite.js build

e2e:
	NODE_OPTIONS=--no-warnings $(NODE) node_modules/vitest/vitest.mjs run src/test/MissionBridgePanel.test.jsx
