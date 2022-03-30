import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateDeposit } from "../entities/Transaction";
import { getPriceOfStakedTokens, getUsdPriceOfToken } from "./price";

export function deposit(call: ethereum.Call, vault: Vault, amount: BigInt): void {
  let deposit = getOrCreateDeposit(call.transaction.hash, call.transaction.index);

  let totalSupply = vault.outputTokenSupply;
  let balance = vault.inputTokenBalances[0];

  let shares = totalSupply.isZero() ? amount : amount.times(totalSupply).div(balance);

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUsdPriceOfToken(inputTokenAddress);

  vault.totalValueLockedUSD = inputTokenPrice
    .times(vault.inputTokenBalances[0].toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(
    inputTokenPrice.times(amount.toBigDecimal()).div(inputTokenDecimals.toBigDecimal()),
  );

  vault.outputTokenPriceUSD = getPriceOfStakedTokens(
    Address.fromString(vault.id),
    inputTokenAddress,
    inputTokenDecimals,
  ).toBigDecimal();

  vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(amount)];
  vault.outputTokenSupply = vault.outputTokenSupply.plus(shares);

  // updating deposit entity
  deposit.asset = vault.inputTokens[0];
  deposit.amount = amount;
  deposit.amountUSD = inputTokenPrice.times(amount.toBigDecimal()).div(inputTokenDecimals.toBigDecimal());

  vault.save();
  deposit.save();
}
