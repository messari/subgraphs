# Dodo V2 (DEX) Subgraph Methodology v1.0.0

DODO is a decentralized trading platform that uses an innovative Proactive Market Maker (PMM) algorithm to provide efficient on-chain liquidity for Web3 assets.

When the quantity of an asset becomes low, the algorithm automatically increases the price quoted for this asset in anticipation of buying back the missing inventory from the market. 

Besides this, DODO also lets you issue your own tokens, and provides a set of tools and smart contracts for NFT creation, trading, and fragmentation.

## Useful Links

* Exchange
    * [https://dodoex.io/](https://dodoex.io/) 
* Docs
    * [https://docs.dodoex.io/english/](https://docs.dodoex.io/english/)
* Smart contracts and subgraph 
    * [https://github.com/DODOEX/contractV2](https://github.com/DODOEX/contractV2)
    * [https://github.com/DODOEX/graph-node](https://github.com/DODOEX/graph-node) 
    * [https://github.com/DODOEX/dodoex_v2_subgraph](https://github.com/DODOEX/dodoex_v2_subgraph) 
* Deployed addresses
    * Ethereum:
        * [https://docs.dodoex.io/english/developers/contracts-address/ethereum](https://docs.dodoex.io/english/developers/contracts-address/ethereum) 
    * BSC:
        * [https://docs.dodoex.io/english/developers/contracts-address/bsc](https://docs.dodoex.io/english/developers/contracts-address/bsc) 
    * Polygon:
        * [https://docs.dodoex.io/english/developers/contracts-address/polygon](https://docs.dodoex.io/english/developers/contracts-address/polygon) 
    * Arbitrium:
        * [https://docs.dodoex.io/english/developers/contracts-address/arbitrum](https://docs.dodoex.io/english/developers/contracts-address/arbitrum) 
    * Avalanche:
        * [https://docs.dodoex.io/english/developers/contracts-address/avalanche](https://docs.dodoex.io/english/developers/contracts-address/avalanche) 
    * MoonRiver:
        * [https://docs.dodoex.io/english/developers/contracts-address/moonriver](https://docs.dodoex.io/english/developers/contracts-address/moonriver) 
    * Aurora:
        * [https://docs.dodoex.io/english/developers/contracts-address/aurora](https://docs.dodoex.io/english/developers/contracts-address/aurora) 
    * Boba:
        * [https://docs.dodoex.io/english/developers/contracts-address/boba](https://docs.dodoex.io/english/developers/contracts-address/boba) 
    * HECO:
        * [https://docs.dodoex.io/english/developers/contracts-address/heco](https://docs.dodoex.io/english/developers/contracts-address/heco) 
    * OKChain:
        * [https://docs.dodoex.io/english/developers/contracts-address/okchain](https://docs.dodoex.io/english/developers/contracts-address/okchain) 
    * Rinkeby Test Network:
        * [https://docs.dodoex.io/english/developers/contracts-address/rinkeby-test-network](https://docs.dodoex.io/english/developers/contracts-address/rinkeby-test-network) 
* Token Transparency Project
    * [https://docs.dodoex.io/english/tokenomics/token-transparency-project](https://docs.dodoex.io/english/tokenomics/token-transparency-project) 


## Usage Metrics

**Active Users, Total Unique Users & Daily Transaction Count**

Any address (EOA) which conducts one of the transactions below should be considered a User:



* Swap Tokens using a Liquidity Pool
* Adding LP
* Removing LP
* Create a Pool (LP or Crowdpooling)

Reference: [https://docs.dodoex.io/english/dodo-dex-intro/how-to-participate](https://docs.dodoex.io/english/dodo-dex-intro/how-to-participate)


## Core Metrics

Some core metrics as explained by DODO on their documentation. All the data of core metrics come from Subgraph, and the data of Subgraph comes from the events thrown when the contract is called. 

**Trading volume**

We use PairDayData to track the data of each trading pair for the day, and TokenDayData to track the trading data of each Token for the day, with daily trading volume data being the trading volume of each Token for the day multiplied by the fiat price of that Token.

**Market Capitalization**: Get all pools from Subgraph and read the BaseReserve and QuoteReserve (i.e. the balance of BaseToken and QuoteToken on the contract) from each pool, multiply it by the Token's current fiat price, and the sum of the dollar value of both Tokens is recorded as the market capitalization. Tokens not accepted by Coingecko, Coinmarket, or Debank are not included in the market capitalization display.

**Number of user addresses**: the number of addresses that have interacted with DODO's smart contracts

**Number of transactions**: the number of transactions that occurred on DODO

**Smart contracts Pools**: Number of pools created in DODO

**Number of pairs**: the number of pairs traded on DODO

Reference: [https://docs.dodoex.io/english/developers/dashboard](https://docs.dodoex.io/english/developers/dashboard)


## Financial Metrics

**Total Value Locked USD**

TVL for DODO should be calculated by summing the LP deposited on all pools. You can calculate the total across all chains, and also the total for each chain.

Ex: If there are only two pools, one with $1M deposited in ETH/DAI and other with $2M deposited on ETH/USDC, the TVL for the protocol is $3M.

**Protocol Controlled Value USD**

Not relevant for this protocol

**Total Revenue USD - waiting on DODO’s feedback**

Each liquidity pool’s trading fees on DODO are set and configured by its creator and may vary from one another. Although the default trading fee for a pair on DODO is 0.3%, with the exception of DODO Classic Pool’s single-sided liquidity pools, which have a default trading fee of 0.01%.

Also, vDODO holders have a discount on transaction fees.

DODO trading fees distribution is as follows:



* 80% for Liquidity Providers
* 15% to Buyback DODO tokens & redistribute them to all vDODO holders
* 5% for the Community treasure

After the [DIP-8](https://snapshot.org/#/dodobird.eth/proposal/0x0e10c3820b2252ece6567a291d9a12f90a481c4160518390211e01c312c538c5) proposal passed, the USDC-USDT (ETH) and BUSD-USDT (BSC) pools fee were reduced to 0.002%, of which 75% is used to repurchase DODOs and distribute them to vDODO holders in the form of vDODOs, and 25% is used for the community vault.

Besides trading fees, DODO also charges a service fee for each token created on the platform. The token creation service fee rates on different networks are as follows:

<span style="text-decoration:underline;">Ethereum</span>: 0.02 ETH

<span style="text-decoration:underline;">BNBChain</span>: 0.05 BNB

<span style="text-decoration:underline;">HECO</span>: 0.5 HT

<span style="text-decoration:underline;">Polygon</span>: 1 MATIC

<span style="text-decoration:underline;">Arbitrium</span>: 0.002 ETH

<span style="text-decoration:underline;">Moonriver</span>: 0.05 MOVR \
<span style="text-decoration:underline;">Boba</span>: 0.002 ETH

<span style="text-decoration:underline;">OKChain</span>: 0.1 OKT

<span style="text-decoration:underline;">Optimism</span>: 0.002 ETH

<span style="text-decoration:underline;">Aurora</span>: 0.002 ETH

<span style="text-decoration:underline;">Avalanche</span>: 0.1 AVAX

**Total Revenue USD** = Fees from all pools + Service fees from token creation

References: 



* [https://docs.dodoex.io/english/tokenomics/vdodo](https://docs.dodoex.io/english/tokenomics/vdodo)
* [https://snapshot.org/#/dodobird.eth/proposal/QmeRQ4DTcBzAETWycrH43WVEj2MXovqgA7gPwSmQpavV8W](https://snapshot.org/#/dodobird.eth/proposal/QmeRQ4DTcBzAETWycrH43WVEj2MXovqgA7gPwSmQpavV8W)
* [https://dodoexhelp.zendesk.com/hc/en-us/articles/4721769913497-How-to-Create-Tokens-on-DODO-](https://dodoexhelp.zendesk.com/hc/en-us/articles/4721769913497-How-to-Create-Tokens-on-DODO-)

**Supply Side Revenue USD**

Supply-side revenue on DODO is the fees generated for Liquidity Providers (80%) and the Buyback of DODO tokens and redistribution to all vDODO holders (15%).

Regarding vDODO holders, the redemption of a vDODO into a DODO requires the payment of a pro-rata refund fee. 50% of this refund fee will be immediately distributed to all non-exiting vDODO holders in the form of vDODO, and the remaining 50% will be permanently destroyed (see [DIP-2](https://snapshot.org/#/dodobird.eth/proposal/QmZon8LttMoD2oJoov8vAMiS6m26AbK18ePBevMUDo99DS) for more details).

**Supply Side Revenue USD** = LP fees + DODO redistribution - vDODO exit fees

**Protocol Revenue USD**

Protocol revenue for DODO is the 5% distribution from the LP fees.


## Pool-Level Metrics

**Pool Total Value Locked USD**

The TVL for DODO is the number of assets deposited in the pool * the price of each asset.

**Pool TVL USD** = (Asset1 amount * Asset1 price) + (Asset2 amount * Asset2 price)

<code> \
</code>[Link for dashboard with general and pairs overviews](https://info.dodoex.io/overview)

**Reward Tokens & Reward Token Emissions Amount**

As previously stated, after the [DIP-8](https://snapshot.org/#/dodobird.eth/proposal/0x0e10c3820b2252ece6567a291d9a12f90a481c4160518390211e01c312c538c5) proposal passed, the USDC-USDT (ETH) and BUSD-USDT (BSC) pools fee were reduced to 0.002%, of which 75% is used to repurchase DODOs and distribute them to vDODO holders in the form of vDODOs, and 25% is used for the community vault.

Since the LPs of both pools will no longer receive a portion of the trading fees, DIP-8 proposes to compensate the LPs by increasing the DODO token rewards for both pairs to cover the LPs’ reduction in fee revenue. Specifically, the token rewards for both pools were increased by 10%, as follows:



* The USDC-USDT (ETH) rewards were increased from 2 DODO per block (1 DODO for USDC and USDT respectively) to 2.2 DODO per block.
* The BUSD-USDT (BSC) rewards were increased from 0.4 DODO per block (0.2 DODO for BUSD and USDT, respectively) to 0.44 DODO per block.

**Liquidity Mining**

DODO has a Liquidity Mining contract with two versions. The first version of the contract is mainly for the DODO V1 type pool, which provides liquidity LP for single coins and carries out DODO token rewards. In the second version of the mining contract, a pledge token corresponds to a contract and supports multiple mining.

**V1 - Current mining projects conducted by the first version of the contract[​](https://docs-next.vercel.app/zh/docs/5_5_mining#%E5%BD%93%E5%89%8D%E7%AC%AC%E4%BA%8C%E7%89%88%E5%90%88%E7%BA%A6%E8%BF%9B%E8%A1%8C%E7%9A%84%E6%8C%96%E7%9F%BF%E9%A1%B9%E7%9B%AE)**

ETH



* Mining Contract Address:[ 0xaed7384f03844af886b830862ff0a7afce0a632c](https://etherscan.io/address/0xaed7384f03844af886b830862ff0a7afce0a632c)
* currently releasing 4.2 DODO rewards per block
* Start date: Oct-01-2020
* Block: [10970196](https://etherscan.io/block/10970196)

BSC



* Mining contract address:[ 0x01f9BfAC04E6184e90bD7eaFD51999CE430Cc750](https://bscscan.com/address/0x01f9BfAC04E6184e90bD7eaFD51999CE430Cc750)
* Currently releasing 0.54DODO reward per block
* Start date: Feb-19-2021
* Block: [5007474](https://bscscan.com/block/5007474)

Arbitrum One



* Mining contract address:[ 0xE3C10989dDc5Df5B1b9c0E6229c2E4e0862fDe3e](https://arbiscan.io/address/0xE3C10989dDc5Df5B1b9c0E6229c2E4e0862fDe3e)
* Currently releasing 1.5DODO rewards per block
* Start date: Sep-02-2021
* Block: [254374](https://arbiscan.io/block/254374)

Aurora



* Mining Contract Address：[0xDBFaF391C37339c903503495395Ad7D6B096E192](https://explorer.mainnet.aurora.dev/address/0xDBFaF391C37339c903503495395Ad7D6B096E192)
* Currently Releasing 0.1 DODO Rewards Per Block
* Start date: Dec-26-2021
* Block: [56001129](https://explorer.mainnet.aurora.dev/block/56001129/transactions)

Polygon



* Mining Contract Address:[ 0xB14dA65459DB957BCEec86a79086036dEa6fc3AD](https://polygonscan.com/address/0xB14dA65459DB957BCEec86a79086036dEa6fc3AD)
* Currently Releasing 0.44 DODO Rewards Per Block
* Start date: Jan-20-2022
* Block: [23937470](https://polygonscan.com/block/23937470)

MoonRiver



* Mining Contract Address:[ 0x6b3518E0260aE1515976A30FA67513C760De2570](https://moonriver.moonscan.io/address/0x6b3518E0260aE1515976A30FA67513C760De2570)
* Currently Releasing 0.005 WMOVR Rewards Per Block
* Start date: Jan-27-2022
* Block: [1379589](https://moonriver.moonscan.io/block/1379589)

Boba



* Mining Contract Address:[ 0x2d8349E957A69E4cC7B4ef225A4B6a85Be57FBF3](https://blockexplorer.boba.network/address/0x2d8349E957A69E4cC7B4ef225A4B6a85Be57FBF3)
* Currently Releasing 3 DODO Rewards Per Block
* Start date: Feb-09-2022
* Block: [320754](https://blockexplorer.boba.network/blocks/320754/transactions)

**V2 - Current mining projects conducted by the second version of the contract[​](https://docs-next.vercel.app/zh/docs/5_5_mining#%E5%BD%93%E5%89%8D%E7%AC%AC%E4%BA%8C%E7%89%88%E5%90%88%E7%BA%A6%E8%BF%9B%E8%A1%8C%E7%9A%84%E6%8C%96%E7%9F%BF%E9%A1%B9%E7%9B%AE)**

ETH[​](https://docs-next.vercel.app/zh/docs/5_5_mining#eth)



* Pledged Token DAI-USDT DLP (0x3058ef90929cb8180174d74c507176cca6835d73)
* Mining Contract 0x1A4F8705E1C0428D020e1558A371b7E6134455A2
* Bonus Token DODO (1.25 per block)
* Start date: May-14-2021
* Block: [12429771](https://etherscan.io/block/12429771)

BSC[​](https://docs-next.vercel.app/zh/docs/5_5_mining#bsc)



* Pledged Token DODO-BNB DLP (0xd534fae679f7f02364d177e9d44f1d15963c0dd7)
* Mining Contract 0x322B43e406D1B4Df9Bc36d058317Dd1cd3b0385F
* Bonus Token DODO (0.3 per block)
* Start date: May-06-2021
* Block: [ 7183883](https://bscscan.com/block/7183883)

Arbitrum One[​](https://docs-next.vercel.app/zh/docs/5_5_mining#arbitrum-one)



* Pledged Token DODO-USDC DLP (0x6a58c68ff5c4e4d90eb6561449cc74a64f818da5)
* Mining Contract 0x38Dbb42C4972116c88E27edFacD2451cf1b14255
* Bonus Token DODO (0.5 per block)
* Start date: Sep-02-2021
* Block: [254535](https://arbiscan.io/block/254535)

Aurora



* Pledged Token DODO-USDC DLP (0xc7689e5315a8b237ac7ab62119df299dd8c4b6d5)
* Mining Contract 0x10353A2e2EeAE8369c685526FC724137002BBDF9
* Bonus Token DODO (0.1 DODO Per Block)
* Bonus Token NEAR (0.007 DF Per Block)
* Start date: Dec-27-2021
* Block: [56104331](https://explorer.mainnet.aurora.dev/block/56104331/transactions)

Polygon



* Pledged Token DODO-USDT DLP (0x581c7DB44F2616781C86C331d31c1F09db87A746)
* Mining Contract 0x738aba1389C5e37d24b5B669F07CBEa594c733E4
* Bonus Token DODO (0.11 per block)
* Start date: Jan-20-2022
* Block: [23949001](https://polygonscan.com/block/23949001)

Boba



* Pledged Token DODO-USDT DLP (0xb55c56541dceef41322b5d7a7880594afcd9711c)
* Mining Contract 0xb69e388c678d6b5aed323e3ef2f22d5fef8fb1ec
* Start date: Feb-07-2022
* Block: [316096](https://blockexplorer.boba.network/blocks/316096/transactions)

Reference: [https://docs.dodoex.io/english/developers/liquidity-mining#current-mining-projects-conducted-by-the-first-version-of-the-contract](https://docs.dodoex.io/english/developers/liquidity-mining#current-mining-projects-conducted-by-the-first-version-of-the-contract)
