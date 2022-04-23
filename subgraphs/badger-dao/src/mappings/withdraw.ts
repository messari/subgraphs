import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { VaultV4 as VaultContract } from "../../generated/bveCVX/VaultV4";
import { Vault } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, BIGINT_TEN, BIGINT_ZERO, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateWithdraw } from "../entities/Transaction";
import { getFeePercentage } from "../entities/Vault";
import { getUsdPricePerToken } from "../price";
import { readValue } from "../utils/contracts";
import { updateAllMetrics } from "./common";
import { getPriceOfStakeToken } from "./price";

export function withdraw(call: ethereum.Call, vault: Vault, shares: BigInt | null): void {
  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let vaultAddress = Address.fromString(vault.id);
  let vaultContract = VaultContract.bind(vaultAddress);

  let pool = vault.inputTokenBalances[0];
  let outputTokenSupply = vault.outputTokenSupply;

  let sharesBurnt = shares
    ? shares
    : readValue<BigInt>(vaultContract.try_balanceOf(call.transaction.from), BIGINT_ZERO);
  let withdrawAmount = pool.times(sharesBurnt).div(outputTokenSupply);

  let pricePerShare = readValue<BigInt>(vaultContract.try_getPricePerFullShare(), BIGINT_ZERO);
  let try_price = getUsdPricePerToken(inputTokenAddress);
  let inputTokenPrice = try_price.reverted
    ? try_price.usdPrice
    : try_price.usdPrice.div(try_price.decimals.toBigDecimal());

  let token = getOrCreateToken(inputTokenAddress);
  let tokenDecimals = BIGINT_TEN.pow(token.decimals as u8).toBigDecimal();
  let amountUSD = inputTokenPrice.times(withdrawAmount.toBigDecimal().div(tokenDecimals));

  vault.pricePerShare = pricePerShare;
  vault.inputTokenBalances = [vault.inputTokenBalances[0].minus(withdrawAmount)];
  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(amountUSD);
  vault.totalValueLockedUSD = inputTokenPrice.times(
    vault.inputTokenBalances[0].toBigDecimal().div(tokenDecimals),
  );
  vault.outputTokenSupply = readValue<BigInt>(vaultContract.try_totalSupply(), BIGINT_ZERO);
  vault.outputTokenPriceUSD = getPriceOfStakeToken(inputTokenPrice, pricePerShare);
  vault.save();

  log.warning(
    "[BADGER] withdraw -  vault {}  token {}  amount {} amountUSD {} shares {} inputTokenBalance {} outputTokenSupply {} txHash {}",
    [
      vaultAddress.toHex(),
      vault.inputTokens[0],
      withdrawAmount.toString(),
      amountUSD.toString(),
      sharesBurnt.toString(),
      vault.inputTokenBalances[0].toString(),
      vault.outputTokenSupply.toString(),
      call.transaction.hash.toHex(),
    ],
  );

  let withdraw = getOrCreateWithdraw(call);

  withdraw.amount = withdrawAmount;
  withdraw.amountUSD = amountUSD;
  withdraw.from = call.transaction.from.toHex();
  withdraw.to = vault.id;
  withdraw.vault = vault.id;
  withdraw.asset = vault.inputTokens[0];
  withdraw.save();

  updateRevenue(call, vault, amountUSD);
  updateAllMetrics(call, vault);
}

function updateRevenue(call: ethereum.Call, vault: Vault, amountUSD: BigDecimal): void {
  let metrics = getOrCreateFinancialsDailySnapshot(call.block);

  let withdrawFee = getFeePercentage(vault, VaultFeeType.WITHDRAWAL_FEE);
  let withdrawFeeAmount = amountUSD.times(withdrawFee.div(BIGDECIMAL_HUNDRED));

  let performanceFee = getFeePercentage(vault, VaultFeeType.PERFORMANCE_FEE);
  let performanceFeeAmount = amountUSD.times(performanceFee.div(BIGDECIMAL_HUNDRED));

  let amountAfterPerformance = amountUSD.times(
    BigDecimal.fromString("1").minus(performanceFee.div(BIGDECIMAL_HUNDRED)),
  );

  metrics.protocolSideRevenueUSD = metrics.protocolSideRevenueUSD.plus(
    withdrawFeeAmount.plus(performanceFeeAmount),
  );
  metrics.supplySideRevenueUSD = metrics.supplySideRevenueUSD.plus(
    amountAfterPerformance.minus(withdrawFeeAmount),
  );
  metrics.totalRevenueUSD = metrics.totalRevenueUSD.plus(amountUSD.times(withdrawFee));

  metrics.save();
}
