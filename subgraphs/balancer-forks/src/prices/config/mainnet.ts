import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { Configurations, ContractInfo, TokenInfo } from "../common/types";

export const NETWORK_STRING = "mainnet";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0x83d95e0d5f402511db06817aff3f9ea88224b030"),
  BigInt.fromI32(12242339)
);

export const INCH_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0x07d91f5fb9bf7798734c3f606db065549f6893bb"),
  BigInt.fromI32(12522266)
);

export const CHAIN_LINK_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0x47fb2585d2c56fe188d0e6ec628a38b74fceeedf"),
  BigInt.fromI32(12864088)
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = ContractInfo.set(
  Address.fromString("0x25bf7b72815476dd515044f9650bf79bad0df655"),
  BigInt.fromI32(12370088)
);

export const CURVE_REGISTRY_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x7d86446ddb609ed0f5f8684acf30380a356b2b4c"),
    BigInt.fromI32(11154794)
  ),
  ContractInfo.set(
    Address.fromString("0x8f942c20d02befc377d41445793068908e2250d0"),
    BigInt.fromI32(13986752)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = ContractInfo.set(
  Address.fromString("0x5ea7e501c9a23f4a76dc7d33a11d995b13a1dd25"),
  BigInt.fromI32(2396120)
);

export const UNISWAP_FORKS_ROUTER_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x7a250d5630b4cf539739df2c5dacb4c659f2488d"), // Uniswap
    BigInt.fromI32(10207858)
  ),
  ContractInfo.set(
    Address.fromString("0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f"), // SushiSwap
    BigInt.fromI32(10794261)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// BLACKLISTED TOKENS ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_BLACKLIST: Address[] = [
  Address.fromString("0x5f98805a4e8be255a32880fdec7f6728c6568ba0"), // LUSD
  Address.fromString("0x8daebade922df735c38c80c7ebd708af50815faa"), // tBTC
  Address.fromString("0x0316eb71485b0ab14103307bf65a021042c6d380"), // Huobi BTC
  Address.fromString("0xca3d75ac011bf5ad07a98d02f18225f9bd9a6bdf"), // crvTriCrypto
  Address.fromString("0xae7ab96520de3a18e5e111b5eaab095312d7fe84"), // stETH
];
export const CURVE_CALCULATIONS_BLACKSLIST: Address[] = [
  Address.fromString("0xca3d75ac011bf5ad07a98d02f18225f9bd9a6bdf"), // crvTriCrypto
  Address.fromString("0xc4ad29ba4b3c580e6d59105fff484999997675ff"), // crv3Crypto
];
export const INCH_ORACLE_BLACKLIST: Address[] = [];
export const AAVE_ORACLE_BLACKLIST: Address[] = [];
export const SUSHI_CALCULATIONS_BLACKSLIST: Address[] = [];

///////////////////////////////////////////////////////////////////////////
//////////////////////////// HARDCODED STABLES ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const HARDCODED_STABLES: Address[] = [
  Address.fromString("0x5f98805a4e8be255a32880fdec7f6728c6568ba0"), // LUSD Token
  Address.fromString("0x8f4063446f5011bc1c9f79a819efe87776f23704"), // bb-f-DAI
  Address.fromString("0xb0f75e97a114a4eb4a425edc48990e6760726709"), // bb-f-LUSD
  Address.fromString("0xc8c79fcd0e859e7ec81118e91ce8e4379a481ee6"), // bb-f-fei
  Address.fromString("0xd997f35c9b1281b82c8928039d14cddab5e13c20"), // bb-f-USD
  Address.fromString("0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb2"), // bb-a-USD old
  Address.fromString("0x4fd63966879300cafafbb35d157dc5229278ed23"), // bb-a-USD
  Address.fromString("0x9210f1204b5a24742eba12f710636d76240df3d0"), // bb-a-USDC deprecated
  Address.fromString("0x804cdb9116a10bb78768d3252355a1b18067bf8f"), // bb-a-DAI deprecated
  Address.fromString("0x2bbf681cc4eb09218bee85ea2a5d3d13fa40fc0c"), // bb-a-USDT deprecated
  Address.fromString("0x652d486b80c461c397b0d95612a404da936f3db3"), // bb-a-USDC old
  Address.fromString("0xa3823e50f20982656557a4a6a9c06ba5467ae908"), // bb-a-DAI old
  Address.fromString("0xe6bcc79f328eec93d4ec8f7ed35534d9ab549faa"), // bb-a-USDT old
  Address.fromString("0x82698aecc9e28e9bb27608bd52cf57f704bd1b83"), // bb-a-USDC
  Address.fromString("0xae37d54ae477268b9997d4161b96b8200755935c"), // bb-a-DAI
  Address.fromString("0x2f4eb100552ef93840d5adc30560e5513dfffacb"), // bb-a-USDT
];

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELISTED_TOKENS = new TypedMap<string, TokenInfo>();

WHITELISTED_TOKENS.set(
  "USDC",
  TokenInfo.set(
    "USDC",
    6,
    Address.fromString("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")
  )
);

WHITELISTED_TOKENS.set(
  "USDT",
  TokenInfo.set(
    "USDT",
    6,
    Address.fromString("0xdac17f958d2ee523a2206206994597c13d831ec7")
  )
);

WHITELISTED_TOKENS.set(
  "DAI",
  TokenInfo.set(
    "DAI",
    18,
    Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f")
  )
);

WHITELISTED_TOKENS.set(
  "WETH",
  TokenInfo.set(
    "WETH",
    18,
    Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
  )
);

WHITELISTED_TOKENS.set(
  "NATIVE_TOKEN",
  TokenInfo.set(
    "ETH",
    18,
    Address.fromString("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
  )
);

export class config implements Configurations {
  yearnLens(): ContractInfo | null {
    return YEARN_LENS_CONTRACT_ADDRESS;
  }
  yearnLensBlacklist(): Address[] {
    return YEARN_LENS_BLACKLIST;
  }

  inchOracle(): ContractInfo | null {
    return INCH_ORACLE_CONTRACT_ADDRESS;
  }
  inchOracleBlacklist(): Address[] {
    return INCH_ORACLE_BLACKLIST;
  }

  chainLink(): ContractInfo | null {
    return CHAIN_LINK_CONTRACT_ADDRESS;
  }

  aaveOracle(): ContractInfo | null {
    return null;
  }
  aaveOracleBlacklist(): Address[] {
    return AAVE_ORACLE_BLACKLIST;
  }

  curveCalculations(): ContractInfo | null {
    return CURVE_CALCULATIONS_ADDRESS;
  }
  curveCalculationsBlacklist(): Address[] {
    return CURVE_CALCULATIONS_BLACKSLIST;
  }

  sushiCalculations(): ContractInfo | null {
    return SUSHISWAP_CALCULATIONS_ADDRESS;
  }
  sushiCalculationsBlacklist(): Address[] {
    return SUSHI_CALCULATIONS_BLACKSLIST;
  }

  uniswapForks(): ContractInfo[] {
    return UNISWAP_FORKS_ROUTER_ADDRESSES;
  }
  curveRegistry(): ContractInfo[] {
    return CURVE_REGISTRY_ADDRESSES;
  }

  hardcodedStables(): Address[] {
    return HARDCODED_STABLES;
  }

  whitelistedTokens(): TypedMap<string, TokenInfo> {
    return WHITELISTED_TOKENS;
  }
}
