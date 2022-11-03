import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
  export const CRONOS = "CRONOS";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const HARMONY = "HARMONY";
  export const JUNO = "JUNO";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const OSMOSIS = "OSMOSIS";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const FIXED_LP_FEE = "FIXED_LP_FEE";
  export const DYNAMIC_LP_FEE = "DYNAMIC_LP_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace LendingType {
  export const CDP = "CDP";
  export const POOLED = "POOLED";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace InterestRateType {
  export const STABLE = "STABLE";
  export const VARIABLE = "VARIABLE";
  export const FIXED_TERM = "FIXED_TERM";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
}

export namespace RewardIntervalType {
  export const BLOCK = "BLOCK";
  export const TIMESTAMP = "TIMESTAMP";
}

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}

export namespace Protocol {
  export const NAME = "Curve Finance";
  export const SLUG = "curve-finance";
}

export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const MAX_BPS = BigInt.fromI32(10000);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_NEGATIVE_ONE = BigInt.fromString("-1");

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const BIGDECIMAL_NEGATIVE_ONE = BigDecimal.fromString("-1");

export const FEE_DENOMINATOR_BIGINT = BIGINT_TEN.pow(10);
export const FEE_DENOMINATOR = BigDecimal.fromString("10000000000");

export const DEFAULT_POOL_FEE = BigInt.fromString("4000000");
export const DEFAULT_ADMIN_FEE = BigInt.fromString("5000000000");

export const ETH_AVERAGE_BLOCK_PER_HOUR = BigInt.fromI32(3756);

export namespace Mainnet {
  export const REGISTRY_ADDRESS = Address.fromString(
    "0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"
  );

  export const REGISTRY_ADDRESS_V2 = Address.fromString(
    "0xF18056Bbd320E96A48e3Fbf8bC061322531aac99"
  );

  export const FACTORY_REGISTRY_ADDRESS = Address.fromString(
    "0xB9fC157394Af804a3578134A6585C0dc9cc990d4"
  );

  export const POOL_INFO_ADDRESS = Address.fromString(
    "0xe64608E223433E8a03a1DaaeFD8Cb638C14B552C"
  );

  export const GAUGE_CONTROLLER_ADDRESS = Address.fromString(
    "0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB"
  );

  export const CRV_TOKEN_ADDRESS = Address.fromString(
    "0xd533a949740bb3306d119cc777fa900ba034cd52"
  );
}

export const MISSING_LP_TOKENS = new Map<string, string>();

MISSING_LP_TOKENS.set(
  "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
  "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490"
);

MISSING_LP_TOKENS.set(
  "0xdebf20617708857ebe4f679508e7b7863a8a8eee",
  "0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900"
);

MISSING_LP_TOKENS.set(
  "0xa96a65c051bf88b4095ee1f2451c2a9d43f53ae2",
  "0xaA17A236F2bAdc98DDc0Cf999AbB47D47Fc0A6Cf"
);

MISSING_LP_TOKENS.set(
  "0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27",
  "0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B"
);

MISSING_LP_TOKENS.set(
  "0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56",
  "0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2"
);

MISSING_LP_TOKENS.set(
  "0x0ce6a5ff5217e38315f87032cf90686c96627caa",
  "0x194eBd173F6cDacE046C53eACcE9B953F28411d1"
);

MISSING_LP_TOKENS.set(
  "0x4ca9b3063ec5866a4b82e437059d2c43d1be596f",
  "0xb19059ebb43466C323583928285a49f558E572Fd"
);

MISSING_LP_TOKENS.set(
  "0x2dded6da1bf5dbdf597c45fcfaa3194e53ecfeaf",
  "0x5282a4eF67D9C33135340fB3289cc1711c13638C"
);

MISSING_LP_TOKENS.set(
  "0xf178c0b5bb7e7abf4e12a4838c7b7c5ba2c623c0",
  "0xcee60cFa923170e4f8204AE08B4fA6A3F5656F3a"
);

MISSING_LP_TOKENS.set(
  "0x06364f10b501e868329afbc005b3492902d6c763",
  "0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8"
);

MISSING_LP_TOKENS.set(
  "0x93054188d876f558f4a66b2ef1d97d16edf0895b",
  "0x49849C98ae39Fff122806C06791Fa73784FB3675"
);

MISSING_LP_TOKENS.set(
  "0xeb16ae0052ed37f479f7fe63849198df1765a733",
  "0x02d341CcB60fAaf662bC0554d13778015d1b285C"
);

MISSING_LP_TOKENS.set(
  "0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714",
  "0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3"
);

MISSING_LP_TOKENS.set(
  "0xc5424b857f758e906013f3555dad202e4bdb4567",
  "0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c"
);

MISSING_LP_TOKENS.set(
  "0xdc24316b9ae028f1497c275eb9192a3ea0f67022",
  "0x06325440D014e39736583c165C2963BA99fAf14E"
);

MISSING_LP_TOKENS.set(
  "0xa5407eae9ba41422680e2e00537571bcc53efbfd",
  "0xC25a3A3b969415c80451098fa907EC722572917F"
);

MISSING_LP_TOKENS.set(
  "0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c",
  "0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23"
);

MISSING_LP_TOKENS.set(
  "0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51",
  "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8"
);

MISSING_LP_TOKENS.set(
  "0x8038c01a0390a8c547446a0b2c18fc9aefecc10c",
  "0x3a664Ab939FD8482048609f652f9a0B0677337B9"
);

MISSING_LP_TOKENS.set(
  "0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956",
  "0xD2967f45c4f384DEEa880F807Be904762a3DeA07"
);

MISSING_LP_TOKENS.set(
  "0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604",
  "0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858"
);

MISSING_LP_TOKENS.set(
  "0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171",
  "0x6D65b498cb23deAba52db31c93Da9BFFb340FB8F"
);

MISSING_LP_TOKENS.set(
  "0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6",
  "0x1AEf73d49Dedc4b1778d0706583995958Dc862e6"
);

MISSING_LP_TOKENS.set(
  "0xc18cc39da8b11da8c3541c598ee022258f9744da",
  "0xC2Ee6b0334C261ED60C72f6054450b61B8f18E35"
);

MISSING_LP_TOKENS.set(
  "0x3e01dd8a5e1fb3481f0f589056b428fc308af0fb",
  "0x97E2768e8E73511cA874545DC5Ff8067eB19B787"
);

MISSING_LP_TOKENS.set(
  "0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1",
  "0x4f3E8F405CF5aFC05D68142F3783bDfE13811522"
);

MISSING_LP_TOKENS.set(
  "0x42d7025938bec20b69cbae5a77421082407f053a",
  "0x7Eb40E450b9655f4B3cC4259BCC731c63ff55ae6"
);

MISSING_LP_TOKENS.set(
  "0x890f4e345b1daed0367a877a1612f86a1f86985f",
  "0x94e131324b6054c0D789b190b2dAC504e4361b53"
);

MISSING_LP_TOKENS.set(
  "0x071c661b4deefb59e2a3ddb20db036821eee8f4b",
  "0x410e3E86ef427e30B9235497143881f717d93c2A"
);

MISSING_LP_TOKENS.set(
  "0xd81da8d904b52208541bade1bd6595d8a251f8dd",
  "0x2fE94ea3d5d4a175184081439753DE15AeF9d614"
);

MISSING_LP_TOKENS.set(
  "0x7f55dde206dbad629c080068923b36fe9d6bdbef",
  "0xDE5331AC4B3630f94853Ff322B66407e0D6331E8"
);

MISSING_LP_TOKENS.set(
  "0xc25099792e9349c7dd09759744ea681c7de2cb66",
  "0x64eda51d3Ad40D56b9dFc5554E06F94e1Dd786Fd"
);

MISSING_LP_TOKENS.set(
  "0xf9440930043eb3997fc70e1339dbb11f341de7a8",
  "0x53a901d48795C58f485cBB38df08FA96a24669D5"
);

MISSING_LP_TOKENS.set(
  "0x618788357d0ebd8a37e763adab3bc575d54c2c7d",
  "0x6BA5b4e438FA0aAf7C1bD179285aF65d13bD3D90"
);

MISSING_LP_TOKENS.set(
  "0xdcef968d416a41cdac0ed8702fac8128a64241a2",
  "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC"
);
