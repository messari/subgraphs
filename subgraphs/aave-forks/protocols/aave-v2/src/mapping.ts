import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  AAVE_DECIMALS,
  FLASHLOAN_PREMIUM_TOTAL,
  getNetworkSpecificConstant,
  Protocol,
  USDC_POS_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS,
} from "./constants";
import {
  BorrowingDisabledOnReserve,
  BorrowingEnabledOnReserve,
  CollateralConfigurationChanged,
  ReserveActivated,
  ReserveDeactivated,
  ReserveFactorChanged,
  ReserveInitialized,
} from "../../../generated/LendingPoolConfigurator/LendingPoolConfigurator";
import {
  Borrow,
  Deposit,
  FlashLoan,
  LiquidationCall,
  Paused,
  Repay,
  ReserveDataUpdated,
  ReserveUsedAsCollateralDisabled,
  ReserveUsedAsCollateralEnabled,
  Unpaused,
  Withdraw,
  Swap,
} from "../../../generated/LendingPool/LendingPool";
import { AToken } from "../../../generated/LendingPool/AToken";
import {
  _handleBorrow,
  _handleBorrowingDisabledOnReserve,
  _handleBorrowingEnabledOnReserve,
  _handleCollateralConfigurationChanged,
  _handleDeposit,
  _handleFlashLoan,
  _handleLiquidate,
  _handlePaused,
  _handlePriceOracleUpdated,
  _handleRepay,
  _handleReserveActivated,
  _handleReserveDataUpdated,
  _handleReserveDeactivated,
  _handleReserveFactorChanged,
  _handleReserveInitialized,
  _handleReserveUsedAsCollateralDisabled,
  _handleReserveUsedAsCollateralEnabled,
  _handleSwapBorrowRateMode,
  _handleTransfer,
  _handleUnpaused,
  _handleWithdraw,
} from "../../../src/mapping";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  InterestRateMode,
  Network,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { Token, _DefaultOracle } from "../../../generated/schema";
import { AaveIncentivesController } from "../../../generated/LendingPool/AaveIncentivesController";
import { StakedAave } from "../../../generated/LendingPool/StakedAave";
import { IPriceOracleGetter } from "../../../generated/LendingPool/IPriceOracleGetter";
import { BalanceTransfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as StableTransfer } from "../../../generated/templates/StableDebtToken/StableDebtToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";
import {
  DataManager,
  ProtocolData,
  RewardData,
} from "../../../src/sdk/manager";
import {
  equalsIgnoreCase,
  exponentToBigDecimal,
  getBorrowBalances,
  getMarketFromToken,
  getOrCreateFlashloanPremium,
  readValue,
} from "../../../src/helpers";
import {
  CollateralizationType,
  InterestRateType,
  LendingType,
  PermissionType,
  PositionSide,
  RewardTokenType,
  RiskType,
} from "../../../src/sdk/constants";
import { TokenManager } from "../../../src/sdk/token";

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

///////////////////////////////////////////////
///// LendingPoolAddressProvider Handlers /////
///////////////////////////////////////////////

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  _handlePriceOracleUpdated(event.params.newAddress, protocolData, event);
}

//////////////////////////////////////
///// Lending Pool Configuration /////
//////////////////////////////////////

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

export function handleBorrowingEnabledOnReserve(
  event: BorrowingEnabledOnReserve
): void {
  _handleBorrowingEnabledOnReserve(event.params.asset, protocolData);
}

export function handleBorrowingDisabledOnReserve(
  event: BorrowingDisabledOnReserve
): void {
  _handleBorrowingDisabledOnReserve(event.params.asset, protocolData);
}

export function handleReserveActivated(event: ReserveActivated): void {
  _handleReserveActivated(event.params.asset, protocolData);
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  _handleReserveDeactivated(event.params.asset, protocolData);
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  _handleReserveFactorChanged(
    event.params.asset,
    event.params.factor,
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

  updateRewards(manager, event);

  const assetPriceUSD = getAssetPriceInUSDC(
    Address.fromBytes(market.inputToken),
    manager.getOracleAddress(),
    event.block.number
  );

  _handleReserveDataUpdated(
    event,
    event.params.liquidityRate,
    event.params.liquidityIndex,
    event.params.variableBorrowIndex,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handlePaused(event: Paused): void {
  _handlePaused(protocolData);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleUnpaused(event: Unpaused): void {
  _handleUnpaused(protocolData);
}

export function handleDeposit(event: Deposit): void {
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

export function handleFlashloan(event: FlashLoan): void {
  const flashloanPremium = getOrCreateFlashloanPremium(protocolData);
  flashloanPremium.premiumRateTotal = FLASHLOAN_PREMIUM_TOTAL;
  flashloanPremium.save();

  _handleFlashLoan(
    event.params.asset,
    event.params.amount,
    event.params.initiator,
    protocolData,
    event,
    event.params.premium,
    flashloanPremium
  );
}

export function handleSwapBorrowRateMode(event: Swap): void {
  const interestRateMode = event.params.rateMode.toI32();
  if (
    ![InterestRateMode.STABLE, InterestRateMode.VARIABLE].includes(
      interestRateMode
    )
  ) {
    log.error(
      "[handleSwapBorrowRateMode]interestRateMode {} is not one of [{}, {}]",
      [
        interestRateMode.toString(),
        InterestRateMode.STABLE.toString(),
        InterestRateMode.VARIABLE.toString(),
      ]
    );
    return;
  }

  const interestRateType =
    interestRateMode === InterestRateMode.STABLE
      ? InterestRateType.STABLE
      : InterestRateType.VARIABLE;
  const market = getMarketFromToken(event.params.reserve, protocolData);
  if (!market) {
    log.error("[handleLiquidationCall]Failed to find market for asset {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  const newBorrowBalances = getBorrowBalances(market, event.params.user);
  _handleSwapBorrowRateMode(
    event,
    market,
    event.params.user,
    newBorrowBalances,
    interestRateType,
    protocolData
  );
}

/////////////////////////
//// Transfer Events ////
/////////////////////////

export function handleCollateralTransfer(event: CollateralTransfer): void {
  _handleTransfer(
    event,
    protocolData,
    PositionSide.COLLATERAL,
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
  priceOracle: Address,
  blockNumber: BigInt
): BigDecimal {
  const oracle = IPriceOracleGetter.bind(priceOracle);
  let oracleResult = readValue<BigInt>(
    oracle.try_getAssetPrice(tokenAddress),
    BIGINT_ZERO
  );

  // if the result is zero or less, try the fallback oracle
  if (!oracleResult.gt(BIGINT_ZERO)) {
    const tryFallback = oracle.try_getFallbackOracle();
    if (tryFallback) {
      const fallbackOracle = IPriceOracleGetter.bind(tryFallback.value);
      oracleResult = readValue<BigInt>(
        fallbackOracle.try_getAssetPrice(tokenAddress),
        BIGINT_ZERO
      );
    }
  }

  // Mainnet Oracles return the price in eth, must convert to USD through the following method
  if (equalsIgnoreCase(dataSource.network(), Network.MAINNET)) {
    const priceUSDCInEth = readValue<BigInt>(
      oracle.try_getAssetPrice(Address.fromString(USDC_TOKEN_ADDRESS)),
      BIGINT_ZERO
    );

    if (priceUSDCInEth.equals(BIGINT_ZERO)) {
      return BIGDECIMAL_ZERO;
    } else {
      return oracleResult.toBigDecimal().div(priceUSDCInEth.toBigDecimal());
    }
  }

  // Polygon Oracle returns price in ETH, must convert to USD with following method
  if (equalsIgnoreCase(dataSource.network(), Network.MATIC)) {
    // there was misprice at block 15783457 that affects 2 transactions
    // we will override the price at this block to $1.55615781978
    // this price is derived using the following method on that block using historical contract calls
    // The contract calls return 634291527055835 / 407601027988722 = our new price
    const MISPRICE_BLOCK_NUMBER = 15783457;
    if (blockNumber.equals(BigInt.fromI32(MISPRICE_BLOCK_NUMBER))) {
      return BigDecimal.fromString("1.55615781978");
    }

    const priceUSDCInEth = readValue<BigInt>(
      oracle.try_getAssetPrice(Address.fromString(USDC_POS_TOKEN_ADDRESS)),
      BIGINT_ZERO
    );

    if (priceUSDCInEth.equals(BIGINT_ZERO)) {
      return BIGDECIMAL_ZERO;
    } else {
      // USD price = token oracle result / USDC POS oracle result
      return oracleResult.toBigDecimal().div(priceUSDCInEth.toBigDecimal());
    }
  }

  // Avalanche Oracle return the price offset by 8 decimals
  if (equalsIgnoreCase(dataSource.network(), Network.AVALANCHE)) {
    return oracleResult.toBigDecimal().div(exponentToBigDecimal(AAVE_DECIMALS));
  }

  // last resort, should not be touched
  const inputToken = Token.load(tokenAddress);
  if (!inputToken) {
    log.warning(
      "[getAssetPriceInUSDC]token {} not found in Token entity; return BIGDECIMAL_ZERO",
      [tokenAddress.toHexString()]
    );
    return BIGDECIMAL_ZERO;
  }
  return oracleResult
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));
}

function updateRewards(manager: DataManager, event: ethereum.Event): void {
  // Reward rate (rewards/second) in a market comes from try_assets(to)
  // Supply side the to address is the aToken
  // Borrow side the to address is the variableDebtToken
  const market = manager.getMarket();
  const aTokenContract = AToken.bind(Address.fromBytes(market.outputToken!));
  const tryIncentiveController = aTokenContract.try_getIncentivesController();
  if (tryIncentiveController.reverted) {
    log.warning(
      "[updateRewards]getIncentivesController() call for aToken {} is reverted",
      [market.outputToken!.toHexString()]
    );
    return;
  }
  const incentiveControllerContract = AaveIncentivesController.bind(
    tryIncentiveController.value
  );
  const tryBorrowRewards = incentiveControllerContract.try_assets(
    Address.fromBytes(market._vToken!)
  );
  const trySupplyRewards = incentiveControllerContract.try_assets(
    Address.fromBytes(market.outputToken!)
  );
  const tryRewardAsset = incentiveControllerContract.try_REWARD_TOKEN();

  if (tryRewardAsset.reverted) {
    log.warning(
      "[updateRewards]REWARD_TOKEN() call for AaveIncentivesController contract {} is reverted",
      [tryIncentiveController.value.toHexString()]
    );
    return;
  }
  // create reward tokens
  const tokenManager = new TokenManager(tryRewardAsset.value, event);
  const rewardToken = tokenManager.getToken();
  const vBorrowRewardToken = tokenManager.getOrCreateRewardToken(
    RewardTokenType.VARIABLE_BORROW
  );
  const sBorrowRewardToken = tokenManager.getOrCreateRewardToken(
    RewardTokenType.STABLE_BORROW
  );
  const depositRewardToken = tokenManager.getOrCreateRewardToken(
    RewardTokenType.DEPOSIT
  );

  const rewardDecimals = rewardToken.decimals;
  const defaultOracle = _DefaultOracle.load(protocolData.protocolID);
  // get reward token price
  // get price of reward token (if stkAAVE it is tied to the price of AAVE)
  let rewardTokenPriceUSD = BIGDECIMAL_ZERO;
  if (
    equalsIgnoreCase(dataSource.network(), Network.MAINNET) &&
    defaultOracle &&
    defaultOracle.oracle
  ) {
    // get staked token if possible to grab price of staked token
    const stakedTokenContract = StakedAave.bind(tryRewardAsset.value);
    const tryStakedToken = stakedTokenContract.try_STAKED_TOKEN();
    if (!tryStakedToken.reverted) {
      rewardTokenPriceUSD = getAssetPriceInUSDC(
        tryStakedToken.value,
        Address.fromBytes(defaultOracle.oracle),
        event.block.number
      );
    }
  }

  // if reward token price was not found then use old method
  if (
    rewardTokenPriceUSD.equals(BIGDECIMAL_ZERO) &&
    defaultOracle &&
    defaultOracle.oracle
  ) {
    rewardTokenPriceUSD = getAssetPriceInUSDC(
      tryRewardAsset.value,
      Address.fromBytes(defaultOracle.oracle),
      event.block.number
    );
  }

  // we check borrow first since it will show up first in graphql ordering
  // see explanation in docs/Mapping.md#Array Sorting When Querying
  if (!tryBorrowRewards.reverted) {
    // update borrow rewards
    const borrowRewardsPerDay = tryBorrowRewards.value.value0.times(
      BigInt.fromI32(SECONDS_PER_DAY)
    );
    const borrowRewardsPerDayUSD = borrowRewardsPerDay
      .toBigDecimal()
      .div(exponentToBigDecimal(rewardDecimals))
      .times(rewardTokenPriceUSD);

    const vBorrowRewardData = new RewardData(
      vBorrowRewardToken,
      borrowRewardsPerDay,
      borrowRewardsPerDayUSD
    );
    const sBorrowRewardData = new RewardData(
      sBorrowRewardToken,
      borrowRewardsPerDay,
      borrowRewardsPerDayUSD
    );
    manager.updateRewards(vBorrowRewardData);
    manager.updateRewards(sBorrowRewardData);
  }

  if (!trySupplyRewards.reverted) {
    // update deposit rewards
    const supplyRewardsPerDay = trySupplyRewards.value.value0.times(
      BigInt.fromI32(SECONDS_PER_DAY)
    );
    const supplyRewardsPerDayUSD = supplyRewardsPerDay
      .toBigDecimal()
      .div(exponentToBigDecimal(rewardDecimals))
      .times(rewardTokenPriceUSD);
    const depositRewardData = new RewardData(
      depositRewardToken,
      supplyRewardsPerDay,
      supplyRewardsPerDayUSD
    );
    manager.updateRewards(depositRewardData);
  }
}
