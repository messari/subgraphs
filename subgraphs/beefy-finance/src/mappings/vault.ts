import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import { Vault, VaultDailySnapshot, VaultFee } from "../../generated/schema";
import {
  BeefyStrategy,
  Deposit,
  StratHarvest,
  Withdraw,
} from "../../generated/ExampleVault/BeefyStrategy";
import { BeefyVault } from "../../generated/ExampleVault/BeefyVault";
import {
  getBeefyFinanceOrCreate,
  getTokenOrCreate,
  getVaultFromStrategyOrCreate,
} from "../utils/getters";
import { createDeposit, getOrCreateFirstDeposit } from "./deposit";
import { createWithdraw, getOrCreateFirstWithdraw } from "./withdraw";
import {
  updateVaultDailySnapshot,
  updateVaultHourlySnapshot,
} from "../utils/snapshots";
import { fetchTokenName, fetchTokenSymbol, getLastPriceUSD } from "./token";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  BIGINT_ZERO,
  PROTOCOL_ID,
} from "../prices/common/constants";

export function createVaultFromStrategy(
  strategyAddress: Address,
  currentBlock: ethereum.Block
): Vault {
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  const vaultAddress = strategyContract.vault();
  let vault = Vault.load(vaultAddress.toHex());
  if (!vault) {
    vault = new Vault(vaultAddress.toHex());
  }
  const vaultContract = BeefyVault.bind(vaultAddress);

  vault.name = fetchTokenName(vaultAddress);
  vault.symbol = fetchTokenSymbol(vaultAddress);
  vault.strategy = strategyAddress.toHex();

  vault.inputToken = getTokenOrCreate(strategyContract.want()).id;
  vault.outputToken = getTokenOrCreate(vaultAddress).id;

  vault.fees = getFees(vault.id, strategyContract);

  vault.createdTimestamp = currentBlock.timestamp;
  vault.createdBlockNumber = currentBlock.number;

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

  const inputToken = getTokenOrCreate(strategyContract.want());
  vault.totalValueLockedUSD = getLastPriceUSD(
    strategyContract.want(),
    currentBlock.number
  )
    .times(vault.inputTokenBalance.toBigDecimal())
    .div(BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal());

  const outputSupply = vault.outputTokenSupply;
  if (outputSupply && outputSupply != BIGINT_ZERO)
    vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
      outputSupply.toBigDecimal()
    );

  vault.deposits = [getOrCreateFirstDeposit(vault).id];
  vault.withdraws = [getOrCreateFirstWithdraw(vault).id];

  vault.protocol = PROTOCOL_ID;
  vault.dailySnapshots = [updateVaultDailySnapshot(currentBlock, vault).id];
  vault.hourlySnapshots = [updateVaultHourlySnapshot(currentBlock, vault).id];

  vault.save();
  getBeefyFinanceOrCreate(vault.id, currentBlock);
  return vault;
}

export function updateVaultAndSave(vault: Vault, block: ethereum.Block): void {
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
    const inputToken = getTokenOrCreate(wantCall.value);
    vault.totalValueLockedUSD = getLastPriceUSD(wantCall.value, block.number)
      .times(vault.inputTokenBalance.toBigDecimal())
      .div(BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal());
  }

  const outputSupply = vault.outputTokenSupply;
  if (outputSupply && outputSupply != BIGINT_ZERO)
    vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
      outputSupply.toBigDecimal()
    );

  const dailySnapshot = updateVaultDailySnapshot(block, vault);
  if (
    vault.dailySnapshots[vault.dailySnapshots.length - 1] != dailySnapshot.id
  ) {
    vault.dailySnapshots = vault.dailySnapshots.concat([dailySnapshot.id]);
  }
  const hourlySnapshot = updateVaultHourlySnapshot(block, vault);
  if (
    vault.hourlySnapshots[vault.hourlySnapshots.length - 1] != hourlySnapshot.id
  ) {
    vault.hourlySnapshots = vault.hourlySnapshots.concat([hourlySnapshot.id]);
  }

  vault.save();
}

export function getFees(
  vaultId: string,
  strategyContract: BeefyStrategy
): string[] {
  const strategistFee = new VaultFee("STRATEGIST_FEE-" + vaultId);
  let call = strategyContract.try_STRATEGIST_FEE();
  if (call.reverted) {
    strategistFee.feePercentage = BIGDECIMAL_ZERO;
  } else {
    strategistFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
  }
  strategistFee.feeType = "STRATEGIST_FEE";
  strategistFee.save();

  const withdrawalFee = new VaultFee("WITHDRAWAL_FEE-" + vaultId);
  call = strategyContract.try_withdrawalFee();
  if (call.reverted) {
    withdrawalFee.feePercentage = BIGDECIMAL_ZERO;
  } else {
    withdrawalFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
  }
  withdrawalFee.feeType = "WITHDRAWAL_FEE";
  withdrawalFee.save();

  const callFee = new VaultFee("MANAGEMENT_FEE-" + vaultId);
  call = strategyContract.try_callFee();
  if (call.reverted) {
    callFee.feePercentage = BIGDECIMAL_ZERO;
  } else {
    callFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
  }
  callFee.feeType = "MANAGEMENT_FEE";
  callFee.save();

  const beefyFee = new VaultFee("PERFORMANCE_FEE-" + vaultId);
  call = strategyContract.try_beefyFee();
  if (call.reverted) {
    beefyFee.feePercentage = BIGDECIMAL_ZERO;
  } else {
    beefyFee.feePercentage = call.value.divDecimal(BIGDECIMAL_HUNDRED);
  }
  beefyFee.feeType = "PERFORMANCE_FEE";
  beefyFee.save();

  return [strategistFee.id, withdrawalFee.id, callFee.id, beefyFee.id];
}

export function getVaultDailyRevenues(vault: Vault): BigDecimal[] {
  let fee: VaultFee | null;
  let lastSnapshot = VaultDailySnapshot.load(
    vault.dailySnapshots[vault.dailySnapshots.length - 1]
  );
  if (lastSnapshot) {
    let currentTotalRevenue = lastSnapshot.dailyTotalRevenueUSD;
    let currentRevenueSupplySide = currentTotalRevenue;
    let currentRevenueProtocolSide = BIGDECIMAL_ZERO;
    for (let k = 0; k < vault.fees.length; k++) {
      fee = VaultFee.load(vault.fees[k]);
      if (fee) {
        if (fee.id == "PERFORMANCE_FEE-" + vault.id) {
          currentRevenueProtocolSide = currentRevenueProtocolSide.plus(
            currentTotalRevenue.times(fee.feePercentage).div(BIGDECIMAL_HUNDRED)
          );
          continue;
        }

        if (fee.id == "STRATEGIST_FEE-" + vault.id) {
          currentRevenueSupplySide = currentRevenueSupplySide.minus(
            currentTotalRevenue.times(fee.feePercentage).div(BIGDECIMAL_HUNDRED)
          );
          continue;
        }

        if (fee.id == "MANAGEMENT_FEE-" + vault.id) {
          currentRevenueSupplySide = currentRevenueSupplySide.minus(
            currentTotalRevenue.times(fee.feePercentage).div(BIGDECIMAL_HUNDRED)
          );
          continue;
        }
      }
    }
    return [
      currentRevenueSupplySide.minus(currentRevenueProtocolSide),
      currentRevenueProtocolSide,
      currentTotalRevenue,
    ];
  }

  return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
}

export function handleDeposit(event: Deposit): void {
  const vault = getVaultFromStrategyOrCreate(event.address, event.block);

  if (vault.deposits[0] == "MockDeposit" + vault.id) {
    const depositedAmount = event.params.tvl;
    const deposit = createDeposit(event, depositedAmount, vault.id);
    vault.deposits = [deposit.id];
  } else {
    const depositedAmount = event.params.tvl.minus(vault.inputTokenBalance);
    const deposit = createDeposit(event, depositedAmount, vault.id);
    vault.deposits = vault.deposits.concat([deposit.id]);
  }

  updateVaultAndSave(vault, event.block);
  getBeefyFinanceOrCreate(vault.id, event.block);
}

export function handleWithdraw(event: Withdraw): void {
  const vault = getVaultFromStrategyOrCreate(event.address, event.block);
  const withdrawnAmount = vault.inputTokenBalance.minus(event.params.tvl);
  const withdraw = createWithdraw(event, withdrawnAmount, vault.id);

  if (vault.withdraws[0] == "MockWithdraw" + vault.id) {
    vault.withdraws = [withdraw.id];
  } else {
    vault.withdraws = vault.withdraws.concat([withdraw.id]);
  }

  updateVaultAndSave(vault, event.block);
  getBeefyFinanceOrCreate(vault.id, event.block);
}

export function handleStratHarvestWithAmount(event: StratHarvest): void {
  const vault = getVaultFromStrategyOrCreate(event.address, event.block);
  updateVaultAndSave(vault, event.block);
  const dailySnapshot = VaultDailySnapshot.load(
    vault.dailySnapshots[vault.dailySnapshots.length - 1]
  );
  if (dailySnapshot) {
    const token = getTokenOrCreate(
      Address.fromString(vault.inputToken.split("x")[1])
    );
    const priceUsd = token.lastPriceUSD;
    if (priceUsd) {
      dailySnapshot.dailyTotalRevenueUSD = dailySnapshot.dailyTotalRevenueUSD.plus(
        priceUsd
          .times(event.params.wantHarvested.toBigDecimal())
          .div(BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
      );
      dailySnapshot.save();
    }
  }
  getBeefyFinanceOrCreate(vault.id, event.block);
}

export function handleStratHarvest(event: StratHarvest): void {
  const vault = getVaultFromStrategyOrCreate(event.address, event.block);
  const vaultContract = BeefyVault.bind(event.address);
  const balance = vaultContract.try_balance();
  if (!balance.reverted) {
    const amountHarvested = balance.value.minus(vault.inputTokenBalance);
    updateVaultAndSave(vault, event.block);
    const dailySnapshot = VaultDailySnapshot.load(
      vault.dailySnapshots[vault.dailySnapshots.length - 1]
    );
    if (dailySnapshot && amountHarvested > BIGINT_ZERO) {
      const token = getTokenOrCreate(
        Address.fromString(vault.inputToken.split("x")[1])
      );
      const priceUsd = token.lastPriceUSD;
      if (priceUsd) {
        dailySnapshot.dailyTotalRevenueUSD = dailySnapshot.dailyTotalRevenueUSD.plus(
          priceUsd
            .times(amountHarvested.toBigDecimal())
            .div(BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
        );
        dailySnapshot.save();
      }
    }
  }
  getBeefyFinanceOrCreate(vault.id, event.block);
}
