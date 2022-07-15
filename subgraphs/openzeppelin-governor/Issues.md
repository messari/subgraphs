### Schema Discrepancy

Governor Alpha/Bravo:

- quorum: BigDecimal

OpenZeppelin Governor:

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

2. Using the first `QuorumNumeratorUpdated` event to create `GovernanceFramework` which feels wrong. This may not always be the case depending on constructor ordering of OpenZeppelin Governor contracts

```
constructor(ERC20Votes _token, TimelockController _timelock)
  Governor("ENS Governor")
  GovernorVotes(_token)
  GovernorVotesQuorumFraction(100) // 1% <-- event from here trigger creation
  GovernorTimelockControl(_timelock)
{}
```

[OpenZeppelinGovernor deployment logs](https://etherscan.io/tx/0x97cba35bb5b36409dc31f22f2cb31d0f947bd8d1145093f9a785aefa525fe269#eventlog)

It would be ideal if there was a handler for after constructor call or after the contract is successfully deployed...
