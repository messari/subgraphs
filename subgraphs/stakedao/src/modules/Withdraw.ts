import {
  Vault as VaultStore,
  Withdraw as WithdrawTransaction,
} from "../../generated/schema";

import * as utils from "../common/utils";
import { getPriceOfCurveLpToken } from "./Price";
import * as constants from "../common/constants";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function _Withdraw(
  vault: VaultStore,
  _sharesBurnt: BigInt
): Array<BigInt> {
  let _totalSupply = BigInt.fromString(vault.outputTokenSupply.toString());
  let _balance = BigInt.fromString(vault.inputTokenBalances[0].toString());

  let _withdrawAmount = _balance.times(_sharesBurnt).div(_totalSupply);

  vault.outputTokenSupply = vault.outputTokenSupply.minus(_sharesBurnt);
  vault.inputTokenBalances = [
    vault.inputTokenBalances[0].minus(_withdrawAmount),
  ];

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  const amountUSD = utils.normalizedUsdcPrice(
    getPriceOfCurveLpToken(
      inputTokenAddress,
      _withdrawAmount,
      constants.DEFAULT_DECIMALS_BIGINT
    )
  );

  vault.totalValueLockedUSD = utils.normalizedUsdcPrice(
    getPriceOfCurveLpToken(
      inputTokenAddress,
      BigInt.fromString(vault.inputTokenBalances[0].toString()),
      constants.DEFAULT_DECIMALS_BIGINT
    )
  ).toBigDecimal();

  vault.save();

  return [_withdrawAmount, amountUSD];
}

export function createWithdrawTransaction(
  call: ethereum.Call,
  _amount: BigInt,
  _amountUSD: BigDecimal
): WithdrawTransaction {
  let tx = call.transaction;
  let id = "withdraw-" + tx.hash.toHexString();
  let transaction = WithdrawTransaction.load(id);
  if (transaction == null) {
    transaction = new WithdrawTransaction(id);
    transaction.logIndex = tx.index.toI32();
    transaction.to = call.to.toHexString();
    transaction.from = tx.from.toHexString();
    transaction.hash = tx.hash.toHexString();
    transaction.timestamp = utils.getTimestampInMillis(call.block);
    transaction.blockNumber = call.block.number;
    transaction.protocol = constants.ETHEREUM_PROTOCOL_ID;
    transaction.vault = call.to.toHexString();

    const vault = VaultStore.load(call.to.toHexString());
    if (vault) {
      transaction.asset = vault.inputTokens[0];
    }
    transaction.amount = _amount;
    transaction.amountUSD = _amountUSD;
    transaction.save();
  }
  return transaction;
}
