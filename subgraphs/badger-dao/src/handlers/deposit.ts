import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Deposit, Vault } from "../../generated/schema";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateDeposit } from "../entities/Transaction";
import { getPriceOfStakedTokens, getUsdPriceOfToken } from "./price";

export function deposit(call: ethereum.Call, vault: Vault, amount: BigInt): void {
  let id = "deposit-"
    .concat(call.transaction.hash.toHex())
    .concat("-")
    .concat(call.transaction.index.toHex());
  let deposit = Deposit.load(id);

  if (deposit) {
    return;
  }

  deposit = getOrCreateDeposit(call.transaction.hash, call.transaction.index);

  let totalSupply = vault.outputTokenSupply;
  let balance = vault.inputTokenBalances[0];

  let shares = totalSupply.isZero() ? amount : amount.times(totalSupply).div(balance);

  log.warning("[BADGER] deposit - totalSupply {}, amount {}, balance {}, shares {}", [
    totalSupply.toString(),
    amount.toString(),
    balance.toString(),
    shares.toString(),
  ]);

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUsdPriceOfToken(inputTokenAddress);

  log.warning("[BADGER] deposit - tokenPrice {}, decimals {}", [
    inputTokenPrice.toString(),
    inputTokenDecimals.toString(),
  ]);

  vault.totalValueLockedUSD = inputTokenPrice.times(balance.toBigDecimal()).div(inputTokenDecimals.toBigDecimal());

  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(
    inputTokenPrice.times(amount.toBigDecimal()).div(inputTokenDecimals.toBigDecimal()),
  );

  vault.outputTokenPriceUSD = getPriceOfStakedTokens(
    Address.fromString(vault.id),
    inputTokenAddress,
    inputTokenDecimals,
  ).toBigDecimal();

  vault.inputTokenBalances = [balance.plus(amount)];
  vault.outputTokenSupply = vault.outputTokenSupply.plus(shares);

  // updating deposit entity
  deposit.from = call.transaction.from.toHex();
  deposit.to = call.to.toHex();
  deposit.asset = vault.inputTokens[0];
  deposit.amount = amount;
  deposit.amountUSD = inputTokenPrice.times(amount.toBigDecimal()).div(inputTokenDecimals.toBigDecimal());
  deposit.vault = vault.id;

  vault.save();
  deposit.save();
}
