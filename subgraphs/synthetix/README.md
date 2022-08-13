# Introduction of Synthetix

## Overview of Synthetix
Synthetix is a collateralised lending platforms for users to deposit SNX, its platform token, to mint sUSD, a stablecoin. 

Currently, Synthetix operates on Ethereum and Optimism.

## Useful Links
- Protocol: https://synthetix.io/
- dAPP page: https://staking.synthetix.io/staking/mint
- Dashboard: https://grafana.synthetix.io
- Docs: https://docs.synthetix.io/
- DAO: https://synthetix.io/governance
- Discord: https://discord.com/invite/AEdUHzt
- Whitepaper: https://docs.synthetix.io/litepaper/
- Github: https://github.com/Synthetixio/synthetix
- Smart contracts: https://docs.synthetix.io/contracts/

## Mechanism 

### Main Feature - Staking

*Staking to Mint sUSD*

Users stake SNX into mint sUSD, a synthetic stablecoin, at 400% overcollateralisation. 

*Trading on Kwenta*

sUSD can be traded on Kwenta, a Synthetix-integrated dex, for other synthetic cryptocurrencies created by Synthetix, such as sBTC, sETH or synthetic foreign currencies like sEUR, sJPY (collectively, "Synth"). Trading these Synth is a process of burning the source Synth and minting (less fees) the destination Synth, based on Oracle price. There's no liquidity pool in this design, and the counter party is all SNX stakers (owners of debt pool), and therefore there's no slippage.
- For a full of Synth that can be traded on Kwenta: https://kwenta.io/dashboard/overview

*Debt Pool*

SNX stakers incur a debt when they mint sUSD. This debt is not individual but a share of the total debt of the system ("Debt Pool"). As sUSD can be traded into other Synth, such as sBTC, the debt pool is the sum of all the Synth in the system. The value of the debt pool can vary according to the prices of the Synth. 

For an individual user, his share of the debt pool is the sUSD he mints over the total value of the debt pool at the point of minting.

In this way, SNX stakers act as a pooled counterparty to all Synth exchanges; stakers take on the risk of the overall debt in the system. 

Ethereum and Optimism SNX stakers share the same debt pool. 
- https://blog.synthetix.io/debt-pool-synthesis-2/

*Liquidation*

Stakers of SNX (or depositors of ETH and BTC) can be liquidated if their debt are not sufficiently collateralised. 
- https://blog.synthetix.io/new-liquidation-mechanism/

### Other Features

*Wrapper*

Synthetix also allows (or historically allowed) users to deposit ETH, renBTC and LUSD as collaterals, to borrow sETH or sUSD. This feature changed a few times in the past and it's not in the documentation. 

Depositing ETH, renBTC or LUSD into Synthetix is separated from staking SNX. It functions like a normal CDP, whereby:
  - It's in the "Loan" screen in UI, not the Staking UI
  - The minted underlyings of sETH or sUSD do not go into debt pool (see definition below) 
  - The depositors do not have SNX staking rewards, nor do they share the debt pool exposure
  
Additional info on Wrapper:
- LUSD wrapper on Optimism: https://optimistic.etherscan.io/address/0x8a91e92fdd86e734781c38db52a390e1b99fba7c
- A data dashboard from Discord, refer the link for details: https://discord.com/channels/413890591840272394/479848672289488906/975848214404141166

*Depot*

Allows anyone with sUSD to deposit their sUSD and users to exchange ETH for sUSD. It's a contract function stated in the docs but not in the UI.
- https://docs.synthetix.io/contracts/source/contracts/Depot/
- https://docs.synthetix.io/contracts/#depot

## Fees

Synthetix charges the below types of fees, which go to the fee 

*Trading Fee*

When Synths are exchanged through the Synthetix contract, a fee is extracted and sent to the fee pool to be claimed by SNX stakers. Whilst trades are done on the website of Kwenta, the minting and burning of Synth are based on Synthetix contract, and therefore a fee is charged by Synthetix. Currently, there are two levels of fees (refer to https://docs.kwenta.io/products/exchange-fees for details):
- Exchange fee: 0.25% on Optimism (L2) and between 0.2-0.5% on Ethereum (L1)
- Dynamic exchange fees: additional fees paid by traders under volatile market conditions that neutralize front-running opportunities and protect stakers

*Liquidation Fee*

Liquidation fee is 30% by others or 20% for self-liquidate. 

Fees are not shared between L1 and L2. Fees from L2 only go to L2 SNX stakers, and fees from L1 only go to L1 stakers.

*Issuance Fee*

Under the Wrapper feature, sometimes a small issuance fee like 0.1% is charged, e.g. using renBTC to mint sUSD.

*Interest*

Under the Wrapper feature, sometimes an interest is charged, e.g. 0.25% depositing ETH to mint sETH on Optimism.

<br>
  
Fees are allocated based on the proportion of debt each staker has issued. For example, if a staker has issued 1,000 sUSD in debt, the debt pool is 10,000 sUSD, and 100 in fees are generated in a fee period, this staker is entitled to 10 sUSD because their debt represents 10% of the debt pool. The same proportional distribution mechanism is used for SNX staking rewards. 
- Reference: https://docs.synthetix.io/litepaper/, under section "Claiming Fees"


## Platform Token SNX and Incentives

SNX is the platform token, mainly used as collaterals described above.

SNX tokens are given to SNX stakers as incentives, with a 12-month vesting period.


## Usage Metrics

The usage of Synthetix includes the following:

*SNX Stakers*

- Stake SNX and mint sUSD
- Burn sUSD to withdraw SNX
- Claim staking rewards (fee and staking)
- Claim liquidation rewards
- Vest escrowed rewards
- Liquidation
- Self-liquidation
- Merge two accounts into one
- Bridge to Optimism

*Trading*

Although the trading activities are on Kwenta website, the fees are accrued to the Synthetix contract. So trading via mint/burn of synths can be considered as Synthetix usage. The same can be used other DeFi protocols, e.g. Curve. 

- Trade synths (via mint/burn a pair of synths)

*Wrapper*

- Deposit ETH/renBTC/LUSD in wrapper contract to mint sUSD or sETH
- Burn sUSD or sETH to withdraw collaterals

*Depot*

- Deposit sUSD
- Trade ETH for sUSD in depot

## Financial Metrics

### TVL 
TVL is the sum of collaterals in Staking and Wrapper, e.g. the sum of SNX staked and ETH, LUSD, renBTC, etc. deposited for loans.
> TVL = （Price of SNX * SNX tokens staked in the Staking contract) + (Price of ETH * ETH tokens in the Wrapper contract) + (Price of LUSD * LUSD tokens inthe Wrapper contract) + (Price of renBTC * renBTC tokens inthe Wrapper contract) 

### Total Borrow
Totol borrow will be the sum of all the synths, including those in the debt pool and those minted from the Wrappers.
> Total Borrow = $\sum$ value of synths in Debt Pool + $\sum$ value of synths minted from the Wrapper  

### Revenue
There's no liquidity provider in Synthetix, so all revenue is protocol-side (belong to stakers of SNX).

#### Protocol-Side Revenue

- Trading fees
- Liquidation fees
- (From Wrapper) issuance fee
- (From Wrapper) interest

> Protocol-side revenue = $\sum$ (Trading fees, Liquidation Fees, Issurance Fees, interest) <br>
Whereas, <br>
> Trading fees = $\sum$ (exchange fee rate for each synth + dynamic fee rate when applicable) * value of the transacted synth <br>
> Liquidation fees = $\sum$ liquidation penalty * sUSD burnt in liquidation <br>
> Issurance fees = $\sum$ issurance fee rate when applicable * sSUD minted <br>
> Interest = $\sum$ interest rate when applicable * sSUD minted <br>

#### Supply-Side Revenue
Nil.

### Rewards

SNX stakers also receive SNX rewards, subject to a 12 month lock.

### Protocol Owned Liquidity

There's no protocol owned liquidity by Synthetix. Synthetix has a treasury:
- 0x99f4176ee457afedffcb1839c7ab7a030a5e4a92
