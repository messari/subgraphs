# run make to do a full deployment

# used for easy testing deployments
# an example of deploying our network subgraph on mainnet:
#  $ make network=mainnet network-type=evm
all: prepare codegen deploy

# prepare the manifest for $(network)
.PHONY: prepare
prepare:; npm run prepare:yaml --network=$(network) --protocol=$(network-type) --template=$(network-type).template.yaml

# generate the assemblyscript
.PHONY: codegen
codegen:; graph codegen

# build the subgraph per manifest
.PHONY: build
build:; graph build

# deploy to the hosted service using the  
.PHONY: deploy
deploy:; graph deploy dmelotik/network-$(network) --node https://api.thegraph.com/deploy/

# used to make a network template and json file for deployments
template:; mkdir ./protocols/evm/config/networks/$(network) ; echo '{\n\t"network": "$(network)"\n}' > ./protocols/evm/config/networks/$(network)/$(network).json