
help:										## Show this help.
	@echo ''
	@echo 'Available commands:'
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ''
.PHONY: help

gen-readme:							## Generate the README.md (using docker-verb)
	npm run docs
.PHONY: gen-readme

build:									## Build the docker image.
	docker build -t sammlerio/scheduler-service .
.PHONY: build

up-deps:								## Get up the dependencies.
	docker-compose --f=docker-compose.deps.yml up
.PHONY: up-deps

down-deps:							## Tear down the dependencies.
	docker-compose --f=docker-compose.deps.yml down
.PHONY: down-deps
