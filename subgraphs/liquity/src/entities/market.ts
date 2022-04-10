import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Market, MarketDailySnapshot } from "../../generated/schema";
import {
  ACTIVE_POOL,
  ACTIVE_POOL_CREATED_BLOCK,
  ACTIVE_POOL_CREATED_TIMESTAMP,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  LIQUIDATION_FEE,
  MAXIMUM_LTV,
  SECONDS_PER_DAY,
} from "../utils/constants";
import { getCurrentETHPrice } from "./price";
import { getOrCreateLiquityProtocol, updateUSDLocked } from "./protocol";
import { getETHToken, getLUSDToken } from "./token";
import { bigIntToBigDecimal } from "../utils/numbers";

export function getOrCreateMarket(): Market {
  let market = Market.load(ACTIVE_POOL);
  if (!market) {
    market = new Market(ACTIVE_POOL);
    market.protocol = getOrCreateLiquityProtocol().id;
    market.inputTokens = [getETHToken().id];
    market.outputToken = getLUSDToken().id;
    market.outputTokenPriceUSD = BIGDECIMAL_ONE;
    market.createdTimestamp = ACTIVE_POOL_CREATED_TIMESTAMP;
    market.createdBlockNumber = ACTIVE_POOL_CREATED_BLOCK;
    market.name = "Liquity";
    market.isActive = true;
    market.canUseAsCollateral = true;
    market.canBorrowFrom = true;
    market.maximumLTV = MAXIMUM_LTV;
    market.liquidationThreshold = MAXIMUM_LTV;
    market.liquidationPenalty = LIQUIDATION_FEE;
    market.depositRate = BIGDECIMAL_ZERO;
    market.stableBorrowRate = BIGDECIMAL_ZERO;
    market.variableBorrowRate = BIGDECIMAL_ZERO;
    market.save();
  }
  return market;
}

export function createMarketSnapshot(
  event: ethereum.Event,
  market: Market
): void {
  const days: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = `${market.id}-${days}`;
  const marketSnapshot = new MarketDailySnapshot(id);
  marketSnapshot.protocol = market.protocol;
  marketSnapshot.market = market.id;
  marketSnapshot.totalValueLockedUSD = market.totalValueLockedUSD;
  marketSnapshot.inputTokenBalances = market.inputTokenBalances;
  marketSnapshot.inputTokenPricesUSD = [getCurrentETHPrice()];
  marketSnapshot.outputTokenSupply = market.outputTokenSupply;
  marketSnapshot.outputTokenPriceUSD = market.outputTokenPriceUSD;

  marketSnapshot.blockNumber = event.block.number;
  marketSnapshot.timestamp = event.block.timestamp;
  marketSnapshot.save();
}

export function setMarketLUSDDebt(
  event: ethereum.Event,
  debtLUSD: BigInt
): void {
  const debtUSD = bigIntToBigDecimal(debtLUSD);
  const market = getOrCreateMarket();
  market.totalVolumeUSD = debtUSD;
  market.outputTokenSupply = debtLUSD;
  market.save();
  createMarketSnapshot(event, market);
}

export function setMarketETHBalance(
  event: ethereum.Event,
  balanceETH: BigInt
): void {
  const balanceUSD = bigIntToBigDecimal(balanceETH).times(getCurrentETHPrice());
  const market = getOrCreateMarket();
  market.totalValueLockedUSD = balanceUSD;
  market.inputTokenBalances = [balanceETH];
  market.save();
  createMarketSnapshot(event, market);
  updateUSDLocked(event, balanceUSD);
}
