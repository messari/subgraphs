# Bancor V3 Subgraph Methodology v1.0.0


## Contact Details


## Useful Links



* Bancor V3: [https://try.bancor.network/](https://try.bancor.network/)
* Bancor V3 Proposal Document: 
* Bancor V3 Technical Docs: [Bancor V3 Technical Docs](https://docs.bancor.network/about-bancor-network/bancor-v3)
* Introducing Bancor V3: [Introducing Bancor 3](https://blog.bancor.network/introducing-bancor-3-962a3c601c25)
* Bancor V3 Useful Resources: [Resources - Bancor V3 Technical Docs](https://docs.bancor.network/about-bancor-network/resources)
* Bancor V3 Presentation by Mark Richardson (Head of Bancor Research): https://www.youtube.com/watch?v=qi1geks1n8A


## Bancor V3 Deployment

**Last Update: 13/05/22**

Bancor V3 was deployed on the 11th May 2022 on the Ethereum mainnet. 

This is currently the only chain where Bancor V3 is deployed.

All metrics in this document are for** _Ethereum mainnet_** only.


## 


## Usage Metrics

**Active Users, Total Unique Users & Daily Transaction Count**

Bancor V3 has a number of transactions that users can execute. 

The transactions of interest according to the Usage Metrics guidelines are:



* Swapping tokens using liquidity pools
* Providing liquidity using liquidity pools (adding and removing liquidity)
* Flashloan trading

These transactions are explained in the table below.


<table>
  <tr>
   <td><strong>Transaction Type</strong>
   </td>
   <td><strong>Transaction Description</strong>
   </td>
   <td><strong>Example</strong>
   </td>
  </tr>
  <tr>
   <td>Swap
   </td>
   <td>When a user (address) swaps one token for the equivalent in value of another
   </td>
   <td>User A swapped 1 ETH for 2000 USDC
   </td>
  </tr>
  <tr>
   <td>Add Liquidity
   </td>
   <td>When a user (address) adds liquidity to a liquidity pool in the protocol
   </td>
   <td>User A added 100 LINK to the LINK pool protocol
   </td>
  </tr>
  <tr>
   <td>Remove Liquidity
   </td>
   <td>When a user (address) removes liquidity from a liquidity pool in the protocol
   </td>
   <td>User A removed 100 LINK from the LINK pool in the protocol
   </td>
  </tr>
  <tr>
   <td>Flashloan
   </td>
   <td>When a user (address) borrows an amount of an asset from the protocol which needs to be repaid within 1 block
   </td>
   <td>User A flashloaned 100 ETH from the protocol
   </td>
  </tr>
</table>



### Usage Metrics Definitions

Any address that executes one of the transaction types listed in the table above (Swap, Add/Remove Liquidity or Flashloan) should be considered a user of the protocol.

The core usage metrics of interest are:



* Active Users
* Total Unique Users
* Daily Transaction Count

These metrics are defined and explained in the table below.

**Core Usage Metrics Table**


<table>
  <tr>
   <td><strong>Name</strong>
   </td>
   <td><strong>Description</strong>
   </td>
   <td><strong>Calculation</strong>
   </td>
   <td><strong>Example</strong>
   </td>
  </tr>
  <tr>
   <td>Active Users
   </td>
   <td>Any user (address) that executed one of the transactions (Swap, Add Liquidity, Remove Liquidity or Flashloan)
<p>
There may be a temporal element that is applied to this metric
<p>
E.g Active Users in the last 30 days would be any user (address) that has executed one of the transactions (Swap, Add Liquidity, Remove Liquidity or Flashloan) in the last 30 days
   </td>
   <td>Active Users = Count of distinct users (addresses) that executed one of the transactions (Swap, Add Liquidity, Remove Liquidity or Flashloan)
   </td>
   <td>The following is a list of transactions and the addresses that executed them in the last 1 day:
<ul>

<li>Swap - Address ABC

<li>Add Liquidity - Address DEF

<li>Flashloan - Address GHI

<p>
In this case the Active Users for the last 1 day would be 3
</li>
</ul>
   </td>
  </tr>
  <tr>
   <td>Total Unique Users
   </td>
   <td>The total distinct number of users (addresses) that have ever executed one of the transactions (Swap, Add Liquidity, Remove Liquidity or Flashloan)
   </td>
   <td>Total Unique Users = Count of distinct users (addresses) that have ever executed one of the transactions (Swap, Add Liquidity, Remove Liquidity or Flashloan)
   </td>
   <td>The following is a list of transactions that have occurred in a protocol since launch:
<ul>

<li>Swap - Address ABC

<li>Add Liquidity - Address DEF

<li>Flashloan - Address GHI

<li>Swap - Address ABC

<p>
In this case the Total Unique Users would be 3
</li>
</ul>
   </td>
  </tr>
  <tr>
   <td>Daily Transaction Count
   </td>
   <td>The total distinct number of successful transactions (Swap, Add Liquidity, Remove Liquidity or Flashloan) that occurred in 1 day
   </td>
   <td>Daily Transaction Count = Count of distinct transactions that occurred in 1 day 
   </td>
   <td>The following transactions were recorded for a single day:
<ul>

<li>Swap - Tx Id: 123

<li>Add Liquidity - Tx Id: 456

<li>Flashloan - Tx Id: 789

<li>Swap - Tx Id: 234

<p>
The daily transaction count in this case would be 4
</li>
</ul>
   </td>
  </tr>
</table>


There are additional breakdowns that may facilitate further drill-down analysis if required. These suggested metrics are listed below:



* Active Traders
* Unique Traders
* Daily Swap Transactions
* Active Liquidity Providers
* Total Unique Liquidity Providers
* Daily Liquidity Actions Count
* Active Flashloaners
* Unique Flashloaners
* Daily Flashloaners Count


## Financial Metrics

**Total Value Locked USD**

The Total Value Locked USD on Bancor V3 is calculated by summing the TVL USD across each individual liquidity pool in the protocol.

_TVL USD = SUM of TVL USD IN ALL LIQUIDITY POOLS IN PROTOCOL_

Example:

Let’s assume that there are 4 liquidity pools in the Bancor V3 protocol which are: ETH, BNT, DAI and LINK.

The pools have the following TVL USD each:



* ETH: $1,000,000 USD
* BNT: $1,800,000 USD
* DAI: $2,000,000 USD
* LINK: $1,500,000 USD

In this case, the Total Value Locked USD for the protocol would be: 

_TVL USD = ETH TVL USD + BNT TVL USD + DAI TVL USD + LINK TVL USD = $6,300,000_

**Protocol Controlled Value USD**

There are two metrics worth noting here:

1. BNT locked forever
2. Protocol-owned BNT

About 1:
BNT is locked forever in the protocol as vBNT is burnt. This is because vBNT is needed to unstake BNT.

On Bancor 2.1, vBNT is emitted 1:1 with BNT stakes, and is needed in a 1:1 ratio in order to unstake BNT.
On Bancor 3, vBNT is emitted 1:1 with bnBNT, and is needed in a 1:1 ratio with bnBNT in order to unstake BNT. How much BNT can be unstaked with 1 vBNT can be calculated by using the poolTokenToUnderlying in the BancorNetworkInfo contract.

One can expect the vBNT:BNT price to stabilise around the poolTokenToUnderlying value of vBNT in BNT, but this isn't necessarily true and thus doesn't exactly translate to how much BNT is actually locked forever. As the vBNT and bnBNT are needed 1:1 to unstake poolTokenToUnderlying(BNT, bnBNT), the amount of BNT locked forever can be calculated as follows:

_BNT locked forever = poolTokenToUnderlying(BNT, Amount of vBNT Burned)_

Note: This BNT isn't necessarily protocol controlled. As an example, the protocol could theoretically control no BNT and some BNT would still be locked forever.

About 2:
Protocol controlled BNT can be calculated based on how much bnBNT the protocol owns, by checking the BNTpool balance and using the poolTokenToUnderlying function in BancorNetworkInfo contract.

_Protocol Controlled BNT = poolTokenToUnderlying(BNT, bnBNT in the BNTPool contract)_

Relevant SC addresses:
BNTpool: https://etherscan.io/address/0x02651e355d26f3506c1e644ba393fdd9ac95eaca
BancorNetworkInfo: https://etherscan.io/address/0x8E303D296851B320e6a697bAcB979d13c9D6E760#readProxyContract

Reference links



* Dune Analytics Dashboard: [https://dune.com/Bancor/Bancor-3-Beta](https://dune.com/Bancor/bancor_1)
* Dune Analytics BNT Value Locked Forever Query: [https://dune.com/queries/30032/73935](https://dune.com/queries/30032/73935)
* Bancor Vortex Burner: [Bancor Vortex Burner](https://docs.bancor.network/guides/triggering-the-bancor-vortex-burner)
* Bancor V3 Proposal Document - see Bancor Vortex section: [Bancor V3 Proposal Document](https://docs.google.com/document/d/11UeMYaI_1CWdf_Nu6veUO-vNB5uX-FcVRqTSU-ziDRk/edit#)

**Total Revenue USD**

_Total Revenue USD = Supply Side Revenue USD + Protocol Revenue USD_
_Total Revenue USD = Total Trading Fees USD + Total Flash Loan Fees USD (LP side) + Total Exit Fees USD + Total Flash Loan Fees (Protocol Side) + Total Vortex Fees USD_

**Supply Side Revenue USD**

_Total Supply Side Revenue USD = Total Trading Fees USD + Total Flash Loan Fees USD_

_Total Supply Side Revenue USD = Total BNT to TKN Trading Fees USD + Total TKN to BNT Trading Fees USD + Total TKN to TKN Trading Fees USD + Total Flash Loan Fees USD_

**Protocol Revenue USD**

_Protocol Revenue USD = Total Exit Fees from Liquidity Pools USD + Total Flash Loan Fees USD + Total Vortex Fees USD_


## Pool-Level Metrics

**Pool Total Value Locked USD**

Pool Total Value Locked USD is calculated summing the total USD value of the tokens in a given liquidity pool

_Pool Total Value Locked USD = Number of tokens in liquidity pool * price of token in USD_

Example:

Let’s assume that there are 1,500,000 LINK in the LINK liquidity pool on Bancor V3 and the current price of LINK at the time of calculation is $8.

_Pool Total Value Locked USD (LINK Liquidity Pool) = Number of tokens in liquidity pool * price of token USD = 1,500,000 * $8 = $12,000,000 USD_

**Reward Tokens & Reward Token Emissions Amount**

Breakdown of total BNT rewards:

30M BNT will be distributed over an infinite time period to BNT LPs

10M BNT to be distributed to TKN LPs, not necessarily under an exponential decay emission model i.e. over an infinite time period, as we also have the flat/linear emissions model mentioned below

**BNT Pool Reward Token Emissions**

In Bancor V3 there will be a maximum of 40,000,000 BNT that will be distributed over an infinite time period. 

The start date and end date of the rewards is still to be decided.

The distribution rate of the rewards will follow an _exponential decay curve_.

See the “Rewards Schedules” section of the [Bancor 3 Proposal document](https://docs.google.com/document/d/11UeMYaI_1CWdf_Nu6veUO-vNB5uX-FcVRqTSU-ziDRk/edit#) for more information and examples. 

**Third Party Reward Token Emissions**

For third party reward token emissions, the third party can use the same mechanism (_exponential decay curve)_ as described in the “BNT Pool Reward Token Emissions”. The only difference being the rewards will be in TKN rather than BNT.

There will also be a Flat Alternative emissions program where project teams may not wish to use the exponential decay function equation as described above. 

In this case, a constant emissions rate will be possible similar to what is currently done on Bancor V 2.1 (a constant rate of emissions over a period of time).

For more detailed information see “Third Party TKN Staking Rewards” in the [Bancor V3 proposal document](https://docs.google.com/document/d/11UeMYaI_1CWdf_Nu6veUO-vNB5uX-FcVRqTSU-ziDRk/edit#).

**Non-Identical TKN Emission Programs**

In the case where the incentivised asset is being rewarded with the asset of the same type (e.g BNT rewards for BNT LPs) then the above described emission programs would work. 

If however the rewarded asset is different to the asset that is being incentivised then the above will not work. 

Bancor V3 has addressed this by allowing users to manually claim rewards.

For more detailed information see “Non-Identical TKN Emission Programs” in the [Bancor V3 proposal document](https://docs.google.com/document/d/11UeMYaI_1CWdf_Nu6veUO-vNB5uX-FcVRqTSU-ziDRk/edit#)

**Historical Reward Incentive Programs**

As Bancor V3 has only gone live on 11th May 2022, there are currently no historical reward incentive programs to date. This section can be updated in the future.
=======
# Bancor V3

## Interaction

![Bancor V3 Interaction](./docs/bancor-v3-interaction.png)

Edit the chart [here](https://excalidraw.com/#json=8pcmLXt3KH0HR1BmvGgc4,xXC-0PZvj5s1kGpIX4Fwhw).

