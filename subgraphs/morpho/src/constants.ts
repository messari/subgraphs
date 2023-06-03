import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { LendingProtocol } from "../generated/schema";

export const BASE_UNITS = BigDecimal.fromString("10000");
export const WAD = BigDecimal.fromString("1000000000000000000");
export const RAY = BigDecimal.fromString("1000000000000000000000000000");
export const RAY_BI = BigInt.fromString("1000000000000000000000000000");

export namespace ProtocolType {
  export const LENDING = "LENDING";
}

export namespace LendingType {
  export const POOLED = "POOLED";
}

export namespace InterestRateType {
  export const STABLE = "STABLE";
  export const VARIABLE = "VARIABLE";
  export const FIXED = "FIXED";
  export const P2P = "P2P";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace PositionSide {
  export const COLLATERAL = "COLLATERAL";
  export const BORROWER = "BORROWER";
}

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

export namespace ActivityType {
  export const DAILY = "DAILY";
  export const HOURLY = "HOURLY";
}

export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
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

export namespace PermissionType {
  export const WHITELIST_ONLY = "WHITELIST_ONLY";
  export const PERMISSIONED = "PERMISSIONED";
  export const PERMISSIONLESS = "PERMISSIONLESS";
  export const ADMIN = "ADMIN";
}

export namespace CollateralizationType {
  export const OVER_COLLATERALIZED = "OVER_COLLATERALIZED";
  export const UNDER_COLLATERALIZED = "UNDER_COLLATERALIZED";
  export const UNCOLLATERALIZED = "UNCOLLATERALIZED";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const VARIABLE_BORROW = "VARIABLE_BORROW";
  export const STABLE_BORROW = "STABLE_BORROW";
  export const STAKE = "STAKE";
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

export const CCOMP_ADDRESS = Address.fromString(
  "0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4"
);
export const COMP_ADDRESS = Address.fromString(
  "0xc00e94cb662c3520282e6f5717214004a7f26888"
);
export const COMPTROLLER_ADDRESS = Address.fromString(
  "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b"
);

///////////////////
///// Numbers /////
///////////////////

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGINT_ZERO = BigInt.fromI32(0);
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

export const BLOCKS_PER_DAY = BigInt.fromI32(7200 as i32);
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

///////////////////////////
//// Protocol Specific ////
///////////////////////////

// Morpho Aave specific
export class ReserveUpdateParams {
  constructor(
    public readonly event: ethereum.Event,
    public readonly marketAddress: Bytes,
    public readonly protocol: LendingProtocol,
    public readonly reserveSupplyIndex: BigInt,
    public readonly reserveBorrowIndex: BigInt,
    public readonly poolSupplyRate: BigInt,
    public readonly poolBorrowRate: BigInt
  ) {}
}

export class ProtocolData {
  constructor(
    public readonly protocolID: Bytes,
    public readonly protocol: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly network: string,
    public readonly lendingType: string,
    public readonly lenderPermissionType: string | null,
    public readonly borrowerPermissionType: string | null,
    public readonly poolCreatorPermissionType: string | null,
    public readonly collateralizationType: string | null,
    public readonly riskType: string | null
  ) {}
}

export function getProtocolData(protocolAddress: Address): ProtocolData {
  if (protocolAddress == MORPHO_AAVE_V2_ADDRESS) {
    return new ProtocolData(
      Bytes.fromHexString(MORPHO_AAVE_V2_ADDRESS.toHexString()),
      "Morpho",
      "Morpho Aave V2",
      "morpho-aave-v2",
      Network.MAINNET,
      LendingType.POOLED,
      PermissionType.PERMISSIONLESS,
      PermissionType.PERMISSIONLESS,
      PermissionType.PERMISSIONED,
      CollateralizationType.UNDER_COLLATERALIZED,
      RiskType.ISOLATED
    );
  }
  if (protocolAddress == MORPHO_COMPOUND_ADDRESS) {
    return new ProtocolData(
      Bytes.fromHexString(MORPHO_COMPOUND_ADDRESS.toHexString()),
      "Morpho",
      "Morpho Compound",
      "morpho-compound",
      Network.MAINNET,
      LendingType.POOLED,
      PermissionType.PERMISSIONLESS,
      PermissionType.PERMISSIONLESS,
      PermissionType.PERMISSIONED,
      CollateralizationType.UNDER_COLLATERALIZED,
      RiskType.ISOLATED
    );
  }

  log.critical("[getProtocolData] Protocol not found: {}", [
    protocolAddress.toHexString(),
  ]);
  return new ProtocolData(
    Bytes.fromHexString("0x0000000"),
    "",
    "",
    "",
    "",
    "",
    "",
    null,
    null,
    null,
    null
  );
}
