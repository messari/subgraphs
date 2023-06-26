# Arbitrum One Bridge

## General

Arbitrum One the "Canonical Bridge" implemented by Offchain Labs leveraging Arbitrum's cross-chain message passing system.

Briding is implemented using gateways (for cross-chain asset bridgning) and routers (to route each asset to its designated gateway). See useful links section for more details.

## Mechanism

Arbitrum implements a Lock-Release bridging mechanism where some amount (bridged_amount - fees) of tokens are escrowed in L1 bridge/gateway contracts and the same amount of canonical token on L2 (arbitrum) are minted to the sender.

Withdrawal involves burning some amount of tokens in L2 contract, which can be claimed on the L1 bridge contract after challenge period is complete.

## Useful Links

- [Arbitrum Bridge](https://bridge.arbitrum.io)
- [Smart contract architecture](https://l2beat.com/scaling/projects/arbitrum#contracts)
- [Token bridge useful addresses](https://developer.arbitrum.io/useful-addresses#token-bridge)
- [Token bridging reference guide](https://developer.arbitrum.io/asset-bridging)
- [Fees](https://developer.arbitrum.io/inside-arbitrum-nitro/#fees)

## Metrics

### TVL

TVL is the total amount of ETH and ERC20 tokens escrowed in L1 Bridge and Gateway contracts.

### Usage

The bridge supports both token transfers and cross-chain messaging.

### Fees and Revenue

- This is a canonical bridge implemented by Offchain Labs. Bridging involves fees (L2 gas, L1 calldata fees, L1 gas fees) to cover the transaction costs on L1 and L2.
- A portion of the transaction costs (from sequencer) goes to Offchain Labs but the bridge protocol doesn't earn any fees/revenue.

## Other

### Disabled Yearn Oracle

Yearn Oracle was disabled in prices lib because of price inconsistencies for SPELL token. See [Issue-2090](https://github.com/messari/subgraphs/issues/2090).
