/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as constants from "../common/constants";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Configurations, OracleConfig, OracleContract } from "../common/types";

export const NETWORK_STRING = "mainnet";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = new OracleContract(
  "0x83d95e0d5f402511db06817aff3f9ea88224b030",
  12242339
);
export const CHAIN_LINK_CONTRACT_ADDRESS = new OracleContract(
  "0x47fb2585d2c56fe188d0e6ec628a38b74fceeedf",
  12864088
);
export const AAVE_ORACLE_CONTRACT_ADDRESS = new OracleContract();
export const SUSHISWAP_CALCULATIONS_ADDRESS = new OracleContract(
  "0x8263e161a855b644f582d9c164c66aabee53f927",
  12692284
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = new OracleContract(
  "0x25bf7b72815476dd515044f9650bf79bad0df655",
  12370088
);

// Address Provider: https://etherscan.io/address/0x0000000022d53366457f9d5e68ec105046fc4383
export const CURVE_REGISTRY_ADDRESSES: OracleContract[] = [
  new OracleContract("0x7d86446ddb609ed0f5f8684acf30380a356b2b4c", 11154794),
  new OracleContract("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5", 12195750), // Main Registry
  new OracleContract("0x8f942c20d02befc377d41445793068908e2250d0", 13986752), // CryptoSwap Registry
  new OracleContract("0xf98b45fa17de75fb1ad0e7afd971b0ca00e379fc", 15732062), // Meta Registry
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES: OracleContract[] = [
  new OracleContract("0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f", 10794261), // SushiSwap
  new OracleContract("0x7a250d5630b4cf539739df2c5dacb4c659f2488d", 10207858), // Uniswap
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// BLACKLISTED TOKENS ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_BLACKLIST: Address[] = [
  Address.fromString("0x5f98805a4e8be255a32880fdec7f6728c6568ba0"), // LUSD
  Address.fromString("0x8daebade922df735c38c80c7ebd708af50815faa"), // tBTC
  Address.fromString("0x0316eb71485b0ab14103307bf65a021042c6d380"), // Huobi BTC
  Address.fromString("0xca3d75ac011bf5ad07a98d02f18225f9bd9a6bdf"), // crvTriCrypto
];
export const AAVE_ORACLE_BLACKLIST: Address[] = [];
export const CURVE_CALCULATIONS_BLACKSLIST: Address[] = [
  Address.fromString("0xca3d75ac011bf5ad07a98d02f18225f9bd9a6bdf"), // crvTriCrypto
  Address.fromString("0xc4ad29ba4b3c580e6d59105fff484999997675ff"), // crv3Crypto
];
export const SUSHI_CALCULATIONS_BLACKSLIST: Address[] = [];

///////////////////////////////////////////////////////////////////////////
//////////////////////////// HARDCODED STABLES ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const HARDCODED_STABLES: Address[] = [
  Address.fromString("0xd632f22692fac7611d2aa1c0d552930d43caed3b"), // Curve.fi Factory USD Metapool: Frax
  Address.fromString("0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3"), // Magic Internet Money
  Address.fromString("0x5a6a4d54456819380173272a5e8e9b9904bdf41b"), // Curve.fi Factory USD Metapool: Magic Internet Money 3Pool
  Address.fromString("0xbc6da0fe9ad5f3b0d58160288917aa56653660e9"), // Alchemix USD
  Address.fromString("0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c"), // Curve.fi Factory USD Metapool: Alchemix USD
  Address.fromString("0x57ab1ec28d129707052df4df418d58a2d46d5f51"), // Synth SUSD
  Address.fromString("0xc25a3a3b969415c80451098fa907ec722572917f"), // Curve.fi DAI/USDC/USDT/sUSD
  Address.fromString("0x0000000000085d4780b73119b644ae5ecd22b376"), // TrueUSD
  Address.fromString("0xecd5e75afb02efa118af914515d6521aabd189f1"), // Curve.fi Factory USD Metapool: TrueUSD
  Address.fromString("0xfd2a8fa60abd58efe3eee34dd494cd491dc14900"), // Curve.fi aDAI/aUSDC/aUSDT
  Address.fromString("0x8ee017541375f6bcd802ba119bddc94dad6911a1"), // Curve.fi Factory USD Metapool: PUSd
  Address.fromString("0x5b3b5df2bf2b6543f78e053bd91c4bdd820929f1"), // Curve.fi Factory USD Metapool: USDM
  Address.fromString("0x04b727c7e246ca70d496ecf52e6b6280f3c8077d"), // Curve.fi Factory USD Metapool: apeUSDFRAXBP
  Address.fromString("0x3175df0976dfa876431c2e9ee6bc45b65d3473cc"), // Curve.fi FRAX/USDC
  Address.fromString("0xbcb91e689114b9cc865ad7871845c95241df4105"), // Curve.fi Factory USD Metapool: PWRD Metapool
  Address.fromString("0x26ea744e5b887e5205727f55dfbe8685e3b21951"), // iearn USDC
  Address.fromString("0xc2cb1040220768554cf699b0d863a3cd4324ce32"), // iearn DAI
  Address.fromString("0x04bc0ab673d88ae9dbc9da2380cb6b79c4bca9ae"), // iearn BUSD
  Address.fromString("0xe6354ed5bc4b393a5aad09f21c46e101e692d447"), // iearn USDT
  Address.fromString("0x3b3ac5386837dc563660fb6a0937dfaa5924333b"), // Curve.fi yDAI/yUSDC/yUSDT/yBUSD
  Address.fromString("0xc2f5fea5197a3d92736500fd7733fcc7a3bbdf3f"), // Curve.fi Factory USD Metapool: fUSD-3pool
  Address.fromString("0x0c10bf8fcb7bf5412187a595ab97a3609160b5c6"), // Decentralized USD
  Address.fromString("0x028171bca77440897b824ca71d1c56cac55b68a3"), // Aave interest bearing DAI
  Address.fromString("0x3ed3b47dd13ec9a98b44e6204a523e766b225811"), // Aave interest bearing USDT
  Address.fromString("0xbcca60bb61934080951369a648fb03df4f96263c"), // Aave interest bearing USDC
  Address.fromString("0x6c5024cd4f8a59110119c56f8933403a539555eb"), // Aave interest bearing SUSD
  Address.fromString("0xd71ecff9342a5ced620049e616c5035f1db98620"), // Synth sEUR
  Address.fromString("0xfc2838a17d8e8b1d5456e0a351b0708a09211147"), // FRAX/USDP
  Address.fromString("0x5ca135cb8527d76e932f34b5145575f9d8cbe08e"), // FPI
  Address.fromString("0xf939e0a03fb07f59a73314e73794be0e57ac1b4e"), // crvUSD
];

///////////////////////////////////////////////////////////////////////////
///////////////////////// ORACLE CONFIG OVERRIDES /////////////////////////
///////////////////////////////////////////////////////////////////////////

// https://github.com/messari/subgraphs/issues/2090
class SpellOverride implements OracleConfig {
  oracleCount(): number {
    return constants.INT_ONE;
  }
  oracleOrder(): string[] {
    return [
      constants.OracleType.CHAINLINK_FEED,
      constants.OracleType.CURVE_CALCULATIONS,
      constants.OracleType.SUSHI_CALCULATIONS,
      constants.OracleType.CURVE_ROUTER,
      constants.OracleType.UNISWAP_FORKS_ROUTER,
      constants.OracleType.YEARN_LENS_ORACLE,
    ];
  }
}

// https://github.com/messari/subgraphs/issues/726
class StETHOverride implements OracleConfig {
  oracleCount(): number {
    return constants.INT_ONE;
  }
  oracleOrder(): string[] {
    return [
      constants.OracleType.CHAINLINK_FEED,
      constants.OracleType.CURVE_CALCULATIONS,
      constants.OracleType.SUSHI_CALCULATIONS,
      constants.OracleType.CURVE_ROUTER,
      constants.OracleType.UNISWAP_FORKS_ROUTER,
      constants.OracleType.YEARN_LENS_ORACLE,
    ];
  }
}

// https://github.com/messari/subgraphs/issues/2097
class BaxaOverride implements OracleConfig {
  oracleCount(): number {
    return constants.INT_ONE;
  }
  oracleOrder(): string[] {
    return [
      constants.OracleType.UNISWAP_FORKS_ROUTER,
      constants.OracleType.YEARN_LENS_ORACLE,
      constants.OracleType.CHAINLINK_FEED,
      constants.OracleType.CURVE_CALCULATIONS,
      constants.OracleType.CURVE_ROUTER,
      constants.OracleType.SUSHI_CALCULATIONS,
    ];
  }
}

// https://github.com/messari/subgraphs/issues/2290
class CurveFactoryPoolOverride implements OracleConfig {
  oracleCount(): number {
    return constants.INT_ONE;
  }
  oracleOrder(): string[] {
    return [
      constants.OracleType.CURVE_ROUTER,
      constants.OracleType.UNISWAP_FORKS_ROUTER,
      constants.OracleType.CHAINLINK_FEED,
      constants.OracleType.CURVE_CALCULATIONS,
      constants.OracleType.SUSHI_CALCULATIONS,
      constants.OracleType.YEARN_LENS_ORACLE,
    ];
  }
}

class PreferUniswapOverride implements OracleConfig {
  oracleCount(): number {
    return constants.INT_ONE;
  }
  oracleOrder(): string[] {
    return [
      constants.OracleType.UNISWAP_FORKS_ROUTER,
      constants.OracleType.CURVE_CALCULATIONS,
      constants.OracleType.CHAINLINK_FEED,
      constants.OracleType.SUSHI_CALCULATIONS,
      constants.OracleType.CURVE_ROUTER,
      constants.OracleType.YEARN_LENS_ORACLE,
    ];
  }
}

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const USDC_TOKEN_DECIMALS = BigInt.fromI32(6);

export const ETH_ADDRESS = Address.fromString(
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
);
export const WETH_ADDRESS = Address.fromString(
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
);
export const USDC_ADDRESS = Address.fromString(
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
);

export class config implements Configurations {
  network(): string {
    return NETWORK_STRING;
  }

  yearnLens(): OracleContract {
    return YEARN_LENS_CONTRACT_ADDRESS;
  }
  chainLink(): OracleContract {
    return CHAIN_LINK_CONTRACT_ADDRESS;
  }
  yearnLensBlacklist(): Address[] {
    return YEARN_LENS_BLACKLIST;
  }

  aaveOracle(): OracleContract {
    return AAVE_ORACLE_CONTRACT_ADDRESS;
  }
  aaveOracleBlacklist(): Address[] {
    return AAVE_ORACLE_BLACKLIST;
  }

  curveCalculations(): OracleContract {
    return CURVE_CALCULATIONS_ADDRESS;
  }
  curveCalculationsBlacklist(): Address[] {
    return CURVE_CALCULATIONS_BLACKSLIST;
  }

  sushiCalculations(): OracleContract {
    return SUSHISWAP_CALCULATIONS_ADDRESS;
  }
  sushiCalculationsBlacklist(): Address[] {
    return SUSHI_CALCULATIONS_BLACKSLIST;
  }

  uniswapForks(): OracleContract[] {
    return UNISWAP_FORKS_ROUTER_ADDRESSES;
  }
  curveRegistry(): OracleContract[] {
    return CURVE_REGISTRY_ADDRESSES;
  }

  hardcodedStables(): Address[] {
    return HARDCODED_STABLES;
  }

  ethAddress(): Address {
    return ETH_ADDRESS;
  }
  wethAddress(): Address {
    return WETH_ADDRESS;
  }
  usdcAddress(): Address {
    return USDC_ADDRESS;
  }

  usdcTokenDecimals(): BigInt {
    return USDC_TOKEN_DECIMALS;
  }

  getOracleOverride(
    tokenAddr: Address | null,
    block: ethereum.Block | null
  ): OracleConfig | null {
    if (tokenAddr || block) {
      if (
        tokenAddr &&
        [
          Address.fromString("0x090185f2135308bad17527004364ebcc2d37e5f6"), // SPELL
        ].includes(tokenAddr)
      ) {
        return new SpellOverride();
      }
      if (
        tokenAddr &&
        [
          Address.fromString("0xae7ab96520de3a18e5e111b5eaab095312d7fe84"), // stETH
        ].includes(tokenAddr) &&
        block &&
        block.number.gt(BigInt.fromString("14019699")) &&
        block.number.lt(BigInt.fromString("14941265"))
      ) {
        return new StETHOverride();
      }
      if (
        tokenAddr &&
        [
          Address.fromString("0x91b08f4a7c1251dfccf5440f8894f8daa10c8de5"), // BAXA
        ].includes(tokenAddr)
      ) {
        return new BaxaOverride();
      }
      if (
        tokenAddr &&
        [
          Address.fromString("0xed4064f376cb8d68f770fb1ff088a3d0f3ff5c4d"), // crvCRVETH
          Address.fromString("0xf985005a3793dba4cce241b3c19ddcd3fe069ff4"), // ALCXFRAXBP-f
          Address.fromString("0x971add32ea87f10bd192671630be3be8a11b8623"), // cvxcrv-crv-f
          Address.fromString("0x137469b55d1f15651ba46a89d0588e97dd0b6562"), // BADGERWBTC-f
          Address.fromString("0x4647b6d835f3b393c7a955df51eefcf0db961606"), // KP3RETH-f
          Address.fromString("0x6359b6d3e327c497453d4376561ee276c6933323"), // SDTETH-f
          Address.fromString("0x2889302a794da87fbf1d6db415c1492194663d13"), // crvCRVUSDTBTCWSTETH
          //
          Address.fromString("0x7f86bf177dd4f3494b841a37e810a34dd56c829b"), // TricryptoUSDC
          Address.fromString("0xf5f5b97624542d72a9e06f04804bf81baa15e2b4"), // TricryptoUSDT
          Address.fromString("0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14"), // TriCRV
          Address.fromString("0xf3a43307dcafa93275993862aae628fcb50dc768"), // Factory Crypto Pool: cvxFxs/Fxs
          Address.fromString("0xb79565c01b7ae53618d9b847b9443aaf4f9011e7"), // Factory Crypto Pool: LDO/ETH
          Address.fromString("0x4704ab1fb693ce163f7c9d3a31b3ff4eaf797714"), // Factory Crypto Pool: FPI2Pool
          Address.fromString("0x390f3595bca2df7d23783dfd126427cceb997bf4"), // Factory Plain Pool: crvUSD/USDT
          Address.fromString("0x4dece678ceceb27446b35c672dc7d61f30bad69e"), // Factory Plain Pool: crvUSD/USDC
        ].includes(tokenAddr)
      ) {
        return new CurveFactoryPoolOverride();
      }
      if (
        tokenAddr &&
        [
          Address.fromString("0xdbdb4d16eda451d0503b854cf79d55697f90c8df"), // ALCX
          Address.fromString("0x62b9c7356a2dc64a1969e19c23e4f579f9810aa7"), // cvxCRV
          Address.fromString("0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44"), // KP3R
          Address.fromString("0x73968b9a57c6e53d41345fd57a6e6ae27d6cdb2f"), // SDT
        ].includes(tokenAddr)
      ) {
        return new PreferUniswapOverride();
      }
    }

    return null;
  }
}
