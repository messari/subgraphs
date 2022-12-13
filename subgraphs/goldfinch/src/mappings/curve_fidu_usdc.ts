import { BigInt } from "@graphprotocol/graph-ts";
import { TokenExchange } from "../../generated/CurveFiduUSDC/CurveFiduUSDC";
import {
  createTransactionFromEvent,
  usdcWithFiduPrecision,
} from "../entities/helpers";
import { getOrInitUser } from "../entities/user";

export function handleTokenExchange(event: TokenExchange): void {
  const buyer = event.params.buyer;
  const boughtId = event.params.bought_id;
  const soldId = event.params.sold_id;
  const tokensSold = event.params.tokens_sold;
  const tokensBought = event.params.tokens_bought;
  getOrInitUser(buyer);

  // FIDU=0 USDC=1
  const curveFiduId = BigInt.fromI32(0);
  const boughtFidu = boughtId.equals(curveFiduId);

  const eventName = boughtFidu ? "CURVE_FIDU_BUY" : "CURVE_FIDU_SELL";

  const transaction = createTransactionFromEvent(event, eventName, buyer);
  transaction.category = eventName;
  transaction.sentAmount = tokensSold;
  transaction.sentToken = soldId.equals(curveFiduId) ? "FIDU" : "USDC";
  transaction.receivedAmount = tokensBought;
  transaction.receivedToken = boughtFidu ? "FIDU" : "USDC";

  // sell fidu buy usdc
  if (soldId.equals(curveFiduId)) {
    // usdc / fidu
    transaction.fiduPrice = usdcWithFiduPrecision(tokensBought).div(tokensSold);
  } else {
    transaction.fiduPrice = usdcWithFiduPrecision(tokensSold).div(tokensBought);
  }

  transaction.save();
}
