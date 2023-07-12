# Across Bridge

## Introduction

Across is a cross-chain bridge for L2s and rollups secured by UMA's optimistic oracle. It is optimized for capital efficiency with a single liquidity pool, a competitive relayer landscape, and a no-slippage fee model.

## Mechanism

Across involves Users (bridgess tokens), Liquidity Providers (deposits assets into one of the pools to insure user funds in exchange for fees) and Relayers (give out short-term token loans to Users in exchange for fees). Across therefore involves liquidity and lock-release mechanisms to fullfill bridge requests.

- All liquidity is primarily held in L1 (HubPool). LPs deposit/withdraw here
- SpokePools are deployed on all supported chains to facilitate bridging
- Users deposit funds on source chain
- Relayer fills deposits thru SpokePools on destination chain
- Spokepools (with the help of HubPools and Dataworkers) can send funds back to L1 (pool rebalance) or refund relayers if they choose to get refunded on the chain the spokepool is deployed on.

See Across Overview in Useful Links for more details.

## Useful Links

- [Across Overview](https://docs.across.to/v/developer-docs/how-across-works/overview#resources-to-learn-more)
- [Useful addresses](https://docs.across.to/v/developer-docs/developers/contract-addresses)
- [Fees](https://docs.across.to/how-across-works/fees)

## Metrics

### TVL

TVL is the total amount (in USD) of tokens held by across's contracts (eg. WETH held by hubpool, spokepools).

### Usage

Bridge is used only for cross-chain token transfers. Across doesn't support cross-chain messaging.

### Fees and Revenue

Liquidity providers and Relayers are both considered suppliers. Supply side revenue is therefore (LPfee + RelayerFee) times transferAmount.
