# Introduction of Portal Bridge (Wormhole)

> [The Graph does not support callHandlers on all supported networks](https://thegraph.com/docs/en/developing/creating-a-subgraph/#call-handlers).<br>
> For Portal, there are no events emitted on receiving bridge transfers.
> For this reason,
>
> - BSC, Polygon, and Avalanche deployments only capture the outbound data.
> - Ethereum and Fantom deployments capture both outbound and inbound data.

## General

Wormhole is a generic message passing protocol that connects to multiple chains including Ethereum, Solana, Binance Smart Chain, Polygon, Avalanche, Algorand, Fantom, Karura, Celo, Acala, Aptos and Arbitrum.<br>
Wormhole does this through emitting messages from one chain which are observed by a Guardian network of nodes and verified. After verification, this message is submitted to the target chain for processing.

The Portal is an application built on top of Wormhole.
When you bridge tokens through Portal, the origin token gets locked in a smart contract, and a new Portal wrapped token gets minted on the target chain. You can swap those for other/native tokens on the target chain.

## Official Links

- Protocol: https://www.portalbridge.com/#/transfer
- User Docs: https://docs.wormhole.com/wormhole/
- Developer Docs: https://book.wormhole.com/
- Contracts: https://book.wormhole.com/reference/contracts.html

## Metrics

### Usage and Transactions

Transactions are both outbound and inbound transfers of assets across networks.<br>
Users of Portal are EOAs which initiate these transfers.

### TVL

TVL is the total value of assets locked in `TokenBridge` contract.

### Fees

Protocol [claims a sub-cent bridging fee](https://docs.wormhole.com/wormhole/faqs#what-are-the-fees-for-using-portal). We use [messageFee](https://etherscan.io/address/0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B#readProxyContract#F11) read method on `Wormhole` contract to obtain fee value for each message.

### Revenue

There is no Supply Side Revenue.
MessageFee makes up the Protocol Side Revenue.

### Rewards

There is no reward distribution.
