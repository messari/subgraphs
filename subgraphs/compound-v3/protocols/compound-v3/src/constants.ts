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

export const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";
export const ETH_DECIMALS = 18;
export const DEFAULT_DECIMALS = 18;

// factory contract
export const CONFIGURATOR_ADDRESS =
  "0x316f9708bb98af7da9c68c1c3b5e79039cd336e3";
export const REWARDS_ADDRESS = "0x1b0e765f6224c21223aea2af16c1c46e38885a40";
export const WETH_COMET_ADDRESS = "0xa17581a9e3356d9a858b789d68b4d866e593ae94";
export const USDC_COMET_WETH_MARKET_ID =
  "0xc3d688b66703497daa19211eedff47f25384cdc3c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

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
