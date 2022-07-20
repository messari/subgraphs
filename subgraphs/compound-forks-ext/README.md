# Compound Fork Subgraph

## Quickstart

### Setup

Setting up a new subgraph will require mimicing what is done currently.

- Under `./protocols` will be the fork in a new folder
- Any protocol-specific mappings will live in `./protocols/$(protocol)/src`
- Setup a config folder in `./protocols/$(protocol)/config` for the supported networks and the manifest template
- Lastly you need to add your configuration to [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json)
- You can also reference the deployment [README](../../deployment/README.md) for help

### Deployment

Once everything is setup properly deploying is very easy.

```bash
# This example will deploy rari-fuse on all networks to the hosted service under "dmelotik" in deploymentConfigurations.json
npm run deploy --SUBGRAPH=compound-forks-ext --PROTOCOL=rari-fuse --LOCATION=dmelotik

# This will do the same, but only deploying the mainnet subgraph
npm run deploy --SUBGRAPH=compound-forks-ext --PROTOCOL=rari-fuse --NETWORK=ethereum --LOCATION=dmelotik
```

> Setting `deploy-on-merge` to `true` in [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json) will run the above commands on subgraphs that have changed to messari's hosted service.

### Development Commands

During development you probably won't want to fully deploy the subgraph every time. Follow this guide to do each step incrementally.

To setup the subgraph manifest from the template:

```bash
# Use rari fuse as an example
npm run prepare:yaml --PROTOCOL=rari-fuse --NETWORK=ethereum --TEMPLATE=rari-fuse.template.yaml
```

To codegen and build:

```bash
graph codegen
graph build
```

> If you are working on multiple subgraphs you may want to delete `./generated/**` before `codegen` so no old files are left behind.

To deploy follow the steps above. You may put your hosted service endpoint in [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json) just how messari's is set to take advantage of the commands.

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

**Notice**: Some forks have different abis from Compound. For example, Moonwell:

1. renames cToken to mToken
1. rename supplyRatePerBlock to supplyRatePerTimestamp because it accrues interest every second, not block
1. add supplyRewardSpeeds and borrowRewardSpeeds

Therefore we need to use Moonwell-specific abis, see moonwell/subgraph.yaml (note the dots!):

```yaml
- name: CToken
    file: ./abis/CToken.json
- name: Comptroller
    file: ./abis/Comptroller.json
- name: ERC20
    file: ../abis/ERC20.json
- name: PriceOracle
    file: ../abis/PriceOracle.json
- name: SolarBeamLPToken
    file: ./abis/SolarBeamLPToken.json
```
