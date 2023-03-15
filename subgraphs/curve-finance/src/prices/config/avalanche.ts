import { Address, BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { Configurations, ContractInfo, TokenInfo } from "../common/types";

export const NETWORK_STRING = "avalanche";

///////////////////////////////////////////////////////////////////////////
///////////////////// CALCULATIONS/ORACLE CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const INCH_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0xBd0c7AaF0bF082712EbE919a9dD94b2d978f79A9"),
  BigInt.fromI32(8608685)
);

export const AAVE_ORACLE_CONTRACT_ADDRESS = ContractInfo.set(
  Address.fromString("0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C"),
  BigInt.fromI32(11970477)
);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// CURVE CONTRACT //////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const CURVE_REGISTRY_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6"),
    BigInt.fromI32(5254206)
  ),
  ContractInfo.set(
    Address.fromString("0x90f421832199e93d01b64DaF378b183809EB0988"),
    BigInt.fromI32(9384663)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// UNISWAP FORKS CONTRACT ////////////////////////
///////////////////////////////////////////////////////////////////////////

export const UNISWAP_FORKS_ROUTER_ADDRESSES = [
  ContractInfo.set(
    Address.fromString("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"), // TraderJOE
    BigInt.fromI32(2486393)
  ),
  ContractInfo.set(
    Address.fromString("0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"), // Pangolin
    BigInt.fromI32(56879)
  ),
  ContractInfo.set(
    Address.fromString("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"), // SushiSwap
    BigInt.fromI32(506236)
  ),
];

///////////////////////////////////////////////////////////////////////////
/////////////////////////// BLACKLISTED TOKENS ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const YEARN_LENS_BLACKLIST: Address[] = [];
export const INCH_ORACLE_BLACKLIST: Address[] = [];
export const AAVE_ORACLE_BLACKLIST: Address[] = [];
export const CURVE_CALCULATIONS_BLACKSLIST: Address[] = [];
export const SUSHI_CALCULATIONS_BLACKSLIST: Address[] = [];

///////////////////////////////////////////////////////////////////////////
//////////////////////////// HARDCODED STABLES ////////////////////////////
///////////////////////////////////////////////////////////////////////////

export const HARDCODED_STABLES: Address[] = [
  Address.fromString("0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee"), // Aave Avalannche DAI
  Address.fromString("0xfab550568c688d5d8a52c7d794cb93edc26ec0ec"), // Axelar Wrapped USDC
  Address.fromString("0xc5fa5669e326da8b2c35540257cd48811f40a36b"), // Axelar Wrapped DAI
  Address.fromString("0x6ab707aca953edaefbc4fd23ba73294241490620"), // Axelar Wrapped USDT
  Address.fromString("0x6807ed4369d9399847f306d7d835538915fa749d"), // Blizz DAI
  Address.fromString("0x18cb11c9f2b6f45a7ac0a95efd322ed4cf9eeebf"), // BLizz USDT
  Address.fromString("0x943df430f7f9f734ec7625b561dc5e17a173adf8"), // BLizz MIM
  Address.fromString("0x025ab35ff6abcca56d57475249baaeae08419039"), // Arable USD
  Address.fromString("0x28690ec942671ac8d9bc442b667ec338ede6dfd3"), // deBridge USD Coin
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
    Address.fromString("0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e")
  )
);

WHITELISTED_TOKENS.set(
  "USDT",
  TokenInfo.set(
    "USDT",
    6,
    Address.fromString("0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7")
  )
);

WHITELISTED_TOKENS.set(
  "DAI",
  TokenInfo.set(
    "DAI",
    18,
    Address.fromString("0xd586e7f844cea2f87f50152665bcbc2c279d8d70")
  )
);

WHITELISTED_TOKENS.set(
  "WETH",
  TokenInfo.set(
    "WETH",
    18,
    Address.fromString("0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab")
  )
);

WHITELISTED_TOKENS.set(
  "NATIVE_TOKEN",
  TokenInfo.set(
    "WAVAX",
    18,
    Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7")
  )
);

export class config implements Configurations {
  yearnLens(): ContractInfo | null {
    return null;
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
    return null;
  }
  curveCalculationsBlacklist(): Address[] {
    return CURVE_CALCULATIONS_BLACKSLIST;
  }

  sushiCalculations(): ContractInfo | null {
    return null;
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
