import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Registry } from "../../generated/Factory/Registry";
import {
  Coin,
  DexAmmProtocol,
  LiquidityPool,
  Token,
} from "../../generated/schema";
import {
  DEFAULT_DECIMALS,
  FEE_DENOMINATOR,
  REGISTRY_ADDRESS,
  toDecimal,
} from "../utils/constant";
import { getOrCreateToken } from "../utils/tokens";
import { updateFinancials } from "./financials";
import { createSwap } from "./swap";

export function handleExchange(
  event: ethereum.Event,
  pool: LiquidityPool,
  protocol: DexAmmProtocol,
  sold_id: BigInt,
  token_sold: BigInt,
  bought_id: BigInt,
  token_bought: BigInt,
  buyer: Address
): void {
  let soldId = sold_id.toI32();
  let boughtId = bought_id.toI32();
  // Coin Sold
  let coinSold = Coin.load(pool.id + "-" + soldId.toString());
  if (coinSold !== null) {
    log.info("Success: Sold Coin {} was found. SoldId is {} valid", [
      coinSold.id,
      soldId.toString(),
    ]);

    // Token Sold
    let tokenSold = Token.load(coinSold.token);
    if (tokenSold !== null) {
      log.info("Success: Token Sold {} was found. Token Sold ID is {} valid", [
        tokenSold.id,
        coinSold.token,
      ]);

      // Coin Bought
      let coinBought = Coin.load(pool.id + "-" + boughtId.toString());
      if (coinBought !== null) {
        log.info("Success: Coin Bought {} was found. Bought ID is {} valid", [
          coinBought.id,
          boughtId.toString(),
        ]);

        // Token Bought
        let tokenBought = Token.load(coinBought.token);
        if (tokenBought !== null) {
          log.info("Success: Coin Bought {} was found. Bought ID is {} valid", [
            coinBought.id,
            boughtId.toString(),
          ]);

          // let amountSoldUSD = normalizedUsdcPrice(
          //   usdcPrice(tokenSold, token_sold)
          // );
          // let amountBoughtUSD = normalizedUsdcPrice(
          //   usdcPrice(tokenBought, token_bought)
          // );
          

          // Get swap fee
          // let registryContract = Registry.bind(Address.fromString(REGISTRY_ADDRESS));
          // let getFee = registryContract.try_get_fees(Address.fromString(pool.id));
          // let fee: BigInt[] = getFee.reverted ? [] : getFee.value;
          // let swapFee = token_bought.times(fee[0]).div(FEE_DENOMINATOR);
          // let fees: BigInt[] = [];
          // fees.push(swapFee);

          // Update totalVolumeUSD
          // let totalVolumeUSD = amountSoldUSD
          //   .plus(amountBoughtUSD)
          //   .div(toDecimal(BigInt.fromI32(2), DEFAULT_DECIMALS));
          // pool.totalVolumeUSD = pool.totalVolumeUSD.plus(totalVolumeUSD);
          // pool.save();

          // Update Swap
          createSwap(
            event,
            pool,
            protocol,
            tokenSold,
            toDecimal(token_sold, tokenSold.decimals),
            // amountSoldUSD,
            tokenBought,
            toDecimal(token_bought, tokenBought.decimals),
            // amountBoughtUSD,
            buyer
          );

          // Take FinancialsDailySnapshot
          updateFinancials(event, pool, protocol);
        }
        log.warning(
          "Error: Token Bought was not found. Coin Bought ID {} is not valid",
          [coinBought.token]
        );
      }
      log.warning(
        "Error: Coin Bought was not found. BoughtId {} is not valid",
        [boughtId.toString()]
      );
    }
    log.warning(
      "Error: Token Sold was not found. Token Sold ID {} is not valid",
      [coinSold.token]
    );
  }
  log.warning("Error: Sold Coin was not found. SoldId {} is not valid", [
    soldId.toString(),
  ]);
}

