import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/bveCVX/ERC20";
import { VaultV4 as VaultContract } from "../../generated/bveCVX/VaultV4";
import { Vault } from "../../generated/schema";
import { BIGINT_TEN, BIGINT_ZERO } from "../constant";
import { getOrCreateToken } from "../entities/Token";
import { getOrCreateDeposit } from "../entities/Transaction";
import { getPricePerShare } from "../entities/Vault";
import { getUsdPricePerToken } from "../price";
import { readValue } from "../utils/contracts";
import { updateAllMetrics } from "./common";
import { getPriceOfStakeToken } from "./price";

export function deposit(call: ethereum.Call, vault: Vault, amount: BigInt | null): void {
  let vaultAddress = Address.fromString(vault.id);
  let vaultContract = VaultContract.bind(vaultAddress);

  let inputTokenAddress = Address.fromString(vault.inputToken);
  let tokenContract = ERC20.bind(inputTokenAddress);

  let depositAmount = amount
    ? amount
    : readValue<BigInt>(tokenContract.try_balanceOf(call.transaction.from), BIGINT_ZERO);

  let pricePerShare = getPricePerShare(vaultAddress);
  let try_price = getUsdPricePerToken(inputTokenAddress, call.block);
  let inputTokenPrice = try_price.reverted
    ? try_price.usdPrice
    : try_price.usdPrice.div(try_price.decimals.toBigDecimal());

  let token = getOrCreateToken(inputTokenAddress);
  token.lastPriceBlockNumber = call.block.number;
  token.lastPriceUSD = inputTokenPrice;
  token.save();

  let tokenDecimals = BIGINT_TEN.pow(token.decimals as u8);
  let amountUSD = inputTokenPrice.times(
    depositAmount.toBigDecimal().div(tokenDecimals.toBigDecimal()),
  );

  vault.pricePerShare = pricePerShare.toBigDecimal();
  vault.inputTokenBalance = vault.inputTokenBalance.plus(depositAmount);
  vault.totalValueLockedUSD = inputTokenPrice.times(
    vault.inputTokenBalance.toBigDecimal().div(tokenDecimals.toBigDecimal()),
  );
  vault.outputTokenSupply = readValue<BigInt>(vaultContract.try_totalSupply(), BIGINT_ZERO);
  vault.outputTokenPriceUSD = getPriceOfStakeToken(inputTokenPrice, pricePerShare);
  vault.save();

  log.warning(
    "[BADGER] deposit -  vault {}  token {}  amount {} amountUSD {} inputTokenBalance {}  outputTokenSupply {} txHash {}",
    [
      vaultAddress.toHex(),
      inputTokenAddress.toHex(),
      depositAmount.toString(),
      amountUSD.toString(),
      vault.inputTokenBalance.toString(),
      vault.outputTokenSupply.toString(),
      call.transaction.hash.toHex(),
    ],
  );

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
