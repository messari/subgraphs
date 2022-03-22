# BadgerDAO Subgraph

## Links

- Protocol website: https://badger.com/
- Protocol documentation: https://badger-finance.gitbook.io/badger-finance/
- Smart contracts: https://github.com/Badger-Finance/badger-system
- Deployed addresses: https://docs.badger.com/badger-finance/contract-addresses
- Existing subgraphs: https://github.com/Badger-Finance/badger-subgraph

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
yarn run prepare:<chain>
yarn run codegen
```

3. Building the subgraph
```
yarn run prepare:<chain>
yarn run build:<network>
```

4. Running all the tests
```
yarn run test
```

5. Deploy
```
graph auth --product hosted-service <access-token>
graph deploy --product hosted-service <username/subgraph-name>
```
