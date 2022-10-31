import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";

export const DEFUALT_DECIMALS: BigInt = BigInt.fromString("0");
export const DEFUALT_AMOUNT: BigInt = BigInt.fromString("1000000000000000000")

export const ZERO_BIGDECIMAL: BigDecimal = BigDecimal.fromString("0");
export const ZERO_BIGINT: BigInt = BigInt.fromString("0");
export const ZERO_INT: i32 = 0;
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");

export const ZERO_ADDRESS: Address = Address.fromString("0x0000000000000000000000000000000000000000");
export const YAK_STRATEGY_MANAGER_ADDRESS: Address = Address.fromString("0x302404cb8F34713A8B8DBF9b4989A41252332068");
export const WAVAX_CONTRACT_ADDRESS: Address = Address.fromString("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");
export const YAK_ROUTER_ADDRESS: Address = Address.fromString("0xC4729E56b831d74bBc18797e0e17A295fA77488c");
export const USDC_ADDRESS: Address = Address.fromString("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E");

export const SECONDS_PER_DAY = 60 * 60 * 24;
export const SECONDS_PER_HOUR = 60 * 60;

export const MAX_UINT256 = BigInt.fromI32(115792089237316195423570985008687907853269984665640564039457584007913129639935);

export const MAX_UINT256_STR = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const FEE_DIVISOR = BigDecimal.fromString("10000");