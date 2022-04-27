import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { VaultV4 as VaultContract } from "../../generated/bveCVX/VaultV4";
import { Vault } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, BIGINT_TEN, BIGINT_ZERO, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateWithdraw } from "../entities/Transaction";
import { getFeePercentage, getPricePerShare } from "../entities/Vault";
import { readValue } from "../utils/contracts";
import { updateAllMetrics } from "./common";
import { getOrUpdateTokenPrice, getPriceOfStakeToken } from "./price";

export function withdraw(call: ethereum.Call, vault: Vault, shares: BigInt | null): void {
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let vaultAddress = Address.fromString(vault.id);
  let vaultContract = VaultContract.bind(vaultAddress);

  let prevOutputTokenSupply = vault.outputTokenSupply;
  let currOutputTokenSupply = readValue<BigInt>(vaultContract.try_totalSupply(), BIGINT_ZERO);
  let withdrawAmount = prevOutputTokenSupply.minus(currOutputTokenSupply);
  let inputTokenBalance = readValue<BigInt>(vaultContract.try_balance(), BIGINT_ZERO);

  let pricePerShare = getPricePerShare(vaultAddress);
  let token = getOrCreateToken(inputTokenAddress);
  let inputTokenPrice = getOrUpdateTokenPrice(token, call.block);

  let tokenDecimals = BIGINT_TEN.pow(token.decimals as u8).toBigDecimal();
  let amountUSD = inputTokenPrice.times(withdrawAmount.toBigDecimal().div(tokenDecimals));

  vault.pricePerShare = pricePerShare.toBigDecimal();
  vault.inputTokenBalance = inputTokenBalance;
  vault.totalValueLockedUSD = inputTokenPrice.times(
    inputTokenBalance.toBigDecimal().div(tokenDecimals),
  );
  vault.outputTokenSupply = currOutputTokenSupply;
  vault.outputTokenPriceUSD = getPriceOfStakeToken(inputTokenPrice, pricePerShare);
  vault.save();

  log.warning(
    "[BADGER] withdraw -  vault {}  token {}  amount {} amountUSD {} inputTokenBalance {} outputTokenSupply {} txHash {}",
    [
      vaultAddress.toHex(),
      vault.inputToken,
      withdrawAmount.toString(),
      amountUSD.toString(),
      vault.inputTokenBalance.toString(),
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
  withdraw.asset = vault.inputToken;
  withdraw.save();

  updateRevenue(call, vault, amountUSD);
  updateAllMetrics(call, vault, false);
}

function updateRevenue(call: ethereum.Call, vault: Vault, amountUSD: BigDecimal): void {
  let withdrawFee = getFeePercentage(vault, VaultFeeType.WITHDRAWAL_FEE);
  let withdrawFeeAmount = amountUSD.times(withdrawFee.div(BIGDECIMAL_HUNDRED));

  let performanceFee = getFeePercentage(vault, VaultFeeType.PERFORMANCE_FEE);
  let performanceFeeAmount = amountUSD.times(performanceFee.div(BIGDECIMAL_HUNDRED));

  let amountAfterPerformance = amountUSD.times(
    BigDecimal.fromString("1").minus(performanceFee.div(BIGDECIMAL_HUNDRED)),
  );

  let protocol = getOrCreateProtocol();
  let financial = getOrCreateFinancialsDailySnapshot(call.block);

  let protocolSideRevenue = withdrawFeeAmount.plus(performanceFeeAmount);
  let supplySideRevenue = amountAfterPerformance.minus(withdrawFeeAmount);
  let totalRevenue = amountUSD.times(withdrawFee);

  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenue,
  );
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenue,
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(totalRevenue);
  protocol.save();

  financial.dailyProtocolSideRevenueUSD = financial.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenue,
  );
  financial.dailySupplySideRevenueUSD = financial.dailySupplySideRevenueUSD.plus(supplySideRevenue);
  financial.dailyTotalRevenueUSD = financial.dailyTotalRevenueUSD.plus(totalRevenue);
  financial.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financial.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financial.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financial.blockNumber = call.block.number;
  financial.timestamp = call.block.timestamp;
  financial.save();
}
