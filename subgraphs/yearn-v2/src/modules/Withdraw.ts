import {
  Token,
  Vault as VaultStore,
  Withdraw as WithdrawTransaction,
} from "../../generated/schema";

import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { getUsdPricePerToken } from "../Prices";


export function createWithdrawTransaction(
  id: string,
  call: ethereum.Call
): WithdrawTransaction {
  let transaction = new WithdrawTransaction(id);
  transaction.logIndex = call.transaction.index.toI32();
  transaction.to = call.to.toHexString();
  transaction.from = call.transaction.from.toHexString();
  transaction.hash = call.transaction.hash.toHexString();
  transaction.timestamp = utils.getTimestampInMillis(call.block);
  transaction.blockNumber = call.block.number;
  transaction.protocol = constants.ETHEREUM_PROTOCOL_ID;
  transaction.vault = call.to.toHexString();

  return transaction;
}

export function _Withdraw(
  call: ethereum.Call,
  vault: VaultStore,
  _withdrawAmount: BigInt,
  _sharesBurnt: BigInt
): void {
  let id = "withdraw-" + call.transaction.hash.toHexString();

  let transaction = WithdrawTransaction.load(id);
  if (transaction) {
    return;
  }

  transaction = createWithdrawTransaction(id, call);

  let inputToken = Token.load(vault.inputTokens[0]);
  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken!.decimals as u8);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);

  vault.totalValueLockedUSD = inputTokenPrice.usdPrice
    .times(vault.inputTokenBalances[0].toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());
  // vault.totalVolumeUSD remains same

  vault.inputTokenBalances = [
    vault.inputTokenBalances[0].minus(_withdrawAmount),
  ];
  vault.outputTokenSupply = vault.outputTokenSupply.minus(_sharesBurnt);

  // Update Financial Metrics FeesUSD
  let financialMetricsId: i64 =
    call.block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  const financialMetrics = utils.getOrCreateFinancialSnapshots(
    financialMetricsId.toString()
  );

  let feesPercentage = utils.getFeePercentage(
    vault.id,
    constants.VaultFeeType.WITHDRAWAL_FEE
  );
  financialMetrics.totalRevenueUSD = financialMetrics.totalRevenueUSD.plus(
    inputTokenPrice.usdPrice
      .times(_withdrawAmount.toBigDecimal())
      .times(feesPercentage.times(BigDecimal.fromString("10")))
      .div(constants.BIGINT_HUNDRED.times(BigInt.fromI32(10)).toBigDecimal())
      .div(inputTokenDecimals.toBigDecimal())
  );

  // update deposit transaction
  transaction.asset = vault.inputTokens[0];
  transaction.amount = _withdrawAmount;
  transaction.amountUSD = inputTokenPrice.usdPrice
    .times(_withdrawAmount.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  financialMetrics.save();
  transaction.save();
  vault.save();

  log.info(
    "[Withdrawn] TxHash: {}, vaultAddress: {}, _sharesBurnt: {}, _withdrawAmount: {}",
    [call.transaction.hash.toHexString(), vault.id, _sharesBurnt.toString(), _withdrawAmount.toString()]
  );
}

