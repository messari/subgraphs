import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { BIGINT_HUNDRED, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateWithdraw } from "../entities/Transaction";
import { getDay } from "../utils/numbers";
import { getFeePercentange } from "./common";
import { getUsdPriceOfToken } from "./price";

export function withdraw(call: ethereum.Call, vault: Vault, shares: BigInt): void {
  let withdraw = getOrCreateWithdraw(call.transaction.hash, call.transaction.index);

  let totalSupply = vault.outputTokenSupply;
  let balance = vault.inputTokenBalances[0];

  let amount = balance.times(shares).div(totalSupply);

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUsdPriceOfToken(inputTokenAddress);

  vault.totalValueLockedUSD = inputTokenPrice
    .times(vault.inputTokenBalances[0].toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  vault.inputTokenBalances = [vault.inputTokenBalances[0].minus(amount)];
  vault.outputTokenSupply = vault.outputTokenSupply.minus(shares);

  let financialMetrics = getOrCreateFinancialsDailySnapshot(getDay(call.block.timestamp));
  let feePercentage = getFeePercentange(vault, VaultFeeType.WITHDRAWAL_FEE);

  financialMetrics.feesUSD = financialMetrics.feesUSD.plus(
    inputTokenPrice
      .times(amount.toBigDecimal())
      .times(feePercentage.times(BigDecimal.fromString("10")))
      .div(BIGINT_HUNDRED.times(BigInt.fromI32(10)).toBigDecimal())
      .div(inputTokenDecimals.toBigDecimal()),
  );

  withdraw.asset = vault.inputTokens[0];
  withdraw.amount = amount;
  withdraw.amountUSD = inputTokenPrice.times(amount.toBigDecimal()).div(inputTokenDecimals.toBigDecimal());

  financialMetrics.save();
  vault.save();
  withdraw.save();
}
