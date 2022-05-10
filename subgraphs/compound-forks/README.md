# Compound Fork Subgraph

## Deployments

### Moonwell

https://thegraph.com/hosted-service/subgraph/0xbe1/moonwell-subgraph

### Bastion Protocol

https://thegraph.com/hosted-service/subgraph/0xbe1/bastionprotocol-subgraph

### Benqi

https://thegraph.com/hosted-service/subgraph/0xbe1/benqi-subgraph

## Quickstart

Use moonwell as an example.

```
yarn

# generate code under root
# codegen needs subgraph.yaml, here borrow one from bastion-protocol/
# why bastion-protocol? because it doesn't override any abi, hence an ideal candidate
graph codegen bastion-protocol/subgraph.yaml -o ./generated

# generate code under moonwell
subgraph=moonwell make codegen

# build moonwell
subgraph=moonwell make build

# deploy moonwell
make deploy subgraph-name=0xbe1/moonwell-subgraph subgraph=moonwell
```

## Project Layout

### schema.graphql

Shared schema for all Compound forks.

### abis

Standard Compound abis.

### src

Shared logic among the forks.

### queries

Useful queries to run against a Compound fork subgraph.

### bastion-protocol/moonwell/etc

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
