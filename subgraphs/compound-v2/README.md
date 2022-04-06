# Compound Subgraph

## Calculations

- Total Value Locked (TVL) = Pool Deposits
- Fees = Total Revenue = (Market Outstanding Borrows \* Market Borrow Rate)
- Protocol-side Revenue = (Market Outstanding Borrows _ Market Borrow Rate) _ (Market Reserve Factor)
- Supply-side Revenue = (Market Outstanding Borrows _ Market Borrow Rate) _ (1 - Market Reserve Factor)
- Reward Emissions for Supply and Borrow = (COMP Per Block _ 4 _ 60 _ 24) _ (COMP Price)

## Links

Protocol: https://compound.finance/

Docs: https://compound.finance/docs

Smart contracts: https://github.com/compound-finance/compound-protocol

Deployed addresses: https://compound.finance/docs#networks

Existing subgraphs: https://github.com/graphprotocol/compound-v2-subgraph

Explanation of lending metrics: https://docs.aave.com/risk/asset-risk/risk-parameters

Subgraph in the studio: https://api.studio.thegraph.com/query/23909/compound-v2/v1.4.1

Dune Dashboard for Testing: https://dune.xyz/messari/Messari:-Compound-Macro-Financial-Statements
