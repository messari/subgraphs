# Ribbon Finance

This protocol uses the Yield Aggregator Schema of Messari subgraph.

## Business Summary

Ribbon Finance is an on-chain option seller. The protocol sets up vaults for different option strategies and pools funds from users. Then, the protocol runs a automated sale of options ever week.

Currently, most of the vaults are on Ethereum and some on Avalanche. Although the protocol had Solana vault deployment as well, but the current vault is empty.

## Useful Links

Protocol:

- https://app.ribbon.finance/

Docs:

- https://docs.ribbon.finance/

Smart contracts:

- https://docs.ribbon.finance/developers/contract-addresses

Tokenomics:

- https://docs.ribbon.finance/ribbon-dao/overview

Discord:

- https://discord.com/invite/ribbon-finance

## Fees

#### V2 Vaults

Ribbon Finance charges 2% annualised management fee and a 10% performance fee. If the weekly strategy is profitable, the weekly performance fee is charged on the premiums earned and the weekly management fee is charged on the assets managed by the vault. If the weekly strategy is unprofitable, there are no fees charged.

The only exception is the R-Earn vault, which has a flat fee of 15% on the performance.

#### V1 Vaults

Ribbon finance charges a 0.5% fee on all withdrawls in a V1 vault.

## Rewards

Ribbon Finance has a "ve" system similar to Curve Finance. Rewards in RNB, its governance token, are given to users who contributed liquidity to the vaults, subject to the gauge votings by veRNB holders.

## User Metrics

Ribbon Finance has two types of users: Vault users who provide liquidity to option strategy vaults, and auction users who bid to purchase options.

### Vault Users

- Deposit into vault
- Withdraw from vault
- Stake/Unstake vault tokens (rTokens)
- Claim RNB rewards
- Lock/unlock RNB into veRNB

_Note: veRNB can be unlock back to RNB, subject to a penalty._

### Auction Users

There are two auction organisers, Gnosis and Paradigm, both are on-chain. Therefore, they may have different contracts. Auctions take place on every Friday only.

- Make a tender bid
- Claim option tokens for successful bid (oTokens)
- Redeem oTokens for underlying after option settlement

## Financial Metrics

### TVL

> TVL of a vault = $\sum$ of tokens contributed by the vault users

> TVL of the protocol = $\sum$ of TVL of all vaults

### Total Revenue

> Revenue of a vault = Number of option sold X option price per the auction

For each strategy, each week, there's one auction, and there is only one clearing price.

> Revenue of the protocol = $\sum$ of revenue of all vaults

#### Protocol Side Revenue

Ribbon Finance charges a management fee and performance fee for each vault. Please refer to the section "Fee" for details.

#### V2 Vaults

> Protocol-side revenue of a vault per week = Management Fee + Performance Fee

Whereas,

> Management Fee = Management Fee rate (usually 2% per annum/52 weeks) X the TVL of the vault

> Performance Fee = Performance Fee rate X Max(the Profit of the vault for the week, 0)

#### V1 Vaults

Protocol-side revenue of a vault per week = Withraw fee charged on each withdraw

Profit of a vault is determined upon the expiry of the options for that vault each week.

#### Supply Side Revenue

> Supply-side revenue of a vault = Total revenue - protocol-side revenue

#### Rewards

> Rewards rate for a vault = RNB token received by the vault per governance voting X RNB price

## Protocol Owned Liquidity

There's no protocol owned liquidity by there's a treasury for Ribbon Finance.

## Notes

- Ribbon lend and Ribbon treasury are currently not in the scope of this subgraph, therefore they are not tracked.
