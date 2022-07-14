### Schema Discrepancy

Governor Alpha/Bravo:

- quorum: BigDecimal

OZ Governor:

- quorumNumerator: BigInt!
- quorumDenominator: BigInt!

Gov Specific:

- guardian: String (FEI)
- eta: BigInt (FEI)

## Things that do not work well

1. The `quorum` changes per block since it relies on total token supply

```
function quorum(uint256 blockNumber) public view virtual override returns (uint256) {
  return (token.getPastTotalSupply(blockNumber) * quorumNumerator())  / quorumDenominator();
}
```

This makes it hard to keep it up to date in the subgraph. _Keep up to date via the subgraph ingestion process?_

2. Using the first `QuorumNumeratorUpdated` event to create `GovernanceFramework` which feels wrong. This may not always be the case depending on constructor ordering of OZ Governor contracts

```
constructor(ERC20Votes _token, TimelockController _timelock)
  Governor("ENS Governor")
  GovernorVotes(_token)
  GovernorVotesQuorumFraction(100) // 1% <-- event from here trigger creation
  GovernorTimelockControl(_timelock)
{}
```

[OZGovernor deployment logs](https://etherscan.io/tx/0x97cba35bb5b36409dc31f22f2cb31d0f947bd8d1145093f9a785aefa525fe269#eventlog)

It would be ideal if there was a handler for after constructor call or after the contract is successfully deployed...

<br>

# Adding a new governance subgraph

## Init new subgraph

`graph init --product hosted-service danielkhoo/truefi-governance`

This will pull the abis and subgraph yml for reference. We will delete this folder once we are done.

## Duplicate existing OZ Governor subgraph

Make clones of:

- abis/subgraph-name
  - replace with abis from previous step
  - update `mainnet.json` with contract addresses and startblocks
- protocols/subgraph-name
  - Replace contract names in subgraph.template.yml
  - Replace eventHandlers for governor (ensures we have the right events)
  - Double check that the 3 token handlers exist in subgraph
  - change `file: ./protocols/subgraph-name/src/contract-name.ts`
  - merge cloned governor/token mappings with the generated ones

## Generate files and Build

Gen yaml
`npm run prepare:yaml --protocol=hop-governance --network=mainnet --template=hop-governance.template.yaml`
Gen wasm
`graph codegen`
Compile
`graph build`

## Run locally

(Separate Terminal)
`ipfs daemon`
(Separate Terminal)

```
cargo run -p graph-node --release -- \
  --postgres-url postgresql://daniel:@localhost:5432/graph-node \
  --ethereum-rpc mainnet:https://eth-mainnet.g.alchemy.com/v2/<api-key> \
  --ipfs 127.0.0.1:5001
```

`npm run create-local --name=subgraph-name`
`npm run deploy-local --name=subgraph-name`

## Deploy graph to hosted service with

**NOTE: Must first be created on the hosted service and auth via cli**
https://thegraph.com/hosted-service/dashboard
`graph auth --product hosted-service {access-token}`

Add to `deploymentConfigurations.json`

`npm run deploy --subgraph=openzeppelin-governor --protocol={subgraph-name} --network=mainnet --location=danielkhoo`

**old way:**
`graph auth --product hosted-service {access-token}`
`graph deploy --product hosted-service danielkhoo/ens-governance`

Add description
Subgraph for Fei's OpenZeppelin Governor Contract

**Test Subgraph Query**

```
{
  governances{
    id
currentTokenHolders
    totalTokenHolders
    currentDelegates
    totalDelegates
    delegatedVotesRaw
    delegatedVotes
    proposals
    proposalsQueued
     proposalsExecuted
    proposalsCanceled

  }
  proposals(first: 1){
    id
    description
    proposer{
      id
    }
    state
    againstVotes
    forVotes
    abstainVotes
    votes(first:1){
      id
      choice
      weight
      reason
      voter{
        id
        numberVotes
      }
    }
  }

  governanceFrameworks{
    id
    name
    type
    version
  }
}

```
