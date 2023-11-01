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

// Global contracts
export const ISLE_GLOBALS = 
  "0xd5175C76F5a129De4F53b0DF5c878706E31910a1";
export const ISLE_USD_ADDRESS =
  "0xD7719799520b89A6b934A4402388e9EDdFD85387";
export const RECEIVABLE =
  "0x103d37376F312C0D3FA4021351dC87811E0464B2";

// Pool-side contracts
export const POOL_CONFIGURATOR = 
  "0x4137b1072c18F50D8D5f883043712727efa7B038";
export const LOAN_MANAGER =
  "0x14C0c74483abeaA0122DE6b8dD6c51795b48314c";
export const WITHDRAWAL_MANAGER =
  "0x9EDe7Fa06de4CcF3be5e26e27120eb608D001Ed8";


/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const PROTOCOL = "Isle Finance";
export const PROTOCOL_NAME = "Isle Finance";
export const PROTOCOL_SLUG = "isle-finance-v0";
export const PROTOCOL_NETWORK = Network._SEPOLIA;
export const LENDING_TYPE = LendingType.POOLED;
export const LENDER_PERMISSION_TYPE = PermissionType.PERMISSIONED;
export const BORROWER_PERMISSION_TYPE = PermissionType.PERMISSIONED;
export const POOL_CREATOR_PERMISSION_TYPE = PermissionType.WHITELIST_ONLY; // Pool Admins
export const COLATERALIZATION_TYPE = CollateralizationType.OVER_COLLATERALIZED; // LTV at most 100%
export const RISK_TYPE = RiskType.ISOLATED;

export function getProtocolData(): ProtocolData {
  return new ProtocolData(
    Bytes.fromHexString(POOL_CONFIGURATOR),
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
