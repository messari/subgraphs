import { updateTranche } from "./tranche";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { SDK } from "../sdk/protocols/perpfutures";
import { Pool } from "../sdk/protocols/perpfutures/pool";
import { getOrCreateAccount } from "../common/initializers";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";

export function transaction(
  accountAddress: Address,
  tokenAddress: Address,
  trancheAddress: Address,
  mintAmount: BigInt,
  transactionType: TransactionType,
  sdk: SDK,
  pool: Pool,
  amount: BigInt = constants.BIGINT_ZERO
): void {
  const account = getOrCreateAccount(accountAddress, pool, sdk);
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);
  if (!token._isWhitelisted) return;

  if (transactionType === TransactionType.DEPOSIT) {
    utils.checkAndUpdateInputTokens(pool, token, amount);
  }
  if (transactionType === TransactionType.WITHDRAW) {
    utils.checkAndUpdateInputTokens(pool, token);
  }

  const poolInputTokens = pool.getInputTokens();
  const idx = pool.getInputTokens().indexOf(token.id);
  const inputTokenBalances = pool.pool.inputTokenBalances;
  if (transactionType === TransactionType.DEPOSIT) {
    inputTokenBalances[idx] = inputTokenBalances[idx].plus(amount);
  }
  if (transactionType === TransactionType.WITHDRAW) {
    inputTokenBalances[idx] = inputTokenBalances[idx].minus(amount);
  }
  const amountsArray = new Array<BigInt>(poolInputTokens.length).fill(
    constants.BIGINT_ZERO
  );
  amountsArray[idx] = amount;
  pool.setInputTokenBalances(inputTokenBalances, true);

  if (transactionType === TransactionType.DEPOSIT) {
    account.deposit(pool, amountsArray, mintAmount, true);
  }
  if (transactionType === TransactionType.WITHDRAW) {
    account.withdraw(pool, amountsArray, mintAmount, true);
  }
  updateTranche(trancheAddress, transactionType, token, amount);
  pool.addTranche(Bytes.fromHexString(trancheAddress.toHexString()));
  const outputTokenSupply = utils.getOutputTokenSupply(pool);
  pool.setOutputTokenSupply(outputTokenSupply);
}
