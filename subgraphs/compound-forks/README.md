# Compound Fork Subgraph

## Quickstart

### Setup

Setting up a new subgraph will require mimicking what is done currently.

- Under `./protocols` will be the fork in a new folder
- Any protocol-specific mappings will live in `./protocols/$(protocol)/src`
- Setup a config folder in `./protocols/$(protocol)/config` for the supported networks and the manifest template
- Lastly you need to add your configuration to [deploymentConfigurations.json](../../deployment/deploymentConfigurations.json)
- You can also reference the deployment [README](../../deployment/README.md) for help

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
