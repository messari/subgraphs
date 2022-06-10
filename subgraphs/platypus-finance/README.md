

# Platypus Subgraph Methodology v1.0

The Platypus Finance protocol is a single-side AMM (decentralized exchange) designed for exchanging stable cryptocurrencies (ERC20 tokens) on the Avalanche blockchain.

The protocol is implemented as a set of smart contracts; designed to prioritize censorship resistance, security, self-custody and maximum capital efficiency. Platypus takes the early innovations of Curve Finance (ETH mainnet) and adds the twist of single-token staking and asset-liability management, in an attempt to fix issues related to impermanent loss and slippage.


## Useful Links



* Main Page
    * [https://www.platypus.finance/](https://www.platypus.finance/)
* Protocol
    * AMM: [https://app.platypus.finance/swap](https://app.platypus.finance/swap)
    * LPs: [https://app.platypus.finance/pool?pool_group=main](https://app.platypus.finance/pool?pool_group=main)
    * Staking (vePTP): [https://app.platypus.finance/stake](https://app.platypus.finance/stake)
* Docs
    * Liquidity Mining Yellow Paper: [https://cdn.platypus.finance/Platypus_Liquidity_Mining_Paper.pdf](https://cdn.platypus.finance/Platypus_Liquidity_Mining_Paper.pdf)
    * AMM Technical Specification Yellow Paper: [https://cdn.platypus.finance/Platypus_Liquidity_Mining_Paper.pdf](https://cdn.platypus.finance/Platypus_Liquidity_Mining_Paper.pdf)
    * [https://docs.platypus.finance/platypus-finance-docs/](https://docs.platypus.finance/platypus-finance-docs/)
    * [https://docs.platypus.finance/platypus-finance-docs/developers/contracts](https://docs.platypus.finance/platypus-finance-docs/developers/contracts)
* Smart contracts
    * [https://github.com/platypus-finance](https://github.com/platypus-finance)
* Deployed addresses
    * [https://docs.platypus.finance/platypus-finance-docs/developers/contract-addresses](https://docs.platypus.finance/platypus-finance-docs/developers/contract-addresses)
* Airdrop Site
    * [https://airdrop.platypus.finance/](https://airdrop.platypus.finance/)
* Treasury
    * [https://gnosis-safe.io/app/avax:0x068e297e8FF74115C9E1C4b5B83B700FdA5aFdEB/balances](https://gnosis-safe.io/app/avax:0x068e297e8FF74115C9E1C4b5B83B700FdA5aFdEB/balances)
* Coverage Ratio & APR Example
    * [https://docs.platypus.finance/platypus-finance-docs/concepts/platypus-interest-rate-model](https://docs.platypus.finance/platypus-finance-docs/concepts/platypus-interest-rate-model)
* Medium
    * [https://medium.com/platypus-finance](https://medium.com/platypus-finance)
* Messari Profile
    * [https://messari.io/asset/platypus-finance](https://messari.io/asset/platypus-finance)


## Usage Metrics

**Active Users, Total Unique Users & Daily Transaction Count**

Transactions of interest on Platypus include:



* Depositing one (or more tokens) into a liquidity pool
* Staking LP token to Liquidity Mine PTP
* Staking PTP for vePTP
* Swapping one stablecoin for another (Stableswap)
* Minting a [Platopia Hero NFT](https://www.platypus.finance/nft)
    * Likely that only users who have engaged in Staking PTP would mint a hero but still worthwhile to keep track of

Any address which conducts one of the transactions above should be considered a User.

All unique addresses that have participated in any of the above accounts should be considered in the Total Unique Users Calculation. Furthermore, a 24-hour lookback period should be used to determine Daily Transaction Count.

**Total Swap Volume**

Total Volume on Platypus would be total amount (in USD) swapped across all assets available.

**Total LP Volume**

Given that Platypus allows users to add single-sided (as opposed to paired liquidity), Total LP Volume would be total deposits into any asset liquidity pool (both Main and Alt) on the Platypus platform.

_Note: _Additional breakdowns into Main Pool LP Volume and ALT Pool LP volume would be appropriate, as well.** **

**Total Staked Volume (PTP and vePTP)**

In order to mine the PTP token, users must stake their LP tokens after depositing into a liquidity pool. Process is as follows:

User deposits USDC into USDC:PTP Pool-> User received single-sided LP Token -> User stakes single-sided LP Token-> User receives emissions in PTP based on volume, coverage ratio/APR

Total Staked Volume (PTP) would be total LP tokens staked in on Platypus. This will likely be a % of Total LP Volume, and a **% of Staked/LP** would be an interesting metric as well.

Discussed under Reward Tokens below, but Platypus incorporates a veCRV model to boost PTP emissions at the pool level. After a user receives PTP from the LP staking process outlined above, they have the ability to further stake their PTP tokens to generate voting-escrowed PTP (vePTP). vePTP is non-tradeable or transferable and is used to boost PTP-rewards for LP stakers.

**Total NFT Activity (total minted and trading volume)**

In May, Platypus will be launching an NFT (Platopia; Platopia Hero), to incorporate into a user’s staking rewards:

_Pre-sale: _50 PTP (24 hours)

_Public sale: _Dutch Auction (100 PTP -> 20 PTP in 5 PTP increments)

Total NFT Activity is calculated by summing all wallets that minted a Platopia Hero or engaged in active trading of the NFT on secondary

**NFT Metrics**

There is a whole number of NFT Metrics that can be incorporated into this analysis:



* Unique Users
* Biggest Whales
* Highest Sale
* Avg. Floor Price

**Total Wallets that received initial airdrop**

Platypus engaged in a multi-step airdrop over the month of December 2021:

**[https://docs.platypus.finance/platypus-finance-docs/getting-started/8-claim-page-tutorial](https://docs.platypus.finance/platypus-finance-docs/getting-started/8-claim-page-tutorial)**

Total Wallets would be calculated as all unique wallets that participated in the airdrops

**Average Airdrop Amount per Wallet**

Average PTP balance claimed throughout the airdrop per wallet.


## Financial Metrics

**Total Value Locked USD**

The Total Value Locked (TVL) on Platypus can be calculated by summing the total deposits across all pools (Main and Alt) on Platypus. Leverage the LP-Pools from [this list](https://docs.platypus.finance/platypus-finance-docs/developers/contract-addresses).


_Note: _DeFi Llama utilizes the above calculation; **however, **user’s can toggle TVL to include staking. If Messari were to want TVL both inclusive and exclusive of staking, they would take the TVL calculation laid out above and add Total Staked Volume metrics shown under Usage.

_TVL (non-staking): All LP deposits across main and alt pools_

_TVL (staking): TVL (non-staking) + Total Staked Volume (PTP) + Total Staked Volume (vePTP)_

**Protocol Controlled Value USD**

As a DEX, and more specifically a StableSwap protocol, Platypus does not require a PCV to back its token. Token price should be based on total trading volume, fees, etc.

**Total Revenue USD**

Total Revenue generated on Platypus Finance is a combination of



1. Protocol Revenue
2. Treasury Revenue Yield 
3. NFT Revenue

This calculation will be broken down into its complete components below:

**Supply Side Revenue**

As with most DEXs, supply side revenue is generated for LPs through a % of transaction fees as a function of one’s % of total liquidity added to a pool. By depositing liquidity, an individual may farm the PTP governance token once liquidity mining, or share the 0.01% of the transaction fee collected from each asset swap **in the future (no update on this front)**. 

In addition to PTP emissions, an individual can boost their rewards through staking their earned PTP to farm vePTP

_Stake PTP To Farm vePTP_

Depositors can receive additional PTP token emission from the Booster Pool by staking PTP tokens. Every 0.014 vePTP is generated from 1 staked PTP on an hourly basis with the maximum vePTP held from a deposit is equal to 100 times the PTP staked; however, vePTP is non-tradeable or transferable. The only use of vePTP is to increase your PTP-denominated emissions.

_SupplySideRevenue = TotalAPR (see pool level metrics for a deeper dive)_

**Protocol Revenue:**

_Swap Fees_

Within its main function as a DEX, Platypus charges a 0.01% transaction fee on all swaps on the platform. This relatively small fee can be changed via governance; however, is slated to remain at 0.01% for the foreseeable future. In order to calculate the total swap revenue for the protocol you would perform the following calculation:

_Total Transaction Fees = Total Swap Volume * .0001_

_Withdrawal Fees_

Given the nature of Platypus’ single-side LPs, they opened themselves up to unique arbitrage risk, outlined [here](https://medium.com/platypus-finance/withdrawal-arbitrage-the-risk-of-platypus-attacks-bc3e43e69fcb). To combat this arbitrage, they have instituted a withdrawal fee, which also provides a source of revenue.

The withdrawal fee is based on the coverage ratio of the pools:


<table>
  <tr>
   <td>Coverage Ratio
   </td>
   <td>Withdrawal Fee
   </td>
  </tr>
  <tr>
   <td>>=1
   </td>
   <td>-0.0000%
   </td>
  </tr>
  <tr>
   <td>0.9
   </td>
   <td>-0.0011%
   </td>
  </tr>
  <tr>
   <td>0.8
   </td>
   <td>-0.0093%
   </td>
  </tr>
  <tr>
   <td>0.7
   </td>
   <td>-0.0518%
   </td>
  </tr>
  <tr>
   <td>0.6
   </td>
   <td>-0.2731%
   </td>
  </tr>
</table>


_Deposit Fees_

Similar to withdrawal arbitrage, “Deposit Arbitrage” is harmful to the protocol’s long term financial health. To counter this a similar fee is applied:


<table>
  <tr>
   <td>Coverage Ratio
   </td>
   <td>Withdrawal Fee
   </td>
  </tr>
  <tr>
   <td>&lt;=1
   </td>
   <td>-0.0000%
   </td>
  </tr>
  <tr>
   <td>1.1
   </td>
   <td>-0.0017%
   </td>
  </tr>
  <tr>
   <td>1.2
   </td>
   <td>-0.0012%
   </td>
  </tr>
  <tr>
   <td>1.3
   </td>
   <td>-0.0008%
   </td>
  </tr>
  <tr>
   <td>1.4
   </td>
   <td>-0.0006%
   </td>
  </tr>
</table>


_Protocol Revenue = Transaction Fees + Withdrawal Fees + Deposit Fees_

**Treasury Yield Revenue:**

Platypus also generates revenue by yield farming its treasury. This is currently mostly composed

of its native token, PTP. Platypus can deploy these assets to generate yield and increase the existing treasury.

**NFT Revenue:**

Upon the release of the Platnoia Heroes, Platypus should expect a large inflow of revenue. This revenue will be from both the initial mint as well as royalties from secondary sales (undetermined at this time)

_NFT Revenue = Dutch Auction Revenue + Secondary Sales Royalties_

An approximate calculation for the revenue of Platypus Finance:

_Total Revenue = Protocol Revenue + Yield from Treasury + NFT Revenue_


## Pool-Level Metrics

**Coverage Ratio **

Ratio of single-sided asset to PTP in every pool

The higher the coverage ratio, the greater the PTP emission is to the stablecoin account.

**Pool Total Value Locked USD**

Total deposits in a pool

**Reward Tokens & Reward Token Emissions Amount**

Platypus delivers its native token PTP through three different pool for liquidity mining: namely the **Base Pool, Boosting Pool and AVAX-PTP Pool (Pool 2)**, accounted for 30%, 50%, and 20% of the liquidity emission, respectively.



**Base Pool:**

The Base Pool issues PTP tokens to a deposit at an amount that is positively proportional to its share of the aggregate deposit. The token emission for a deposit in the base pool is defined as:

	_Token Emissions (per Deposit) = Emissions Allocated to the Account * (Deposit Amount / Aggregate Deposits in Account)(_

**Boosting Pool:**

The Boosting Pool utilizes an additional token, voting escrow PTP (vePTP), inspired by voting escrow CRV ([veCRV](https://resources.curve.fi/base-features/understanding-crv)) of Curve Finance. Have a look at the below vePTP attributes :



* 1 staked PTP generates 0.014 vePTP every hour
* Maximum vePTP held with a deposit equals to 100 times PTP staked for the deposit
* Upon unstaking PTP, vePTP drops to 0
* vePTP is non-transferable and non-tradeable due to the design of the smart contract, i.e. vePTP token will be locked in the private wallet of the user

The weight function and number of PTP token emission for the boosting pool is defined as:

_w=sqrt{deposit*vePTP}_

_PTP token emission for a deposit=Emission Allocated to the account∗(Deposit Weight/Aggregate Weights in the Account) _

**Total Return and APR:**

Summing up the previous conclusions, the total APR will be defined as:

_TotalAPRofPTPtoken= (Token Emission - base + Token Emission - boosting) / Deposit Amount_

Mathematic Proofs and calculations related to emissions are found in the Platypus Yellow Paper: [https://cdn.platypus.finance/Platypus_Liquidity_Mining_Paper.pdf](https://cdn.platypus.finance/Platypus_Liquidity_Mining_Paper.pdf)
