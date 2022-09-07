import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  StrategyAdded,
  StrategyRemoved,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
} from "../../generated/templates/Strategy/Vault";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";

export function handleDeposit(event: DepositEvent): void {
  const vaultAddress = event.address;
  const sharesMinted = event.params.sharesMinted;
  const depositAmount = event.params.depositAmount;
  const strategyAddress = event.params.strategyAddress;
  const inputTokenAddress = event.params.tokenAddress;

  Deposit(
    vaultAddress,
    depositAmount,
    sharesMinted,
    event.transaction,
    event.block
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleWithdraw(event: WithdrawEvent): void {
  const vaultAddress = event.address;
  const sharesBurnt = event.params.sharesBurnt;
  const withdrawAmount = event.params.withdrawAmount;
  const strategyAddress = event.params.strategyAddress;
  const inputTokenAddress = event.params.tokenAddress;

  Withdraw(
    vaultAddress,
    withdrawAmount,
    sharesBurnt,
    event.transaction,
    event.block
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(vaultAddress, event.block);
}

export function handleStrategyAdded(event: StrategyAdded): void {}

export function handleStrategyRemoved(event: StrategyRemoved): void {}
