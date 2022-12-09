import { BigInt, log, BigDecimal } from "@graphprotocol/graph-ts";

import { getOrCreateToken } from "../helpers/token";
import { BD_ZERO } from "../utils/const";
import { EventData } from "../utils/type";

export function handleOracleCall(event: EventData): void {
  const data = event.data;
  const receipt = event.receipt;

  const eventArgsArr = data.get("data");
  const eventArgs = eventArgsArr!.toObject();
  const prices = eventArgs.get("prices");

  const pricesArr = prices!.toArray();

  for (let i = 0; i < pricesArr.length; i++) {
    /* -------------------------------------------------------------------------- */
    /*                                  Asset ID                                  */
    /* -------------------------------------------------------------------------- */
    const price = pricesArr[i].toObject();
    const tokenId = price.get("asset_id");

    /* -------------------------------------------------------------------------- */
    /*                                    Price                                   */
    /* -------------------------------------------------------------------------- */
    const priceObj = price.get("price");

    if (!priceObj!.isNull()) {
      /* -------------------------------------------------------------------------- */
      /*                                 Multiplier                                 */
      /* -------------------------------------------------------------------------- */
      const multiplier = priceObj!.toObject().get("multiplier");
      const decimals = priceObj!.toObject().get("decimals");

      const token = getOrCreateToken(tokenId!.toString());
      const decimalFactor = decimals!.toI64() - token.decimals;

      token.lastPriceUSD = BigDecimal.fromString(multiplier!.toString()).div(
        BigInt.fromI32(10)
          .pow(decimalFactor as u8)
          .toBigDecimal()
      );

      token.lastPriceBlockNumber = BigInt.fromString(
        receipt.block.header.height.toString()
      );

      if (token.lastPriceUSD!.gt(BD_ZERO)) {
        token.save();
      } else {
        log.warning(
          "ORACLE::Token reported price is zero {} :: multiplier {} :: decimals {}",
          [token.id, multiplier!.toString(), decimals!.toString()]
        );
      }
    }
  }
}
