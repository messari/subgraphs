/* eslint-disable @typescript-eslint/no-magic-numbers */

import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { Configurations, ContractInfo, TokenInfo } from "../common/types";

export const NETWORK_STRING = "fantom";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0x57aa88a0810dfe3f9b71a9b179dd8bf5f956c46a"),
  BigInt.fromI32(17091856)
);

export const INCH_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0xe8e598a1041b6fdb13999d275a202847d9b654ca"),
  BigInt.fromI32(34026291)
);

export const AAVE_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0xfd6f3c1845604c8ae6c6e402ad17fb9885160754"),
  BigInt.fromI32(33142059)
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_CALCULATIONS_ADDRESS = ContractInfo.set(
  Address.fromString("0x0b53e9df372e72d8fdcdbedfbb56059957a37128"),
  BigInt.fromI32(27067399)
);

export const CURVE_REGISTRY_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x0f854ea9f38cea4b1c2fc79047e9d0134419d5d6"),
    BigInt.fromI32(5655918)
  ),
  ContractInfo.set(
    Address.fromString("0x4fb93d7d320e8a263f22f62c2059dfc2a8bcbc4c"),
    BigInt.fromI32(27552509)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const SUSHISWAP_CALCULATIONS_ADDRESS = ContractInfo.set(
  Address.fromString("0x44536de2220987d098d1d29d3aafc7f7348e9ee4"),
  BigInt.fromI32(3809480)
);

export const UNISWAP_FORKS_ROUTER_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0xbe4fc72f8293f9d3512d58b969c98c3f676cb957"), // Uniswap
    BigInt.fromI32(3796241)
  ),
  ContractInfo.set(
    Address.fromString("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"), // SushiSwap
    BigInt.fromI32(2457904)
  ),
  ContractInfo.set(
    Address.fromString("0x16327e3fbdaca3bcf7e38f5af2599d2ddc33ae52"), // Spiritswap
    BigInt.fromI32(4250168)
  ),
  ContractInfo.set(
    Address.fromString("0xf491e7b69e4244ad4002bc14e878a34207e38c29"), // SpookySwap
    BigInt.fromI32(4242185)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// BLACKLISTED TOKENS ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_BLACKLIST: Address[] = [
  Address.fromString("0xe578c856933d8e1082740bf7661e379aa2a30b26"), // GeistUSDC
  Address.fromString("0xe3a486c1903ea794eed5d5fa0c9473c7d7708f40"), // Creditum USD
  Address.fromString("0xc664fc7b8487a3e10824cda768c1d239f2403bbe"), // Geist MIM
  Address.fromString("0x940f41f0ec9ba1a34cf001cc03347ac092f5f6b5"), // Geist fUSDT
  Address.fromString("0x95dd59343a893637be1c3228060ee6afbf6f0730"), // Luna
  Address.fromString("0xdbf31df14b66535af65aac99c32e9ea844e14501"), // renBTC
  Address.fromString("0xc931f61b1534eb21d8c11b24f3f5ab2471d4ab50"), // Binance USD
  Address.fromString("0xad84341756bf337f5a0164515b1f6f993d194e1f"), // Fantom USD
  Address.fromString("0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad"), // fETH
  Address.fromString("0x25c130b2624cf12a4ea30143ef50c5d68cefa22f"), // geistETH
];
export const SUSHI_CALCULATIONS_BLACKSLIST: Address[] = [
  Address.fromString("0xdbf31df14b66535af65aac99c32e9ea844e14501"), // renBTC
  Address.fromString("0xc931f61b1534eb21d8c11b24f3f5ab2471d4ab50"), // Binance USD
  Address.fromString("0xad84341756bf337f5a0164515b1f6f993d194e1f"), // Fantom USD
  Address.fromString("0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad"), // fETH
];
export const INCH_ORACLE_BLACKLIST: Address[] = [];
export const AAVE_ORACLE_BLACKLIST: Address[] = [];
export const CURVE_CALCULATIONS_BLACKSLIST: Address[] = [];

///////////////////////////////////////////////////////////////////////////
//////////////////////////// HARDCODED STABLES ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const HARDCODED_STABLES: Address[] = [];

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// HELPERS /////////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const WHITELISTED_TOKENS = new TypedMap<string, TokenInfo>();

WHITELISTED_TOKENS.set(
  "USDC",
  TokenInfo.set(
    "USDC",
    6,
    Address.fromString("0x04068da6c83afcfa0e13ba15a6696662335d5b75")
  )
);

WHITELISTED_TOKENS.set(
  "USDT",
  TokenInfo.set(
    "USDT",
    6,
    Address.fromString("0x049d68029688eabf473097a2fc38ef61633a3c7a")
  )
);

WHITELISTED_TOKENS.set(
  "DAI",
  TokenInfo.set(
    "DAI",
    18,
    Address.fromString("0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e")
  )
);

WHITELISTED_TOKENS.set(
  "WETH",
  TokenInfo.set(
    "WETH",
    18,
    Address.fromString("0x25c130b2624cf12a4ea30143ef50c5d68cefa22f")
  )
);

WHITELISTED_TOKENS.set(
  "NATIVE_TOKEN",
  TokenInfo.set(
    "WFTM",
    18,
    Address.fromString("0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83")
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
    return null;
  }

  aaveOracle(): ContractInfo | null {
    return AAVE_ORACLE_CONTRACT_ADDRESS;
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
