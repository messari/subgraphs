import { BigInt,BigDecimal, Address, log, ethereum } from "@graphprotocol/graph-ts"
import {
  Deposit as DepositEvent,
  Invest as InvestEvent,
  StrategyAnnounced as StrategyAnnouncedEvent,
  StrategyChanged as StrategyChangedEvent,
  Withdraw as WithdrawEvent,
  DoHardWorkCall
} from "../../generated/ControllerListener/VaultContract";
import { getOrCreateToken } from './../entities/Token';
import { getOrCreateProtocol } from './../entities/Protocol';
import { getOrCreateVaultFee } from './../entities/VaultFee';
import { Vault, Token, Account } from "../../generated/schema";
import { WETH_ADDRESS } from './../constant';
import { getOrCreateVault, updateVaultPrices } from './../entities/Vault';
import { getOrCreateDeposit, getOrCreateWithdraw } from './../entities/Transaction';
import { getOrCreateToken } from './../entities/Token';
import { depositUpdateMetrics, withdrawUpdateMetrics } from './../entities/Metrics';
import * as constants from "./../constant";
import { getUsdPricePerToken } from "./../Prices";
import { StrategyListener } from '../../generated/templates';
import { Vault as VaultContract } from "../../generated/ControllerListener/Vault";

export function handleDeposit(event: DepositEvent): void {

  const vaultAddress = event.address;

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
    .div(constants.BIGINT_TEN.pow(inputTokenPrice.decimals as u8).toBigDecimal());

  deposit.from = event.params.beneficiary.toHex();
  deposit.to = vault.inputToken;
  deposit.asset = vault.inputToken;
  deposit.amount = amount;
  deposit.vault = vault.id;
  deposit.amountUSD = depositAmountUSD;
  deposit.save();

  let protocol = getOrCreateProtocol();
  let accountId = deposit.from;
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  
  vault.inputTokenBalance = vault.inputTokenBalance.plus(amount);
  
  updateVaultPrices(event, vault);

  vault.save();

  depositUpdateMetrics(event, vault);
  //calculateProtocolTotalValueLockedUSD(event);
  
}

export function handleWithdraw(event: WithdrawEvent): void {

  const vaultAddress = event.address;

  let vault = getOrCreateVault(vaultAddress, event.block);

  let amount = event.params.amount;

  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let block = event.block;
  let withdraw = getOrCreateWithdraw(hash, index, block);


  let inputTokenAddress = Address.fromString(vault.inputToken)
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  // exist because vault create it
  let inputToken = Token.load(inputTokenAddress.toHex());
  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken!.decimals as u8);

  let withdrawAmountUSD = inputTokenPrice.usdPrice
    .times(amount.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())
    .div(constants.BIGINT_TEN.pow(inputTokenPrice.decimals as u8).toBigDecimal());

  withdraw.from = event.params.beneficiary.toHex();
  withdraw.to = vault.inputToken;
  withdraw.asset = vault.inputToken;
  withdraw.amount = amount;
  withdraw.vault = vault.id;
  withdraw.amountUSD = withdrawAmountUSD;
  withdraw.save();


  let protocol = getOrCreateProtocol();
  let accountId = withdraw.from;
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  
  vault.inputTokenBalance = vault.inputTokenBalance.minus(amount);
  
  updateVaultPrices(event, vault);

  withdrawUpdateMetrics(event, vault);
  
}

export function handleDoHardWorkCall(call: DoHardWorkCall): void {
  const vaultAddress = call.to;

  let vault_contract = VaultContract.bind(vaultAddress);
  let strategy_addr = vault_contract.strategy();

  let vault = getOrCreateVault(vaultAddress, call.block);
  //updateVaultPrices(call, vault);

  StrategyListener.create(strategy_addr);
  log.info('New strategy registered', []);

}


export function handleStrategyChanged(event: StrategyChangedEvent): void {
  const vaultAddress = event.address;
  const new_strategy_address = event.params.newStrategy;
  // this will automaticly update vault and vaultFee
  let vault = getOrCreateVault(vaultAddress, event.block);
  let vaultFee = getOrCreateVaultFee(vault, event.block); // to update vault fee;
  vault.fees = [vaultFee.id];
  vault.save();

  updateVaultPrices(event, vault);


  StrategyListener.create(new_strategy_address);
  log.info('New strategy registered', []);
}

export function handleStrategyAnnounced(event: StrategyAnnouncedEvent): void {
  const vaultAddress = event.address;
  const new_strategy_address = event.params.newStrategy;
  // this will automaticly update vault and vaultFee
  let vault = getOrCreateVault(vaultAddress, event.block);
  updateVaultPrices(event, vault);


  StrategyListener.create(new_strategy_address);
  log.info('New strategy registered', []);
}
