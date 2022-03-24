import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Registry } from "../../generated/Factory/Registry";
import { DexAmmProtocol, LiquidityPool } from "../../generated/schema";
import {
  DEFAULT_DECIMALS,
  FEE_DENOMINATOR,
  REGISTRY_ADDRESS,
  toDecimal,
} from "../utils/constant";
import { normalizedUsdcPrice, usdcPrice } from "../utils/pricing";
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
  let tokenSold = getOrCreateToken(
    Address.fromString(pool.inputTokens[soldId])
  );

  let boughtId = bought_id.toI32();
  let tokenBought = getOrCreateToken(
    Address.fromString(pool.inputTokens[boughtId])
  );

  let amountSoldUSD = normalizedUsdcPrice(usdcPrice(tokenSold, token_sold));
  let amountBoughtUSD = normalizedUsdcPrice(
    usdcPrice(tokenBought, token_bought)
  );

  // Get swap fee
  let registryContract = Registry.bind(Address.fromString(REGISTRY_ADDRESS));
  let getFee = registryContract.try_get_fees(Address.fromString(pool.id));
  let fee: BigInt[] = getFee.reverted ? [] : getFee.value;
  let swapFee = token_bought.times(fee[0]).div(FEE_DENOMINATOR);
  let fees: BigInt[] = [];
  fees.push(swapFee);

  // Update totalVolumeUSD
  let totalVolumeUSD = amountSoldUSD
    .plus(amountBoughtUSD)
    .div(toDecimal(BigInt.fromI32(2), DEFAULT_DECIMALS));
  pool.totalVolumeUSD = pool.totalVolumeUSD.plus(totalVolumeUSD);
  pool.save();

  // Update Swap
  createSwap(
    event,
    pool,
    protocol,
    tokenSold,
    toDecimal(token_sold, DEFAULT_DECIMALS),
    amountSoldUSD,
    tokenBought,
    toDecimal(token_bought, DEFAULT_DECIMALS),
    amountBoughtUSD,
    buyer
  );

  // Take FinancialsDailySnapshot
  updateFinancials(event, pool, protocol);
}
