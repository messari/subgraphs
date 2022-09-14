# Introduction of Notional Finance

## Overview of Notional Finance
Notional Finance is a protocol for decentralised fixed term, fixed rate lending. For now it only operates on Ethereum. 

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

*Principal*

Notional achieves fixed term loan for an asset, e.g. DAI, by creating a zero-coupon instrument of the asset, which can be redeemed to 1 unit of the asset at a fixed date in the future. E.g. Notional issues fDAI quarterly which can be redeemed to DAI with 3-month, 6-month and 1-year maturity. 

Fixed interest rate is achieved as the zero-coupon instrument theoretically trades at a discount to the asset prior to its maturity. At any point of time, a transaction of fDAI (with DAI) happens, the discount amount is locked in and an interest rate can be derived from there. For example, if a user purchases fDAI (using DAI) at 0.98 and redeems fDAI for DAI at 1.00 upon maturity 3 months later, then he is effectively earned an interest of 2%/90 days, annualised to be 8%. This rate is locked in at the moment the user enters into the transaction of buying fDAI, and therefore is "fixed".

*fCASH, a ERC1155 Token*

The above zero-coupon instrument is generally called fCASH in Notional, whereby CASH refers to any of DAI, USDC, ETH or WBTC. 

Whilst some other similar platform (Element Finance or Yield) just use ERC20 tokens for zero-coupon instruments，Notional adopts an ERC1155 standard. Each type of fCASH with a distinctive maturity date is a ERC115 token with unique ID under the Notional main proxy contract. For instance, different IDs represent 3-month fDAI, 6-month fDAI, 1-year fETH, etc. 

Each fCash token is uniquely identified by an ERC1155 ID that is constructed as follows:
- 256 bits encoded as: | 0 (192 bits) | 16 bits (currency id) | 40 bits (maturity) | 8 bits (asset type) | 
- Further details on Notional's ERC1155 fCASH can be found here: https://docs.notional.finance/developer-documentation/how-to/lend-and-borrow-fcash/otc-trading-erc1155

A user's balance of any fCASH can be positive or negative. At a fCASH's maturity, 1 unit of positive fCash allows the user to redeem 1 unit of the underlying asset and 1 unit of negative fCash means an obligation of the user to pay 1 unit underlying asset in order to release his collaterals.

*cTOKENs, Underlying Asset*

Instead of using these native tokens directly, Notional uses their Compound version, the LP tokens of DAI, USDC, ETH and BTC when deposited into Compound, i,e. cDAI, cUSDC, cETH and cWBTC, as underlying tokens. When lending and borrowing DAI in Notional, users trade fDAI with cDAI, instead of DAI. These Compound tokens are referred to as cTOKENs in the context of Notional.

- For the avoidance of doubt, as cDAI is usually $$0.02 plus and not $1, fDAI trades to cDAI as the prevailing market exchange rate of cDAI/DAI, so as to track DAI prices. E.g. at redemption, 1 fDAI is converted to cDAI at the market exchange of cDAI/DAI to give the user 1 DAI worth of cDAI.

*Account Structure Under the Main Proxy Contract*

The account structure of Notional has two layers:
- Account level: users deposit tokens into Notional (usually as collaterals) and these tokens are automatically converted to cTOKENs. This is referred to as cash in Notional. Users also can have cash from settlement of matured loans. In relation to this, users also have fCASH at their account level, representing their loans or debts of different maturity to the Notional system.
- AMM Liquidity pool: users can deposit cTOKENs and fCASH in to liquidity pools within the Notional main proxy contract. Liquidity pool is an AMM that facilitates the buying and selling of fCASH tokens (against cTOKENs), and therefore serves as the counter party of any lender or borrower. LP of liquidity pools hold in their wallets nTOKENs, which are ERC20 tokens. 

## Lender, Borrower, Liquidity Provider and Other Actions

*Liquidity Provider*
Each fCASH token with different ID has its dedicated pool under the main proxy contract. Each pool contains fCASH with a specific maturity and the corresponding cTOKENs, e.g. fDAI-3m and cDAI pool. 

The LP token, nTOKEN, represents a holders' share of the aggregate value of all pools of different maturities of one asset in Notional. E.g. all pools containing fDAIs of any maturity is represented by a nTOKEN, nDAI.

A liquidity provider deposits cTOKENs into the pool, and receives a nTOKEN as the LP token. The main proxy contract does the following:
 - Distributes a user's cTOKENs to individual pools based on governance parameters (Reference: https://docs.notional.finance/governance/overview-of-governance-parameters/selected-parameters#deposit-shares)
 - It mints an fCASH pair (an equal amount of positive fCASH and a negative fCASH) for each pool
 - Deposit the fCASH and the cTOKENs into each pool
The liquidity provider is left with a negative balance of fCASH and nTOKEN.

*Lender*

Lenders of the protocol are those who buy fCash (at a discount to cTOKENs, therefore earning an interest upon maturity) from the pool.

At maturity, all fCASH at account level are converted automatically to cTOKENs.

*Borrower*

Firstly, a borrower deposits tokens or cTOKENs into Notional as collaterals. Collaterals are parked under the user's account level in Notional.

Secondly, to borrow, the borrower specifies a borrowing amount in a token type and a duration. The main proxy contract does the following:
- Mint a corresponding fCASH pair (a positive and a negative) matching the borrowing requirement
- Sell the positive fCASH into its liquidity pool for cTOKENs and returns to the borrower
The borrower is left with a negative fCASH balance, indicating his obligation to pay back the loan before he can release his collateral.

In Notional, cTOKENs in the account level, fCASH tokens and nTOKENs can all be counted as collaterals automatically.

*Liquidator*

Borrowers who are undercollateralised can be liquidated just like any other lending platforms. Liquidator pays for a portion of the debt in exchange for collaterals.

*Settlement*

In the event that a borrower has a debt matured but not paid, and at the same time his account is overall well-collateralised, then a third party can make a settlement for him. In this situation, a third party is a lender who deposits the cTOKEN and lends directly to the borrower at a penalty rate.

Reference: 
- https://github.com/notional-finance/contracts-v2/blob/master/WHITEPAPER.md#settlement-via-debt
- https://docs.notional.finance/notional-v2/risk-and-collateralization/settlement

*OTC Trade of idiosyncratic fCash*

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
Pools of Notional can be classified by assets (DAI, USDC, ETH, BTC). Theoretically, each asset can be further classified according to maturity, but it's difficult as the collaterals and nTOKENs do not have corresponding maturity.

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
Pools of Notional can be classified by assets (DAI, USDC, ETH, BTC). 

*TVL* 

The TVL of each pool is the cTOKEN in the main proxy contract. The value is the net result of:
- Lenders deposit/withdraw cTOKENs
- Borrower borrow/repay cTOKENs
- Borrowers deposit/release collaterals in cTOKENs
- Liquidity providers provide/withdraw cTOKENs as liquidity

To simplify, the formula of Notional's TVL is:
> TVL = $\sum$ value of cToken assets (cDAI, cUSDC, cETH, cWBTC) in the proxy contract

*Volume*

Volume in the context of Notional is the aggregate transactions with the liquidity pool. For instance, total borrowing volume is the total selling transactions of fCASH.

To simplify, the formula of Notional's Volume (combining lend, borrow, repay and withdraw) is:
> Volumn = $\sum$ value of fCASH transacted

*Revenue*

Notional has two types of revenue:
- Interests paid by borrowers to lenders. Different from Aave or Compound, Notional operates like a trading platform of zero-interest coupon (buying and selling fCASH), so the interests paid by borrowers to lenders do not accrue per block, but rather happens when each trade takes place. To simplify, we take the difference between the cTOKEN value and fCASH future value as the interest paid. For any given period, the higher of borrowing interests paid (selling fCASH) and lending interest paid (buying fCASH) is the interest revenue for that period. For more details please refer to Appendix: Consideration on Interest Revenue For Notional.

**To simplify the revenue, we can presume the interest paid by borrowers to lenders is not revenue, i.e. only counting revenue generated to liquidity providiers as revenue.** 

- Fees paid by borrowers and lenders for each trade. Notional charges a fee for each transaction with the liquidity pool, e.g. borrow, repay, lend, withdraw. The fee rate is 0.3% per transaction for a 1-year loan, and pro rata for shorter maturity, i.e. 0.15% for 6-month loan. 80% of the fees go to the protocol and 20% goes to the liquidity provider. 
  - Reference: https://docs.notional.finance/governance/overview-of-governance-parameters/selected-parameters#fees-and-incentives
  
To simplify, the formula of Notional's Revenue is:
> Revenue = $\sum$ value of fCASH transacted * fee rate of 0.3%

As such, the protocol side revenue of Notional will be the 80% transaction fees generated from the transaction fees. The supply side revenue is the sum of 20% of the transaction fees. Interests paid to lenders are not counted as revenue, as suggested above.

*Interest Rate*

Theoretically, interest rate of Notional is derived from the exchange rate between the fCASH price and cTOKEN price. Notional uses an Oracle Rate, modified from the last traded rate, as the interest rate for internal computation. 
- https://docs.notional.finance/notional-v2/fcash-valuation/interest-rate-oracles

*Rewards*

Rewards in NOTE token are given to liquidity providers.

### Protocol Level
The protocol level metrics of the above items is the sum of the same metrics from all pools. 

*Protocol Owned Liquidity*
Notional has a treasury but not protocol owned liquidity. fCASH is more of an accounting convenience and not a liquidity token. 
 - https://info.notional.finance/treasury

## Notes on Transactions 
Notional has only one main proxy smart contract as the main contract for handling all transactions. At the main proxy contract level, there are only a few functions, e.g. batchBalanceAndTradeAction and batchLend. The actionType a user specifies when calling these functions determines what type of transaction it is, e.g. DepositAsset: deposits asset cash (i.e. cDAI, cUSDC, aFRAX) into the account's cash balance. 

## Appendix: Consideration on Interest Revenue For Notional

Notional's interest revenue from borrowers to lenders are different from that of Aave or Compound. In Aave or Compound, interest is accrued per block in accordance with TVL and interest rate. In Notional, lenders and borrowers are buyers and sellers of fCASH, which is a zero-coupon bond. Therefore, interest is implied when a transaction of fCASH happens. 

For example, user A sells a 1-year fDAI to a user B, for a discount of 5%, i.e. 95 cents worth of cDAI for 1 fDAI (which can redeem $1 worth of cDAI in a year). Effectively, A borrows from B 1 DAI at an interest rate of 5%. If both of them hold to maturity, then the interest paid by A to B is 5 cents of DAI, the market value of the differences between cDAI and fDAI in that transaction.

However, in decentralised finance, it's not necessary to have a matching A and B. The liquidity pools serves the purpose. So the above case has actually two transactions: A sells fDAI to the liquidity pool, and B buys the fDAI from the liquidity pool. The gist of the two transactions is still A borrows from B 1 DAI for 5 cents of interest.

As the buying and selling in any liquidity pool usually do not match, so the lending and borrowings amount of any fCASH over a period of time will not match. The liquidity pool served as a counter party for any shortage: when there's more borrowing than lending, the additional borrowing comes from the liquidity pool. Therefore, the amount of actual borrowing/lending in any period is the higher of the borrowing and lending amount during that period. 

In this method, there might be a situation when the same person borrows and repays before maturity. If his borrowing and repayment happen closely, in principal he does not incur any interest. However, in this method, his action is counted as one borrowing and interest is incurred. To adjust for this, we need to look into the transactions in this period and compute the higher of:
- interests from all borrowings - interests from all repayments
- interests from all lendings - interests from all withdraws

However, this might be technically cumbersome to recitify this error. In any case, most lending protocols do not eliminate lendings and borrowing from the same address from their statistics. 













