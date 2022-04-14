import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Vault as VaultContract, Withdraw as WithdrawEvent } from "../../generated/beltBTC/Vault";
import { Vault } from "../../generated/schema";
import { BIGDECIMAL_HUNDRED, BIGINT_ZERO, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getFeePercentage } from "../entities/Strategy";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateWithdraw } from "../entities/Transaction";
import { updateVaultFees } from "../entities/Vault";
import { readValue } from "../utils/contracts";
import { updateAllMetrics } from "./common";
import { getUSDPriceOfToken } from "./price";

export function withdraw(event: WithdrawEvent, vault: Vault): void {
  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let withdraw = getOrCreateWithdraw(hash, index, event.block);

  let sharesBurnt = event.params.sharesBurnt;
  let withdrawAmount = event.params.withdrawAmount;

  let vaultContract = VaultContract.bind(Address.fromString(vault.id));
  let inputTokenBalance = readValue<BigInt>(vaultContract.try_calcPoolValueInToken(), BIGINT_ZERO);

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUSDPriceOfToken(inputToken);

  let amountUSD = inputTokenPrice.times(withdrawAmount.toBigDecimal().div(inputTokenDecimals.toBigDecimal()));

  vault.outputTokenSupply = readValue<BigInt>(vaultContract.try_totalSupply(), BIGINT_ZERO);
  vault.inputTokenBalances = [inputTokenBalance];
  vault.totalValueLockedUSD = inputTokenPrice.times(
    inputTokenBalance.toBigDecimal().div(inputTokenDecimals.toBigDecimal()),
  );

  vault.save();

  updateVaultFees(vault, event.params.strategyAddress);
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event.block);

  let strategyAddress = event.params.strategyAddress.toHex();
  let withdrawFeePercentage = getFeePercentage(vault, strategyAddress, VaultFeeType.WITHDRAWAL_FEE);
  let depositFeePercentage = getFeePercentage(vault, strategyAddress, VaultFeeType.DEPOSIT_FEE);

  let withdrawFeesUSD = amountUSD.times(withdrawFeePercentage.div(BIGDECIMAL_HUNDRED));
  let depositFeesUSD = amountUSD.times(depositFeePercentage.div(BIGDECIMAL_HUNDRED));

  // only adding withdraw fee as deposit fee is accounted for
  financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(withdrawFeesUSD);
  // total revenue - (sum of all fees)
  financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(
    amountUSD.minus(withdrawFeesUSD.plus(depositFeesUSD)),
  );
  financialMetrics.save();

  // updating withdraw entity
  withdraw.from = event.transaction.from.toHex();
  withdraw.to = vault.id;
  withdraw.asset = inputToken.id;
  withdraw.amount = withdrawAmount;
  withdraw.amountUSD = amountUSD;
  withdraw.vault = vault.id;
  withdraw.save();

  // updating metrics
  updateAllMetrics(event, vault);
}
