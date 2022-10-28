import {
  Deposit as DepositEvent,
  Reinvest as ReinvestEvent,
  UpdateAdminFee,
  UpdateDevFee,
  UpdateReinvestReward,
  Withdraw as WithdrawEvent
} from "../generated/YakStrategyV2/YakStrategyV2";
import { getOrCreateVault } from "./common/initializers";
import { _Deposit } from "./modules/Deposit";
import { updateFinancials, updateUsageMetrics, updateVaultSnapshots } from "./modules/Metrics";
import { _Reinvest } from "./modules/Reinvest";
import { _Withdraw } from "./modules/Withdraw";

export function handleDeposit(event: DepositEvent): void {
  let contractAddress = event.address;
  let vault = getOrCreateVault(contractAddress, event.block);

  if (vault) {
    _Deposit(
      contractAddress,
      event.transaction,
      event.block,
      vault,
      event.params.amount,
    );
  }

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(contractAddress, event.block);
}

export function handleWithdraw(event: WithdrawEvent): void {
  let contractAddress = event.address;
  let vault = getOrCreateVault(contractAddress, event.block);

  if (vault) {
    let withdrawAmount = event.params.amount;

    _Withdraw(
      contractAddress,
      event.transaction,
      event.block,
      vault,
      withdrawAmount
    );
  }

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(contractAddress, event.block);
}

export function handleReinvest(event: ReinvestEvent): void {
  let contractAddress = event.address;
  let vault = getOrCreateVault(contractAddress, event.block);

  if (vault) {
    _Reinvest(
      contractAddress,
      event.transaction,
      event.block,
      vault,
      event.params.newTotalSupply
    )
  }

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(contractAddress, event.block);
}

export function handleUpdateAdminFee(event: UpdateAdminFee): void {
}

export function handleUpdateDevFee(event: UpdateDevFee): void {
}

export function handleUpdateReinvestReward(event: UpdateReinvestReward): void {
}