# run make to do a full deployment

# all: prepare codegen deploy
all: codegen deploy

# prepare the manifest for $(chain)
prepare:; npm run prepare:$(chain)

# generate the assemblyscript
codegen:; graph codegen

# build the subgraph per manifest
build:; graph build

# deploy to the hosted service using the  
deploy:; graph deploy dmelotik/layer-one-$(chain) --node https://api.thegraph.com/deploy/
