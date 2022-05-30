import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { VaultV4 as VaultContract } from "../../generated/bimBTC/VaultV4";
import { Vault } from "../../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGINT_TEN,
  BIGINT_ZERO,
  VaultFeeType,
} from "../constant";
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
  let inputTokenPrice = getOrUpdateTokenPrice(vault, token, call.block);

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
    "[BADGER] withdraw -  vault {}  token {} tokenPrice {}  amount {} amountUSD {} inputTokenBalance {} outputTokenSupply {} txHash {}",
    [
      vaultAddress.toHex(),
      vault.inputToken,
      inputTokenPrice.toString(),
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

  updateAllMetrics(call, vault, false);

  const withdrawalFees = getFeePercentage(vault, VaultFeeType.WITHDRAWAL_FEE).div(
    BIGDECIMAL_HUNDRED,
  );
  const protocolSideWithdrawalAmount = withdrawAmount.toBigDecimal().times(withdrawalFees);
  const protocolSideWithdrawalAmountUSD = protocolSideWithdrawalAmount
    .div(tokenDecimals)
    .times(inputTokenPrice);

  const supplySideWithdrawalAmount = withdrawAmount
    .toBigDecimal()
    .times(BIGDECIMAL_ONE.minus(withdrawalFees));
  const supplySideWithdrawalAmountUSD = supplySideWithdrawalAmount
    .div(tokenDecimals)
    .times(inputTokenPrice);

  const totalRevenueUSD = supplySideWithdrawalAmountUSD.plus(protocolSideWithdrawalAmountUSD);

  updateFinancialsAfterWithdrawal(
    call.block,
    protocolSideWithdrawalAmountUSD,
    supplySideWithdrawalAmountUSD,
    totalRevenueUSD,
  );
}

export function updateFinancialsAfterWithdrawal(
  block: ethereum.Block,
  protocolSideRevenueUSD: BigDecimal,
  supplySideRevenueUSD: BigDecimal,
  totalRevenueUSD: BigDecimal,
): void {
  const financialMetrics = getOrCreateFinancialsDailySnapshot(block);
  const protocol = getOrCreateProtocol();

  // TotalRevenueUSD Metrics
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    totalRevenueUSD,
  );
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(totalRevenueUSD);
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

  // ProtocolSideRevenueUSD Metrics
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD,
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD,
  );
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;

  // SupplySideRevenueUSD Metrics
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD,
  );
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD,
  );
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;

  financialMetrics.save();
  protocol.save();
}
