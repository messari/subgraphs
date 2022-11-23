# Compound Fork Subgraph

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
