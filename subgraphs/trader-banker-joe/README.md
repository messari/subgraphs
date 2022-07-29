

# Trader Joe & Banker Joe - Metrics Methodology v1.0.0

Introduction:

Trader Joe is a one-stop decentralized trading platform on Avalanche and $JOE is its native token. Banker Joe is Trader Joe's lending protocol based on the Compound protocol.


## Useful Links



* Protocol
    * [https://traderjoexyz.com/home](https://traderjoexyz.com/home)
* Docs
    * Trader Joe: [https://docs.traderjoexyz.com/en/welcome/master](https://docs.traderjoexyz.com/en/welcome/master)
    * Banker Joe: [https://github.com/traderjoe-xyz/research/blob/main/BankerJoe_DeFi_Leveraged_Trading.pdf](https://github.com/traderjoe-xyz/research/blob/main/BankerJoe_DeFi_Leveraged_Trading.pdf)
* Smart contracts
    * [https://docs.traderjoexyz.com/en/security-and-contracts/contracts](https://docs.traderjoexyz.com/en/security-and-contracts/contracts)
* Medium:
    * [https://traderjoe-xyz.medium.com/](https://traderjoe-xyz.medium.com/)
* Subgraphs:
    * [https://docs.traderjoexyz.com/en/security-and-contracts/subgraphs](https://docs.traderjoexyz.com/en/security-and-contracts/subgraphs)
* Analytics Dashboard
    * [https://analytics.traderjoexyz.com/](https://analytics.traderjoexyz.com/)


## Usage Metrics

**Active Users, Total Unique Users & Daily Transaction Count**

Transactions of interest on Trader Joe include:



* Swapping tokens (in the interface called ‘trade’)
* Creating a pool
* ‘Zap’ (1-click convert tokens to LP tokens)
* Add / remove liquidity to a pool
* Stake LP tokens
* Unstake LP tokens
* Claim Rewards
* Claim LP tokens (for new token launches)
* Staking JOE / Claiming rJOE / Unstaking JOE (rJOE is valueless, only allows for participation in new token launches)

Transactions of interest on Banker Joe include:



* Depositing Tokens into Pools, Withdrawing Tokens from Pools, Borrowing Tokens from Pools, Repaying Borrowed Balances, Liquidating Positions


## Financial Metrics

**Total Value Locked USD**

The Total Value Locked (TVL) on Trader Joe can be calculated by summing up the available liquidity in the pools for each pair. Note: There is a staking portion for JOE which could be included into TVL calculation.

`TVL Trader Joe = Sum of available liquidity in pair pools`

The Total Value Locked (TVL) on Banker Joe can be calculated by deducting the borrowed supply from the total available supply for lending. 

`TVL Banker Joe = Total Supply - Total Borrow`

To get an aggregate TVL metric both TVL formulas can be combined: \


`𝜮 TVL Trader Joe & Banker Joe =  Sum of available liquidity in pair pools + (Total Supply - Total Borrow)`

The information for these calculations can be found on the Trader Joe dashboard (https://analytics.traderjoexyz.com/).

**Protocol Controlled Value USD**

Trader Joe has a Treasury but not Protocol Controlled Value, so this is not applicable. PCV is also not applicable for Banker Joe.

**Total Revenue USD**

Total Revenue generated on Trader Joe is a combination of



1. Swap Fees (currently 0.3%)
2. Deposit Fee: Staking into sJOE may come with a fee that can scale up to 3% Max, depending on the number of JOE already Staked. This fee will be sent to the treasury.

`Total Revenue Trader Joe = Swap Fees + Deposit Fees`

Note: The Deposit Fee for staking into sJOE could also be excluded as it is arguably not relevant for the protocol's operations. However, since parts of it go to the treasury, totalRevenueUSD = supplySideRevenueUSD + protocolRevenueUSD would be invalid.

Total Revenue for Banker Joe is a combination of:



1. Interest: Net APY = Deposit APY - Borrow APY; a portion of accrued interest goes to the protocol reserves determined by the reserve factor that is specific to each asset. E.g. If the reserve factor is 20% then 20% of all accrued interest goes to the reserve fund for that market and the rest is paid to the supplier.
2. Flash Loan Fees: Flash loan fee is 0.08% for all markets. Of the 0.08%, the protocol takes a portion of the fee as determined by the reserve factor. E.g. A reserve factor of 20% means 0.016% will go to reserves and the remaining 0.064% will go to the depositors.
3. Liquidation Fees: Seized collateral is liquidated at an 8% discount for all markets in order to incentivise liquidators. Of the 8%, the protocol takes a portion of liquidated tokens as determined by the protocol seize share and the remaining difference goes to the liquidator. The liquidator is therefore another supply-side participant. E.g The protocol seizes a 1.6% share of the 8% and the remaining 6.4% goes to the liquidator.

`Total Revenue Banker Joe = Interest + Flash Loan Fees + Liquidation Fees`

For this calculation `Interest = Total borrow * APY - Total deposit * APY`

Note: Various parameters used in the revenue calculations for Banker Joe are asset-specific and can be found here: [https://docs.traderjoexyz.com/en/trader-joe/lending/risk-parameters](https://docs.traderjoexyz.com/en/trader-joe/lending/risk-parameters)

**Supply Side Revenue USD**

For Trader Joe the Supply Side Revenue can be defined as the share of trading fees that goes to the liquidity providers.

`Trader Joe Supply Side Revenue = Swap Fees * Supply-side share in %`

Currently, there is a 0.3% swap fee, which is broken down as follows:

0.25% - Paid to liquidity pools in the form of a trading fee for liquidity providers.

0.05% - Sent to sJOE token farm (see rewards section)

Banker Joe:

`Banker Joe Supply Side Revenue = Interest * (1 - Reserve Factor) + Liquidation Fees * (1- Protocol Seize Share) + Flash Loan Fees * (1 - Reserve Factor)`

**Protocol Revenue USD**

`Trader Joe Protocol Revenue = Deposit Fees + Swap Fees * Protocol-side share in %`

Note: Swap fees only go to LPs and sJOE stakers and not to JOE holders. I think it’s important to differentiate whether protocol-revenue is distributed to tokenholders or only to stakers.

Banker Joe:

`Banker Joe Protocol Revenue = Interest * Reserve Factor + Liquidation Fees * Protocol Seize Share + Flash Loan Fees * Reserve Factor`

Note: There was a proposal to divert revenues from Banker Joe to sJOE stakers which was not pursued further. This is why all protocol revenues are currently used to build up reserves to shield the protocol from losses in case of shortfalls. Revenues from Banker Joe are currently utilized for protocol owned liquidity (JOE-AVAX) and do not go to the treasury. 


## Pool-Level Metrics

**Pool Total Value Locked USD**

For all liqudity pools on Trader Joe & Banker Joe Pool TVL can be calculated as follows:

`Trader Joe Pool TVL = (𝜮 token1 * price token1) + (𝜮 token2 * price token2)`

`Banker Joe Pool TVL = Deposits (No. of tokens) - Borrows (No. of tokens) * Coin Price`

**Reward Tokens & Reward Token Emissions Amount**

<span style="text-decoration:underline;">JOE Emissions for Liquidity Providers:</span>

JOE tokens will be issued through liquidity provider rewards, as there were no pre-sales, seed investors, or VC allocations. The token distribution follows a fixed supply, decaying emission model and will be distributed as per the emission schedule.

Total. JOE Supply: 500,000,000 of which 50% are reserved for LPs

<span style="text-decoration:underline;">Emission schedule: </span>

Below are the emission rates. Token emission began 3-July, 2021 and will end 3-Jan, 2024.

 [https://docs.traderjoexyz.com/en/trader-joe/platform/tokenomics#distribution](https://docs.traderjoexyz.com/en/trader-joe/platform/tokenomics#distribution)

<span style="text-decoration:underline;">sJOE Staking</span>

sJOE is a staking option that provides users with yield in the form of a stablecoin. For every swap on Trader Joe, a 0.05% fee is charged and accrued by the protocol, this is converted into a stablecoin and then distributed to the sJOE Pool every 24 hours. 

sJOE stakers receive rewards proportional to their share of the sJOE vault.

Calculation: `userRewardRate = userJoe / totalJoe * sJoeRewardRate.`

Source: [https://docs.traderjoexyz.com/en/trader-joe/staking/sjoe-staking](https://docs.traderjoexyz.com/en/trader-joe/staking/sjoe-staking)

Note: In the past xJOE was used for platform revenue distribution but it is now deprecated.

<span style="text-decoration:underline;">veJOE Staking</span>

veJOE is a staking option that rewards long-term Stakers with Boosted JOE Farm rewards as well as voting power for future governance. The formula for which can be found in the following

Source: [https://docs.traderjoexyz.com/en/trader-joe/staking/vejoe-staking](https://docs.traderjoexyz.com/en/trader-joe/staking/vejoe-staking)

There is already a subgraph available for veJOE: [https://thegraph.com/hosted-service/subgraph/traderjoe-xyz/vejoe](https://thegraph.com/hosted-service/subgraph/traderjoe-xyz/vejoe)
