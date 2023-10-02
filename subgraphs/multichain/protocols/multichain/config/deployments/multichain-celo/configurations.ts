import {
  json,
  log,
  BigDecimal,
  BigInt,
  Address,
  JSONValue,
} from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import { Token } from "../../../../../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  ZERO_ADDRESS,
  BIGINT_ZERO,
  BridgeType,
  ID_BY_NETWORK,
  INT_ZERO,
  INT_ONE,
  INT_TWO,
} from "../../../../../src/common/constants";
import { bigIntToBigDecimal } from "../../../../../src/common/utils/numbers";
import { BRIDGE_API_RESPONSE, ROUTER_API_RESPONSE } from "./api";

export class MultichainCeloConfigurations implements Configurations {
  getNetwork(): string {
    return Network.CELO;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0xfa9da51631268a30ec3ddd1ccbf46c65fad99251";
  }
  getChainID(): BigInt {
    const chainID = ID_BY_NETWORK.get(this.getNetwork());
    if (!chainID) {
      log.error("[getChainID] ID_BY_NETWORK not set for network", []);
      return BIGINT_ZERO;
    }
    return chainID;
  }
  getCrosschainID(tokenID: string): BigInt {
    let crosschainID = BIGINT_ZERO;

    const key = tokenID.toLowerCase();
    const obj = json.fromString(BRIDGE_API_RESPONSE).toObject().get(key);

    if (obj) {
      crosschainID = BigInt.fromString(obj.toArray()[INT_ZERO].toString());
    } else {
      log.warning("[getCrosschainID] No crosschainID for key: {}", [key]);
    }

    return crosschainID;
  }
  isWhitelistToken(tokenAddress: Address, crosschainID: string): boolean {
    const key = tokenAddress
      .toHexString()
      .toLowerCase()
      .concat(":")
      .concat(crosschainID);

    if (!json.fromString(ROUTER_API_RESPONSE).toObject().get(key)) {
      log.warning("[isWhitelistToken] Not whitelisted key: {}", [key]);

      return false;
    }
    return true;
  }
  getCrosschainTokenAddress(
    bridgeType: string,
    tokenID: string,
    crosschainID: string
  ): Address {
    let crosschainToken = ZERO_ADDRESS;

    let key: string;
    let obj: JSONValue | null;
    let idx: number;

    if (bridgeType == BridgeType.BRIDGE) {
      key = tokenID.toLowerCase();
      obj = json.fromString(BRIDGE_API_RESPONSE).toObject().get(key);
      idx = INT_ONE;
    } else {
      key = tokenID.toLowerCase().concat(":").concat(crosschainID);
      obj = json.fromString(ROUTER_API_RESPONSE).toObject().get(key);
      idx = INT_ZERO;
    }

    if (obj) {
      crosschainToken = obj.toArray()[idx as i32].toString();
    } else {
      log.warning(
        "[getCrosschainTokenAddress] No crosschainTokenAddress for key: {}",
        [key]
      );
    }

    return Address.fromString(crosschainToken);
  }
  getBridgeFeeUSD(
    bridgeType: string,
    token: Token,
    crosschainID: string,
    amount: BigInt
  ): BigDecimal {
    let feeUSD = BIGDECIMAL_ZERO;

    let key: string;
    let obj: JSONValue | null;
    let idx: number;

    if (bridgeType == BridgeType.BRIDGE) {
      key = token.id.toHexString().toLowerCase();
      obj = json.fromString(BRIDGE_API_RESPONSE).toObject().get(key);
      idx = INT_TWO;
    } else {
      key = token.id
        .toHexString()
        .toLowerCase()
        .concat(":")
        .concat(crosschainID);
      obj = json.fromString(ROUTER_API_RESPONSE).toObject().get(key);
      idx = INT_ONE;
    }

    if (obj) {
      const feeValues = obj.toArray()[idx as i32].toString().split(",");

      const swapFeeRate = BigDecimal.fromString(feeValues[INT_ZERO]);
      const minFee = BigDecimal.fromString(feeValues[INT_ONE]);
      const maxFee = BigDecimal.fromString(feeValues[INT_TWO]);

      let fee = bigIntToBigDecimal(amount, token.decimals).times(
        swapFeeRate.div(BIGDECIMAL_HUNDRED)
      );
      if (fee.lt(minFee)) {
        fee = minFee;
      } else if (fee.gt(maxFee)) {
        fee = maxFee;
      }

      feeUSD = fee.times(token.lastPriceUSD!);
    } else {
      log.warning("[getBridgeFeeUSD] No fee details for key: {}", [key]);
    }

    return feeUSD;
  }
}
