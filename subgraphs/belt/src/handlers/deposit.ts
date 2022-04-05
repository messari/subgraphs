import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Deposit as DepositEvent } from "../../generated/beltBTC/Vault";
import { Deposit, Vault } from "../../generated/schema";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateDeposit } from "../entities/Transaction";
import { getUSDPriceOfToken } from "./price";

export function deposit(event: DepositEvent, vault: Vault): void {
  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let id = "deposit-"
    .concat(hash.toHex())
    .concat("-")
    .concat(index.toHex());

  let deposit = Deposit.load(id);
  if (deposit) return;

  deposit = getOrCreateDeposit(hash, index);

  let shares = event.params.sharesMinted;
  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputToken = getOrCreateToken(inputTokenAddress);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken.decimals as u8);
  let inputTokenPrice = getUSDPriceOfToken(inputToken);

  vault.outputTokenSupply = vault.outputTokenSupply.plus(shares);
  vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(event.params.depositAmount)];
  vault.totalValueLockedUSD = inputTokenPrice
    .times(vault.inputTokenBalances[0].toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  let amountUSD = inputTokenPrice
    .times(event.params.depositAmount.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(amountUSD);
  // vault.outputTokenPriceUSD = getPriceOfStakedTokens(
  //   Address.fromString(vault.id),
  //   inputTokenAddress,
  //   inputTokenDecimals,
  // ).toBigDecimal();
  vault.save();

  // updating deposit entity
  deposit.from = event.transaction.from.toHex();
  deposit.to = vault.id;
  deposit.asset = vault.inputTokens[0];
  deposit.amount = event.params.depositAmount;
  deposit.amountUSD = amountUSD;
  deposit.vault = vault.id;
  deposit.save();
}
