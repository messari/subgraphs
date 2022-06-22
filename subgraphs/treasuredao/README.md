# TreasureDAO Protocol Metrics Subgraph Methodology v1.0.0

## Useful Links

* Protocol
    * [https://www.treasure.lol/](https://www.treasure.lol/)
* Docs/Whitepaper
    * [https://docs.treasure.lol/about-treasure/readme](https://docs.treasure.lol/about-treasure/readme)
* GitHub
    * [https://github.com/TreasureProject](https://github.com/TreasureProject)
* Marketplace
    * [https://marketplace.treasure.lol/](https://marketplace.treasure.lol/)
* Contracts
    * [https://docs.treasure.lol/references/contracts](https://docs.treasure.lol/references/contracts)


## Introduction

TreasureDAO is an Arbitrum based NFT marketplace with a focus on metaverse projects. Their native token, MAGIC, is the base currency for transactions throughout their platform and partnered NFT projects. They are actively working towards bootstrapping new metaverse projects and solidifying MAGIC as the reserve currency for all their current and future connected metaverses. 


## Usage Metrics

**Active Users, Total Unique Users & Daily Transaction Count**

**Usage**



* Mining Actions
    * Deposits
    * Withdrawals
    * Harvesting
* Interactions with NFT contracts
    * Bridgeworld
    * Legions
* Treasure Marketplace NFT transactions
    * (Treasures, Keys, Extra Life, Legions, etc.)

**Additional Metrics for consideration**



* Liquidity Pairs Swap Volume
    * **[Sushiswap MAGIC-ETH LP Pair](https://app.sushi.com/analytics/pools/0xb7e50106a5bd3cf21af210a755f9c8740890a8c9?chainId=42161)**
    * **[Sushiswap MAGIC-gOHM Pair](https://app.sushi.com/analytics/pools/0xac75a1a0c4933e6537eafb6af3d402f82a459389?chainId=42161)**
* Bond Volume
    * **[Olympus MAGIC-ETH SLP Bond ](https://pro.olympusdao.finance/#/bond/magic_eth_slp) **


## Financial Metrics

**Total Value Locked USD**

The TVL for TreasureDAO should be calculated as follows: 
```
TVL (USD) = Total Mine TVL + LP Pools Value TVL
```
This can be checked against DefiLlama which follows this for TreasureDAO’s TVL.

Some useful reference links:



* **[Atlas mine contract](https://arbiscan.io/address/0xa0a89db1c899c49f98e6326b764bafcf167fc2ce) **
* **[Sushiswap MAGIC-ETH LP Pair](https://app.sushi.com/analytics/pools/0xb7e50106a5bd3cf21af210a755f9c8740890a8c9?chainId=42161)**
* **[Sushiswap MAGIC-gOHM Pair](https://app.sushi.com/analytics/pools/0xac75a1a0c4933e6537eafb6af3d402f82a459389?chainId=42161)**
* **[Olympus MAGIC-ETH SLP Bond ](https://pro.olympusdao.finance/#/bond/magic_eth_slp) **
* **[TreasureDAO Ecofund](https://arbiscan.io/address/0x482729215AAF99B3199E41125865821ed5A4978a) **

**Protocol Controlled Value USD**

TreasureDAO utilizes Olympus Pro to offer bonds on their native $MAGIC token. 

They currently offer a single bond for the MAGIC-ETH LP pair. They are staking the MAGIC-ETH LP they have accumulated in their treasury multisig.

[TreasureDAO Marketplace Multisig](https://arbiscan.io/address/0xDb6Ab450178bAbCf0e467c1F3B436050d907E233) 

The PCV is equal to the LP positions they hold. 
```
Protocol Controlled Value = Sum of LP Positions Held (USD)
```
**Total Revenue USD**

TreasureDAO generates revenue from three main sources: 



1. **Atlas Mine Emissions**
2. **LP Fees**
3. **NFT Royalty**

Adding these together we can get the total revenue. 
```
Total Revenue (USD) = Total Mining Revenue + Total LP Revenue + Total Royalty Revenue
```
where
```
Total Royalty Revenue = Creatory Royalty Revenue + DAO Swap Fee Revenue
```
**Supply Side Revenue USD**
```
Supply Side Revenue (USD) = Mining Supply Revenue + (Total LP Revenue - PCV Yield Revenue) + Marketplace Creator Royalty Revenue
```
where
```
Marketplace Creator Royalty Revenue (USD) = Swap Volume (USD) * Creator Fee (%)
```
TreasureDAO does not hold any MAGIC in the Atlas Mine or charge a fee. All MAGIC and mining rewards are paid to token holders. Mining rewards emissions are detailed in the rewards token section. 
```
Mining Supply Revenue = Emissions Amount * Price of MAGIC (USD)
```
**The DAO holds a LP position as PCV.**

With the implementation of TIP-12, the maximum cap for the creator fee was increased from 5% to 20%. As this was quite recent, NFT transactions on the marketplace have mostly stayed at 5% swap fees with 2.5% allocated to the creator. 

**Protocol Revenue USD**
```
Protocol Revenue (USD) = PCV Yield Revenue + Marketplace DAO Swap Fee Revenue
```
where
```
PCV Yield Revenue = LP Position (USD) * LP Yield (%)
```
and
```
Marketplace DAO Swap Fee Revenue (USD) = Swap Volume (USD) * DAO Swap Fee(%)
```
TreasureDAO currently takes 2.5% on all NFT swaps, so the DAO Swap Fee = 2.5% until changed. See [TreasureDAO TIP - 12](https://treasuredao.freeflarum.com/d/33-tip-12-creator-royalties-on-the-treasure-marketplace)


## Pool-Level Metrics

**Pool Total Value Locked USD**

The only two pools containing TreasureDAO’s native token; MAGIC-ETH and MAGIC-gOHM on Sushiswap Arbitrum. The value in these pools can be calculated as follows:
```
Pool TVL (USD) = (Sum of Magic Tokens * Price of MAGIC) + (Sum of Paired Token * Price of Token)
```

**Atlas mine TVL:**
```
Mine TVL = Sum of MAGIC tokens locked * Price of MAGIC
```
Reward Tokens & Reward Token Emissions Amount

The max supply of MAGIC is 347,714,007.

33% (115,904,669) was distributed through the treasure farm fair launch on September 6, 2021 over 30 days. 25% (86,928,502) is allocated to mining emissions over 10 years with a yearly halvening.






Of the first year (Y1) allocation, 20m was distributed in 90 days for the Genesis mine beginning 2021-10-26 14:00 UTC. With the close of the Genesis mine on 2022-01-24, emissions moved to the currently operational Atlas mine (started 2022-01-26) for the remaining 23,464,251 MAGIC in emissions.

On 2021-12-13 15:00 UTC, staking rewards for the MAGIC-ETH LP on Arbitrum were transferred to SushiSwap under the Onsen farm program, where LP providers can earn dual rewards in MAGIC and SUSHI tokens.

17% (59,111,381) of supply is allocated to LP Staking emissions.

Current MAGIC-ETH LP Emissions schedule after TIP-11 which passed on 2022-04-09.


<table>
  <tr>
   <td><strong>End December 2021 - April 2022</strong>
   </td>
   <td><strong>1,000,000 MAGIC per month</strong>
   </td>
  </tr>
  <tr>
   <td><strong>End April 2022 - June 2022</strong>
   </td>
   <td><strong>800,000 MAGIC per month</strong>
   </td>
  </tr>
  <tr>
   <td><strong>End June 2022 - August 2022</strong>
   </td>
   <td><strong>650,000 MAGIC per month</strong>
   </td>
  </tr>
</table>


Team and ecosystem fund emissions schedule was unable to be found.


## References: 



* **[https://docs.treasure.lol/getting-started/what-is-magic#tokenomics](https://docs.treasure.lol/getting-started/what-is-magic#tokenomics)**
* **[https://docs.treasure.lol/bridgeworld/bridgeworld-litepaper/magic-mining](https://docs.treasure.lol/bridgeworld/bridgeworld-litepaper/magic-mining)**
* **[TreasureDAO TIP - 11](https://treasuredao.freeflarum.com/d/31-tip-11-next-stage-of-magic-lp-emissions)**
* **[TreasureDAO TIP - 12](https://treasuredao.freeflarum.com/d/33-tip-12-creator-royalties-on-the-treasure-marketplace)**
* **[TreasureDAO Discord](https://discord.gg/treasuredao)**
