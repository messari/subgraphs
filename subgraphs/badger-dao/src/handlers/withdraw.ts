import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Vault, Withdraw } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_HUNDRED, BIGINT_ZERO, VaultFeeType } from "../constant";
import { getOrCreateFinancialsDailySnapshot } from "../entities/Metrics";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateWithdraw } from "../entities/Transaction";
import { getDay } from "../utils/numbers";
import { getFeePercentange } from "./common";
import { getUsdPriceOfToken } from "./price";

export function withdraw(call: ethereum.Call, vault: Vault, shares: BigInt): void {
  let id = "withdraw-"
    .concat(call.transaction.hash.toHex())
    .concat("-")
    .concat(call.transaction.index.toHex());
  let withdraw = Withdraw.load(id);

  if (withdraw) {
    return;
  }

  withdraw = getOrCreateWithdraw(call.transaction.hash, call.transaction.index);

  let totalSupply = vault.outputTokenSupply;
  let balance = vault.inputTokenBalances[0];

  if (totalSupply <= BIGINT_ZERO) {
    return;
  }

  let amount = balance.times(shares).div(totalSupply);

  log.warning("[BADGER] withdraw - totalSupply {}, amount {}, balance {}, shares {}", [
    totalSupply.toString(),
    amount.toString(),
    balance.toString(),
    shares.toString(),
  ]);

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUsdPriceOfToken(inputTokenAddress);

  log.warning("[BADGER] withdraw - tokenPrice {}, decimals {}", [
    inputTokenPrice.toString(),
    inputTokenDecimals.toString(),
  ]);

  vault.totalValueLockedUSD = inputTokenPrice
    .times(vault.inputTokenBalances[0].toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  vault.inputTokenBalances = [vault.inputTokenBalances[0].minus(amount)];
  vault.outputTokenSupply = vault.outputTokenSupply.minus(shares);

  let financialMetrics = getOrCreateFinancialsDailySnapshot(getDay(call.block.timestamp));
  let feePercentage = getFeePercentange(vault, VaultFeeType.WITHDRAWAL_FEE);

  if (feePercentage != BIGDECIMAL_ZERO) {
    financialMetrics.feesUSD = financialMetrics.feesUSD.plus(
      inputTokenPrice
        .times(amount.toBigDecimal())
        .times(feePercentage.times(BigDecimal.fromString("10")))
        .div(BIGINT_HUNDRED.times(BigInt.fromI32(10)).toBigDecimal())
        .div(inputTokenDecimals.toBigDecimal()),
    );
  }

  withdraw.to = call.to.toHex();
  withdraw.from = call.transaction.from.toHex();
  withdraw.asset = vault.inputTokens[0];
  withdraw.amount = amount;
  withdraw.amountUSD = inputTokenPrice.times(amount.toBigDecimal()).div(inputTokenDecimals.toBigDecimal());
  withdraw.vault = vault.id;

  financialMetrics.save();
  vault.save();
  withdraw.save();
}
