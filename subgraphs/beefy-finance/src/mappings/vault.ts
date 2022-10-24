import { Address, BigInt } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import { Vault, VaultFee } from "../../generated/schema";
import {
  BeefyStrategy,
  ChargedFees,
  Deposit,
  StratHarvest,
  Withdraw,
} from "../../generated/Standard/BeefyStrategy";
import { BeefyVault } from "../../generated/Standard/BeefyVault";
import {
  getBeefyFinanceOrCreate,
  getTokenOrCreate,
  getVaultFromStrategyOrCreate,
} from "../utils/getters";
import { createDeposit } from "./deposit";
import { createWithdraw } from "./withdraw";
import {
  updateVaultDailySnapshot,
  updateVaultHourlySnapshot,
} from "../utils/snapshots";
import { fetchTokenName, fetchTokenSymbol } from "./token";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  BIGINT_ZERO,
  ZERO_ADDRESS,
} from "../prices/common/constants";
import {
  updateProtocolRevenueFromChargedFees,
  updateProtocolRevenueFromHarvest,
  updateProtocolRevenueFromWithdraw,
  updateProtocolUsage,
} from "./protocol";

export function createVaultFromStrategy(
  strategyAddress: Address,
  event: ethereum.Event
): Vault {
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  const vaultAddress = strategyContract.vault();
  const vault = new Vault(vaultAddress.toHex());
  const vaultContract = BeefyVault.bind(vaultAddress);
  vault.name = fetchTokenName(vaultAddress);
  vault.symbol = fetchTokenSymbol(vaultAddress);
  vault.strategy = strategyAddress.toHex();
  vault.inputTokenBalance = BIGINT_ZERO;

  let want = strategyContract.try_want();
  if (want.reverted) {
    want = vaultContract.try_token();
  }
  if (want.reverted) {
    vault.inputToken = getTokenOrCreate(ZERO_ADDRESS, event.block).id;
  } else {
    vault.inputToken = getTokenOrCreate(want.value, event.block).id;
  }
  vault.totalValueLockedUSD = BIGDECIMAL_ZERO;

  vault.outputToken = getTokenOrCreate(vaultAddress, event.block).id;
  vault.fees = getFees(vault.id, strategyContract);
  vault.createdTimestamp = event.block.timestamp;
  vault.createdBlockNumber = event.block.number;

  vault.outputTokenSupply = BIGINT_ZERO;
  vault.pricePerShare = BIGINT_ZERO;
  vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;

  const beefy = getBeefyFinanceOrCreate(vault.id);
  vault.protocol = beefy.id;
  vault.save();
  if (beefy.vaults[0] != vault.id) {
    beefy.vaults = beefy.vaults.concat([vault.id]);
    beefy.save();
  }
  return vault;
}

export function updateVaultAndSnapshots(
  vault: Vault,
  block: ethereum.Block
): void {
  const vaultContract = BeefyVault.bind(
    Address.fromString(vault.id.split("x")[1])
  );
  let call = vaultContract.try_balance();
  if (call.reverted) {
    vault.inputTokenBalance = BIGINT_ZERO;
  } else {
    vault.inputTokenBalance = call.value;
  }
  call = vaultContract.try_totalSupply();
  if (call.reverted) {
    vault.outputTokenSupply = BIGINT_ZERO;
  } else {
    vault.outputTokenSupply = call.value;
  }
  call = vaultContract.try_getPricePerFullShare();
  if (call.reverted) {
    vault.pricePerShare = BIGINT_ZERO;
  } else {
    vault.pricePerShare = call.value.div(
      BigInt.fromI32(vaultContract.decimals())
    );
  }
  const wantCall = vaultContract.try_want();
  if (wantCall.reverted) {
    vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
  } else {
    const inputToken = getTokenOrCreate(wantCall.value, block);
    vault.totalValueLockedUSD = inputToken.lastPriceUSD
      .times(vault.inputTokenBalance.toBigDecimal())
      .div(BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal());
  }
  const outputSupply = vault.outputTokenSupply;
  if (outputSupply && outputSupply != BIGINT_ZERO)
    vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
      outputSupply.toBigDecimal()
    );
  vault.save();
  updateVaultHourlySnapshot(block, vault);
  updateVaultDailySnapshot(block, vault);
}

export function getFees(
  vaultId: string,
  strategyContract: BeefyStrategy
): string[] {
  const fees: string[] = [];
  let call = strategyContract.try_STRATEGIST_FEE();
  if (!call.reverted) {
    const strategistFee = new VaultFee("STRATEGIST_FEE-" + vaultId);
    strategistFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
    strategistFee.feeType = "STRATEGIST_FEE";
    strategistFee.save();
    fees.push(strategistFee.id);
  }

  call = strategyContract.try_withdrawalFee();
  if (!call.reverted) {
    const withdrawalFee = new VaultFee("WITHDRAWAL_FEE-" + vaultId);
    withdrawalFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
    withdrawalFee.feeType = "WITHDRAWAL_FEE";
    withdrawalFee.save();
    fees.push(withdrawalFee.id);
  }

  call = strategyContract.try_callFee();
  if (!call.reverted) {
    const callFee = new VaultFee("MANAGEMENT_FEE-" + vaultId);
    callFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
    callFee.feeType = "MANAGEMENT_FEE";
    callFee.save();
    fees.push(callFee.id);
  }

  call = strategyContract.try_beefyFee();
  if (!call.reverted) {
    const beefyFee = new VaultFee("PERFORMANCE_FEE-" + vaultId);
    beefyFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
    beefyFee.feeType = "PERFORMANCE_FEE";
    beefyFee.save();
    fees.push(beefyFee.id);
  }
  return fees;
}

export function handleDeposit(event: Deposit): void {
  const vault = getVaultFromStrategyOrCreate(event.address, event);
  const depositedAmount = event.params.tvl.minus(vault.inputTokenBalance);
  createDeposit(event, depositedAmount, vault.id);

  updateVaultAndSnapshots(vault, event.block);
  updateProtocolUsage(event, vault, true, false);
}

export function handleWithdraw(event: Withdraw): void {
  const vault = getVaultFromStrategyOrCreate(event.address, event);
  const withdrawnAmount = event.params.tvl.minus(vault.inputTokenBalance);
  createWithdraw(event, withdrawnAmount, vault.id);
  updateVaultAndSnapshots(vault, event.block);
  updateProtocolRevenueFromWithdraw(event, vault, withdrawnAmount);
}

export function handleStratHarvestWithAmount(event: StratHarvest): void {
  const vault = getVaultFromStrategyOrCreate(event.address, event);
  updateVaultAndSnapshots(vault, event.block);
  updateProtocolRevenueFromHarvest(event, event.params.wantHarvested, vault);
}

export function handleStratHarvest(event: StratHarvest): void {
  const vault = getVaultFromStrategyOrCreate(event.address, event);
  const strategyContract = BeefyStrategy.bind(event.address);
  const balance = strategyContract.try_balanceOf();
  if (!balance.reverted) {
    const amountHarvested = balance.value.minus(vault.inputTokenBalance);
    updateVaultAndSnapshots(vault, event.block);
    updateProtocolRevenueFromHarvest(event, amountHarvested, vault);
  } else {
    updateVaultAndSnapshots(vault, event.block);
  }
}

export function handleChargedFees(event: ChargedFees): void {
  const vault = getVaultFromStrategyOrCreate(event.address, event);
  updateVaultAndSnapshots(vault, event.block);
  updateProtocolRevenueFromChargedFees(event, vault); //si rompe qua!
}
