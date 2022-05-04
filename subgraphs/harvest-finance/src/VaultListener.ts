import { BigInt, Address, log } from "@graphprotocol/graph-ts"
import {
  Deposit as DepositEvent,
  Invest as InvestEvent,
  StrategyAnnounced as StrategyAnnouncedEvent,
  StrategyChanged as StrategyChangedEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent
} from "../generated/ControllerListener/VaultContract"
import { getOrCreateToken } from './entities/Token'
import { Vault } from "../generated/schema";
import { WETH_ADDRESS } from './constant'
import { getOrCreateVault } from './entities/Vault'
import { getOrCreateDeposit } from './entities/Transaction'
import { getOrCreateToken } from './entities/Token'

export function handleDeposit(event: DepositEvent): void {

  const vaultAddress = event.address;
  //const tokenAddress = WETH_ADDRESS;

  let vault = getOrCreateVault(vaultAddress, event.block);

  let amount = event.params.amount;

  let hash = event.transaction.hash;
  let index = event.transaction.index;
  let block = event.block;
  let deposit = getOrCreateDeposit(hash, index, block);


  deposit.from = event.params.beneficiary.toHex();
  deposit.to = vault.inputToken;
  deposit.asset = vault.inputToken;
  deposit.amount = amount;
  deposit.vault = vault.id;
  deposit.save();
  
}

export function handleInvest(event: InvestEvent): void {

}

export function handleStrategyAnnounced(event: StrategyAnnouncedEvent): void {
  
}

export function handleStrategyChanged(event: StrategyChangedEvent): void {
  
}

export function handleTransfer(event: TransferEvent): void {
  
}

export function handleWithdraw(event: WithdrawEvent): void {
  
}
