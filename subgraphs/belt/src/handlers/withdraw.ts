import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Withdraw as WithdrawEvent } from "../../generated/beltBTC/Vault";
import { Vault, VaultFee } from "../../generated/schema";
import { VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateWithdraw } from "../entities/Transaction";
import { getDay } from "../utils/numbers";
import { enumToPrefix } from "../utils/strings";
import { getUSDPriceOfToken } from "./price";

export function withdraw(event: WithdrawEvent, vault: Vault): void {
  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let withdraw = getOrCreateWithdraw(hash, index);

  let sharesBurnt = event.params.sharesBurnt;
  let strategyAddress = event.params.strategyAddress;
  let withdrawAmount = event.params.withdrawAmount;

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUSDPriceOfToken(inputToken);
  let inputTokenBalance = vault.inputTokenBalances[0];

  let amountUSD = inputTokenPrice.times(withdrawAmount.toBigDecimal()).div(inputTokenDecimals.toBigDecimal());

  vault.outputTokenSupply = vault.outputTokenSupply.minus(sharesBurnt);
  vault.inputTokenBalances = [inputTokenBalance.minus(withdrawAmount)];
  vault.totalValueLockedUSD = inputTokenPrice
    .times(inputTokenBalance.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  vault.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(getDay(event.block.timestamp));
  let feeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE)
    .concat(strategyAddress.toHex())
    .concat("-")
    .concat(vault.id);
  let vaultFee = VaultFee.load(feeId);

  if (vaultFee) {
    let feePercentage = vaultFee.feePercentage;

    financialMetrics.feesUSD = financialMetrics.feesUSD.plus(amountUSD.times(feePercentage));
    financialMetrics.save();
  }

  // updating withdraw entity
  withdraw.from = event.transaction.from.toHex();
  withdraw.to = vault.id;
  withdraw.asset = inputToken.id;
  withdraw.amount = withdrawAmount;
  withdraw.amountUSD = amountUSD;
  withdraw.vault = vault.id;
  withdraw.save();
}
