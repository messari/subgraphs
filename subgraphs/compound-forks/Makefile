.PHONY: codegen
codegen:
	graph codegen $(subgraph)/subgraph.yaml -o $(subgraph)/generated

.PHONY: build
build:
	graph build $(subgraph)/subgraph.yaml -o $(subgraph)/build

.PHONY: deploy
deploy:
	graph deploy $(subgraph-name) $(subgraph)/subgraph.yaml --node https://api.thegraph.com/deploy/
deploy-local:
	graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 $(subgraph-name) $(subgraph)/subgraph.yaml

.PHONY: create
create-local:
	graph create --node http://localhost:8020/ $(subgraph-name)

.PHONY: remove
remove-local:
	graph remove --node http://localhost:8020/ $(subgraph-name)