import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  AAVE_DECIMALS,
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
  LiquidationCall,
  Paused,
  Repay,
  ReserveDataUpdated,
  ReserveUsedAsCollateralDisabled,
  ReserveUsedAsCollateralEnabled,
  Unpaused,
  Withdraw,
} from "../../../generated/LendingPool/LendingPool";
import { AToken } from "../../../generated/LendingPool/AToken";
import {
  ProtocolData,
  _handleBorrow,
  _handleBorrowingDisabledOnReserve,
  _handleBorrowingEnabledOnReserve,
  _handleCollateralConfigurationChanged,
  _handleDeposit,
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
  _handleTransfer,
  _handleUnpaused,
  _handleWithdraw,
} from "../../../src/mapping";
import {
  getOrCreateLendingProtocol,
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../src/helpers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  equalsIgnoreCase,
  exponentToBigDecimal,
  Network,
  PositionSide,
  readValue,
  RewardTokenType,
  SECONDS_PER_DAY,
} from "../../../src/constants";
import { Market } from "../../../generated/schema";
import { AaveIncentivesController } from "../../../generated/LendingPool/AaveIncentivesController";
import { StakedAave } from "../../../generated/LendingPool/StakedAave";
import { IPriceOracleGetter } from "../../../generated/LendingPool/IPriceOracleGetter";
import { Transfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as StableTransfer } from "../../../generated/templates/StableDebtToken/StableDebtToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";

function getProtocolData(): ProtocolData {
  const constants = getNetworkSpecificConstant();
  return new ProtocolData(
    constants.protocolAddress.toHexString(),
    Protocol.NAME,
    Protocol.SLUG,
    constants.network
  );
}

///////////////////////////////////////////////
///// LendingPoolAddressProvider Handlers /////
///////////////////////////////////////////////

export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  _handlePriceOracleUpdated(event.params.newAddress, getProtocolData());
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
    getProtocolData(),
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
    getProtocolData()
  );
}

export function handleBorrowingEnabledOnReserve(
  event: BorrowingEnabledOnReserve
): void {
  _handleBorrowingEnabledOnReserve(event.params.asset, getProtocolData());
}

export function handleBorrowingDisabledOnReserve(
  event: BorrowingDisabledOnReserve
): void {
  _handleBorrowingDisabledOnReserve(event.params.asset, getProtocolData());
}

export function handleReserveActivated(event: ReserveActivated): void {
  _handleReserveActivated(event.params.asset, getProtocolData());
}

export function handleReserveDeactivated(event: ReserveDeactivated): void {
  _handleReserveDeactivated(event.params.asset, getProtocolData());
}

export function handleReserveFactorChanged(event: ReserveFactorChanged): void {
  _handleReserveFactorChanged(
    event.params.asset,
    event.params.factor,
    getProtocolData()
  );
}

/////////////////////////////////
///// Lending Pool Handlers /////
/////////////////////////////////

export function handleReserveDataUpdated(event: ReserveDataUpdated): void {
  const protocolData = getProtocolData();
  const protocol = getOrCreateLendingProtocol(protocolData);

  // update rewards if there is an incentive controller
  const market = Market.load(event.params.reserve.toHexString());
  if (!market) {
    log.warning("[handleReserveDataUpdated] Market not found", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }

  //
  // Reward rate (rewards/second) in a market comes from try_assets(to)
  // Supply side the to address is the aToken
  // Borrow side the to address is the variableDebtToken

  const aTokenContract = AToken.bind(Address.fromString(market.outputToken!));
  const tryIncentiveController = aTokenContract.try_getIncentivesController();
  if (!tryIncentiveController.reverted) {
    const incentiveControllerContract = AaveIncentivesController.bind(
      tryIncentiveController.value
    );
    const tryBorrowRewards = incentiveControllerContract.try_assets(
      Address.fromString(market.vToken!)
    );
    const trySupplyRewards = incentiveControllerContract.try_assets(
      Address.fromString(market.outputToken!)
    );
    const tryRewardAsset = incentiveControllerContract.try_REWARD_TOKEN();

    if (!tryRewardAsset.reverted) {
      // get reward tokens
      const borrowRewardToken = getOrCreateRewardToken(
        tryRewardAsset.value,
        RewardTokenType.BORROW
      );
      const depositRewardToken = getOrCreateRewardToken(
        tryRewardAsset.value,
        RewardTokenType.DEPOSIT
      );

      // always ordered [borrow, deposit/supply]
      const rewardTokens = [borrowRewardToken.id, depositRewardToken.id];
      const rewardEmissions = [BIGINT_ZERO, BIGINT_ZERO];
      const rewardEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      const rewardDecimals = getOrCreateToken(tryRewardAsset.value).decimals;

      // get reward token price
      // get price of reward token (if stkAAVE it is tied to the price of AAVE)
      let rewardTokenPriceUSD = BIGDECIMAL_ZERO;
      if (equalsIgnoreCase(dataSource.network(), Network.MAINNET)) {
        // get staked token if possible to grab price of staked token
        const stakedTokenContract = StakedAave.bind(tryRewardAsset.value);
        const tryStakedToken = stakedTokenContract.try_STAKED_TOKEN();
        if (!tryStakedToken.reverted) {
          rewardTokenPriceUSD = getAssetPriceInUSDC(
            tryStakedToken.value,
            Address.fromString(protocol.priceOracle)
          );
        }
      }

      // if reward token price was not found then use old method
      if (rewardTokenPriceUSD.equals(BIGDECIMAL_ZERO)) {
        rewardTokenPriceUSD = getAssetPriceInUSDC(
          tryRewardAsset.value,
          Address.fromString(protocol.priceOracle)
        );
      }

      // we check borrow first since it will show up first in graphql ordering
      // see explanation in docs/Mapping.md#Array Sorting When Querying
      if (!tryBorrowRewards.reverted) {
        // update borrow rewards
        const borrowRewardsPerDay = tryBorrowRewards.value.value0.times(
          BigInt.fromI32(SECONDS_PER_DAY)
        );
        rewardEmissions[0] = borrowRewardsPerDay;
        const borrowRewardsPerDayUSD = borrowRewardsPerDay
          .toBigDecimal()
          .div(exponentToBigDecimal(rewardDecimals))
          .times(rewardTokenPriceUSD);
        rewardEmissionsUSD[0] = borrowRewardsPerDayUSD;
      }

      if (!trySupplyRewards.reverted) {
        // update deposit rewards
        const supplyRewardsPerDay = trySupplyRewards.value.value0.times(
          BigInt.fromI32(SECONDS_PER_DAY)
        );
        rewardEmissions[1] = supplyRewardsPerDay;
        const supplyRewardsPerDayUSD = supplyRewardsPerDay
          .toBigDecimal()
          .div(exponentToBigDecimal(rewardDecimals))
          .times(rewardTokenPriceUSD);
        rewardEmissionsUSD[1] = supplyRewardsPerDayUSD;
      }

      market.rewardTokens = rewardTokens;
      market.rewardTokenEmissionsAmount = rewardEmissions;
      market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
      market.save();
    }
  }

  const assetPriceUSD = getAssetPriceInUSDC(
    Address.fromString(market.inputToken),
    Address.fromString(protocol.priceOracle)
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
    getProtocolData()
  );
}

export function handleReserveUsedAsCollateralDisabled(
  event: ReserveUsedAsCollateralDisabled
): void {
  // This Event handler disables a reserve/market being used as collateral
  _handleReserveUsedAsCollateralDisabled(
    event.params.reserve,
    event.params.user,
    getProtocolData()
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handlePaused(event: Paused): void {
  _handlePaused(getProtocolData());
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleUnpaused(event: Unpaused): void {
  _handleUnpaused(getProtocolData());
}

export function handleDeposit(event: Deposit): void {
  _handleDeposit(
    event,
    event.params.amount,
    event.params.reserve,
    getProtocolData(),
    event.params.onBehalfOf
  );
}

export function handleWithdraw(event: Withdraw): void {
  _handleWithdraw(
    event,
    event.params.amount,
    event.params.reserve,
    getProtocolData(),
    event.params.user
  );
}

export function handleBorrow(event: Borrow): void {
  _handleBorrow(
    event,
    event.params.amount,
    event.params.reserve,
    getProtocolData(),
    event.params.onBehalfOf
  );
}

export function handleRepay(event: Repay): void {
  _handleRepay(
    event,
    event.params.amount,
    event.params.reserve,
    getProtocolData(),
    event.params.user
  );
}

export function handleLiquidationCall(event: LiquidationCall): void {
  _handleLiquidate(
    event,
    event.params.liquidatedCollateralAmount,
    event.params.collateralAsset,
    getProtocolData(),
    event.params.liquidator,
    event.params.user,
    event.params.debtAsset
  );
}

/////////////////////////
//// Transfer Events ////
/////////////////////////

export function handleCollateralTransfer(event: CollateralTransfer): void {
  _handleTransfer(
    event,
    getProtocolData(),
    PositionSide.LENDER,
    event.params.to,
    event.params.from
  );
}

export function handleVariableTransfer(event: VariableTransfer): void {
  _handleTransfer(
    event,
    getProtocolData(),
    PositionSide.BORROWER,
    event.params.to,
    event.params.from
  );
}

export function handleStableTransfer(event: StableTransfer): void {
  _handleTransfer(
    event,
    getProtocolData(),
    PositionSide.BORROWER,
    event.params.to,
    event.params.from
  );
}

///////////////////
///// Helpers /////
///////////////////

function getAssetPriceInUSDC(
  tokenAddress: Address,
  priceOracle: Address
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
    const priceUSDCInEth = readValue<BigInt>(
      oracle.try_getAssetPrice(Address.fromString(USDC_POS_TOKEN_ADDRESS)),
      BIGINT_ZERO
    );

    if (priceUSDCInEth.equals(BIGINT_ZERO)) {
      return BIGDECIMAL_ZERO;
    } else {
      return oracleResult.toBigDecimal().div(priceUSDCInEth.toBigDecimal());
    }
  }

  // Avalanche Oracle return the price offset by 8 decimals
  if (equalsIgnoreCase(dataSource.network(), Network.AVALANCHE)) {
    return oracleResult.toBigDecimal().div(exponentToBigDecimal(AAVE_DECIMALS));
  }

  // last resort, should not be touched
  const inputToken = getOrCreateToken(tokenAddress);
  return oracleResult
    .toBigDecimal()
    .div(exponentToBigDecimal(inputToken.decimals));
}
