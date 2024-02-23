# Morpho Blue Subgraph


## Specifications
Morpho Blue is a permissionless lending protocol, meaning that everyone can list any market with any oracle, that can give inconsistent price to compute the TVL.

So the measure of the TVL is not the same as other protocols, because we can't trust the price of all the markets.

To do so, we use a whitelist of markets trusted by the Morpho DAO, and we use these markets to calculate the TVL.

The list is updated each time the DAO is trusting a new market. 

However, the subgraph is listing all created markets and computes the price by mapping a token symbol with a Chainlink price feed
to compute the USD or ETH price of an asset (if a price feed exists).



TODO:
checkk si les addons sont biens initialisés
