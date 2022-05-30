import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ChainLinkSolo } from "../../../generated/bimBTC/ChainLinkSolo";
import { BIGINT_ZERO, CHAINLINK_BADGER_USD } from "../../constant";
import { CustomPriceType } from "../common/types";
import { readValue } from "../common/utils";

export function getUsdPriceOfBadgerToken(tokenAddress: Address): CustomPriceType {
  let chainlinkContract = ChainLinkSolo.bind(CHAINLINK_BADGER_USD);
  let decimals = readValue<i32>(chainlinkContract.try_decimals(), BigInt.fromString("8").toI32());

  let price = readValue<BigInt>(chainlinkContract.try_latestAnswer(), BIGINT_ZERO);
  return CustomPriceType.initialize(price.toBigDecimal(), decimals);
}
