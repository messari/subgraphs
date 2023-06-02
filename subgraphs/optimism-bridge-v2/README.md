# Optimism Bridge

The standard bridge functionality provides a method for an ERC20 token to be deposited and locked on L1 in exchange of the same amount of an equivalent token on L2. This process is known as "bridging a token", e.g. depositing 100 USDC on L1 in exchange for 100 USDC on L2 and also the reverse - withdrawing 100 USDC on L2 in exchange for the same amount on L1. In addition to bridging tokens the standard bridge is also used for ETH.

## Usage metrics

`Unique Transfer Senders` & `Unique Transfer Receivers`

Number of users that have either sent or received tokens or ETH through the bridge.

`Unique Message Senders`

Number of users that have sent messages through the bridge. Note that a messages sent during bridge transfers are excluded.

`Active Users` & `Total Unique Users`

Number of users that have interacted with the protocol in any way - transferring tokens/ETH or sending messages.

## Volume

### `Volume Out USD`

Sum of assets transferred out from selected network.

### `Volume In USD`

Sum of assets transferred in to selected network.

### `Total Volume USD`

`Volume Out USD` + `Volume In USD`

### `Net Volume USD`

`Volume In USD` - `Volume Out USD`

## Total Value Locked USD

Total value of assets currently locked in the bridge.

On Optimism network this is always 0, because tokens are minted/burned as needed.

## Revenue

Optimism Gateway does not charge a fee to bridge assets, therefore there is no revenue generated.

## Notes

- Received messages are not being tracked, because there is not enough data included in the event.

- Some of the earliest transfers on Optimism network are missing price data, because price oracles were not deployed yet

## Smart Contract Interactions

![Optimism Gateway](../../docs/images/protocols/optimism-gateway.png "Optimism Gateway")

## Links

Links to the relevant sources to learn about this protocol.

- Protocol: https://gateway.optimism.io/
- Docs: https://community.optimism.io/
- Smart contracts: https://github.com/ethereum-optimism/optimism/tree/develop/packages/contracts/contracts/
- Smart contract addresses: https://community.optimism.io/docs/useful-tools/networks/
