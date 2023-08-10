import {
  Address,
  ByteArray,
  BigInt,
  Bytes,
  crypto,
  dataSource,
  log,
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
export const LENDING_TYPE = LendingType.POOLED;
export const LENDER_PERMISSION_TYPE = PermissionType.PERMISSIONLESS;
export const BORROWER_PERMISSION_TYPE = PermissionType.PERMISSIONLESS;
export const POOL_CREATOR_PERMISSION_TYPE = PermissionType.ADMIN;
export const COLATERALIZATION_TYPE = CollateralizationType.OVER_COLLATERALIZED;
export const RISK_TYPE = RiskType.GLOBAL;
export const COMPOUND_DECIMALS = 8;
export const BASE_INDEX_SCALE = BigInt.fromI64(1000000000000000);
export const NORMALIZE_DECIMALS = 16;

export function getProtocolData(): ProtocolData {
  const network = dataSource.network();
  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return new ProtocolData(
      Bytes.fromHexString("0x316f9708bb98af7da9c68c1c3b5e79039cd336e3"), // factory
      PROTOCOL,
      PROTOCOL_NAME,
      PROTOCOL_SLUG,
      Network.MAINNET,
      LENDING_TYPE,
      LENDER_PERMISSION_TYPE,
      BORROWER_PERMISSION_TYPE,
      POOL_CREATOR_PERMISSION_TYPE,
      COLATERALIZATION_TYPE,
      RISK_TYPE
    );
  } else if (equalsIgnoreCase(network, Network.MATIC)) {
    return new ProtocolData(
      Bytes.fromHexString("0x83e0f742cacbe66349e3701b171ee2487a26e738"),
      PROTOCOL,
      PROTOCOL_NAME,
      PROTOCOL_SLUG,
      Network.MATIC,
      LENDING_TYPE,
      LENDER_PERMISSION_TYPE,
      BORROWER_PERMISSION_TYPE,
      POOL_CREATOR_PERMISSION_TYPE,
      COLATERALIZATION_TYPE,
      RISK_TYPE
    );
  } else if (equalsIgnoreCase(network, Network.ARBITRUM_ONE)) {
    return new ProtocolData(
      Bytes.fromHexString("0xb21b06d71c75973babde35b49ffdac3f82ad3775"),
      PROTOCOL,
      PROTOCOL_NAME,
      PROTOCOL_SLUG,
      Network.ARBITRUM_ONE,
      LENDING_TYPE,
      LENDER_PERMISSION_TYPE,
      BORROWER_PERMISSION_TYPE,
      POOL_CREATOR_PERMISSION_TYPE,
      COLATERALIZATION_TYPE,
      RISK_TYPE
    );
  }

  log.critical("[getProtocolData] Unsupported network: {}", [network]);
  return new ProtocolData(
    ZERO_ADDRESS,
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

export function getRewardAddress(): Address {
  const network = dataSource.network();
  if (equalsIgnoreCase(network, Network.MAINNET)) {
    return Address.fromString("0x1b0e765f6224c21223aea2af16c1c46e38885a40");
  } else if (equalsIgnoreCase(network, Network.MATIC)) {
    return Address.fromString("0x45939657d1ca34a8fa39a924b71d28fe8431e581");
  } else if (equalsIgnoreCase(network, Network.ARBITRUM_ONE)) {
    return Address.fromString("0x88730d254a2f7e6ac8388c3198afd694ba9f7fae");
  }

  log.critical("[getRewardAddress] Unsupported network: {}", [network]);
  return ZERO_ADDRESS;
}

export function getCOMPChainlinkFeed(network: string): Address {
  if (equalsIgnoreCase(network, Network.MATIC)) {
    return Address.fromString("0x2a8758b7257102461bc958279054e372c2b1bde6");
  }
  if (equalsIgnoreCase(network, Network.ARBITRUM_ONE)) {
    return Address.fromString("0xe7c53ffd03eb6cef7d208bc4c13446c76d1e5884");
  }

  log.error("[getCOMPChainlinkFeed] Unsupported network: {}", [network]);
  return ZERO_ADDRESS;
}

//////////////////
///// Extras /////
//////////////////

export const MARKET_PREFIX = "Compound V3 ";
export const ENCODED_TRANSFER_SIGNATURE = crypto.keccak256(
  ByteArray.fromUTF8("Transfer(address,address,uint256)")
);

export function equalsIgnoreCase(a: string, b: string): boolean {
  return a.replace("-", "_").toLowerCase() == b.replace("-", "_").toLowerCase();
}
