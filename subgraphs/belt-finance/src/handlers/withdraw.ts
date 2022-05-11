import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Vault as VaultContract, Withdraw as WithdrawEvent } from "../../generated/beltBTC/Vault";
import { Vault } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, BIGINT_ZERO, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getFeePercentage } from "../entities/Strategy";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateWithdraw } from "../entities/Transaction";
import { updateVaultFees } from "../entities/Vault";
import { readValue } from "../utils/contracts";
import { updateAllMetrics } from "./common";
import { getUSDPriceOfOutputToken, getUSDPriceOfToken } from "./price";

export function withdraw(event: WithdrawEvent, vault: Vault): void {
  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let withdraw = getOrCreateWithdraw(hash, index, event.block);

  let withdrawAmount = event.params.withdrawAmount;

  let vaultContract = VaultContract.bind(Address.fromString(vault.id));
  let inputTokenBalance = readValue<BigInt>(vaultContract.try_calcPoolValueInToken(), BIGINT_ZERO);

  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUSDPriceOfToken(inputToken);

  inputToken.lastPriceUSD = inputTokenPrice;
  inputToken.lastPriceBlockNumber = event.block.number;
  inputToken.save();

  let amountUSD = inputTokenPrice.times(withdrawAmount.toBigDecimal().div(inputTokenDecimals.toBigDecimal()));

  let pricePerShare = readValue<BigInt>(vaultContract.try_getPricePerFullShare(), BIGINT_ZERO);

  vault.pricePerShare = pricePerShare.toBigDecimal();
  vault.outputTokenSupply = readValue<BigInt>(vaultContract.try_totalSupply(), BIGINT_ZERO);
  vault.inputTokenBalance = inputTokenBalance;
  vault.totalValueLockedUSD = inputTokenPrice.times(
    inputTokenBalance.toBigDecimal().div(inputTokenDecimals.toBigDecimal()),
  );
  vault.outputTokenPriceUSD = getUSDPriceOfOutputToken(vault, inputToken);
  vault.save();

  updateVaultFees(vault, event.params.strategyAddress);

  // updating withdraw entity
  withdraw.from = event.transaction.from.toHex();
  withdraw.to = vault.id;
  withdraw.asset = inputToken.id;
  withdraw.amount = withdrawAmount;
  withdraw.amountUSD = amountUSD;
  withdraw.vault = vault.id;
  withdraw.save();

  // updating metrics
  updateRevenue(event, vault, event.params.strategyAddress, amountUSD);
  updateAllMetrics(event, vault, false);
}

function updateRevenue(event: ethereum.Event, vault: Vault, strategyAddress: Address, amountUSD: BigDecimal): void {
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event.block);
  let protocol = getOrCreateProtocol();

  let withdrawFeePercentage = getFeePercentage(vault, strategyAddress.toHex(), VaultFeeType.WITHDRAWAL_FEE);
  let depositFeePercentage = getFeePercentage(vault, strategyAddress.toHex(), VaultFeeType.DEPOSIT_FEE);

  let withdrawFeesUSD = amountUSD.times(withdrawFeePercentage.div(BIGDECIMAL_HUNDRED));
  let depositFeesUSD = amountUSD.times(depositFeePercentage.div(BIGDECIMAL_HUNDRED));

  let protocolSideRevenueUSD = withdrawFeesUSD;
  let supplySideRevenueUSD = amountUSD.minus(withdrawFeesUSD.plus(depositFeesUSD));
  let totalRevenue = amountUSD.times(withdrawFeePercentage);

  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSD);
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(totalRevenue);
  protocol.save();

  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD,
  );
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(supplySideRevenueUSD);
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(totalRevenue);
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.save();
}
