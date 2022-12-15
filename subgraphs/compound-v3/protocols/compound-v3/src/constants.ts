import {
  Address,
  ByteArray,
  BigInt,
  Bytes,
  crypto,
} from "@graphprotocol/graph-ts";
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

export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";
export const ETH_DECIMALS = 18;
export const DEFAULT_DECIMALS = 18;

// factory contract
export const CONFIGURATOR_ADDRESS =
  "0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3";
export const REWARDS_ADDRESS = "0x1B0e765F6224C21223AeA2af16c1C46E38885a40";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const PROTOCOL = "Compound";
export const PROTOCOL_NAME = "Compound III";
export const PROTOCOL_SLUG = "compound-v3";
export const PROTOCOL_NETWORK = Network.MAINNET;
export const LENDING_TYPE = LendingType.POOLED;
export const LENDER_PERMISSION_TYPE = PermissionType.PERMISSIONLESS;
export const BORROWER_PERMISSION_TYPE = PermissionType.PERMISSIONLESS;
export const POOL_CREATOR_PERMISSION_TYPE = PermissionType.ADMIN;
export const COLATERALIZATION_TYPE = CollateralizationType.OVER_COLLATERALIZED;
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
    LENDER_PERMISSION_TYPE,
    BORROWER_PERMISSION_TYPE,
    POOL_CREATOR_PERMISSION_TYPE,
    COLATERALIZATION_TYPE,
    RISK_TYPE
  );
}

//////////////////
///// Extras /////
//////////////////

export const MARKET_PREFIX = "Compound V3 ";
export const ENCODED_TRANSFER_SIGNATURE = crypto.keccak256(
  ByteArray.fromUTF8("Transfer(address,address,uint256)")
);
