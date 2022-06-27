import {
  getOrCreateMarket,
  getProtocolIdFromCtx,
  getOrCreateLendingProtocol,
  getOrCreateMarketDailySnapshot,
} from "./initializers";
import * as constants from "../common/constants";
import { Market, Token } from "../../generated/schema";
import { AToken } from "../../generated/templates/AToken/AToken";
import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function rayToWad(a: BigInt): BigInt {
  const halfRatio = BigInt.fromI32(10)
    .pow(9)
    .div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(BigInt.fromI32(10).pow(9));
}

export function wadToRay(a: BigInt): BigInt {
  const result = a.times(BigInt.fromI32(10).pow(9));
  return result;
}

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = 18
): BigDecimal {
  return quantity.divDecimal(
    BigInt.fromI32(10)
      .pow(decimals as u8)
      .toBigDecimal()
  );
}

export function updateTVL(
  market: Market,
  token: Token,
  amountInTokens: BigInt,
  toSubtract: bool
): void {
  const protocolId = getProtocolIdFromCtx();
  const protocol = getOrCreateLendingProtocol(protocolId);

  // Update the total value locked in a market and the
  // protocol overall after transactions
  let newMarketTVL = market.inputTokenBalance;
  if (toSubtract) {
    newMarketTVL = newMarketTVL.minus(amountInTokens);
  } else {
    newMarketTVL = newMarketTVL.plus(amountInTokens);
  }

  // Subtract the PREVIOUSLY ADDED totalValueLockedUSD of the market from the protocol TVL
  // Subtracting the most recently added TVL of the market ensures that the correct
  // proportion of this market is deducted before adding the new market TVL to the protocol
  // Otherwise, the difference in asset USD/ETH price  since saving would deduct the incorrect
  // proportion from the protocol TVL
  
  market.totalDepositBalanceUSD = market.totalValueLockedUSD;

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    market.totalValueLockedUSD
  );

  market.totalValueLockedUSD = market.inputTokenPriceUSD.times(
    newMarketTVL
      .toBigDecimal()
      .div(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
  );
  market.totalDepositBalanceUSD = market.totalValueLockedUSD;
  market.save();

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    market.totalValueLockedUSD
  );
  protocol.totalDepositBalanceUSD = protocol.totalValueLockedUSD;

  protocol.save();
}

export function updateOutputTokenSupply(event: ethereum.Event): void {
  const outputTokenAddr = event.address;
  const aTokenContract = AToken.bind(outputTokenAddr);
  const tokenSupply = readValue<BigInt>(
    aTokenContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  if (tokenSupply.equals(constants.BIGINT_ZERO)) {
    return;
  }

  let marketAddress = aTokenContract.UNDERLYING_ASSET_ADDRESS();
  const market = getOrCreateMarket(event, marketAddress.toHexString());
  market.outputTokenSupply = tokenSupply;
  market.save();

  // This funcion only gets called from mint/burn events which only happen following deposits and withdraws which update the market snapshot
  // Calling the getMarketDailySnapshot function seems to cause some sort of overflow error, so only the outputTokenSupply field needs to be set
  const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market);
  marketDailySnapshot.outputTokenSupply = market.outputTokenSupply;
  marketDailySnapshot.save();
}
