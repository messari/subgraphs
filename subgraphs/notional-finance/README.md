# Introduction of Notional Finance

## Version 1.1.0

\*Note on 7 Sept 2022: Notional Finance is one protocol with two services, a DEX (of fCASH and cTOKENs) and a lending and borrowing protocol. The two services are intertwined and not divisible from a product perspective. For the purpose of subgraph, a version computing the statistics of the lending and borrowing services of Notional will be delivered first. In this version, liquidity represented by nTokens (LP liquidity) is not considered as part of lending or borrowing, as they are part of the DEX service.

## Overview of Notional Finance

Notional Finance is a protocol for decentralized fixed term, fixed rate lending. For now it only operates on Ethereum.

Currently, Notional has the following types of loans and rolls each quarter:

- USDC (3 month, 6 month & 1 year maturity)
- DAI (3 month, 6 month & 1 year maturity)
- ETH (3 month & 6 month maturity)
- WBTC (3 month & 6 month maturity)

## Useful Links

- Protocol: https://notional.finance/
- Dashboard: https://info.notional.finance/
- User Docs: https://docs.notional.finance/notional-v2/
- Dev Docs: https://docs.notional.finance/developer-documentation/
- Deployed Contracts: https://docs.notional.finance/developer-documentation/#deployed-contract-addresses
- White Paper: https://github.com/notional-finance/contracts-v2/blob/master/WHITEPAPER.md#notional-v2-whitepaper
- V1 White Paper (for some basic concepts): https://docs.notional.finance/developers/whitepaper/whitepaper
- Governance Forum: https://forum.notional.finance/
- Discord: https://discord.notional.finance/

## Mechanism

_Principal_

Notional achieves fixed term loan for an asset, e.g. DAI, by creating a zero-coupon instrument of the asset, which can be redeemed to 1 unit of the asset at a fixed date in the future. E.g. Notional issues fDAI quarterly which can be redeemed to DAI with 3-month, 6-month and 1-year maturity.

Fixed interest rate is achieved as the zero-coupon instrument theoretically trades at a discount to the asset prior to its maturity. At any point of time, a transaction of fDAI (with DAI) happens, the discount amount is locked in and an interest rate can be derived from there. For example, if a user purchases fDAI (using DAI) at 0.98 and redeems fDAI for DAI at 1.00 upon maturity 3 months later, then he is effectively earned an interest of 2%/90 days, annualised to be 8%. This rate is locked in at the moment the user enters into the transaction of buying fDAI, and therefore is "fixed".

_fCASH, a ERC1155 Token_

The above zero-coupon instrument is generally called fCASH in Notional, whereby CASH refers to any of DAI, USDC, ETH or WBTC.

Whilst some other similar platform (Element Finance or Yield) just use ERC20 tokens for zero-coupon instruments，Notional adopts an ERC1155 standard. Each type of fCASH with a distinctive maturity date is a ERC115 token with unique ID under the Notional main proxy contract. For instance, different IDs represent 3-month fDAI, 6-month fDAI, 1-year fETH, etc.

Each fCash token is uniquely identified by an ERC1155 ID that is constructed as follows:

- 256 bits encoded as: | 0 (192 bits) | 16 bits (currency id) | 40 bits (maturity) | 8 bits (asset type) |
- Further details on Notional's ERC1155 fCASH can be found here: https://docs.notional.finance/developer-documentation/how-to/lend-and-borrow-fcash/otc-trading-erc1155

A user's balance of any fCASH can be positive or negative. At a fCASH's maturity, 1 unit of positive fCash allows the user to redeem 1 unit of the underlying asset and 1 unit of negative fCash means an obligation of the user to pay 1 unit underlying asset in order to release his collaterals.

_cTOKENs, Underlying Asset_

Instead of using these native tokens directly, Notional uses their Compound version, the LP tokens of DAI, USDC, ETH and BTC when deposited into Compound, i,e. cDAI, cUSDC, cETH and cWBTC, as underlying tokens. When lending and borrowing DAI in Notional, users trade fDAI with cDAI, instead of DAI. These Compound tokens are referred to as cTOKENs in the context of Notional.

- For the avoidance of doubt, as cDAI is usually $$0.02 plus and not $1, fDAI trades to cDAI as the prevailing market exchange rate of cDAI/DAI, so as to track DAI prices. E.g. at redemption, 1 fDAI is converted to cDAI at the market exchange of cDAI/DAI to give the user 1 DAI worth of cDAI.

_Account Structure Under the Main Proxy Contract_

The account structure of Notional has two layers:

- Account level: users deposit tokens into Notional (usually as collaterals) and these tokens are automatically converted to cTOKENs. This is referred to as cash in Notional. Users also can have cash from settlement of matured loans. In relation to this, users also have fCASH at their account level, representing their loans or debts of different maturity to the Notional system.
- AMM Liquidity pool: users can deposit cTOKENs and fCASH in to liquidity pools within the Notional main proxy contract. Liquidity pool is an AMM that facilitates the buying and selling of fCASH tokens (against cTOKENs), and therefore serves as the counter party of any lender or borrower. LP of liquidity pools hold in their wallets nTOKENs, which are ERC20 tokens.

## Lender, Borrower, Liquidity Provider and Other Actions

_Liquidity Provider_
Each fCASH token with different ID has its dedicated pool under the main proxy contract. Each pool contains fCASH with a specific maturity and the corresponding cTOKENs, e.g. fDAI-3m and cDAI pool.

The LP token, nTOKEN, represents a holders' share of the aggregate value of all pools of different maturities of one asset in Notional. E.g. all pools containing fDAIs of any maturity is represented by a nTOKEN, nDAI.

A liquidity provider deposits cTOKENs into the pool, and receives a nTOKEN as the LP token. The main proxy contract does the following:

- Distributes a user's cTOKENs to individual pools based on governance parameters (Reference: https://docs.notional.finance/governance/overview-of-governance-parameters/selected-parameters#deposit-shares)
- It mints an fCASH pair (an equal amount of positive fCASH and a negative fCASH) for each pool
- Deposit the fCASH and the cTOKENs into each pool
  The liquidity provider is left with a negative balance of fCASH and nTOKEN.

_Lender_

Lenders of the protocol are those who buy fCash (at a discount to cTOKENs, therefore earning an interest upon maturity) from the pool.

At maturity, all fCASH at account level are converted automatically to cTOKENs.

_Borrower_

Firstly, a borrower deposits tokens or cTOKENs into Notional as collaterals. Collaterals are parked under the user's account level in Notional.

Secondly, to borrow, the borrower specifies a borrowing amount in a token type and a duration. The main proxy contract does the following:

- Mint a corresponding fCASH pair (a positive and a negative) matching the borrowing requirement
- Sell the positive fCASH into its liquidity pool for cTOKENs and returns to the borrower
  The borrower is left with a negative fCASH balance, indicating his obligation to pay back the loan before he can release his collateral.

In Notional, cTOKENs in the account level, fCASH tokens and nTOKENs can all be counted as collaterals automatically.

_Liquidator_

Borrowers who are undercollateralised can be liquidated just like any other lending platforms. Liquidator pays for a portion of the debt in exchange for collaterals.

_Settlement_

In the event that a borrower has a debt matured but not paid, and at the same time his account is overall well-collateralised, then a third party can make a settlement for him. In this situation, a third party is a lender who deposits the cTOKEN and lends directly to the borrower at a penalty rate.

Reference:

- https://github.com/notional-finance/contracts-v2/blob/master/WHITEPAPER.md#settlement-via-debt
- https://docs.notional.finance/notional-v2/risk-and-collateralization/settlement

_OTC Trade of idiosyncratic fCash_

In Notional, fCASH is rolled quarterly, e.g. fCash with 6-month maturity at issue, after 3 months, will become tradable in the new 3-month fCash market. In some cases, a fCASH might have no marching market for it, e.g. a 1-year fCASH at issue, after 3 months it becomes 9-month maturity and Notional does not have any 9-month market.

In this cases, such fCASH can only be traded via OTC, i.e. two parties signing off the same transaction.

Reference:

- https://github.com/notional-finance/contracts-v2/blob/master/WHITEPAPER.md#persistent-maturities
- https://docs.notional.finance/developer-documentation/how-to/lend-and-borrow-fcash/otc-trading-erc1155

## Stakers of NOTE, Governance Token

Notional has a governance token NOTE, which is used for governance purpose and incentivising liquidity providers. Holders of NOTE tokens can stake it for rewards.

- https://docs.notional.finance/notional-v2/governance/the-note

## Usage Metrics

### Pool Level

The pool of Notional can be classified by assets (DAI, USDC, ETH, BTC) and maturity date. E.g. DAI loans maturing on 25 Sept 2022, DAI loans maturing on 24 Dec 2022, ETH loans maturing on 24 Dec 2022, etc. This goes in line with the concept of "Markets" by Notional. (Ref: https://info.notional.finance/).

The usage of a Notional pool includes the following:

- Liquidity providers provide/withdraw liquidity
- Liquidity providers claim NOTE incentives
- Lenders deposit/withdraw
- Borrowers deposit/release collaterals into their account
- Borrowers borrow/repay
  - Rollover a loan (this is actually repaying the current loan and borrowing a longer term loan)
- Liquidation
- Third party settlement of a matured loan
- OTC trade
- (x) Wrap fCASH is a smart contract of Notional but not a service in the Notional UI, so it's not considered a usage of Notional

Due to the design of Notional, some transactions of different user intention may call the same action type in the smart contract function. For instance, lending is depositing into the smart contract cTOKENs and increase amount of the corresponding fCASH tokens in one's portfolio. This is also the same for repaying a loan. The nature of the transaction can therefore only be determined by looking at the value of fCASH token balance at the beginning of the transaction:

- if before the transaction, the user's fCASH balance is zero or positive, increasing his fCASH balance to a higher positive number indicates he is lending;
- If before the transaction his fCASH balance is negative, increasing his fCASH balance, i.e. reducing the negative amount or reducing it to zero, indicates that he is repaying a loan.

Similarly, when a user's fCASH balance decreases after a transaction, then:

- if before the transaction, the users' fCASH balance is zero or negative, decreasing his fCASH balance indicates he is borrowing;
- if before the transaction, the user's fCASH balance is positive, decreasing his fCASH balance indicates he is withdrawing.

### Protocol Level

The protocol level metrics of the above items is the sum of the same metrics from all pools. In addition, protocol level metric may include stakers staking and unstaking NOTE tokens.

## Financial Metrics

### Pool Level

The pool of Notional can be classified by assets (DAI, USDC, ETH, BTC) and maturity date. E.g. DAI loans maturing on 25 Sept 2022, DAI loans maturing on 24 Dec 2022, ETH loans maturing on 24 Dec 2022, etc. This goes in line with the concept of "Markets" by Notional. (Ref: https://info.notional.finance/).

_TVL_

The TVL of each pool is the value of cTOKEN in each pool. The value is the net result of:

- Lenders deposit/withdraw cTOKENs
- Borrower borrow/repay cTOKENs
- ~~Borrowers deposit/release collaterals in cTOKENs~~ (Pending issue: collaterals do not go to any pool, so there should be another class for collaterals)

To simplify, the formula of Notional's TVL is:

> TVL = $\sum$ value of cToken assets (cDAI, cUSDC, cETH, cWBTC) in the pool

_Total Deposit Balance_

This is the net result of all deposit/withdrawals. This should equal to TVL less the cTokens from liquidity providers. However, this is the balance of liquidity in the pool, and not a measure of the actual deposit volume.

> Total Deposit Balance = $\sum$ deposits of cTokens by users - $\sum$ withdrawal of cToken by users

When a pool matures, the deposits by users in that pool will be automatically convert back to cTokens at users' account level. The users decide if they wish to rollover into another lending. So the total deposit of a matured pool will be zero.

_Cumulative Deposit_
This is the sum of all deposits. When a pool matures, this record stays with the pool. This is meant to be a reflection of the business volume of the pool.

> Cumulative Deposit Balance = $\sum$ deposits of cTokens by users

_Total Borrowing Balance_

This is the net result of all borrowing/repayments. This should equal to the total deposit balance, after adjusting for cToken changes in the pool.

> Total Borrowing Balance = $\sum$ borrowings of cTokens by users - $\sum$ repayments of cToken by users

When a pool matures, the borrowings by users in that pool should have been all-repaid (before maturity date), or settled to the next pool by other users (on or shortly after maturity date), or liquidated (any time, depending on collateral ratio only). So the pool should have a zero or close-to-zero balance.

_Cumulative Borrowing Balance_
This is the sum of all borrowings. When a pool matures, this record stays with the pool. This is meant to be a reflection of the business volume of the pool.

> Cumulative Borrowing Balance = $\sum$ borrowings of cTokens by users

_Volume_

Volume in the context of Notional is the aggregate transactions with the liquidity pool. For instance, total borrowing volume is the total selling transactions of fCASH.

To simplify, the formula of Notional's Volume (combining lend, borrow, repay and withdraw) is:

> Volumn = $\sum$ value of fCASH transacted

_Revenue_

Notional has two types of revenue:

- Revenue from lending and borrowing service. Interests paid by borrowers to lenders. Different from Aave or Compound, Notional operates like a trading platform of zero-interest coupon (buying and selling fCASH), so the interests paid by borrowers to lenders do not accrue per block, but rather happens when each trade takes place. To simplify, we take the difference between the cTOKEN value and fCASH future value as the interest paid. For any given period, the higher of borrowing interests paid (selling fCASH) and lending interest paid (buying fCASH) is the interest revenue for that period. For more details please refer to Appendix: Consideration on Interest Revenue For Notional.

To simplify, the formula of Notional's lending and borrowing revenue is:

> Revenue = $\sum$ value of fCASH transacted _ interest rate annualized _ (loan duration in days / 365)

- Revenue from DEX service (not include in the subgraph for the lending and borrowing service). Fees paid by borrowers and lenders for each trade. Notional charges a fee for each transaction with the liquidity pool, e.g. borrow, repay, lend, withdraw. The fee rate is 0.3% per transaction for a 1-year loan, and pro rata for shorter maturity, i.e. 0.15% for 6-month loan. 80% of the fees go to the protocol and 20% goes to the liquidity provider. In the DEX service, the protocol side revenue of Notional will be the 80% transaction fees generated from the transaction fees. The supply side revenue is the sum of 20% of the transaction fees. Interests paid to lenders are not counted as revenue, as suggested above.
  - Reference: https://docs.notional.finance/governance/overview-of-governance-parameters/selected-parameters#fees-and-incentives

_Interest Rate_

Theoretically, interest rate of Notional is derived from the exchange rate between the fCASH price and cTOKEN price. Notional uses an Oracle Rate, modified from the last traded rate, as the interest rate for internal computation.

- https://docs.notional.finance/notional-v2/fcash-valuation/interest-rate-oracles

> Exchange rate = cToken price / fToken price
> Interest rate = Exchange rate - 1 / days to maturity \* 365

_Max LTV and Liquidation_

Notional's Max LTV is unique. Each market may have different a max LTV depending on the collaterals used and borrowings of the user.

For each borrower, each of his collateral has a haircut rate (<1), and each of his debt has a buffer (>1). The two factors work together to determine the user's max LTV at his account level. When a user cannot maintain his max LTV ratio, then he can be liquidated.

- https://docs.notional.finance/developer-documentation/how-to/liquidations (first 2 lines under key concepts).

Example: one account has 1 eth and borrowed 300 dai. ETH:DAI is now 1:400. ETH hair-cut is 0.8 and DAI debt buffer is 1.25. So collateral value (in eth) is 1 x 0.8 = 0.8; and debt value (in ETH) is 300/400 X 12.5 = 0.9375. As debt is more than collateral, the account can be liquidated.

- https://docs.notional.finance/notional-v2/risk-and-collateralization/liquidation

_Rewards_

Rewards in NOTE token are given to liquidity providers.

### Protocol Level

The protocol level metrics of the above items is the sum of the same metrics from all pools.

_Protocol Owned Liquidity_
Notional has a treasury but not protocol owned liquidity. fCASH is more of an accounting convenience and not a liquidity token.

- https://info.notional.finance/treasury

## Notes on Transactions

Notional has only one main proxy smart contract as the main contract for handling all transactions. At the main proxy contract level, there are only a few functions, e.g. batchBalanceAndTradeAction and batchLend. The actionType a user specifies when calling these functions determines what type of transaction it is, e.g. DepositAsset: deposits asset cash (i.e. cDAI, cUSDC, aFRAX) into the account's cash balance.

## Appendix: Consideration on Interest Revenue For Notional

Notional's interest revenue from borrowers to lenders are different from that of Aave or Compound. In Aave or Compound, interest is accrued per block in accordance with TVL and interest rate. In Notional, lenders and borrowers are buyers and sellers of fCASH, which is a zero-coupon bond. Therefore, interest is implied when a transaction of fCASH happens.

For example, user A sells a 1-year fDAI to a user B, for a discount of 5%, i.e. 95 cents worth of cDAI for 1 fDAI (which can redeem $1 worth of cDAI in a year). Effectively, A borrows from B 1 DAI at an interest rate of 5%. If both of them hold to maturity, then the interest paid by A to B is 5 cents of DAI, the market value of the differences between cDAI and fDAI in that transaction.

However, in decentralized finance, it's not necessary to have a matching A and B. The liquidity pools serves the purpose. So the above case has actually two transactions: A sells fDAI to the liquidity pool, and B buys the fDAI from the liquidity pool. The gist of the two transactions is still A borrows from B 1 DAI for 5 cents of interest.

As the buying and selling in any liquidity pool usually do not match, so the lending and borrowings amount of any fCASH over a period of time will not match. The liquidity pool served as a counter party for any shortage: when there's more borrowing than lending, the additional borrowing comes from the liquidity pool. Therefore, the amount of actual borrowing/lending in any period is the higher of the borrowing and lending amount during that period.

In this method, there might be a situation when the same person borrows and repays before maturity. If his borrowing and repayment happen closely, in principal he does not incur any interest. However, in this method, his action is counted as one borrowing and interest is incurred. To adjust for this, we need to look into the transactions in this period and compute the higher of:

- interests from all borrowings - interests from all repayments
- interests from all lendings - interests from all withdraws

However, this might be technically cumbersome to recitify this error. In any case, most lending protocols do not eliminate lendings and borrowing from the same address from their statistics.

# Methodology Implementation Challenges

- Market Balances and Positions: We update market balances and positions to 0 manually when a market is observed to have matured (become inactive). When a market is approaching maturity (see [settlement](https://docs.notional.finance/notional-v2/risk-and-collateralization/settlement#third-party-settlement) details), a user can roll over their position (through individual lend and borrow trades which will be captured through `LendBorrowTrade` event) or a 3p can settle the user balances. In either case, matured market positions should become 0 and positions with rolled-over market will be captured separately.

- Liquidation metrics (e.g. `market.cumulativeLiquidateUSD`, `liquidate.market`, `liquidate.position`): Liquidation events do not report any market info because they are not associated with a market from the perspective of Notional. We cannot update position or market data associated with liquidation events as a result.

- ERC1155: Notional finance represents positions (asset deposits/borrows) using ERC1155 tokens (currencyfCash-maturityDate pairs). The contracts expose `tokenId` but do not expose any metadata. Therefore, we create token entities with only id param available and set to `ERC1155-{tokenAddress}-{tokenId}`.

- Repay and Deposit, Withdraw and Borrow: Notional team confirmed that these can happen in a single action. However, such actions seem to happen through [BatchActions](https://github.com/notional-finance/contracts-v2/blob/63eb0b46ec37e5fc5447bdde3d951dd90f245741/contracts/external/actions/BatchAction.sol#L78) which should still result in individual LendBorrow trades. Further, I didn't find any occurrences of `repay and deposit` and `withdraw and borrow` in single LendBorrow trade based on logging observations. Hence, I include those conditionals for such events and log.warn any such occurrences for future.

- Negative Input Token Balances: When we observe negative token balances, we set it to 0. This results in totalDepositBalanceUSD and supply side revenue to be 0 as well.
