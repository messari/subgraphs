import { BigInt,BigDecimal, Address, log } from "@graphprotocol/graph-ts"
import {
  Deposit as DepositEvent,
  Invest as InvestEvent,
  StrategyAnnounced as StrategyAnnouncedEvent,
  StrategyChanged as StrategyChangedEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
  DoHardWorkCall
} from "../../generated/ControllerListener/VaultContract"
import { Vault as VaultContract } from "../../generated/ControllerListener/Vault";
import { getOrCreateToken } from './../entities/Token'
import { Vault, Token } from "../../generated/schema";
import { WETH_ADDRESS } from './../constant'
import { getOrCreateVault, updateVaultPrices } from './../entities/Vault'
import { getOrCreateDeposit } from './../entities/Transaction'
import { getOrCreateToken } from './../entities/Token'
import { depositUpdateMetrics } from './../entities/Metrics'
import * as constants from "./../constant";
import { getUsdPricePerToken } from "./../Prices";

export function handleDeposit(event: DepositEvent): void {

  const vaultAddress = event.address;
  //const tokenAddress = WETH_ADDRESS;

  let vault = getOrCreateVault(vaultAddress, event.block);

  let amount = event.params.amount;

  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let block = event.block;
  let deposit = getOrCreateDeposit(hash, index, block);


  let inputTokenAddress = Address.fromString(vault.inputToken)
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  // exist because vault create it
  let inputToken = Token.load(inputTokenAddress.toHex());
  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken!.decimals as u8);

  let depositAmountUSD = inputTokenPrice.usdPrice
    .times(amount.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimals.toBigDecimal());

  deposit.from = event.params.beneficiary.toHex();
  deposit.to = vault.inputToken;
  deposit.asset = vault.inputToken;
  deposit.amount = amount;
  deposit.vault = vault.id;
  deposit.amountUSD = depositAmountUSD;
  deposit.save();

  
  vault.inputTokenBalance = vault.inputTokenBalance.plus(amount);
  
  updateVaultPrices(vault);

  vault.save();

  depositUpdateMetrics(event, vault);
  
}

export function handleDoHardWorkCall(call: DoHardWorkCall): void {
  const vaultAddress = call.to;

  let vault = getOrCreateVault(vaultAddress, call.block);
  updateVaultPrices(vault);

}

