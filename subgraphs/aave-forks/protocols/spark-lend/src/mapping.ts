import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import { AssetConfigUpdated } from "../../../generated/RewardsController/RewardsController";
import { Transfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as StableTransfer } from "../../../generated/templates/StableDebtToken/StableDebtToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";
import { AaveOracle } from "../../../generated/RewardsController/AaveOracle";
import {
  CollateralConfigurationChanged,
  ReserveFactorChanged,
  ReserveActive,
  ReserveBorrowing,
  ReserveFrozen,
  ReserveInitialized,
  ReservePaused,
} from "../../../generated/LendingPoolConfigurator/LendingPoolConfigurator";
import {
  Borrow,
  LiquidationCall,
  Repay,
  ReserveDataUpdated,
  ReserveUsedAsCollateralDisabled,
  ReserveUsedAsCollateralEnabled,
  Supply,
  Withdraw,
} from "../../../generated/LendingPool/LendingPool";
import { _DefaultOracle } from "../../../generated/schema";
import {
  AAVE_DECIMALS,
  getNetworkSpecificConstant,
  Protocol,
} from "./constants";
import {
  _handleAssetConfigUpdated,
  _handleBorrow,
  _handleBorrowingDisabledOnReserve,
  _handleBorrowingEnabledOnReserve,
  _handleCollateralConfigurationChanged,
  _handleDeposit,
  _handleLiquidate,
  _handlePriceOracleUpdated,
  _handleRepay,
  _handleReserveActivated,
  _handleReserveDataUpdated,
  _handleReserveDeactivated,
  _handleReserveFactorChanged,
  _handleReserveInitialized,
  _handleReserveUsedAsCollateralDisabled,
  _handleReserveUsedAsCollateralEnabled,
  _handleTransfer,
  _handleWithdraw,
} from "../../../src/mapping";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  PositionSide,
} from "../../../src/constants";

import { DataManager, ProtocolData } from "../../../src/sdk/manager";
import { readValue, getMarketFromToken } from "../../../src/helpers";
import {
  LendingType,
  CollateralizationType,
  PermissionType,
  RiskType,
} from "../../../src/sdk/constants";

function getProtocolData(): ProtocolData {
  const constants = getNetworkSpecificConstant();
  return new ProtocolData(
    constants.protocolAddress,
    Protocol.PROTOCOL,
    Protocol.NAME,
    Protocol.SLUG,
    constants.network,
    LendingType.POOLED,
    PermissionType.PERMISSIONLESS,
    PermissionType.PERMISSIONLESS,
    PermissionType.ADMIN,
    CollateralizationType.OVER_COLLATERALIZED,
    RiskType.GLOBAL
  );
}

const protocolData = getProtocolData();

////////////////////////////////////////
///// PoolAddressProvider Handlers /////
////////////////////////////////////////

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  _handlePriceOracleUpdated(event.params.newAddress, protocolData, event);
}

/////////////////////////////////////
///// RewardController Handlers /////
/////////////////////////////////////

export function handleAssetConfigUpdated(event: AssetConfigUpdated): void {
  // it is not clear which market.oracle shouild we use
  // use the protocol-wide defaultOracle
  const defaultOracle = _DefaultOracle.load(protocolData.protocolID);
  let rewardTokenPriceUSD = BIGDECIMAL_ZERO;
  if (!defaultOracle || !defaultOracle.oracle) {
    log.warning(
      "[handleAssetConfigUpdated]_DefaultOracle for {} not set; rewardTokenPriceUSD set to default 0.0",
      [protocolData.protocolID.toHexString()]
    );
  } else {
    rewardTokenPriceUSD = getAssetPriceInUSDC(
      event.params.reward,
      Address.fromBytes(defaultOracle.oracle)
    );
  }

  _handleAssetConfigUpdated(
    event,
    event.params.asset,
    event.params.reward,
    rewardTokenPriceUSD,
    event.params.newEmission,
    event.params.newDistributionEnd,
    protocolData
  );
}

/////////////////////////////////////
///// PoolConfigurator Handlers /////
/////////////////////////////////////

export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market entity from reserve creation event
  // Attempt to load or create the market implementation

  _handleReserveInitialized(
    event,
    event.params.asset,
    event.params.aToken,
    event.params.variableDebtToken,
    protocolData,
    event.params.stableDebtToken
  );
}

export function handleCollateralConfigurationChanged(
  event: CollateralConfigurationChanged
): void {
  _handleCollateralConfigurationChanged(
    event.params.asset,
    event.params.liquidationBonus,
    event.params.liquidationThreshold,
    event.params.ltv,
    protocolData
  );
}

export function handleReserveActive(event: ReserveActive): void {
  _handleReserveActivated(event.params.asset, protocolData);
}

export function handleReserveBorrowing(event: ReserveBorrowing): void {
  if (event.params.enabled) {
    _handleBorrowingEnabledOnReserve(event.params.asset, protocolData);
  } else {
    _handleBorrowingDisabledOnReserve(event.params.asset, protocolData);
  }
}

export function handleReserveFrozen(event: ReserveFrozen): void {
  _handleReserveDeactivated(event.params.asset, protocolData);
}

export function handleReservePaused(event: ReservePaused): void {
  _handleReserveDeactivated(event.params.asset, protocolData);
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  _handleReserveFactorChanged(
    event.params.asset,
    event.params.newReserveFactor,
    protocolData
  );
}

/////////////////////////////////
///// Lending Pool Handlers /////
/////////////////////////////////

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  const market = getMarketFromToken(event.params.reserve, protocolData);
  if (!market) {
    log.warning("[handleReserveDataUpdated] Market not found for reserve {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }
  const manager = new DataManager(
    market.id,
    market.inputToken,
    event,
    protocolData
  );

  const assetPriceUSD = getAssetPriceInUSDC(
    Address.fromBytes(market.inputToken),
    manager.getOracleAddress()
  );

  _handleReserveDataUpdated(
    event,
    event.params.liquidityRate,
    event.params.liquidityIndex,
    event.params.variableBorrowRate,
    event.params.stableBorrowRate,
    protocolData,
    event.params.reserve,
    assetPriceUSD
  );
}

export function handleReserveUsedAsCollateralEnabled(
  event: ReserveUsedAsCollateralEnabled
): void {
  // This Event handler enables a reserve/market to be used as collateral
  _handleReserveUsedAsCollateralEnabled(
    event.params.reserve,
    event.params.user,
    protocolData
  );
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  // This Event handler disables a reserve/market being used as collateral
  _handleReserveUsedAsCollateralDisabled(
    event.params.reserve,
    event.params.user,
    protocolData
  );
}

export function handleDeposit(event: Supply): void {
  _handleDeposit(
    event,
    event.params.amount,
    event.params.reserve,
    protocolData,
    event.params.onBehalfOf
  );
}

export function handleWithdraw(event: Withdraw): void {
  _handleWithdraw(
    event,
    event.params.amount,
    event.params.reserve,
    protocolData,
    event.params.user
  );
}

export function handleBorrow(event: Borrow): void {
  _handleBorrow(
    event,
    event.params.amount,
    event.params.reserve,
    protocolData,
    event.params.onBehalfOf
  );
}

export function handleRepay(event: Repay): void {
  _handleRepay(
    event,
    event.params.amount,
    event.params.reserve,
    protocolData,
    event.params.user
  );
}

export function handleLiquidationCall(event: LiquidationCall): void {
  _handleLiquidate(
    event,
    event.params.liquidatedCollateralAmount,
    event.params.collateralAsset,
    protocolData,
    event.params.liquidator,
    event.params.user,
    event.params.debtAsset,
    event.params.debtToCover
  );
}

/////////////////////////
//// Transfer Events ////
/////////////////////////

export function handleCollateralTransfer(event: CollateralTransfer): void {
  _handleTransfer(
    event,
    protocolData,
    PositionSide.LENDER,
    event.params.to,
    event.params.from,
    event.params.value
  );
}

export function handleVariableTransfer(event: VariableTransfer): void {
  _handleTransfer(
    event,
    protocolData,
    PositionSide.BORROWER,
    event.params.to,
    event.params.from,
    event.params.value
  );
}

export function handleStableTransfer(event: StableTransfer): void {
  _handleTransfer(
    event,
    protocolData,
    PositionSide.BORROWER,
    event.params.to,
    event.params.from,
    event.params.value
  );
}

///////////////////
///// Helpers /////
///////////////////

function getAssetPriceInUSDC(
  tokenAddress: Address,
  priceOracle: Address
): BigDecimal {
  const oracle = AaveOracle.bind(priceOracle);
  const baseUnit = readValue<BigInt>(
    oracle.try_BASE_CURRENCY_UNIT(),
    BigInt.fromI32(10).pow(AAVE_DECIMALS as u8)
  ).toBigDecimal();

  const oracleResult = readValue<BigInt>(
    oracle.try_getAssetPrice(tokenAddress),
    BIGINT_ZERO
  );

  if (oracleResult.gt(BIGINT_ZERO)) {
    return oracleResult.toBigDecimal().div(baseUnit);
  }

  // fall price oracle unimplemented

  return BIGDECIMAL_ZERO;
}

/*
function getOrCreateRewardToken(
  tokenAddress: Address,
  rewardTokenType: string,
  interestRateType: string,
  distributionEnd: BigInt
): RewardToken {
  const token = getOrCreateToken(tokenAddress);
  // deposit-variable-0x123, borrow-stable-0x123, borrow-variable-0x123
  const id = `${rewardTokenType}-${interestRateType}-${token.id}`;

  let rewardToken = RewardToken.load(id);
  if (!rewardToken) {
    rewardToken = new RewardToken(id);
    rewardToken.token = token.id;
    rewardToken.type = rewardTokenType;
  }
  rewardToken._distributionEnd = distributionEnd;
  rewardToken.save();

  return rewardToken;
}

export function updateMarketRewards(
  event: ethereum.Event,
  market: Market,
  rewardToken: RewardToken,
  emissionRate: BigInt
): void {
  let rewardTokens = market.rewardTokens;
  let rewardTokenEmissions = market.rewardTokenEmissionsAmount;
  let rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;

  if (rewardTokens == null) {
    rewardTokens = [];
    rewardTokenEmissions = [];
    rewardTokenEmissionsUSD = [];
  }

  let rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  if (rewardTokenIndex == -1) {
    rewardTokenIndex = rewardTokens.push(rewardToken.id) - 1;
    rewardTokenEmissions!.push(BIGINT_ZERO);
    rewardTokenEmissionsUSD!.push(BIGDECIMAL_ZERO);
  }
  rewardTokenEmissions![rewardTokenIndex] = emissionRate.times(
    BigInt.fromI32(SECONDS_PER_DAY)
  );
  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = rewardTokenEmissions;
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  market.save();

  sortRewardTokens(market);
  updateMarketRewardEmissions(market, event);
}

function updateMarketRewardEmissions(
  market: Market,
  event: ethereum.Event
): void {
  if (market.rewardTokens == null) {
    return;
  }

  const protocol = getOrCreateLendingProtocol(protocolData);
  const rewardTokens = market.rewardTokens!;
  const rewardEmissions = market.rewardTokenEmissionsAmount!;
  const rewardEmissionsUSD = market.rewardTokenEmissionsUSD!;
  for (let i = 0; i < rewardTokens.length; i++) {
    const rewardToken = RewardToken.load(rewardTokens[i])!;
    if (event.block.timestamp.gt(rewardToken._distributionEnd!)) {
      rewardEmissions[i] = BIGINT_ZERO;
      rewardEmissionsUSD[i] = BIGDECIMAL_ZERO;
    } else {
      const token = Token.load(rewardToken.token)!;
      let rewardTokenPriceUSD = token.lastPriceUSD;
      rewardTokenPriceUSD = getAssetPriceInUSDC(
        Address.fromString(token.id),
        Address.fromString(protocol._priceOracle)
      );

      rewardEmissionsUSD[i] = rewardEmissions[i]
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(rewardTokenPriceUSD);
    }
  }
  market.rewardTokenEmissionsAmount = rewardEmissions;
  market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
  market.save();
}

function sortRewardTokens(market: Market): void {
  if (market.rewardTokens!.length <= 1) {
    return;
  }

  const tokens = market.rewardTokens;
  const emissions = market.rewardTokenEmissionsAmount;
  const emissionsUSD = market.rewardTokenEmissionsUSD;
  multiArraySort(tokens!, emissions!, emissionsUSD!);

  market.rewardTokens = tokens;
  market.rewardTokenEmissionsAmount = emissions;
  market.rewardTokenEmissionsUSD = emissionsUSD;
  market.save();
}

function multiArraySort(
  ref: Array<string>,
  arr1: Array<BigInt>,
  arr2: Array<BigDecimal>
): void {
  if (ref.length != arr1.length || ref.length != arr2.length) {
    // cannot sort
    log.error("[multiArraySort] cannot sort arrays. Array reference: {}", [
      ref.toString()
    ]);
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < ref.length; i++) {
    sorter[i] = [ref[i], arr1[i].toString(), arr2[i].toString()];
  }

  sorter.sort(function(a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    ref[i] = sorter[i][0];
    arr1[i] = BigInt.fromString(sorter[i][1]);
    arr2[i] = BigDecimal.fromString(sorter[i][2]);
  }
}
*/
