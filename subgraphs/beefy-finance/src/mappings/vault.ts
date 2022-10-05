import { Address, log } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import { Vault, VaultFee } from "../../generated/schema";
import {
  BeefyStrategy,
  Deposit,
  StratHarvest,
  StratHarvest1,
  StratHarvest2,
  Withdraw,
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
import { createDeposit } from "./deposit";
import { createWithdraw } from "./withdraw";
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
import { updateVaultSnapshots } from "../utils/snapshots";

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

// export function handleDeposit(event: Deposit): void {
//   const vault = getOrCreateVault(event.address, event);
//   if (!vault) {
//     return;
//   }

//   const depositedAmount = event.params.tvl.minus(vault.inputTokenBalance);
//   createDeposit(event, depositedAmount, vault.id);

//   updateProtocolUsage(event, true, false);
// }

// export function handleWithdraw(event: Withdraw): void {
//   const vault = getOrCreateVault(event.address, event);
//   if (!vault) {
//     return;
//   }

//   const withdrawnAmount = event.params.tvl.minus(vault.inputTokenBalance);
//   createWithdraw(event, withdrawnAmount, vault.id);
// }

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

  const vault = getOrCreateVault(event.address, event);
  if (!vault) {
    log.warning("[handleTransfer] Vault not found: {}", [
      event.address.toHexString(),
    ]);
    return;
  }

  // check if a deposit
  // from address is null
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    // to get the deposited amount from the shares:
    // amount = (balance() * shares) / totalSupply()
  }

  // check if a withdraw
  // to address is null
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    // to get the withdrawn amount from the shares:
    //
    // calculate withdrawal fee if we need to pull inputTokens
    // from the strategy contract (use the )
    // TODO: calc withdrawal fee
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
  if (vault._strategyOutputToken) {
    const strategyOutputTokenContract = ERC20.bind(
      Address.fromString(vault._strategyOutputToken!)
    );

    const tryBalance =
      strategyOutputTokenContract.try_balanceOf(strategyAddress);
    if (tryBalance.reverted) {
      log.warning(
        "Failed to get balance of strategy output token in strategy contract: {}",
        [strategyAddress.toHexString()]
      );
      return;
    }

    // Optional 1- Check for _strategyOutputToken Balance to be > 0 in the Strategy Contract
    if (tryBalance.value.le(BIGINT_ZERO)) {
      log.warning(
        "No revenue to calculate because strategy output token balance is 0: {}",
        [strategyAddress.toHexString()]
      );
      return;
    }
  }

  // 2- Check that the native token balance of the Strategy Contract is > 0
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
      .minus(performanceFeeDelta)
      .times(nativeToken.lastPriceUSD!);
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
  }

  // udpate vault values and snapshots
  updateVaultAndSnapshots(vault, event);
}
