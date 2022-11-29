# Introduction on Tornado Cash

## Business Summary
Tornado Cash a decentralised portal for protecting on-chain transaction privacy. It uses a smart contract that accepts ETH & other tokens deposits from one address and enables their withdrawal from a different address.  Those smart contracts work as pools that mix all deposited assets, so Tornado Cash is also known as a "mixer".

Anyone can send in a deposit of cryptocurrency and others can withdraw it. To take out the funds, the user must have a “secret” or “note” that is given by the original depositor. This transaction is not publicly linked, and no external observer can tell which deposit links to which withdrawal.

Deposits and withdraws are made in fixed sizes - so that it's not possible to trace the depositor and withdrawor by matching the amount. For instance, ETH deposited and withdrawn into Tornado are in 4 transaction sizes: 0.1 ETH, 1 ETH, 10 ETH and 100 ETH.  

## Relayer

To make sure an empty address with no gas fee funded at all to be able to withdraw (so that there's no on-chain trace of this address at all), Tornado Cash introduced the concept of Relayer. A replayer withdraws funds based on a user' request. He pays for the withdrawal transaction fee by deducting it directly from the transferred amount. He also charges the user an additional fee for this service.

Tornado collects a fee directly from the relayer’s staked balance of TORN, the platform token, through the StakingReward contract for each withdrawal. This fee percentage may vary from one pool to another and is subject to change through on-chain governance.

Currently, it is fixed at 0.3% . Some pools remain without fees, either because the instance is too small to assign a fee (0.1 ETH, 100 DAI/USDT, 1000 DAI/USDT), or because there is not enough liquidity on Uni v3 (all cDAI instances).

## Useful links

Due to the OFAC sanction recently, most the web services of Tornado Cash are affected. The following are the sites and their backups:

- Protocol site: https://tornadocash.eth.link/
  - https://ipfs.io/ipfs/bafybeicu2anhh7cxbeeakzqjfy3pisok2nakyiemm3jxd66ng35ib6y5ri/
- Token: https://etherscan.io/address/0x77777feddddffc19ff86db637967013e6c6a116c (Mainnet)
  - https://bscscan.com/address/0x1ba8d3c4c219b124d351f603060663bd1bcd9bbf (Bsc)
- Docs (forked): https://github.com/Garf1eld99/docs/blob/en/SUMMARY.md
  - Introduction: https://github.com/Garf1eld99/docs/blob/en/README.md
  - Relayer: https://github.com/Garf1eld99/docs/blob/en/general/how-to-become-a-relayer.md
  - Anonymity mining: https://github.com/Garf1eld99/docs/blob/en/tornado-cash-classic/anonymity-mining.md
- Smart Contracts: https://github.com/Garf1eld99/docs/blob/en/general/tornado-cash-smart-contracts.md

## Tornado Cash accepted tokens on different chains
- Ethereum Blockchain : ETH (Ethereum), DAI (Dai), cDAI (Compound Dai), USDC (USD Coin), USDT (Tether) & WBTC (Wrapped Bitcoin)
- Binance Smart Chain: BNB (Binance Coin)
- Polygon Network: MATIC (Polygon)
- Gnosis Chain (former xDAI Chain): xDAI (xDai)
- Avalanche Mainnet: AVAX (Avalanche)
- Optimism, as a Layer-2 for ETH (Ethereum)
- Arbitrum One, as a Layer-2 ETH (Ethereum)

## User metrics

The usages of Tornado Cash include:
- Deposit
- Withdraw by relayer
- Stake/unstake TORN
- Claim TORN rewards

There has been mining programs but ended in Dec 2021.

## Financial Metrics

### TVL

TVL of Tornado Cash is the sum of all token balances in Tornado Cash.
> TVL = $\sum$ token price * token balance in Tornash Cash

E.g the TVL of Tornado Cash on Ethereum is the sum of ETH, DAI, cDAI, USDC, USDT & WBTC balances in the smart contract.

### Deposit Volume and Withdrawal Volume

> Deposit volume = $\sum$ value of all deposits 

> Withdrawal volume = $\sum$ value of all withdrawals 

### Revenue

> Total Revenue (in pool token) = $\sum$ Portion of the withdrawn amount paid to a relayer

In a withdrawal transaction, the amount is split into two: 
- one portion (usually the bigger portion) paid to the user
- the other portion paid to the relayer to cover transaction cost borne by the relayer and relayer's fee

> Protocol-side revenue (in TORN token) = $\sum$ Fee rate when applicable *  Value of withdrawals 

To become a relayer, a user has to stake a minimum of 300 TORN tokens (minimum stake value is decided by governance vote) in governance vault. The protocol collects a fee directly from the relayer’s staked balance for each withdrawal. 
- The fee rate, as stated in the Relayer section, is 0.3% or 0% for some pools. The calculated pool fee can be obtained from the `FeeUpdated` [event](https://etherscan.io/address/0xf4B067dD14e95Bab89Be928c07Cb22E3c94E0DAA#code#F33#L80). 
Pool fee is [updated](https://etherscan.io/address/0xf4B067dD14e95Bab89Be928c07Cb22E3c94E0DAA#code#F33#L87) at every `updateFeeTimeLimit` (currently set to 172800 seconds, or 48 hours) or if the current and the expected fee [deviation](https://etherscan.io/address/0xf4B067dD14e95Bab89Be928c07Cb22E3c94E0DAA#code#F33#L151) is too large.
- TORN tokens, equivalent to this calculated pool fee, are [burned](https://etherscan.io/address/0x01e2919679362dFBC9ee1644Ba9C6da6D6245BB1#code#F1#L238) from relayer's staked balance.

> Supply-side revenue = Total Revenue - Protocol-side revenue

Arguably, the difference between the total revenue and protocol-side revenue here is not for the liquidity providers, but for the relayers. Relayers earn a revenue from each withdrawal transaction, to cover the transaction cost (gas fee) and the 0.3% protocol fee charged by Tornado Cash, and keep the remaining as their service income. Liquidity providers do not share revenue generated in Tornado Cash.

> **Note**
> Since the pool fee calculated by the protocol is updated every 48 hours or when the deviation from expected fee is too large, high volatility in TORN price compared to pool token price during this period, can cause unexpected revenues.
> If increment in TORN price to increment in pool token price becomes larger, protocol-side revenue (protocol fee) increases and can even be greater than the total revenue (relayer's fee) and hence supply-side revenue (relayer's profits) for these snapshots can be negative. In effect relayers will lose money, until the pool fee is adjusted to accomodate for this volatility.
> Reverse is true as well, if increment in TORN price to increment in pool token price becomes smaller, relayers will make more commission.

### Rewards

Rewards in TORN, the platform token, were distributed to depositors before Dec 2021. Rewards were first calculated in terms of Anonymity points for each depositor and then depositors can claim Anonymity points and swap them for TORN tokens. Four pools were eligible for rewards, namely, ETH, WBTC, DAI or cDAI pools.

> Reward Rate = TORN rewards for a qualified pool * TORN Price / $\sum\$ Balances of every deposit sizes for each qualified pool
