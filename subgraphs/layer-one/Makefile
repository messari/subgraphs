# run make to do a full deployment

# all: prepare codegen deploy
all: codegen deploy

# prepare the manifest for $(chain)
.PHONY: prepare
prepare:; npm run prepare:$(chain)

# generate the assemblyscript
.PHONY: codegen
codegen:; graph codegen

# build the subgraph per manifest
.PHONY: build
build:; graph build

# deploy to the hosted service using the  
.PHONY: deploy
deploy:; graph deploy dmelotik/layer-one-$(chain) --node https://api.thegraph.com/deploy/
