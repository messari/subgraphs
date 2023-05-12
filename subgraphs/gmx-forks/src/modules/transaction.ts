import {
  getOrCreateAccount,
  getOrCreatePool,
  initializeSDK,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";

export function transaction(
  event: ethereum.Event,
  accountAddress: Address,
  tokenAddress: Address,
  vaultTVL: BigInt,
  outputTokenSupply: BigInt,
  mintAmount: BigInt,
  transactionType: TransactionType,
  amount: BigInt = constants.BIGINT_ZERO
): void {
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(sdk);
  const account = getOrCreateAccount(accountAddress, pool, sdk);
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);

  if (transactionType === TransactionType.DEPOSIT) {
    utils.checkAndUpdateInputTokens(pool, token, amount);
  }
  if (transactionType === TransactionType.WITHDRAW) {
    utils.checkAndUpdateInputTokens(pool, token);
  }

  const poolInputTokens = pool.getInputTokens();
  const idx = pool.getInputTokens().indexOf(token.id);
  const amountsArray = new Array<BigInt>(poolInputTokens.length).fill(
    constants.BIGINT_ZERO
  );
  amountsArray[idx] = amount;
  pool.setTotalValueLocked(
    utils.bigIntToBigDecimal(vaultTVL, constants.DEFAULT_DECIMALS)
  );
  pool.setOutputTokenSupply(outputTokenSupply);
  pool.setStakedOutputTokenAmount(outputTokenSupply);

  if (transactionType === TransactionType.DEPOSIT) {
    account.deposit(pool, amountsArray, mintAmount, true);
  }
  if (transactionType === TransactionType.WITHDRAW) {
    account.withdraw(pool, amountsArray, mintAmount, true);
  }
}
