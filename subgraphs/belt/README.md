# Belt Subgraph

## Links

- Protocol website: https://belt.fi/landing
- Protocol documentation: https://docs.belt.fi/
- Deployed addresses: https://docs.belt.fi/contracts/contract-deployed-info

## Setup

1. Install all the dependencies

```
yarn add

# global packages
yarn global add @graphprotocol/graph-cli
yarn global add mustache
```

2. Generate types

```
yarn run prepare
yarn run codegen
```

3. Building the subgraph

```
yarn run prepare
yarn run build
```

5. Deploy

```
graph auth --product hosted-service <access-token>
graph deploy --product hosted-service <username/subgraph-name>
```
