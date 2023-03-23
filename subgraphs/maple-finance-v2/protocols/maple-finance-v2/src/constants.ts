import { Address, Bytes } from "@graphprotocol/graph-ts";
import {
  CollateralizationType,
  LendingType,
  Network,
  PermissionType,
  RiskType,
} from "../../../src/sdk/constants";
import { ProtocolData } from "../../../src/sdk/manager";

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

export const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";
export const ETH_DECIMALS = 18;
export const DEFAULT_DECIMALS = 18;

export const CHAINLINK_DECIMALS = 8;

// factory contract
export const POOL_MANAGER_FACTORY =
  "0xe463cd473ecc1d1a4ecf20b62624d84dd20a8339";
export const LOAN_MANAGER_FACTORY =
  "0x1551717ae4fdcb65ed028f7fb7aba39908f6a7a6";
export const LIQUIDATOR_FACTORY = "0xa2091116649b070d2a27fc5c85c9820302114c63";
export const WITHDRAWAL_MANAGER_FACTORY =
  "0xb9e25b584dc4a7c9d47aef577f111fbe5705773b";
export const MAPLE_GLOBALS = "0x804a6f5f667170f545bf14e5ddb48c70b788390c"; // price from getLatestPrice()
export const CHAINLINK_USDC_ORACLE =
  "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6";
export const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
export const MIGRATION_HELPER = "0x580b1a894b9fbdbf7d29ba9b492807bf539dd508";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const PROTOCOL = "Maple Finance";
export const PROTOCOL_NAME = "Maple Finance 2.0";
export const PROTOCOL_SLUG = "maple-finance-v2";
export const PROTOCOL_NETWORK = Network.MAINNET;
export const LENDING_TYPE = LendingType.POOLED;
export const LENDER_PERMISSION_TYPE = PermissionType.PERMISSIONLESS;
export const BORROWER_PERMISSION_TYPE = PermissionType.PERMISSIONED;
export const POOL_CREATOR_PERMISSION_TYPE = PermissionType.WHITELIST_ONLY; // Pool Delegates
export const COLATERALIZATION_TYPE = CollateralizationType.UNDER_COLLATERALIZED; // Up to the Pool Delegates discretion
export const RISK_TYPE = RiskType.ISOLATED;

export function getProtocolData(): ProtocolData {
  return new ProtocolData(
    Bytes.fromHexString(POOL_MANAGER_FACTORY),
    PROTOCOL,
    PROTOCOL_NAME,
    PROTOCOL_SLUG,
    PROTOCOL_NETWORK,
    LENDING_TYPE,
    LENDER_PERMISSION_TYPE,
    BORROWER_PERMISSION_TYPE,
    POOL_CREATOR_PERMISSION_TYPE,
    COLATERALIZATION_TYPE,
    RISK_TYPE
  );
}
