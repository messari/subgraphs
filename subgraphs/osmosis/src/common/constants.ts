import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
  export const OSMOSIS = "OSMOSIS";
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

export namespace Protocol {
  export const NAME = "Osmosis";
  export const SLUG = "osmosis";
  export const SCHEMA_VERSION = "1.3.0";
  export const SUBGRAPH_VERSION = "1.0.0";
  export const METHODOLOGY_VERSION = "1.0.0";
}

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
}

export namespace Messages {
  export const MsgCreatePool = "/osmosis.gamm.v1beta1.MsgCreatePool"; // 11918
  export const MsgJoinPool = "/osmosis.gamm.v1beta1.MsgJoinPool"; // 44445
  export const MsgExitPool = "/osmosis.gamm.v1beta1.MsgExitPool"; // 44433
  export const MsgCreateBalancerPool =
    "/osmosis.gamm.v1beta1.MsgCreateBalancerPool"; // 4355226

  export const MsgSwapExactAmountIn =
    "/osmosis.gamm.v1beta1.MsgSwapExactAmountIn"; // 44445
  export const MsgSwapExactAmountOut =
    "/osmosis.gamm.v1beta1.MsgSwapExactAmountOut";

  export const MsgJoinSwapShareAmountOut =
    "/osmosis.gamm.v1beta1.MsgJoinSwapShareAmountOut";
  export const MsgExitSwapShareAmountIn =
    "/osmosis.gamm.v1beta1.MsgExitSwapShareAmountIn";

  export const MsgJoinSwapExternAmountIn =
    "/osmosis.gamm.v1beta1.MsgJoinSwapExternAmountIn"; // 4713063
  export const MsgExitSwapExternAmountOut =
    "/osmosis.gamm.v1beta1.MsgExitSwapExternAmountOut";

  export const MsgWithdrawDelegatorReward =
    "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward"; // 44444
  export const MsgWithdrawValidatorCommission =
    "/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission"; // 44444
  export const MsgDelegate = "/cosmos.staking.v1beta1.MsgDelegate"; // 44446

  export const MsgDeposit = "/cosmos.gov.v1beta1.MsgDeposit"; // 24383
}

export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;

export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_NEG_ONE = BigInt.fromI32(-1);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_SECONDS_PER_DAY = BigInt.fromI32(SECONDS_PER_DAY);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TEN = new BigDecimal(BIGINT_TEN);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);
export const BIGDECIMAL_SECONDS_PER_DAY = new BigDecimal(
  BigInt.fromI32(SECONDS_PER_DAY)
);

export const USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
export const DENOMINATOR = BigDecimal.fromString("10000");
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");
export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";

export const OSMO_DENOM = "uosmo";
export const ATOM_DENOM =
  "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2";
export const STABLE_COIN_DENOM = [
  "ibc/8242AD24008032E457D2E12D46588FD39FB54FB29680C6C7663D296B383C37C4",
  "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858",
  "ibc/9F9B07EF9AD291167CF5700628145DE1DEB777C2CFC7907553B24446515F6D0E",
  "ibc/71B441E27F1BBB44DD0891BCD370C2794D404D60A4FFE5AECCD9B1E28BC89805",
];

export const STABLE_COIN_START_BLOCK = 5000000;
