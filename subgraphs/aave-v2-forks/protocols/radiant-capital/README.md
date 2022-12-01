# RADIANT

## Business Summary

Radiant is a cross chain lending protocol that is forked from Aave and Geist. It’s revenue split and incentive scheme are modelled after Geist Finance on Fantom chain.

Radiant launched v1 on Arbitrum now. It’s working on v2, which allows for full cross chain borrowing & lending on assets such as BTC, ETH and USDC.

The business of the protocol can be divided and summarized as follows:

### Lending and Borrowing

- Depositors can lend supply assets to supply market and in exchange, they receive rTokens, which generate yield (interest rate payments from borrowers).
- Borrowers post collateral and can borrow on interest rates that are algorithmically determined based on supply & demand for each asset.
- Liquidators liquidate undercollateralized positions for liquidation penalty.

### 1-Click Looping

- Looping is automating the deposit and borrow the same asset and repeat the cycle several times in one transaction. This is also known as folding in DeFi. In Radiant Finance, a user can loop up to 5x leverage.

- Loop function allows users to increase their RDNT token rewards and earn yield on a larger collateral value

### Vesting and Locking RDNT

#### Vesting RDNT

- Users vest their RDNT tokens to receive 50% of all fee-generated (borrowing interest paid) while actively vesting.

- Users can withdraw their vested tokens for a 50% penalty on the RNDT rewards.

- The 50% penalty of RDNT rewards are distributed to users who lock their RDNT tokens

##### Locking RDNT

- Users who lock their RDNT tokens receive 50% of fee generated as well.

- They will also receive additional income from RDNT penalty fees from all positions who exit their vests early.

- Users who lock their tokens can unlock but cannot fully withdraw them.

### Pool2

- Liquidity providers of RDNT/WETH pair on SushiSwap can stake their LP tokens in Radiant to receive rewards in the form of RDNT tokens
- This pool aims to enable deeper liquidity for the protocol to secure the longevity and health of Radiant platform

## Useful Links

Protocol:

- https://app.radiant.capital/#/markets

Docs:

- https://docs.radiant.capital/docs/

Smart contracts:

- https://docs.radiant.capital/docs/contracts-and-security/contracts

Discord:

- https://discord.com/invite/radiantcapital

## User Metrics

The user actions of Radiant include:

### Lending and Borrowing

#### Lending

- Deposit any of the five supported assets such as WBTC, WETH, USDT, USDC, & DAI in exchange of rTokens
- Claim RDNT rewards from the deposited assets

#### Borrowing

- Borrow after depositing assets as collaterals
- Repay borrowed funds
- Claim RNDT rewards from the borrowed assets

#### Liquidation

- Liquidate undercollateralized positions/loans

### 1-Click Looping

- Automate and repeat the process of borrow and deposit cycle multiple times by looping to earn greater yield

### Vesting and Locking RDNT tokens

#### Vesting

- Vest RDNT tokens
- Users who vest RDNT may choose to exit early within 28 days (four weeks).
- Claim RDNT rewards incurred from vested tokens

#### Locking

- Lock RDNT tokens to get rewards
- Claim rewards from the locked tokens
- Unlock RDNT tokens

### Pool2

- Staking RDNT/WETH LP tokens from SushiSwap in Radiant platform
- Vest or lock your earned RDNT rewards from the pool

## Financial Metrics

### TVL

> TVL of a Single Pool = $\sum$ value of the specific token deposited in the contract

> TVL of a Protocol = $\sum$ TVL of single pools

Note: At the time of writing, the platform only supports assets or tokens such as BTC, ETH, USDC, USDT, and DAI.

And,

> TVL of Pool2 = $\sum$ value of LP tokens of RDNT/WETH from SushiSwap staked in Radiant platform

Note: This refers to RDNT/WETH liquidity pool on SushiSwap and staking the LP token in Radiant to earn more RDNT.

### Total Revenue

> Total Revenue = $\sum$ value of interest payments incurred by borrowers (platform fees)

### Supply Side Revenue

> Supply Side Revenue = 50% \* Total Revenue

Note: 50% of the total revenue goes to lenders who supply assets

### Protocol Side Revenue

> Protocol Side Revenue = 50% \* Total Revenue

Note: 50% of total revenue goes to vested and locked RDNT tokens

### Deposit Balance

> Total Deposit Balance of a Single Pool = $\sum$ value of tokens deposited in the contracts

> Deposit Balance of a Single Pool = $\sum$ Deposit Balance of single pools

Note: Deposit Balance must be equivalent to TVL. Users may deposit a single token among five of these supported assets: WBTC, WETH, USDT, USDC, & DAI.

### Borrow Balance

> Total Borrow Balance of the Protocol = $\sum$ value of tokens borrowed in the contracts

> Borrow Balance of a Single Pool = $\sum$ Borrow Balance of single pools

Note: The maximum amount available to borrow depends on the value of assets that a user has deposited as collateral, as well as the available liquidity for the asset that a user wishes to borrow.

Important terms:

- Loan-to-Value (LTV) - defines the maximum amount that can be borrowed against a specific collateral.
- For example, an LTV of 75% means that someone would be able to borrow 0.75 ETH worth of let’s say USDC, for every 1 ETH they post as collateral.
- Naturally, since ETH is a volatile asset, the LTV will evolve with market conditions after the loan is taken.

- Liquidation Threshold (LT) - is the LTV level at which the lending platform (smart contract) deems the loan to be undercollateralized and subject to liquidation.

## Rewards

### Rewards for depositors and borrowers

Depositors and borrowers earn the RDNT emissions per block:

> Reward Rate of a pool = Rewards received in RDNT \* RDNT Price / Deposit or borrow balance of that pool

### Interest Rates

Interest rates are determined by utilization rate. Utilization ratio represents how much of a pool has been loaned out. All borrowers pay the same rate, and all lenders receive the same rate. Additionally, the interest varies. As supply and demand change, so do the interest rates vary.

### Rewards for LPs

Liquidity providers who stake their LP tokens in Radiant earn RDNT emissions
Daily Rewards for Pool2 = $ Stake LP tokens value \* APR
Note: Stakers receive 20% of all RDNT emissions as an incentive for providing liquidity

### Rewards for Vesting and Locking RDNT

- Users who vest their RDNT earn 50% of the platform fees, generated from borrowing interest. They have the option to exit early within 28 days (four weeks) with a 50% penalty fee. The 50% penalty fees are distributed to RDNT lockers.
  Reward for vested RDNT = Platform fees

- Users who lock their RDNT earn 50% of the platform fees too, generated from borrowing interest. They also receive penalty fees from users from exit early from their vested tokens.
  Rewards for locked RDNT = Platform fees + Penalty fees

Note: 20% of all RDNT emissions are allocated to Pool2 (RDNT/WETH) rewards.
Reference: [https://docs.radiant.capital/docs/project-info/vesting-and-locking/pool2](https://docs.radiant.capital/docs/project-info/vesting-and-locking/pool2)

## Protocol owned liquidity

There's no protocol owned liquidity for Radiant, but only a treasury.
3% of RDNT allocation is for Treasury and Liquidity.
Reference: [https://docs.radiant.capital/docs/project-info/rdnt-token](https://docs.radiant.capital/docs/project-info/rdnt-token)

## Positional Notes

- The MultiFeeDistribution Contract (0xc2054a8c33bfce28de8af4af548c48915c455c13) tries to send out collateral tokens and has not opened a position for it before. This contract is staking contract.
  - This tries to subtract from a position that doesn't exist. Therefore there is no record of tokens going there.
  - Since this is an internal contract (and not a whale) we are going to leave as is.
