.PHONY: codegen
codegen:
	graph codegen $(subgraph)/subgraph.yaml -o $(subgraph)/generated

.PHONY: build
build:
	graph build $(subgraph)/subgraph.yaml -o $(subgraph)/build

.PHONY: deploy
deploy:
	graph deploy $(subgraph-name) $(subgraph)/subgraph.yaml --node https://api.thegraph.com/deploy/
