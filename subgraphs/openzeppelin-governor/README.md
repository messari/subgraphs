# Open Zeppelin Governor Subgraph

## Project Layout

### schema.graphql

Shared schema for all Compound forks.

### abis

Standard Compound abis.

### src

Shared logic among the forks.

### queries

Useful queries to run against a Compound fork subgraph.

### protocols

Protocol-specific subgraph definition, abis and implementations.

## Quickstart

## Setup

Setting up a new subgraph will require mimicing what is done currently.

- Under `./protocols` will be the fork in a new folder
- Any protocol-specific mappings will live in `./protocols/$(protocol)/src`
- Setup a config folder in `./protocols/$(protocol)/config` for the supported networks and the manifest template
- Lastly you need to add your configuration to [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json)
- You can also reference the deployment [README](../../deployment/README.md) for help

### 1) Graph Init

It is quickest to use graph init to grab ABIs and generate reference code. Note that we will only be copying code over. This folder will be deleted once we are done.
`graph init --product hosted-service danielkhoo/truefi-governance`

### 2) Duplicate existing OZ Governor subgraph

- Under `./abis`, create a new folder with the 2 new ABIs
  - update `./config/networks/mainnet/mainnet.json` with contract addresses and startblocks. (use miniscan to get look it up)
- Under `./protocols`, clone one of the existing folder, rename it your new subgraph
  - In `./protocols/subgraph-name/templates/`, modify xyz-governance.template.yml
    - Replace contract names
    - Copy over relevant eventHandlers from the generate yml (ensures we have the right events), leave out irrelevant event/handlers
    - Change lines `file: ...` to the correct names
- Once done with the subgraph `npm run prepare:yaml --protocol=silo-governance --template=silo-governance.template.yaml` to generate the yaml, then `graph codegen` to gen the ts files
- Next go through the ts mapping/handler files: rename them to the generate file names, update file paths with the correct contract names, copy over any missing handlers from the generated handlers

- Once completed, test compilation with `npm run prepare:build`

### 3) Run locally

(In Separate Terminal)

```
ipfs daemon
```

(In Separate Terminal)

```
cargo run -p graph-node --release -- \
  --postgres-url postgresql://daniel:@localhost:5432/graph-node \
  --ethereum-rpc mainnet:https://eth-mainnet.g.alchemy.com/v2/<api-key> \
  --ipfs 127.0.0.1:5001
```

(Main Terminal)

```
npm run create-local --name=subgraph-name
npm run deploy-local --name=subgraph-name
```

## Deployment

**NOTE: Subgraph bust first be created on the hosted service at** https://thegraph.com/hosted-service/dashboard

**And authenticated via cli**

```
graph auth --product hosted-service {access-token-value}
```

Once everything is setup properly deploying is very easy.

```bash
# This example will deploy ens-governance to the hosted service under "danielkhoo/ens-governance" in deploymentConfigurations.json.
--subgraph=openzeppelin-governor --protocol=ens-governance --network=mainnet --location=danielkhoo
```

> Setting `deploy-on-merge` to `true` in [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json) will run the above commands on subgraphs that have changed to messari's hosted service.
