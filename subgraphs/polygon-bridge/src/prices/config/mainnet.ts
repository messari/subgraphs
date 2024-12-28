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

export const CURVE_REGISTRY_ADDRESSES: OracleContract[] = [
  new OracleContract("0x7d86446ddb609ed0f5f8684acf30380a356b2b4c", 11154794),
  new OracleContract("0x8f942c20d02befc377d41445793068908e2250d0", 13986752),
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
];

export const IGNORELIST: Address[] = [
  Address.fromString("0xea6b6a4b813d1436a75883fcc789121e4b3f0465"),
  Address.fromString("0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3"),
  Address.fromString("0xfad45e47083e4607302aa43c65fb3106f1cd7607"),
  Address.fromString("0x9d3ee6b64e69ebe12a4bf0b01d031cb80f556ee4"),
  Address.fromString("0x922ac473a3cc241fd3a0049ed14536452d58d73c"),
  Address.fromString("0xcae72a7a0fd9046cf6b165ca54c9e3a3872109e0"),
  Address.fromString("0x9695e0114e12c0d3a3636fab5a18e6b737529023"),
  Address.fromString("0xcc4ae94372da236e9b113132e0c46c68704246b9"),
  Address.fromString("0x676cdc3312d0350749bed17cd3eb3b90e5917f42"),
  Address.fromString("0x591975253e25101f6e6f0383e13e82b7601d8c59"),
  Address.fromString("0x7b6bbbeac6a7f5681ec8e250b9aeb45a42bdc2cf"),
  Address.fromString("0xe17093967e43d37ad615a64cb86ae11826d6e58b"),
  Address.fromString("0xa6f7645ed967faf708a614a2fca8d4790138586f"),
  Address.fromString("0x2baac9330cf9ac479d819195794d79ad0c7616e3"),
  Address.fromString("0x38b0e3a59183814957d83df2a97492aed1f003e2"),
  Address.fromString("0x0ff80a1708191c0da8aa600fa487f7ac81d7818c"),
  Address.fromString("0x2596825a84888e8f24b747df29e11b5dd03c81d7"),
  Address.fromString("0x9559aaa82d9649c7a7b220e7c461d2e74c9a3593"),
  Address.fromString("0xc5a1973e1f736e2ad991573f3649f4f4a44c3028"),
  Address.fromString("0xcdb9d30a3ba48cdfcb0ecbe19317e6cf783672f1"),
  Address.fromString("0xd9016a907dc0ecfa3ca425ab20b6b785b42f2373"),
  Address.fromString("0x03042482d64577a7bdb282260e2ea4c8a89c064b"),
  Address.fromString("0xbca3c97837a39099ec3082df97e28ce91be14472"),
  Address.fromString("0x9783b81438c24848f85848f8df31845097341771"),
  Address.fromString("0x4e08f03079c5cd3083ea331ec61bcc87538b7665"),
  Address.fromString("0x09617f6fd6cf8a71278ec86e23bbab29c04353a7"),
  Address.fromString("0xfd957f21bd95e723645c07c48a2d8acb8ffb3794"),
  Address.fromString("0x5aa7c403c7de4b3bb0cc07079a03e389671a4771"),
  Address.fromString("0x31903e333809897ee57af57567f4377a1a78756c"),
];

///////////////////////////////////////////////////////////////////////////
///////////////////////// ORACLE CONFIG OVERRIDES /////////////////////////
///////////////////////////////////////////////////////////////////////////

// https://github.com/messari/subgraphs/issues/2090
class spellOverride implements OracleConfig {
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
class stETHOverride implements OracleConfig {
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
class baxaOverride implements OracleConfig {
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

  ignoreList(): Address[] {
    return IGNORELIST;
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
        return new spellOverride();
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
        return new stETHOverride();
      }
      if (
        tokenAddr &&
        [
          Address.fromString("0x91b08f4a7c1251dfccf5440f8894f8daa10c8de5"), // BAXA
        ].includes(tokenAddr)
      ) {
        return new baxaOverride();
      }
    }

    return null;
  }
}
