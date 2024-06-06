import { WithdrawVaultCreated } from "../../generated/VaultFactory/VaultFactory";
import { WithdrawVault as WithdrawVaultTemplate } from "../../generated/templates";

export function handleWithdrawVaultCreated(event: WithdrawVaultCreated): void {
  const newWithdrawVault = event.params.withdrawVault;

  WithdrawVaultTemplate.create(newWithdrawVault);
}
