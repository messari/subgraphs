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
} from "../../../../../src/common/constants";
import { bigIntToBigDecimal } from "../../../../../src/common/utils/numbers";
import { BridgeAPIResponse, RouterAPIResponse } from "./api";

export class MultichainFantomConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FANTOM;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0xfA9dA51631268A30Ec3DDd1CcBf46c65FAD99251";
  }
  getChainID(): BigInt {
    return BigInt.fromI32(250);
  }
  getCrosschainID(tokenID: string): BigInt {
    let crosschainID = BIGINT_ZERO;

    const key = tokenID.toLowerCase();
    const obj = json.fromString(BridgeAPIResponse).toObject().get(key);

    if (obj) {
      crosschainID = BigInt.fromString(obj.toArray()[0].toString());
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

    if (!json.fromString(RouterAPIResponse).toObject().get(key)) {
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
      obj = json.fromString(BridgeAPIResponse).toObject().get(key);
      idx = 1;
    } else {
      key = tokenID.toLowerCase().concat(":").concat(crosschainID);
      obj = json.fromString(RouterAPIResponse).toObject().get(key);
      idx = 0;
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
      obj = json.fromString(BridgeAPIResponse).toObject().get(key);
      idx = 2;
    } else {
      key = token.id
        .toHexString()
        .toLowerCase()
        .concat(":")
        .concat(crosschainID);
      obj = json.fromString(RouterAPIResponse).toObject().get(key);
      idx = 1;
    }

    if (obj) {
      const feeValues = obj.toArray()[idx as i32].toString().split(",");

      const swapFeeRate = BigDecimal.fromString(feeValues[0]);
      const minFee = BigDecimal.fromString(feeValues[1]);
      const maxFee = BigDecimal.fromString(feeValues[2]);

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
