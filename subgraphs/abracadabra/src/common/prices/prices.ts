import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { _TokenPricesUsd } from "../../../generated/schema";
import { PriceOracle } from "../../../generated/templates/priceOracle/PriceOracle";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, BIGDECIMAL_ONE, MIM, MIM_PRICE_ORACLE } from "../../common/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

const MIM_PRICE_ORACLE_START_BLOCK = BigInt.fromI32(13455009);

export function getOrCreateTokenPriceEntity(tokenAddress: string): _TokenPricesUsd {
  let tokenPriceEntity = _TokenPricesUsd.load(tokenAddress);
  if (tokenPriceEntity) {
    return tokenPriceEntity;
  }
  tokenPriceEntity = new _TokenPricesUsd(tokenAddress);
  tokenPriceEntity.priceUSD = BIGDECIMAL_ZERO;
  tokenPriceEntity.timestamp = BIGINT_ZERO;
  tokenPriceEntity.blockNumber = BIGINT_ZERO;
  tokenPriceEntity.save();
  return tokenPriceEntity;
}

export function updateTokenPrice(tokenAddress: string, priceUSD: BigDecimal, event: ethereum.Event): void {
  let tokenPriceEntity = getOrCreateTokenPriceEntity(tokenAddress);
  tokenPriceEntity.priceUSD = priceUSD;
  tokenPriceEntity.blockNumber = event.block.number;
  tokenPriceEntity.timestamp = event.block.timestamp;
  tokenPriceEntity.save();
}

///////////////////////////
///// MIM Price Oracle /////
///////////////////////////

export function fetchMimPriceUSD(event: ethereum.Event): BigDecimal {
  if (event.block.number < MIM_PRICE_ORACLE_START_BLOCK) {
    return BIGDECIMAL_ONE;
  }
  let mimPriceOracle = PriceOracle.bind(Address.fromString(MIM_PRICE_ORACLE));
  let priceUSD = bigIntToBigDecimal(mimPriceOracle.latestAnswer(), 8);
  updateTokenPrice(MIM, priceUSD, event);
  return priceUSD;
}
