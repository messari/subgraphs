import {
  Address,
  ByteArray,
  BigInt,
  Bytes,
  crypto,
} from "@graphprotocol/graph-ts";
import { ProtocolData } from "../../../src/utils/getters";

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

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace LendingType {
  export const CDP = "CDP";
  export const POOLED = "POOLED";
}

export namespace PermissionType {
  export const PERMISSIONED = "PERMISSIONED";
  export const PARTIALLY_PERMISSIONED = "PARTIALLY_PERMISSIONED";
  export const PERMISSIONLESS = "PERMISSIONLESS";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace TokenType {
  export const REBASING = "REBASING";
  export const NON_REBASING = "NON_REBASING";
}

export namespace InterestRateType {
  export const STABLE = "STABLE";
  export const VARIABLE = "VARIABLE";
  export const FIXED = "FIXED";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace PositionSide {
  export const COLLATERAL = "COLLATERAL";
  export const BORROWER = "BORROWER";
}

export namespace RevenueSource {
  export const BORROW_INTEREST = "BORROW_INTEREST";
  export const LIQUIDATION_FEE = "LIQUIDATION_FEE";
  export const FLASHLOAN_FEE = "FLASHLOAN_FEE";
}

export namespace OracleSource {
  export const UNISWAP = "UNISWAP";
  export const BALANCER = "BALANCER";
  export const CHAINLINK = "CHAINLINK";
  export const YEARN = "YEARN";
  export const SUSHISWAP = "SUSHISWAP";
  export const CURVE = "CURVE";
}

export namespace TransactionType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const BORROW = "BORROW";
  export const REPAY = "REPAY";
  export const LIQUIDATE = "LIQUIDATE";
}

export namespace AccountActiity {
  export const DAILY = "DAILY";
  export const HOURLY = "HOURLY";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";
export const ETH_DECIMALS = 18;
export const DEFAULT_DECIMALS = 18;

// factory contract
export const CONFIGURATOR_ADDRESS =
  "0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const PROTOCOL = "Compound";
export const PROTOCOL_NAME = "Compound III";
export const PROTOCOL_SLUG = "compound-v3";
export const PROTOCOL_NETWORK = Network.MAINNET;
export const LENDING_TYPE = LendingType.POOLED;
export const PERMISSION_TYPE = PermissionType.PERMISSIONLESS;
export const RISK_TYPE = RiskType.GLOBAL;
export const COMPOUND_DECIMALS = 8;
export const BASE_INDEX_SCALE = BigInt.fromI64(1000000000000000);

export function getProtocolData(): ProtocolData {
  return new ProtocolData(
    Bytes.fromHexString(CONFIGURATOR_ADDRESS),
    PROTOCOL,
    PROTOCOL_NAME,
    PROTOCOL_SLUG,
    PROTOCOL_NETWORK,
    LENDING_TYPE,
    PERMISSION_TYPE,
    RISK_TYPE
  );
}

//////////////////
///// Extras /////
//////////////////

export const ENCODED_TRANSFER_SIGNATURE = crypto.keccak256(
  ByteArray.fromUTF8("Transfer(address,address,uint256)")
);
