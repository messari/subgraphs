import { BigInt, Address, log } from "@graphprotocol/graph-ts"
import {
  Deposit as DepositEvent,
  Invest as InvestEvent,
  StrategyAnnounced as StrategyAnnouncedEvent,
  StrategyChanged as StrategyChangedEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent
} from "../generated/fWETHContract/Vault"
import { getOrCreateToken } from './entities/Token'
import { Vault } from "../generated/schema";
import { WETH_ADDRESS } from './constant'
import { getOrCreateVault } from './entities/Vault'

export function handleDeposit(event: DepositEvent): void {
  //const vaultAddress = event.address;
  const vaultAddress = Address.fromString('0xFE09e53A81Fe2808bc493ea64319109B5bAa573e');
  const tokenAddress = WETH_ADDRESS;
  //const strategyAddress = event.params.strategyAddress;

  let vault = getOrCreateVault(vaultAddress, event.block);

  //let strategy = _Strategy.load(strategyAddress.toHex());
  //if (strategy == null) {
    //createStrategy(vault, strategyAddress, tokenAddress);
  //}

  let amount = event.params.amount;
  //let shares = event.params.sharesMinted;

  log.warning("[Harvest Finance] handleDeposit - vault {}, amount {}", [
    vaultAddress.toHex(),
    amount.toString(),
    //shares.toString(),
  ]);
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
