import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent
} from "../generated/YakStrategyV2/YakStrategyV2";
import { getOrCreateVault } from "./common/initializers";
import { MAX_UINT256 } from "./helpers/constants";
import { _Deposit } from "./modules/Deposit";
import { updateFinancials, updateUsageMetrics, updateVaultSnapshots } from "./modules/Metrics";

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
      MAX_UINT256
    );
  }

  updateFinancials(event.block);
  updateUsageMetrics(event.block, event.transaction.from);
  updateVaultSnapshots(contractAddress, event.block);
}

export function handleWithdraw(event: WithdrawEvent): void {


}