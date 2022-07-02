import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  WithdrawCall,
  WithdrawAllCall,
  Deposit1Call as DepositCall,
  DepositCall as DepositCallWithProof,
  DepositAll1Call as DepositAllCall,
  DepositAllCall as DepositAllCallWithProof,
  DepositForCall,
  DepositFor1Call as DepositForCallWithProof,
  FullPricePerShareUpdated,
} from "../../generated/templates/Strategy/Vault";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";
import * as constants from "../common/constants";
import { getOrCreateToken, getOrCreateVault } from "../common/initializers";

export function handleDeposit(call: DepositCall): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;

  Deposit(
    vaultAddress,
    depositAmount,
    call.transaction.from,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositWithProof(call: DepositCallWithProof): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;

  Deposit(
    vaultAddress,
    depositAmount,
    call.transaction.from,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositFor(call: DepositForCall): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;
  const recipientAddress = call.inputs._recipient;

  Deposit(
    vaultAddress,
    depositAmount,
    recipientAddress,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositForWithProof(call: DepositForCallWithProof): void {
  const vaultAddress = call.to;
  const depositAmount = call.inputs._amount;
  const recipientAddress = call.inputs._recipient;

  Deposit(
    vaultAddress,
    depositAmount,
    recipientAddress,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositAll(call: DepositAllCall): void {
  const vaultAddress = call.to;
  const depositAmount = constants.BIGINT_NEGATIVE_ONE;

  Deposit(
    vaultAddress,
    depositAmount,
    call.transaction.from,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleDepositAllWithProof(call: DepositAllCallWithProof): void {
  const vaultAddress = call.to;
  const depositAmount = constants.BIGINT_NEGATIVE_ONE;

  Deposit(
    vaultAddress,
    depositAmount,
    call.transaction.from,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdraw(call: WithdrawCall): void {
  const vaultAddress = call.to;
  const sharesBurnt = call.inputs._shares;

  Withdraw(
    vaultAddress,
    sharesBurnt,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdrawAll(call: WithdrawAllCall): void {
  const vaultAddress = call.to;
  const sharesBurnt = constants.BIGINT_NEGATIVE_ONE;

  Withdraw(
    vaultAddress,
    sharesBurnt,
    call.transaction,
    call.block
  );

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleFullPricePerShareUpdated(
  event: FullPricePerShareUpdated
): void {
  const vaultAddress = event.address;
  const outputToken = getOrCreateToken(vaultAddress);
  const vault = getOrCreateVault(vaultAddress, event.block);

  vault.pricePerShare = event.params.value
    .toBigDecimal()
    .div(constants.BIGINT_TEN.pow(outputToken.decimals as u8).toBigDecimal());

  vault.save();
}
