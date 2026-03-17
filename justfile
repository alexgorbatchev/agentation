set positional-arguments

build-router:
	mkdir -p bin
	cd router && go build -o ../bin/agentation-router ./cmd/agentation-router

test-router:
	cd router && go test ./...

fmt-router:
	cd router && go fmt ./...

lint-router:
	cd router && go test ./...

