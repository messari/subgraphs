import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";

export const DEFAULT_DECIMALS: BigInt = BigInt.fromI32(18);
export const DEFUALT_AMOUNT: BigInt = BigInt.fromString("1000000000000000000");

export const ZERO_BIGDECIMAL: BigDecimal = BigDecimal.fromString("0");
export const ZERO_BIGINT: BigInt = BigInt.fromString("0");
export const ZERO_INT: i32 = 0;
export const ZERO_BIGDECIMAL_ARRAY: BigDecimal[] = [];
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const BIGDECIMAL_ZERO = new BigDecimal(BigInt.fromI32(0));

export const ZERO_ADDRESS: Address = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const YAK_STRATEGY_MANAGER_ADDRESS: Address = Address.fromString(
  "0x302404cb8F34713A8B8DBF9b4989A41252332068"
);
export const WAVAX_CONTRACT_ADDRESS: Address = Address.fromString(
  "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
);
export const YAK_ROUTER_ADDRESS: Address = Address.fromString(
  "0xC4729E56b831d74bBc18797e0e17A295fA77488c"
);

export const SECONDS_PER_DAY = 60 * 60 * 24;
export const SECONDS_PER_HOUR = 60 * 60;

export const MAX_UINT256 =
  BigInt.fromI32(
    115792089237316195423570985008687907853269984665640564039457584007913129639935
  );

export const MAX_UINT256_STR =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const FEE_DIVISOR = BigDecimal.fromString("10000");

export const STAKED_GLP_ADDRESS = Address.fromString(
  "0x5643f4b25e36478ee1e90418d5343cb6591bcb9d"
);
export const YY_JOE_ADDRESS = Address.fromString(
  "0x98c90014222f09f5bfff66f1d206dcc52049cf7f"
);
export const JOE_LP_ADDRESS = Address.fromString(
  "0xe5e9d67e93ad363a50cabcb9e931279251bbefd0"
);
export const USDC_LP_ADDRESS = Address.fromString(
  "0x1205f31718499dbf1fca446663b532ef87481fe1"
);
export const ASI_LP_ADDRESS = Address.fromString(
  "0x38918142779e2CD1189cBd9e932723C968363D1E"
);
export const K3C_LP_ADDRESS = Address.fromString(
  "0xa6cab4b1019ee22309dca5ba62c3372a791dcb2e"
);
export const OLIVE_LP_ADDRESS = Address.fromString(
  "0x57cc32cd7f5a531953e9af25e1c9394093428082"
);