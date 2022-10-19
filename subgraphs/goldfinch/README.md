# The Graph subgraphs related to the Goldfinch Protocol

## Usage

### Schema

The schema is defined under: [schema.graphql](./schema.graphql)

### Assumptions

- The SeniorPool is updated every time when the following events are called:
  - DepositMade
  - InterestCollected
  - PrincipalCollected
  - ReserveFundsCollected
  - WithdrawalMade
  - PrincipalWrittenDown
  - InvestmentMadeInJunior
  - InvestmentMadeInSenior
- All the capital providers from the Senior Pool are updated on the following events:
  - InterestCollected
  - PrincipalCollected
  - PrincipalWrittenDown

### Patterns

- Build the graphQL schema as close as possible to the frontend requirements
- When designing contracts, write events with data retrieval in mind, think about the data you need to avoid doing extra queries on the subgraph
- The mappings that transform the Ethereum into entities are written in a subset of TypeScript called [AssemblyScript](https://thegraph.com/docs/developer/assemblyscript-api)

##### Create vs Update pattern

```js
let id = seniorPoolAddress.toHex()
let seniorPool = SeniorPool.load(id)

if (seniorPool === null) {
  seniorPool = new SeniorPool(id)
  seniorPool.createdAt = event.block.timestamp
}
```

##### Fetching data from smart contracts

If you have the ABIs on the contracts defined on `subgraph.yaml` you can call public methods from smart contracts:


```js
let contract = SeniorPoolContract.bind(seniorPoolAddress)
let sharePrice = contract.sharePrice()
let compoundBalance = contract.compoundBalance()
let totalLoansOutstanding = contract.totalLoansOutstanding()
let totalSupply = fidu_contract.totalSupply()
let totalPoolAssets = totalSupply.times(sharePrice)
```

##### Updating array properties

```js
// This won't work
entity.numbers.push(BigInt.fromI32(1))
entity.save()

// This will work
let numbers = entity.numbers
numbers.push(BigInt.fromI32(1))
entity.numbers = numbers
entity.save()
```

### Regarding Upgradeable Contracts

The subgraph doesn't need to know anything about upgradeable contracts. If a contract is upgradeable, just define it as an ordinary `dataSource` in `subgraph.yaml`, *not* a `template`. The address that you write will be the address of the proxy, because all events are emitted under the proxy's address. The ABI will be the ABI of the implementation contract, but that should come as no surprise because the ABI of the proxy contract itself isn't useful.

With all that said, you do need to be careful of how contracts change over time. Subgraph mapping code allows you to run view functions on the block being ingested. If you try to run a function as you're ingesting block 1000, but the upgrade that introduced that function happened on block 1001, then you'll get an error. Another problem is how event signatures can change through upgrades (see the excerpt below).

### Updating event signatures

If an event signature updates (meaning the parameters change), then Ethereum considers the event to be completely different. You would have to search for the event by it's old and new signatures to get a complete history. This means that some action must be taken in the subgraph mappings in order to consume all old and new events. Let's demonstrate with an example: the `Unstaked` event on `StakingRewards.sol`. Suppose that the signature updates from `Unstaked(indexed address,indexed uint256,uint256)` to `Unstaked(indexed address,indexed uint256,uint256,uint8)`. In the latest ABI for `StakingRewards.sol` (StakingRewards.json), it will list only the newest definition of `Unstaked`. In the ABI that we place in `subgraph/abis`, we have to make sure that both the old and new definition are present. Thankfully, this is actually easy to do, because the artifact file (`StakingRewards.json`) contains a `history` block that will hold the definition for the old version of this event. Therefore, we can just insert this block into `subgraph/abis/StakingRewards.json` to make it aware of the new version of `Unstaked` (assuming it already has the old version):
```
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "enum StakingRewards.StakedPositionType",
          "name": "positionType",
          "type": "uint8"
        }
      ],
      "name": "Unstaked",
      "type": "event"
    },
```
be sure to place this directly _after_ the old version. This will affect what the graph SDK will produce when you run `codegen`.

When you run codegen, the first `Unstaked` event defined in the ABI can be imported as follows (same as before):
```
import { Unstaked } from "../../generated/templates/StakingRewards/StakingRewards"
```
The second one will be generated under the name `Unstaked1`:
```
import { Unstaked1 } from "../../generated/templates/StakingRewards/StakingRewards"
```
You must write a handler for the new `Unstaked1` (it can have the same logic as the old one, if that is desired).

Finally, be sure that you add your new handler for `Unstaked1` to `subgraph.yaml` (otherwise it will never run):
```
- event: Unstaked(indexed address,indexed uint256,uint256,uint8)
  handler: handleUnstaked1
```

### Debugging

Debugging on the graph should be done through logs and checking the subgraph logs:
- [Logging and Debugging](https://thegraph.com/docs/developer/assemblyscript-api#logging-and-debugging)

In practical terms, logs should be added to monitor the progress of the application.

### Validating data received from the subgraph

1. Change the network to be mainnet
2. Change on App.tsx the currentBlock. eg:
```
- const currentBlock = getBlockInfo(await getCurrentBlock())
+ const currentBlock = {
+   number: 13845148,
+   timestamp: 1637262806,
+ }
```
- Add the block number on the graphql/queries.ts. eg:
```
_meta(block: {number: 13845148}) {
  ...
}
seniorPools(first: 1, block: {number: 13845148}) {
  ...
}
tranchedPools(block: {number: 13845148}) {
  ...
}
```
- On `usePoolsData`, disable the skip flag from web3 and add the validation scripts
```
  // Fetch data from subgraph
  const {error, backers: backersSubgraph, seniorPoolStatus, data} = useTranchedPoolSubgraphData(..., false)

  // Fetch data from web3 provider
  const {backers: backersWeb3, poolsAddresses} = usePoolBackersWeb3({skip: false})
  const {seniorPoolStatus: seniorPoolStatusWeb3} = useSeniorPoolStatusWeb3(capitalProvider)

  if (backersSubgraph.loaded && backersWeb3.loaded && currentBlock && goldfinchProtocol) {
    generalTranchedPoolsValidationByBackers(backersWeb3.value, backersSubgraph.value)
    generalBackerValidation(goldfinchProtocol, data, currentBlock)
  }
```
  - Beaware that running `generalBackerValidation` will run the validations for all backers which is subject to rate limit of the web3 provider
- On `src/graphql/client.ts` change the `API_URLS` for the url of the subgraph you want to validate

### Tests

Subgraph tests use [Matchstick](https://github.com/LimeChain/matchstick) as a unit testing framework which is still in the early stages of development.

```
cd packages/subgraph
docker build -t matchstick . && docker run --rm matchstick
```

or

```
cd packages/subgraph
graph test
```

- [Unit Testing Framework](https://thegraph.com/docs/en/developer/matchstick/)
- [Demo Subgraph (The Graph) showcasing unit testing with Matchstick](https://github.com/LimeChain/demo-subgraph)
- [aavegotchi-matic-subgraph tests](https://github.com/aavegotchi/aavegotchi-matic-subgraph/tree/main/src/tests)

## Deployment

### Local

#### Mac OS X

- Make sure you have docker and docker-compose installed
- Start the local chain with `npm run start` in the `packages/protocol` directory. This should run _without_ mainnet forking (it takes way too long to index with mainnet forking)
- In another terminal, go to the `packages/subgraph` directory and run `docker-compose up -d`. This will start up 3 Docker containers that The Graph needs. One for Postgres, one for IPFS, one for Graph Node (which is the actual The Graph product)
- Give it a minute or so to start up, then run `npm run create-local`. This will create an instance of the Goldfinch subgraph (same as if you had created a new empty subgraph on the hosted service)
- Now run `npm run deploy-local`. This will generate a local `subgraph-local.yaml` file, and edit some constants in the source code, then it will deploy into the Docker containers.
- The indexing of the subgraph should start immediately.
- Urls available are:
  - JSON-RPC admin server at: http://localhost:8020
  - GraphQL HTTP server at: http://localhost:8000
  - Index node server at: http://localhost:8030
  - Metrics server at: http://localhost:8040

#### Linux

- Run: `./reset-local.sh && ./start-local.sh` or `./start-local.sh`
  - If you are on linux, the Graph Node Docker Compose setup uses host.docker.internal as the alias for the host machine. On Linux, this is not supported yet. The detault script already replaces the host name with the host IP address. If you have issues, run `ifconfig -a` and get the address of the docker0

#### Cleaning up after running locally

- Run `docker compose down -v` to tear down the Docker instances
- Run `rm -rf ./data` from `packages/subgraph` to remove any leftover data from execution. If you forget this step, it can lead to errors on subsequent runs.
- Don't forget to close your locally-running blockchain from `packages/protocol`

#### Quick Runs

- A quick run script is available: `packages/subgraph/quick-start.sh`. This requires a test dump to be restored to the postgres container.
  - This only works for mainnet forking
  - The network on metamask should be http://localhost:8545

#### Creating local backups

- If you already have a running db and want to save it for future runs use:
  - docker exec -t <postgres-container-id> pg_dumpall -c -U graph-node > ~/dump.sql

### Production

URL: https://thegraph.com/hosted-service/subgraph/goldfinch-eng/goldfinch

For deploying the production subgraph:

```
cd packages/subgraph
npx graph auth --product hosted-service <deploykey>
npx graph codegen
npx graph build
npx graph deploy --product hosted-service goldfinch-eng/goldfinch
```

### Beta subgraph used by https://beta.app.goldfinch.finance

See `beta-subgraph/README.md`.

## Additional Resources

- [The Graph Academy](https://thegraph.academy/developers/)
- [The Graph Academy Hub](https://github.com/TheGraphAcademy/Graph-Academy-Hub)
- [The Graph Explorer](https://thegraph.com/explorer/)
- [Subgraph Monitor](https://github.com/gnosis/thegraph-subgraphs-monitor)
- [Subgraph Toolkit](https://github.com/protofire/subgraph-toolkit)
- [Create Subgraph](https://thegraph.com/docs/developer/create-subgraph-hosted)
