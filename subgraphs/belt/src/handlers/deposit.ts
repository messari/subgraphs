import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Deposit as DepositEvent } from "../../generated/beltBTC/Vault";
import { Vault } from "../../generated/schema";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateDeposit } from "../entities/Transaction";
import { getUSDPriceOfOutputToken, getUSDPriceOfToken } from "./price";

export function deposit(event: DepositEvent, vault: Vault): void {
  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let deposit = getOrCreateDeposit(hash, index);

  let depositAmount = event.params.depositAmount;
  let sharesMinted = event.params.sharesMinted;

  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUSDPriceOfToken(inputToken);
  let inputTokenBalance = vault.inputTokenBalances[0];

  let amountUSD = inputTokenPrice.times(depositAmount.toBigDecimal()).div(inputTokenDecimals.toBigDecimal());

  vault.outputTokenSupply = vault.outputTokenSupply.plus(sharesMinted);
  vault.inputTokenBalances = [inputTokenBalance.plus(depositAmount)];
  vault.totalValueLockedUSD = inputTokenPrice
    .times(inputTokenBalance.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(amountUSD);
  vault.outputTokenPriceUSD = getUSDPriceOfOutputToken(vault, inputToken);
  vault.save();

  // updating deposit entity
  deposit.from = event.transaction.from.toHex();
  deposit.to = vault.id;
  deposit.asset = inputToken.id;
  deposit.amount = depositAmount;
  deposit.amountUSD = amountUSD;
  deposit.vault = vault.id;
  deposit.save();
}
