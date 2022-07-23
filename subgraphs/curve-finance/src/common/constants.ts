import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";

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
  export const SCHEMA_VERSION = "1.3.0";
  export const SUBGRAPH_VERSION = "1.0.0";
  export const METHODOLOGY_VERSION = "1.0.0";
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

export const FEE_DENOMINATOR = BigDecimal.fromString("10000000000");
export const DEFAULT_POOL_FEE = BigInt.fromString("4000000");
export const DEFAULT_ADMIN_FEE = BigInt.fromString("5000000000");

export namespace Mainnet {
  export const REGISTRY_ADDRESS = Address.fromString(
    "0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"
  );

  export const FACTORY_REGISTRY_ADDRESS = Address.fromString(
    "0xB9fC157394Af804a3578134A6585C0dc9cc990d4"
  );

  export const POOL_INFO_ADDRESS = Address.fromString(
    "0xe64608E223433E8a03a1DaaeFD8Cb638C14B552C"
  );

  export const MISSING_LP_TOKENS = new Map<Address, Address>();

  MISSING_LP_TOKENS.set(
    Address.fromString("0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"),
    Address.fromString("0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xDeBF20617708857ebe4F679508E7b7863a8A8EeE"),
    Address.fromString("0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xA96A65c051bF88B4095Ee1f2451C2A9d43F53Ae2"),
    Address.fromString("0xaA17A236F2bAdc98DDc0Cf999AbB47D47Fc0A6Cf")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27"),
    Address.fromString("0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56"),
    Address.fromString("0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x0Ce6a5fF5217e38315f87032CF90686C96627CAA"),
    Address.fromString("0x194eBd173F6cDacE046C53eACcE9B953F28411d1")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F"),
    Address.fromString("0xb19059ebb43466C323583928285a49f558E572Fd")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x2dded6Da1BF5DBdF597C45fcFaa3194e53EcfeAF"),
    Address.fromString("0x5282a4eF67D9C33135340fB3289cc1711c13638C")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xF178C0b5Bb7e7aBF4e12A4838C7b7c5bA2C623c0"),
    Address.fromString("0xcee60cFa923170e4f8204AE08B4fA6A3F5656F3a")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x06364f10B501e868329afBc005b3492902d6C763"),
    Address.fromString("0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x93054188d876f558f4a66B2EF1d97d16eDf0895B"),
    Address.fromString("0x49849C98ae39Fff122806C06791Fa73784FB3675")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xEB16Ae0052ed37f479f7fe63849198Df1765a733"),
    Address.fromString("0x02d341CcB60fAaf662bC0554d13778015d1b285C")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714"),
    Address.fromString("0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xc5424B857f758E906013F3555Dad202e4bdB4567"),
    Address.fromString("0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xDC24316b9AE028F1497c275EB9192a3Ea0f67022"),
    Address.fromString("0x06325440D014e39736583c165C2963BA99fAf14E")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xA5407eAE9Ba41422680e2e00537571bcC53efBfD"),
    Address.fromString("0xC25a3A3b969415c80451098fa907EC722572917F")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C"),
    Address.fromString("0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51"),
    Address.fromString("0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c"),
    Address.fromString("0x3a664Ab939FD8482048609f652f9a0B0677337B9")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956"),
    Address.fromString("0xD2967f45c4f384DEEa880F807Be904762a3DeA07")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604"),
    Address.fromString("0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171"),
    Address.fromString("0x6D65b498cb23deAba52db31c93Da9BFFb340FB8F")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6"),
    Address.fromString("0x1AEf73d49Dedc4b1778d0706583995958Dc862e6")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xC18cC39da8b11dA8c3541C598eE022258F9744da"),
    Address.fromString("0xC2Ee6b0334C261ED60C72f6054450b61B8f18E35")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb"),
    Address.fromString("0x97E2768e8E73511cA874545DC5Ff8067eB19B787")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1"),
    Address.fromString("0x4f3E8F405CF5aFC05D68142F3783bDfE13811522")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x42d7025938bEc20B69cBae5A77421082407f053A"),
    Address.fromString("0x7Eb40E450b9655f4B3cC4259BCC731c63ff55ae6")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x890f4e345B1dAED0367A877a1612f86A1f86985f"),
    Address.fromString("0x94e131324b6054c0D789b190b2dAC504e4361b53")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x071c661B4DeefB59E2a3DdB20Db036821eeE8F4b"),
    Address.fromString("0x410e3E86ef427e30B9235497143881f717d93c2A")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xd81dA8D904b52208541Bade1bD6595D8a251F8dd"),
    Address.fromString("0x2fE94ea3d5d4a175184081439753DE15AeF9d614")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x7F55DDe206dbAD629C080068923b36fe9D6bDBeF"),
    Address.fromString("0xDE5331AC4B3630f94853Ff322B66407e0D6331E8")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xC25099792E9349C7DD09759744ea681C7de2cb66"),
    Address.fromString("0x64eda51d3Ad40D56b9dFc5554E06F94e1Dd786Fd")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xF9440930043eb3997fc70e1339dBb11F341de7A8"),
    Address.fromString("0x53a901d48795C58f485cBB38df08FA96a24669D5")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0x618788357D0EBd8A37e763ADab3bc575D54c2C7d"),
    Address.fromString("0x6BA5b4e438FA0aAf7C1bD179285aF65d13bD3D90")
  );

  MISSING_LP_TOKENS.set(
    Address.fromString("0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2"),
    Address.fromString("0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC")
  );
}
