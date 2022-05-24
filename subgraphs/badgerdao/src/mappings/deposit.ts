import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { VaultV4 as VaultContract } from "../../generated/bBadger/VaultV4";
import { Vault } from "../../generated/schema";
import { BIGINT_TEN, BIGINT_ZERO } from "../constant";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateDeposit } from "../entities/Transaction";
import { getPricePerShare } from "../entities/Vault";
import { readValue } from "../utils/contracts";
import { updateAllMetrics } from "./common";
import { getOrUpdateTokenPrice, getPriceOfStakeToken } from "./price";

export function deposit(call: ethereum.Call, vault: Vault, amount: BigInt | null): void {
  let vaultAddress = Address.fromString(vault.id);
  let vaultContract = VaultContract.bind(vaultAddress);

  let inputTokenAddress = Address.fromString(vault.inputToken);
  let prevTokenBalance = vault.inputTokenBalance;
  let inputTokenBalance = readValue<BigInt>(vaultContract.try_balance(), BIGINT_ZERO);
  let depositAmount = inputTokenBalance.minus(prevTokenBalance);
  let outputTokenSupply = readValue<BigInt>(vaultContract.try_totalSupply(), BIGINT_ZERO);

  let pricePerShare = getPricePerShare(vaultAddress);
  let token = getOrCreateToken(inputTokenAddress);
  let inputTokenPrice = getOrUpdateTokenPrice(vault, token, call.block);

  let tokenDecimals = BIGINT_TEN.pow(token.decimals as u8);
  let amountUSD = inputTokenPrice.times(
    depositAmount.toBigDecimal().div(tokenDecimals.toBigDecimal()),
  );

  log.warning(
    "[BADGER] deposit -  vault {}  token {} tokenPrice {} amount {} amountUSD {} inputTokenBalance {}  outputTokenSupply {} txHash {}",
    [
      vaultAddress.toHex(),
      inputTokenAddress.toHex(),
      inputTokenPrice.toString(),
      depositAmount.toString(),
      amountUSD.toString(),
      inputTokenBalance.toString(),
      outputTokenSupply.toString(),
      call.transaction.hash.toHex(),
    ],
  );

  vault.pricePerShare = pricePerShare.toBigDecimal();
  vault.inputTokenBalance = inputTokenBalance;
  vault.totalValueLockedUSD = inputTokenPrice.times(
    inputTokenBalance.toBigDecimal().div(tokenDecimals.toBigDecimal()),
  );
  vault.outputTokenSupply = outputTokenSupply;
  vault.outputTokenPriceUSD = getPriceOfStakeToken(inputTokenPrice, pricePerShare);
  vault.save();

  let deposit = getOrCreateDeposit(call);

  deposit.amount = depositAmount;
  deposit.amountUSD = amountUSD;
  deposit.from = call.transaction.from.toHex();
  deposit.to = vault.id;
  deposit.vault = vault.id;
  deposit.asset = vault.inputToken;
  deposit.save();

  updateAllMetrics(call, vault, true);
}
