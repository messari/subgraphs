# DODO v2 Subgraph

## Links

- Protocol: https://dodoex.io/
- Docs:
  https://docs.dodoex.io/english/
  https://dodoex.github.io/docs/docs/contractUseGuide
- Smart contracts: https://github.com/DODOEX/contractV2
- Deployed addresses: https://docs.dodoex.io/english/developers/contracts-address
- Official subgraph: https://github.com/DODOEX/dodoex_v2_subgraph

## Build

- Generate code from manifest and schema: `graph codegen`
- Build subgraph: `graph build`

## Deploy

- Deploy to Subgraph Studio: `graph deploy --studio messari-dodo`

## Documentation

The DODO V2 contracts are a rather complex contract set and unfortunately their contracts are not well documented. This makes it harder to follow along
as a subgraph developer so I have taken the time to write out this documentation explaining the finer details of the DODO platform that are not easily
understood from their documentation.

### Subgraph Structure

The Messari DODO V2 subgraph tracks the financial information of the DODO V2 smart-contracts. The information gathered by this subgraph spans a total of
10 different contract sets.

1. DVMFactory contract set

2. DSPFactory contract set

3. DPPFactory contract set

4. CPFactory contract set

5. The DODO Vending Machine contract set

6. The DODO Stable Pool contract set

7. The DODO Private Pool contract set

8. The DODO Crowd Pool contract set

9. DODO Fee contract set

10. DODO token Mining contract set

The various Factory contracts are relatively straight forward in that they each produce their respective Liquidity Pool contracts using a base
"CloneFactory" contract. Each Factory has its own "pool creation" type event making it easy to track pools in the subgraph.

The DODO contract repository facilitates four different types of liquidity pools each having its own factory contract;

DVM's: DODO Vending Machines

CP's: DODO Crowd Pools

DPP's: DODO Private Pools

DSP's: DODO Stablecoin Pools

Out of these four pool types 3 produce LP tokens, DVM's, CP's and DSP's. DPP's DO NOT have Lp tokens even though they do implement sudo LP logic in
their contracts so that they will work with their fee proxy and logic contracts.

### Liquidity Pool Finer Details

All four of these pool types consist of a contract set structured to separate concerns. The events used by the subgraph can mainly be found inside
their respective pools Trader contract implementation and their Funding contract implementation. The Trader contracts facilitate the trading of one
token for another in a pool while the Funding contracts handle the Liquidity Provider and Lp token logic.

A pools respective contract set can be found under contracts > factory name > impl > contract. Each pool type has its own respective mapping file
within the subgraph.

Each pool type has its own factory contract which is imported into the subgraph through the mappingFactory.ts file found in src. In addition to
tracking each pool Factory this mapping file also tracks the DODO liquidity mining contract set.

On the DODO platform LP staking is done through a separate set of contracts and is only done for certain specific LP tokens. This made it necessary to
separately track these mining contracts through their proxy contract (which is also a proxy to their factory) and then relate them back to the relevant
liquidity pools.

These liquidity mines produce a different amount of DODO token per block based on which LP is staked in them so it also became necessary to track and
directly call each mine contract to retrieve its per block emissions rate. To do this the subgraph has imported both the DODOMineV3Proxy and DODOMine
contract ABI's.

DODOMineV3Proxy can be found in contracts > SmartRoute > proxies > DODOMineV3Proxy.sol

while

DODOMine is located in contracts > DODOToken > DODOMine.sol.

DODO's fee logic is spread across multiple contracts as well. Each Liquidity Pool uses both a FeeRateImpl.sol (or FeeRateDIP3Impl.sol) contract along
with FeeRateModel.sol contract to calculate the fee on a per user/per pool basis. To accurately track this through the subgraph each pools FeeRateImpl
contract must first be retrieved. This contract is then used to retrieve that pools FeeRateModel contract which is then used to calculate fee
information within the subgraph.

FeeRateImpl.sol && FeeRateDIP3Impl.sol can both be found in contracts > DODOFee > contract

while FeeRateModel.sol is found in contracts > lib > FeeRateModel.sol

### Additional Pool Information

Out of the four Liquidity pool types it appears that the main contracts would be the DVM and DSP as these two contracts facilitate most trades on the
DODO platform. The Finer points of DPP's are discussed above however I have yet to touch on the DODO CrowdPools(CP's).

CP's are a weird case and take some digging to really understand. The LP mechanism for CP's works essentially the same as the other pools however these
LPs act as a type of bid into the liquidity pool and can be canceled before the CP is settled.

Upon the "Settle()" function being called a CP basically creates a DVM and transfers its holding to the DVM for its newly created LP token which the CP
can then exchange for the pseudo LP tokens it created. The consequences of this are that essentially all of the CPs activities outside of its LP
distribution are defacto tracked through the DVM's mapping code. This is documented in MappingCP.ts under its settle() function.
