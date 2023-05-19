import {
  getOrCreateAccount,
  getOrCreatePool,
  initializeSDK,
} from "../common/initializers";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
export function swap(
  event: ethereum.Event,
  accountAddress: Address,
  tokenInAddress: Address,
  amountIn: BigInt,
  tokenOutAddress: Address,
  amountOut: BigInt
): void {
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(sdk);
  const account = getOrCreateAccount(accountAddress, pool, sdk);

  account.swap(
    pool,
    tokenInAddress,
    amountIn,
    tokenOutAddress,
    amountOut,
    Address.fromBytes(pool.getBytesID()),
    true
  );

  const tokenInFundingRate = utils.getFundingRate(tokenInAddress);
  const tokenOutFundingRate = utils.getFundingRate(tokenOutAddress);
  const tokenIn = sdk.Tokens.getOrCreateToken(tokenInAddress);
  const tokenOut = sdk.Tokens.getOrCreateToken(tokenOutAddress);

  utils.updateFundingRate(pool, tokenIn, tokenInFundingRate);
  utils.updateFundingRate(pool, tokenOut, tokenOutFundingRate);
}
