import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  Harvested,
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
import * as utils from "../common/utils";
import { Deposit } from "../modules/Deposit";
import { log } from "@graphprotocol/graph-ts";
import { Withdraw } from "../modules/Withdraw";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { getOrCreateVault } from "../common/initializers";
import { updateRevenueSnapshots } from "../modules/Revenue";

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

  Withdraw(vaultAddress, sharesBurnt, call.transaction, call.block);

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleWithdrawAll(call: WithdrawAllCall): void {
  const vaultAddress = call.to;
  const sharesBurnt = constants.BIGINT_NEGATIVE_ONE;

  Withdraw(vaultAddress, sharesBurnt, call.transaction, call.block);

  updateFinancials(call.block);
  updateUsageMetrics(call.block, call.from);
  updateVaultSnapshots(vaultAddress, call.block);
}

export function handleFullPricePerShareUpdated(
  event: FullPricePerShareUpdated
): void {
  const vaultAddress = event.address;
  const vault = getOrCreateVault(vaultAddress, event.block);

  vault.pricePerShare = event.params.value.toBigDecimal();

  vault.save();
}

export function handleHarvested(event: Harvested): void {
  // Event emitted by `graviAurora` vault

  const harvestToken = event.params.token;
  const harvestedAmount = event.params.amount; 
  
  const vaultAddress = event.address;
  const vault = getOrCreateVault(vaultAddress, event.block);

  const harvestTokenPrice = getUsdPricePerToken(harvestToken);
  const harvestTokenDecimals = utils.getTokenDecimals(harvestToken);

  const supplySideRevenueUSD = harvestedAmount
    .toBigDecimal()
    .div(harvestTokenDecimals)
    .times(harvestTokenPrice.usdPrice)
    .div(harvestTokenPrice.decimalsBaseTen);

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    constants.BIGDECIMAL_ZERO,
    event.block
  );

  log.warning(
    "[VaultHarvest] Vault: {}, token: {}, amount: {}, amountUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      harvestToken.toHexString(),
      harvestedAmount.toString(),
      supplySideRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
