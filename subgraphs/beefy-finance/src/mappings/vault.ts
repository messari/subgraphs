import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import { Vault, VaultFee } from "../../generated/schema";
import {
  BeefyStrategy,
  StratHarvest,
  StratHarvest1,
  StratHarvest2,
} from "../../generated/Standard/BeefyStrategy";
import { BeefyVault } from "../../generated/Standard/BeefyVault";
import { Transfer } from "../../generated/templates/BeefyVault/BeefyVault";
import {
  getFees,
  getOrCreateFinancials,
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateVaultDailySnapshot,
} from "../utils/getters";
import { createDeposit, createWithdraw } from "./transaction";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../prices/common/constants";
import {
  updateProtocolRevenue,
  updateProtocolTVL,
  updateProtocolUsage,
} from "./protocol";
import { ERC20 } from "../../generated/Standard/ERC20";
import {
  BIGDECIMAL_HUNDRED,
  exponentToBigDecimal,
  ZERO_ADDRESS,
} from "../utils/constants";
import {
  updateUsageMetricsDailySnapshot,
  updateUsageMetricsHourlySnapshot,
  updateVaultSnapshots,
} from "../utils/metrics";

// This function updates the vault's metrics from contract calls
// This includes:
//   totalValueLockedUSD, inputTokenBalance, outputTokenSupply, outputTokenPriceUSD, pricePerShare
//
// Then it will update any snapshots with the latest metrics
export function updateVaultAndSnapshots(
  vault: Vault,
  event: ethereum.Event
): void {
  const vaultContract = BeefyVault.bind(Address.fromString(vault.id));

  const tryVaultBalance = vaultContract.try_balance();
  if (!tryVaultBalance.reverted) {
    vault.inputTokenBalance = tryVaultBalance.value;
  }

  const tryVaultTotalSupply = vaultContract.try_totalSupply();
  if (!tryVaultTotalSupply.reverted) {
    vault.outputTokenSupply = tryVaultTotalSupply.value;
  }

  const tryVaultPricePerShare = vaultContract.try_getPricePerFullShare();
  if (!tryVaultPricePerShare.reverted) {
    vault.pricePerShare = tryVaultPricePerShare.value;
  } else {
    // just in case getPricePerFullShare() is not implemented
    vault.pricePerShare = vault.inputTokenBalance.div(vault.outputTokenSupply!);
  }

  // update prices and TVL
  const inputToken = getOrCreateToken(
    Address.fromString(vault.inputToken),
    event.block
  ); // also updates price
  const outputToken = getOrCreateToken(
    Address.fromString(vault.outputToken!),
    event.block,
    true
  );
  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals))
    .times(inputToken.lastPriceUSD!);
  if (vault.outputTokenSupply!.gt(BIGINT_ZERO)) {
    vault.outputTokenPriceUSD = vault.totalValueLockedUSD.div(
      vault
        .outputTokenSupply!.toBigDecimal()
        .div(exponentToBigDecimal(outputToken.decimals))
    );
  } else {
    vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  }
  vault.save();

  // update snapshots
  const financialDailySnapshot = getOrCreateFinancials(event);
  financialDailySnapshot.totalValueLockedUSD = updateProtocolTVL();
  financialDailySnapshot.save();
  updateVaultSnapshots(event, vault);
}

// StratHarvest (includes tvl in params)
export function handleStratHarvestWithAmount(event: StratHarvest): void {
  updateRevenueFromHarvest(event, event.address);
}

// StratHarvest1 (just messge sender)
export function handleStratHarvest(event: StratHarvest1): void {
  updateRevenueFromHarvest(event, event.address);
}

// StratHarvest2 (harvester and timestamp)
export function handleStratHarvestWithTimestamp(event: StratHarvest2): void {
  updateRevenueFromHarvest(event, event.address);
}

export function handleTransfer(event: Transfer): void {
  // exit if not a deposit or withdraw
  // We can tell because the tokens are not sent to a 0 address
  if (
    event.params.to.toHexString() != ZERO_ADDRESS &&
    event.params.from.toHexString() != ZERO_ADDRESS
  ) {
    return;
  }

  const vaultContract = BeefyVault.bind(event.address);
  const tryStartegyAddress = vaultContract.try_strategy();
  if (tryStartegyAddress.reverted) {
    log.warning(
      "[handleTransfer] failed to get strategy address from vault: {}",
      [event.address.toHexString()]
    );
    return;
  }
  const vault = getOrCreateVault(tryStartegyAddress.value, event);
  if (!vault) {
    log.warning("[handleTransfer] Vault not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }

  const inputToken = getOrCreateToken(
    Address.fromString(vault.inputToken),
    event.block
  );
  const outputToken = getOrCreateToken(
    Address.fromString(vault.outputToken!),
    event.block,
    true
  );

  // to get the deposited/withdrawn amount from the shares:
  // amount = (balance() * shares) / totalSupply()
  // amount = inputTokenBalance * shares / outputTokenSupply
  let amountBI: BigInt;
  let amountUSD: BigDecimal;
  if (vault.outputTokenSupply!.equals(BIGINT_ZERO)) {
    amountBI = event.params.value;
    amountUSD = event.params.value
      .toBigDecimal()
      .div(exponentToBigDecimal(inputToken.decimals))
      .times(inputToken.lastPriceUSD!);
  } else {
    const amountBD = vault.inputTokenBalance
      .toBigDecimal()
      .div(exponentToBigDecimal(inputToken.decimals))
      .times(
        event.params.value
          .toBigDecimal()
          .div(exponentToBigDecimal(inputToken.decimals))
      )
      .div(
        vault
          .outputTokenSupply!.toBigDecimal()
          .div(exponentToBigDecimal(outputToken.decimals))
      );
    amountBI = BigInt.fromString(
      amountBD
        .times(exponentToBigDecimal(inputToken.decimals))
        .truncate(0)
        .toString()
    );
    amountUSD = amountBD.times(inputToken.lastPriceUSD!);
  }

  // handle deposit
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    createDeposit(
      event,
      event.params.to.toHexString(),
      vault.inputToken,
      amountBI,
      amountUSD,
      vault.id
    );

    updateProtocolUsage(event);
    updateUsageMetricsDailySnapshot(event, true, false);
    updateUsageMetricsHourlySnapshot(event, true, false);
  }

  // handle withdraw
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    // TODO: withdraw fee
    createWithdraw(
      event,
      event.params.from.toHexString(),
      vault.inputToken,
      amountBI,
      amountUSD,
      vault.id
    );

    updateProtocolUsage(event);
    updateUsageMetricsDailySnapshot(event, false, true);
    updateUsageMetricsHourlySnapshot(event, false, true);
  }
}

/////////////////
//// Helpers ////
/////////////////

// This helper function carries out the transformations of the Harvest event
// The harvest event is emitted from a Strategy Contract
// This event occurs when rebalancing / auto compounding occurs
// Fees are also generated from this event. This function will calculate:
//     protocolSideRevenue
//     supplySideRevenue
//     totalRevenue
function updateRevenueFromHarvest(
  event: ethereum.Event,
  strategyAddress: Address
): void {
  const vault = getOrCreateVault(strategyAddress, event);
  if (!vault) {
    log.warning("Vault not found for strategy {}", [
      strategyAddress.toHexString(),
    ]);
    return;
  }
  const strategyContract = BeefyStrategy.bind(strategyAddress);

  // 1- Check that the native token balance of the Strategy Contract is > 0
  const nativeTokenContract = ERC20.bind(
    Address.fromString(vault._nativeToken)
  );
  const tryNativeTokenBalance =
    nativeTokenContract.try_balanceOf(strategyAddress);
  if (tryNativeTokenBalance.reverted) {
    log.warning(
      "Failed to get balance of native token in strategy contract: {}",
      [strategyAddress.toHexString()]
    );
    return;
  }

  if (tryNativeTokenBalance.value.gt(BIGINT_ZERO)) {
    // at this point we charge the performance fee on this
    // whatever is left over after the performance fee is supplySideRevenue
    const nativeToken = getOrCreateToken(
      Address.fromString(vault._nativeToken),
      event.block
    ); // update price

    vault.fees = getFees(vault.id, strategyContract);
    vault.save();

    // fees are generally 4.5% performance fee
    const perfFee = VaultFee.load(vault.fees[0]);
    if (!perfFee) {
      log.warning("No perf fee found for vault {}", [vault.id]);
      return;
    }
    const performanceFeeNormalized =
      perfFee.feePercentage.div(BIGDECIMAL_HUNDRED);

    const performanceFeeDelta = tryNativeTokenBalance.value
      .toBigDecimal()
      .div(exponentToBigDecimal(nativeToken.decimals))
      .times(performanceFeeNormalized);
    const protocolSideRevenueDelta = performanceFeeDelta.times(
      nativeToken.lastPriceUSD!
    );
    const supplySideRevenueDelta = tryNativeTokenBalance.value
      .toBigDecimal()
      .div(exponentToBigDecimal(nativeToken.decimals))
      .times(nativeToken.lastPriceUSD!)
      .minus(performanceFeeDelta);
    const totalRevenueDelta = protocolSideRevenueDelta.plus(
      supplySideRevenueDelta
    );

    updateProtocolRevenue(
      protocolSideRevenueDelta,
      supplySideRevenueDelta,
      totalRevenueDelta,
      event
    );

    // update vault.dailyTotalRevenueUSD
    const vaultDailySnapshot = getOrCreateVaultDailySnapshot(vault.id, event);
    vaultDailySnapshot.dailyTotalRevenueUSD =
      vaultDailySnapshot.dailyTotalRevenueUSD.plus(totalRevenueDelta);
    vaultDailySnapshot.save();

    // TODO: remove
    log.warning(
      "HARVEST: {} nativeBal: {} supply side rev ${} protocol side rev ${}",
      [
        event.transaction.hash.toHexString(),
        tryNativeTokenBalance.value.toString(),
        supplySideRevenueDelta.toString(),
        protocolSideRevenueDelta.toString(),
      ]
    );
  }

  // udpate vault values and snapshots
  updateVaultAndSnapshots(vault, event);
}
