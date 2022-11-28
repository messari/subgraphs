import {
  json,
  log,
  BigDecimal,
  BigInt,
  Address,
} from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import { Token } from "../../../../../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  CrosschainTokenType,
  ZERO_ADDRESS,
} from "../../../../../src/common/constants";
import { bigIntToBigDecimal } from "../../../../../src/common/utils/numbers";
import { TokenlistAPIResponse } from "./tokenlist-v4";

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
  getCrosschainTokenAddress(token: Token, crosschainID: string): Address {
    let crosschainToken = ZERO_ADDRESS;

    const key = token.id.toLowerCase().concat(":").concat(crosschainID);
    const obj = json.fromString(TokenlistAPIResponse).toObject().get(key);

    if (obj) {
      crosschainToken = obj.toArray()[0].toString();
    } else {
      log.warning(
        "[getCrosschainTokenAddress] No crosschainTokenAddress for key: {}",
        [key]
      );
    }

    return Address.fromString(crosschainToken);
  }
  getCrosschainTokenType(token: Token, crosschainID: string): string {
    let crosschainTokenType = CrosschainTokenType.WRAPPED;

    const key = token.id.toLowerCase().concat(":").concat(crosschainID);
    const obj = json.fromString(TokenlistAPIResponse).toObject().get(key);

    if (obj) {
      crosschainTokenType = obj.toArray()[1].toString();
    } else {
      log.warning(
        "[getCrosschainTokenType] No crosschainTokenType for key: {}",
        [key]
      );
    }

    return crosschainTokenType;
  }
  getBridgeFeeUSD(
    amount: BigInt,
    token: Token,
    crosschainID: string
  ): BigDecimal {
    let feeUSD = BIGDECIMAL_ZERO;

    const key = token.id.toLowerCase().concat(":").concat(crosschainID);
    const obj = json.fromString(TokenlistAPIResponse).toObject().get(key);

    if (obj) {
      const feeValues = obj.toArray()[2].toString().split(",");

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
