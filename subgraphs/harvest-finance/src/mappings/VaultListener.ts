import { BigInt,BigDecimal, Address, log } from "@graphprotocol/graph-ts"
import {
  Deposit as DepositEvent,
  Invest as InvestEvent,
  StrategyAnnounced as StrategyAnnouncedEvent,
  StrategyChanged as StrategyChangedEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent
} from "../../generated/ControllerListener/VaultContract"
import { Vault as VaultContract } from "../../generated/ControllerListener/Vault";
import { getOrCreateToken } from './../entities/Token'
import { Vault, Token } from "../../generated/schema";
import { WETH_ADDRESS } from './../constant'
import { getOrCreateVault } from './../entities/Vault'
import { getOrCreateDeposit } from './../entities/Transaction'
import { getOrCreateToken } from './../entities/Token'
import { depositUpdateMetrics } from './../entities/Metrics'
import * as constants from "./../constant";
import { getUsdPricePerToken } from "./../Prices";
import { readValue } from "../utils/contracts";

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

  let vault_contract = VaultContract.bind(vaultAddress);
  vault.inputTokenBalance = vault.inputTokenBalance.plus(amount);
  vault.outputTokenSupply = readValue<BigInt>(vault_contract.try_totalSupply(), constants.BIGINT_ZERO);

  vault.pricePerShare = readValue<BigInt>(vault_contract.try_getPricePerFullShare(), constants.BIGINT_ZERO).toBigDecimal();
  vault.save();

  vault.totalValueLockedUSD = (<BigDecimal> vault.pricePerShare)
    .times(inputTokenPrice.usdPrice)
    .times((<BigInt> vault.outputTokenSupply).toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(inputTokenPrice.decimals.toBigDecimal());

  vault.save();

  depositUpdateMetrics(event, vault);
  
}

