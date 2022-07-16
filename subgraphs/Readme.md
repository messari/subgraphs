# Introduction of Multichain
## General
Multichain (previously AnySwap) is a one of the biggest cross-chain service providers, with services on 26 chains and for hundreds of tokens. 

Multichain deploys router contracts and anyTOKEN contracts on each chain to manage the cross-chain services and coordinate the settlement between chain with its SMPC Network. SMPC Network is independent of any chain; it comprises of SMPC nodes, which are run by different organisations, institutions and individuals and they are incentivized to perform their functions properly. 

## Official Links
- Protocol: https://multichain.org/
- Docs: https://docs.multichain.org/getting-started/introduction
- Explorer: https://anyswap.net/
- Fees: https://docs.multichain.org/getting-started/fees
- veMulti: https://docs.multichain.org/getting-started/vemulti
- Bridge list: https://bridgeapi.anyswap.exchange/v2/serverInfo/250
- Router list (all): https://bridgeapi.anyswap.exchange/v3/serverinfoV3?chainId=all&version=all 
- Router list (major coins): https://bridgeapi.anyswap.exchange/v3/serverinfoV3?chainId=all&version=STABLEV3

## Fees
Bridging fee is charged per transaction:
- Mainstream tokens(including stable-coins) bridge fee for crossing to none-ETH chains: $0.9-$1.9 per transaction;
-  Mainstream tokens(including stable-coins) bridge fee for crossing to ETH: 0.1% per transaction; minimum fees $40; maximum fees $1000;
- Altcoin bridge fee: 0.1%. The minimum fee is equal to tokens worth $5(to ETH is around $80) and the maximum fee is equal to tokens worth $1000.

Fees are accrued in the origination chain. When a user sends from chain A to chain B, what he will receive on chain B will be the sending amount less fees. Therefore the fees are accrued in chain A. 

Currently, 45% of the quarterly bridge fees will be distributed to MULTI token stakers as rewards and dispersed every quarter. $3,901,975.04 bridge fees from Q1 2022 will be distributed in Q2 2022.


## Cross-chain Mechanism
There are two types of cross-chain mechanism in Multichain's services: Bridge and Router. A Bridge allows an asset on one chain to be 'sent' to another chain. A Router enables any assets to be transferred between multiple chains.

### Bridge
#### Mechanism
Below are the steps on how Bridge works:
1. The SMPC nodes generate an address on the origination chain (the sending chain) for users to send assets;
2. SMPC nodes connect to a new smart contract on the destination chain for Wrapped Assets. This contract for the Wrapped Assets can be created by third party or the Multichain team, based on AnyswapV5ERC20.sol;
3. When a new asset arrives in the address in step 1 , the SMPC nodes trigger the Wrapped Asset smart contract on the destination chain to mint tokens;
4. Similarly, when the Wrapped Assets is burned, the SMPC nodes will trigger the address in step 1 to release the corresponding assets. 

An illustration of the above process:
1. For the Bridge from Ethereum to Fantom, the address is 0xc564ee9f21ed8a2d8e7e76c085740d5e4c5fafbe
2. Taking Yearn's YFI as example, the Wrapped Asset is YFI on Fantom chain (v2 version) with address 0x29b0Da86e484E1C0029B56e817912d778aC0EC69 on Fantom.
3. A user sent some YFI on Ethereum into the Bridge address in 1: https://etherscan.io/tx/0x478ad669493e5708d8bb990f1643b5e0ff40a2e14a9a14eeb8b92044c2dea2d5
4. The SMPC nodes triggers the Wrapped Asset contract on Fantom to send the user the same amount of YFI on fantom: https://ftmscan.com/tx/0x06a6c0d43d4c432e705cd5e00d12e3601dab43aab87985cb65a1a3d50157fbf4
The above transaction is also recorded in Multichain's explorer, where you can check the matching transactions on the sending and receiving chains: https://anyswap.net/explorer/tx?params=0x478ad669493e5708d8bb990f1643b5e0ff40a2e14a9a14eeb8b92044c2dea2d5

#### API point
The Multichain team has provided an API point for query all the Bridges:
https://bridgeapi.anyswap.exchange/v2/serverInfo/250

#### Metrics
For metrics relevant to Bridge (to add to the metrics data from Router service to form the overall Metrics of the protocol):
- TVL on a chain is the balance of all assets in the Bridge addresses on the origination (sending) chain
- Revenue is the difference of the amount a user sent to the Bridge address in the origination chain less then amount paid out to the user in destination chain. For the fee rate, please refer to the Fees section for details. Revenue are therefore accrued on the origination chain. However, Multichain also has a cost component, as the protocol has to bear the gas fee cost of sending the assets to the user on the destination chain. The revenue here should be net revenue of bridging fee less the gas fee cost incurred on the destination chain. (The gas fee cost on the origination chain is paid by the user.) It's not explicitly mentioned in the documentation how this fee is distributed; but since there's no liquidity provider in the case of Bridge service, 100% of the fees are kept by the  protocol (only accounted and distributed amongst different parties, i.e Safety Fund, veMulti stakers and SMPC nodes.)
- Usage of the Bridge are deposits (Transfer In) and withdrawals (Transfer Out) from thses address.
Please note that these addresses are not smart contracts, but wallet addresses controlled by the SMPC nodes.

### Router
Router service allows users to send assets across different chains. Instead of managing the wallets addresses, the SMPC nodes manage routers, which are smart contracts on each chain to coordinate the cross-chain settlements. 

#### Mechanism
There are two type of assets of any token in the Multicoin's Router service:
- In the case of Bridge, all the cross-chain assets are solely controlled by Multichain's  AnyswapV5ERC20.sol. In the case of Routers, such AnyswapV5ERC20.sol-controlled assets can still be transferred cross chain in the same way they are minted/burned like in the Bridge service. In the UI of Multichain app, these AnyswapV5ERC20.sol-controlled assets are shown as "unlimited", meaning there's no limit to how much of such assets can be transferred to the destination chain, as long as a user deposits the asset into the origination chain. An example of this will be MIM, Magic Internet Money: other than Ethereum, MIM tokens on all other chains are AnyswapV5ERC20.sol-controlled tokens and can be minted where a user deposits MIM into the anyMIM smart contract on Ethereum.
- There are also native tokens in some chains, e.g. USDC are issued by Circle in multiple chains. In such case, Muitlchain creates an anyTOKEN smart contract. Conceptually, it's wrapping a native token into a anyTOKEN form, for the purpose of settlement cross-chain with other AnyswapV5ERC20.sol-controlled tokens or other anyTOKENs on different chains. The anyToken smart contract is a liquidity pool and the liquidity inside is only the native token, e.g. anyUSDC only has a USDC balance inside this contract. This balance is the maximum amount of such native token can be transferred  into this destination bridge at that point of time. In the event that the intended transferred amount by a user exceeds the balance of the native token in the anyTOKEN contract in the destination chain, anyTOKEN will be minted and be given to the user. The user can come back to redeem the anyTOKEN to the native token when the smart contract has sufficient liquidity. (This is a summarised version of the sequence of events, for details, please refer to https://docs.multichain.org/getting-started/how-it-works/cross-chain-router .) As anyTOKEN contract is a liquidity pool, anyone can provide native token into it as liquidity (or withdraw any time) and share the cross-chain fees. 

Illustrations of the above process can be seen here:
- AnyswapV5ERC20.sol-controlled token transfer, transferring MIM from Ethereum to Avalanche: https://anyswap.net/explorer/tx?params=0x64acd10ffe0eb8ff09ed5c52029c839babbed0757c270ca19b32459b1be5614b
- Native token transfer, transferring USDC from Ethereum to Polygon: https://anyswap.net/explorer/tx?params=0xaaad5410230f0d68d589b3b963ae9ce6d8f2804aa764fc7816c1de06f483e9fd

#### API point
The Multichain team has provided an API point for query all the Routers:
https://bridgeapi.anyswap.exchange/v3/serverinfoV3?chainId=all&version=all . This is a large file and a more readable version for stablecoins and BTC, ETH is also available: https://bridgeapi.anyswap.exchange/v3/serverinfoV3?chainId=all&version=STABLEV3


#### Metrics
For metrics relevant to Router (to add to the metrics data from Bridge service to form the overall Metrics of the protocol):

*Usage and transactions*

Users of Multichain are people who either use the router services or provide liquidity to the pools.

- Usage of the Router services are the sum of all router smart contract transactions. As each cross-chain transaction will use one router smart contract on each of the destination and origination chain, we only look at the transaction on the origination chain to avoid double counting:
  - For router interacting with anyTOKEN smart contract: a cross-chain transaction is an Any Swap Out Underlying of the router contract;
  - For router interacting with a AnyswapV5ERC20.sol-controlled token: a cross-chain transaction is an Any Swap Out (looks like a burning function) of the router contract.
  
- Supplying Liquidity to pool: This is only relevant where anyTOKEN smart contract is available for liquidity providing purposes. Supply and withdraw liquidity are Deposit and Withdraw transactions of the anyTOKEN contract. 
  - For users who did not receive the native tokens in a cross-chain transfer due to temporary lack of liquidity in the pool, they are given the anyTOKEN of that that pool, and in this case they are technically considered as having provided liquidity to the pool.

*Revenue*
- Revenue is the difference of the amount a user sent to the anyToken address in the origination chain less then amount paid out to the user in destination chain. Revenue are therefore accrued on the origination chain. For the fee rate, please refer to the Fees section for details. However, Multichain also has a cost component, as the protocol has to bear the gas fee cost of sending the assets to the user on the destination chain. The revenue here should be net revenue of bridging fee less the gas fee cost incurred on the destination chain. (The gas fee cost on the origination chain is paid by the user.)
- Protocol-side revenue currently is 55% of the quarterly bridge fees (10% to the protocol's Safety Fund, and 45% to veMulti stakers). Distribution to MULTI token stakers is dispersed every quarter. The rest 45% is then supply-side revenue accrued to liquidity providers.

*TVL*
- TVL: liquidity in Multichain on any chain is to sum up the native token values in all the anyTOKEN smart contracts on that chain. 
  - However, this is not accurate as some protocols, like MIM, have minted more tokens than what's actually in circulation and bridged the extra tokens to another chain for borrowers of MIMs on that chain. *From Multichain's perspective, the transactions executed by the protocol might not be different from that of a user.* So in this case, we need to manually subtract this amount of MIM transferred by the protocol (e.g. from address 0x5f0dee98360d8200b20812e174d139a1a633edd2, under method Exec Transaction. This might not be exhaustive) to present the TVL meaningfully. This relates to the understanding of MIM (Abracadabra Money)'s methodology.
  - To better illustrate the above point, we can refer to the case of QiDao's Mai token on Polygon (as it's a smaller set of transactions). Mai has an officially reported circulation of 29m on Polygon but there's over 300m Mai minted and locked in some contracts not in circulation, one of such contracts being Multichain's anyMAI contract: 0x95dD59343a893637BE1c3228060EE6afBf6F0730, for cross-chain purposes. anyMai contract has over 84m Mai inside it; it was due to the deposit from Qi's working capital account 0xad95a5fe898679b927c266eb2edfabc7fe268c27. Deposits by the working capital account are mixed with the users' deposits.
  - In view of the above, if the reported TVL from summing up assets in anyTOKEN smart contracts is higher that the TVL of that asset in a chain, then it's necessary to look into that asset's methodology and amend its Multichain TVL manually. 


### List of router smart contracts
The list of router smart contracts are in the API point link, under each chain's "router" row. Each chain has one router. However, in some cases the router has versions, so it's not clear if there're earlier versions with different smart contracts. 


