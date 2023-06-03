import * as utils from "../common/utils";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreatePool, initializeSDK } from "../common/initializers";

export function updatePoolAmount(
  amount: BigInt,
  isIncrease: bool,
  tokenAddress: Address,
  event: ethereum.Event
): void {
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(sdk);
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);
  utils.checkAndUpdateInputTokens(pool, token, amount);
  const inputTokens = pool.getInputTokens();
  const inputTokenIndex = inputTokens.indexOf(token.id);
  const inputTokenBalances = pool.pool.inputTokenBalances;
  if (isIncrease) {
    inputTokenBalances[inputTokenIndex] =
      inputTokenBalances[inputTokenIndex].plus(amount);
  } else {
    inputTokenBalances[inputTokenIndex] =
      inputTokenBalances[inputTokenIndex].minus(amount);
  }
  pool.setInputTokenBalances(inputTokenBalances, true);
}
