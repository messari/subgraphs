
# GMX Protocol Subgraph Metrics Methodology v1.0

Introduction:

GMX is a decentralized spot and perpetual exchange featuring a unique multi-asset pool that earns fees for liquidity providers. The platform supports swaps with minimal fees and trades without price impact.

Note:



* GMX is currently running on Arbitrum and Avalanche.
* Before its rebranding to “GMX” the protocol was called “Gambit” and ran on Binance Smart Chain. After the rebranding Gambit has been phased out and there is no noteworthy activity anymore which is why BSC was not considered in this report.


## Useful Links



* Protocol
    * [https://gmx.io/](https://gmx.io/)
* Docs
    * [https://gmxio.gitbook.io/gmx/](https://gmxio.gitbook.io/gmx/)
    * [https://gmx-io.notion.site/gmx-io/GMX-Technical-Overview-47fc5ed832e243afb9e97e8a4a036353](https://gmx-io.notion.site/gmx-io/GMX-Technical-Overview-47fc5ed832e243afb9e97e8a4a036353)
* Smart contracts
    * [https://github.com/gmx-io](https://github.com/gmx-io)
* Deployed addresses
    * [https://gmxio.gitbook.io/gmx/contracts](https://gmxio.gitbook.io/gmx/contracts)
* Protocol stats
    * [https://stats.gmx.io/](https://stats.gmx.io/)
    * [https://gmx.io/dashboard](https://gmx.io/dashboard)
* Governance forum
    * [https://gov.gmx.io](https://gov.gmx.io)
* GMX Medium
    * [https://medium.com/@gmx.io](https://medium.com/@gmx.io)


## Usage Metrics

**Active Users, Total Unique Users & Daily Transaction Count**

Transactions of interest on GMX include:



* Swapping (excluding swaps of the protocol token)
* Opening a position (long / short)
* Closing a position (long / short; 3 options: manual closing, stop-loss, liquidations)
* Staking GMX
* Minting GLP
* Redeeming GLP
* Depositing collateral
* Withdrawing collateral
* Compounding esGMX
* Claiming esGMX
* Staking GLP should not be considered because after buying GLP, these tokens will be automatically staked so this is not a transaction actively triggered by users.


## Financial Metrics

**Total Value Locked USD**

TVL = GMX staked (all chains) + GLP supply * GLP price

Note that GLP is specific to the network and the price & supply will differ between Arbitrum & Avalanche. So for TVL among all chains, it should be calculated as follows: \


TVL = GMX staked (all chains) + (GLP supply on Arbitrum * GLP price on Arbitrum) + (GLP supply on Avalanche * GLP price on Avalanche)

GMX has a Floor Price Fund (FPF). The assets in the FPF were not deposited in the protocol and should therefore not be included in the TVL calculation. 

Assets in the FPF are accumulated by: 



* provision of GMX/ETH liquidity that is provided and owned by the protocol
* 50% of funds received through[ Olympus bonds](https://pro.olympusdao.finance/#/partners/GMX) 

**Protocol Controlled Value USD**

There is a sale of 10,000 GMX each month through Olympus bonds Olympus Pro-Bond marketplace for protocol-owned liquidity, 50% goes to the floor price fund, and 50% for marketing activities. The starting price is at 0.9 * GMX market price at the time.

Source: https://gov.gmx.io/t/treasury-diversification-through-the-sale-of-esgmx-tokens/73/29

**Total Revenue USD**

Total Revenue generated on GMX is the sum of:



1. Fees generated from swapping
2. Fees generated from minting GLP
3. Fees generated from burning GLP
4. Fees from liquidations
5. Fees from margin trading

As a calculation, this could be described as:

Total Revenue = Fees from swapping + Fees from minting GLP + Fees from burning GLP + Fees from liquidations + Fees from margin trading

Total Revenue for GMX can be described as the sum of all Platform Fees.

**Supply Side Revenue USD**

In general fees for GMX are split 30/70 between staked GMX/GLP and paid out in either wETH or wAVAX depending on which chain the user staked their assets. 

The two assets GMX and GLP can be defined as follows:



* GMX: The utility and governance token, accrues 30% of the platform's generated fees (if staked).
* GLP: The platform's liquidity provider token. Holders of the GLP token earn Escrowed GMX rewards and 70% of platform fees distributed in ETH/AVAX.

For GMX the supply side revenue can be calculated as the share of trading fees that goes to the liquidity providers:

Supply Side Revenue = (Total Revenue - Costs of Keepers - Referral Rewards)  * Supply Side Fees

  \
Supply Side Fees in this case would be equal to a fixed parameter of 70%. Platform Fees in the case of GMX are equal to Total Revenues (see the formula in the respective section) since all fees are distributed between staked GMX & GLP holders. Referral Rewards are further explained in the section ‘Reward Tokens & Reward Token Emissions Amount’.

**Protocol Revenue USD**

For GMX protocol revenue can be calculated as the share of trading fees that goes to the stakers of the protocol token. Staked GMX receives three types of rewards:



* Escrowed GMX
* Multiplier Points
* ETH / AVAX Rewards (Platform Fees)

Protocol Revenue = (Total Revenue - Costs of Keepers - Referral Rewards) * (1- Supply Side Fees) \
 \
Supply Side Fees in this case would be equal to a fixed parameter of 70%. Platform Fees in the case of GMX are equal to Total Revenues (see the formula in the respective section) since all fees are distributed between staked GMX & GLP holders.


## Pool-Level Metrics

**Pool Total Value Locked USD**

The Pool TVL of GMX is the No. of Assets Deposited in the GLP * Price of the Asset. On the GMX dashboard (https://gmx.io/dashboard), this is shown as “GLP Index Composition”. Please note that there are two GLP: One for Arbitrum and one for Avalanche. 

Pool Total Value Locked = No. of Assets Deposited in the GLP * Price of the Asset

**Reward Tokens & Reward Token Emissions Amount**

**Escrowed GMX:**

Escrowed GMX was and will be distributed at the following rate starting from 1 Sep 2021:



* 100,000 Escrowed GMX tokens per month to GMX stakers
* 100,000 Escrowed GMX tokens per month to GLP holders on Arbitrum
* 50,000 Escrowed GMX tokens per month to GLP holders on Avalanche from Jan 2022 - Mar 2022
* 25,000 Escrowed GMX tokens per month to GLP holders on Avalanche from Apr 2022 - Dec 2022

Escrowed GMX rewards are distributed every second to staked tokens and can be converted into GMX tokens through vesting. Note for future maintenance of the subgraph: A very recent governance decision will update esGMX emissions from fixed to dynamic starting from June 2022. 

(Source: https://snapshot.org/#/gmx.eth/proposal/0xb370249628b2226c6a7e771b2959c3b2e80eada36ad3618a7fc39f964213643e)

**Multiplier Points: **

GMX stakers receive Multiplier Points every second at a fixed rate of 100% APR. Example: 1000 GMX staked for one year would earn 1000 Multiplier Points. Multiplier points can be staked for fee rewards. Each multiplier point will earn the same amount of ETH / AVAX rewards as a regular GMX token. 

When GMX or Escrowed GMX tokens are unstaked, the proportional amount of Multiplier Points is burnt. For example, if 1000 GMX is staked and 500 Multiplier Points have been earned so far, then unstaking 300 GMX would burn 150 (300 / 1000 * 500) Multiplier Points. The burn will apply to the total amount of Multiplier Points which includes both staked and unstaked Multiplier Points.

**Referral Rewards:**

The GMX Referral Program provides fee discounts and the earning of rebates. In the course of this program, esGMX is paid out to Tier 3 referrers. The payout price of esGMX is based on the 7-day TWAP of GMX. Note that there is a cap of 5000 esGMX distributed per week. If the price of GMX is $30 the full 5% bonus can be paid for total Tier 3 referral volumes up to $3 billion per week. esGMX tokens distributed for this program do not require GMX or GLP to vest. The discounts and rebates are distributed as ETH on Arbitrum and AVAX on Avalanche every Wednesday.

**ETH Rewards:**

In their launch announcement on Medium, additional ETH rewards were mentioned. They read as follows: With the start of GMX on Arbitrum, $72,072.62 USD worth of ETH that has been collected from trading fees on BSC was distributed to GMX stakers over 4 weeks. However, these rewards are not mentioned in the official documentation.  \
(Source: https://medium.com/@gmx.io/gmx-launch-plan-8ecf60254410)
