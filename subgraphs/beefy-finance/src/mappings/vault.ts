import { Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import {
  Vault,
  VaultDailySnapshot,
  VaultFee,
  Deposit as DepositEntity,
  Withdraw as WithdrawEntity,
} from "../../generated/schema";
import {
  BeefyStrategy,
  Deposit,
  Withdraw,
} from "../../generated/ExampleVault/BeefyStrategy";
import { BeefyVault } from "../../generated/ExampleVault/BeefyVault";
import {
  getBeefyFinanceOrCreate,
  getTokenOrCreate,
  getVaultFromStrategyOrCreate,
} from "../utils/getters";
import { getAddressFromId } from "../utils/helpers";
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
  BIGINT_ZERO,
  NETWORK_SUFFIX_MAP,
} from "../prices/common/constants";

export function createVaultFromStrategy(
  strategyAddress: Address,
  currentBlock: ethereum.Block
): Vault {
  let network = dataSource.network();
  let NETWORK_SUFFIX = NETWORK_SUFFIX_MAP.get(network);
  if (!NETWORK_SUFFIX) NETWORK_SUFFIX = "";
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  const vaultAddress = strategyContract.vault();
  let vault = Vault.load(vaultAddress.toHexString() + NETWORK_SUFFIX);
  if (!vault) {
    vault = new Vault(vaultAddress.toHexString() + NETWORK_SUFFIX);
  }
  const vaultContract = BeefyVault.bind(vaultAddress);

  vault.name = fetchTokenName(vaultAddress);
  vault.symbol = fetchTokenSymbol(vaultAddress);
  vault.strategy = strategyAddress.toHexString() + NETWORK_SUFFIX;

  vault.inputToken = getTokenOrCreate(
    strategyContract.want(),
    NETWORK_SUFFIX
  ).id;
  vault.outputToken = getTokenOrCreate(vaultAddress, NETWORK_SUFFIX).id;

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
    vault.pricePerShare = call.value;
  }

  vault.totalValueLockedUSD = getLastPriceUSD(
    strategyContract.want(),
    NETWORK_SUFFIX,
    currentBlock.number
  ).times(new BigDecimal(vault.inputTokenBalance));

  const outputSupply = vault.outputTokenSupply;
  if (outputSupply && outputSupply != BIGINT_ZERO)
    vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
      new BigDecimal(outputSupply)
    );

  vault.deposits = [getOrCreateFirstDeposit(vault, currentBlock).id];
  vault.withdraws = [getOrCreateFirstWithdraw(vault, currentBlock).id];

  vault.protocol = getBeefyFinanceOrCreate(network, vault.id, currentBlock).id;
  vault.dailySnapshots = [updateVaultDailySnapshot(currentBlock, vault).id];
  vault.hourlySnapshots = [updateVaultHourlySnapshot(currentBlock, vault).id];

  vault.save();
  return vault;
}

export function handleDeposit(event: Deposit): void {
  let network = dataSource.network();
  let NETWORK_SUFFIX = NETWORK_SUFFIX_MAP.get(network);
  if (!NETWORK_SUFFIX) NETWORK_SUFFIX = "";
  const vault = getVaultFromStrategyOrCreate(
    event.address,
    event.block,
    NETWORK_SUFFIX
  );

  if (vault.deposits[0] === "MockDeposit" + vault.id) {
    const depositedAmount = event.params.tvl;
    const deposit = createDeposit(event, depositedAmount, NETWORK_SUFFIX);
    vault.deposits = [deposit.id];
  } else {
    const depositedAmount = event.params.tvl.minus(vault.inputTokenBalance);
    const deposit = createDeposit(event, depositedAmount, NETWORK_SUFFIX);
    vault.deposits = vault.deposits.concat([deposit.id]);
  }

  updateVaultAndSave(vault, event.block, NETWORK_SUFFIX);
}

export function handleWithdraw(event: Withdraw): void {
  let network = dataSource.network();
  let NETWORK_SUFFIX = NETWORK_SUFFIX_MAP.get(network);
  if (!NETWORK_SUFFIX) NETWORK_SUFFIX = "";
  const vault = getVaultFromStrategyOrCreate(
    event.address,
    event.block,
    NETWORK_SUFFIX
  );
  const withdrawnAmount = vault.inputTokenBalance.minus(event.params.tvl);
  const withdraw = createWithdraw(event, withdrawnAmount, NETWORK_SUFFIX);

  if (vault.withdraws[0] === "MockWithdraw" + vault.id) {
    vault.withdraws = [withdraw.id];
  } else {
    vault.withdraws = vault.withdraws.concat([withdraw.id]);
  }

  updateVaultAndSave(vault, event.block, NETWORK_SUFFIX);
}

export function updateVaultAndSave(
  vault: Vault,
  block: ethereum.Block,
  networkSuffix: string
): void {
  const vaultContract = BeefyVault.bind(getAddressFromId(vault.id));
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
    vault.pricePerShare = call.value;
  }

  const wantCall = vaultContract.try_want();
  if (wantCall.reverted) {
    vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
  } else {
    vault.totalValueLockedUSD = getLastPriceUSD(
      wantCall.value,
      networkSuffix,
      block.number
    ).times(new BigDecimal(vault.inputTokenBalance));
  }

  const outputSupply = vault.outputTokenSupply;
  if (outputSupply && outputSupply != BIGINT_ZERO)
    vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
      new BigDecimal(outputSupply)
    );

  const dailySnapshot = updateVaultDailySnapshot(block, vault);
  if (
    vault.dailySnapshots[vault.dailySnapshots.length - 1] !== dailySnapshot.id
  )
    vault.dailySnapshots = vault.dailySnapshots.concat([dailySnapshot.id]);
  const hourlySnapshot = updateVaultHourlySnapshot(block, vault);
  if (
    vault.hourlySnapshots[vault.hourlySnapshots.length - 1] !==
    hourlySnapshot.id
  )
    vault.hourlySnapshots = vault.hourlySnapshots.concat([hourlySnapshot.id]);

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

export function getVaultDailyRevenues(
  vault: Vault,
  block: ethereum.Block
): BigDecimal[] {
  const lastSnapshot = VaultDailySnapshot.load(
    vault.dailySnapshots[vault.dailySnapshots.length - 1]
  );
  let lastTvl = BIGDECIMAL_ZERO;
  let startBlock = BIGINT_ZERO;
  if (lastSnapshot) {
    lastTvl = lastSnapshot.totalValueLockedUSD;
    startBlock = lastSnapshot.blockNumber;
  }
  const currentSnapshot = updateVaultDailySnapshot(block, vault);
  let currentTotalRevenue = currentSnapshot.totalValueLockedUSD.minus(lastTvl);
  for (let i = 0; i < vault.deposits.length; i++) {
    const deposit = DepositEntity.load(vault.deposits[i]);
    if (!deposit) continue;
    if (deposit.blockNumber <= startBlock || deposit.blockNumber > block.number)
      continue;
    currentTotalRevenue = currentTotalRevenue.minus(deposit.amountUSD);
  }
  for (let i = 0; i < vault.withdraws.length; i++) {
    const withdraw = WithdrawEntity.load(vault.withdraws[i]);
    if (!withdraw) continue;
    if (
      withdraw.blockNumber <= startBlock ||
      withdraw.blockNumber > block.number
    )
      continue;
    currentTotalRevenue = currentTotalRevenue.plus(withdraw.amountUSD);
  }
  let currentRevenueProtocolSide = BIGDECIMAL_ZERO;
  let currentRevenueSupplySide = currentTotalRevenue;
  let fee: VaultFee | null;
  for (let i = 0; i < vault.fees.length; i++) {
    fee = VaultFee.load(vault.fees[i]);
    if (fee) {
      if (fee.id == "PERFORMANCE_FEE-" + vault.id) {
        currentRevenueProtocolSide = currentTotalRevenue.times(
          fee.feePercentage
        );
        continue;
      }

      if (fee.id == "STRATEGIST_FEE-" + vault.id) {
        currentRevenueSupplySide = currentRevenueSupplySide.minus(
          currentTotalRevenue.times(fee.feePercentage)
        );
        continue;
      }

      if (fee.id == "MANAGEMENT_FEE-" + vault.id) {
        currentRevenueSupplySide = currentRevenueSupplySide.minus(
          currentTotalRevenue.times(fee.feePercentage)
        );
        continue;
      }
    }
  }
  return [
    currentRevenueProtocolSide,
    currentRevenueSupplySide,
    currentTotalRevenue,
  ];
}
