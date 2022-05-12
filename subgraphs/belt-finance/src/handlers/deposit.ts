import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Deposit as DepositEvent, Vault as VaultContract } from "../../generated/beltBTC/Vault";
import { Vault } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, BIGINT_ZERO, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateProtocol } from "../entities/Protocol";
import { getFeePercentage } from "../entities/Strategy";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateDeposit } from "../entities/Transaction";
import { updateVaultFees } from "../entities/Vault";
import { readValue } from "../utils/contracts";
import { updateAllMetrics } from "./common";
import { getUSDPriceOfOutputToken, getUSDPriceOfToken } from "./price";

export function deposit(event: DepositEvent, vault: Vault): void {
  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let deposit = getOrCreateDeposit(hash, index, event.block);
  let depositAmount = event.params.depositAmount;

  let vaultContract = VaultContract.bind(Address.fromString(vault.id));
  let inputTokenBalance = readValue<BigInt>(vaultContract.try_calcPoolValueInToken(), BIGINT_ZERO);
  let pricePerShare = readValue<BigInt>(vaultContract.try_getPricePerFullShare(), BIGINT_ZERO);

  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUSDPriceOfToken(inputToken);

  inputToken.lastPriceUSD = inputTokenPrice;
  inputToken.lastPriceBlockNumber = event.block.number;
  inputToken.save();

  let amountUSD = inputTokenPrice.times(depositAmount.toBigDecimal().div(inputTokenDecimals.toBigDecimal()));

  vault.pricePerShare = pricePerShare.toBigDecimal();
  vault.outputTokenSupply = readValue<BigInt>(vaultContract.try_totalSupply(), BIGINT_ZERO);
  vault.inputTokenBalance = inputTokenBalance;
  vault.totalValueLockedUSD = inputTokenPrice.times(
    inputTokenBalance.toBigDecimal().div(inputTokenDecimals.toBigDecimal()),
  );
  vault.outputTokenPriceUSD = getUSDPriceOfOutputToken(vault, inputToken);
  vault.save();

  updateVaultFees(vault, event.params.strategyAddress);

  // updating deposit entity
  deposit.from = event.transaction.from.toHex();
  deposit.to = vault.id;
  deposit.asset = inputToken.id;
  deposit.amount = depositAmount;
  deposit.amountUSD = amountUSD;
  deposit.vault = vault.id;
  deposit.save();

  // updating the metrics
  updateRevenue(event, vault, event.params.strategyAddress, amountUSD);
  updateAllMetrics(event, vault, true);
}

function updateRevenue(event: ethereum.Event, vault: Vault, strategyAddress: Address, amountUSD: BigDecimal): void {
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event.block);
  let protocol = getOrCreateProtocol();
  let feePercentage = getFeePercentage(vault, strategyAddress.toHex(), VaultFeeType.DEPOSIT_FEE);

  let fees = amountUSD.times(feePercentage.div(BIGDECIMAL_HUNDRED));

  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(fees);
  protocol.save();

  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(fees);
  financialMetrics.save();
}
