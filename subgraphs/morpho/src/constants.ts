import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { ProtocolData } from "./sdk/protocols/lending/manager";
import {
  CollateralizationType,
  LendingType,
  Network,
  PermissionType,
  RiskType,
} from "./sdk/protocols/lending/constants";

export const BASE_UNITS = BigDecimal.fromString("10000");
export const WAD = BigDecimal.fromString("1000000000000000000");

export const RAY = BigDecimal.fromString("1000000000000000000000000000");

export const RAY_BI = BigInt.fromString("1000000000000000000000000000");

export namespace EventType {
  export const DEPOSIT = 1;
  export const WITHDRAW = 2;
  export const BORROW = 3;
  export const REPAY = 4;
  export const LIQUIDATOR = 5;
  export const LIQUIDATEE = 6;

  export const SUPPLIER_POSITION_UPDATE = 7;

  export const BORROWER_POSITION_UPDATE = 8;
}

/////////////////////
///// Addresses /////
/////////////////////

export const USDC_TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // used for Mainnet pricing
export const MORPHO_AAVE_V2_ADDRESS = Address.fromBytes(
  Bytes.fromHexString("0x777777c9898d384f785ee44acfe945efdff5f3e0")
);
export const MORPHO_COMPOUND_ADDRESS = Address.fromBytes(
  Bytes.fromHexString("0x8888882f8f843896699869179fb6e4f7e3b58888")
);
export const C_ETH = Address.fromBytes(
  Bytes.fromHexString("0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5")
);
export const WRAPPED_ETH = Address.fromBytes(
  Bytes.fromHexString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
);
export const ETH_USD_PRICE_FEED_ADDRESS = Address.fromBytes(
  Bytes.fromHexString("0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419")
);

///////////////////
///// Numbers /////
///////////////////

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_THREE = BigInt.fromI32(3);

export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);

export const BIGDECIMAL_ZERO = new BigDecimal(BigInt.zero());
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_THREE = new BigDecimal(BIGINT_THREE);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BigInt.fromI32(100));

export const DEFAULT_DECIMALS = 18;
export const RAY_OFFSET = 27;
export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;

export const BLOCKS_PER_YEAR = BigInt.fromI32(2632320 as i32); // 7200 blocks per day

/////////////////////////////
///// Utility Functions /////
/////////////////////////////

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function rayToWad(a: BigInt): BigInt {
  const halfRatio = BigInt.fromI32(10).pow(9).div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(BigInt.fromI32(10).pow(9));
}

export function wadToRay(a: BigInt): BigInt {
  return a.times(BigInt.fromI32(10).pow(9));
}

// n => 10^n
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let result = BIGINT_ONE;
  const ten = BigInt.fromI32(10);
  for (let i = 0; i < decimals; i++) {
    result = result.times(ten);
  }
  return result.toBigDecimal();
}
export function exponentToBigInt(decimals: i32): BigInt {
  let result = BIGINT_ONE;
  const ten = BigInt.fromI32(10);
  for (let i = 0; i < decimals; i++) {
    result = result.times(ten);
  }
  return result;
}

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}

export function getProtocolData(protocolID: Address): ProtocolData {
  if (protocolID == MORPHO_AAVE_V2_ADDRESS) {
    return new ProtocolData(
      Bytes.fromHexString(protocolID.toHexString()),
      "Morpho",
      "Morpho Aave V2",
      "morpho-aave-v2",
      Network.MAINNET,
      LendingType.CDP,
      PermissionType.PERMISSIONLESS,
      PermissionType.PERMISSIONLESS,
      PermissionType.ADMIN,
      CollateralizationType.OVER_COLLATERALIZED,
      RiskType.ISOLATED
    );
  } else if (protocolID == MORPHO_COMPOUND_ADDRESS) {
    return new ProtocolData(
      Bytes.fromHexString(protocolID.toHexString()),
      "Morpho",
      "Morpho Compound",
      "morpho-compound",
      Network.MAINNET,
      LendingType.CDP,
      PermissionType.PERMISSIONLESS,
      PermissionType.PERMISSIONLESS,
      PermissionType.ADMIN,
      CollateralizationType.OVER_COLLATERALIZED,
      RiskType.ISOLATED
    );
  } else {
    log.critical("Unknown protocol ID: {}", [protocolID.toHexString()]);
    return new ProtocolData(
      Bytes.fromHexString(protocolID.toHexString()),
      "",
      "",
      "",
      "",
      "",
      null,
      null,
      null,
      null,
      null
    );
  }
}
