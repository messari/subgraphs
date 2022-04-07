import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Vault as VaultContract, Withdraw as WithdrawEvent } from "../../generated/beltBTC/Vault";
import { Vault } from "../../generated/schema";
import { BIGINT_ZERO, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getFeePercentage } from "../entities/Strategy";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateWithdraw } from "../entities/Transaction";
import { readValue } from "../utils/contracts";
import { getDay } from "../utils/numbers";
import { getUSDPriceOfToken } from "./price";

export function withdraw(event: WithdrawEvent, vault: Vault): void {
  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let withdraw = getOrCreateWithdraw(hash, index);

  let sharesBurnt = event.params.sharesBurnt;
  let withdrawAmount = event.params.withdrawAmount;

  let vaultContract = VaultContract.bind(Address.fromString(vault.id));
  let inputTokenBalance = readValue<BigInt>(vaultContract.try_calcPoolValueInToken(), BIGINT_ZERO);

  log.warning("[belt] withdraw - inputTokenBalance {}", [inputTokenBalance.toString()]);

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUSDPriceOfToken(inputToken);

  let amountUSD = inputTokenPrice.times(withdrawAmount.toBigDecimal().div(inputTokenDecimals.toBigDecimal()));

  vault.outputTokenSupply = vault.outputTokenSupply.minus(sharesBurnt);
  vault.inputTokenBalances = [inputTokenBalance];
  vault.totalValueLockedUSD = inputTokenPrice.times(
    inputTokenBalance.toBigDecimal().div(inputTokenDecimals.toBigDecimal()),
  );

  vault.save();

  let financialMetrics = getOrCreateFinancialsDailySnapshot(getDay(event.block.timestamp));
  let feePercentage = getFeePercentage(vault, VaultFeeType.WITHDRAWAL_FEE);

  financialMetrics.feesUSD = financialMetrics.feesUSD.plus(amountUSD.times(feePercentage));
  financialMetrics.save();

  // updating withdraw entity
  withdraw.from = event.transaction.from.toHex();
  withdraw.to = vault.id;
  withdraw.asset = inputToken.id;
  withdraw.amount = withdrawAmount;
  withdraw.amountUSD = amountUSD;
  withdraw.vault = vault.id;
  withdraw.save();
}
