import {
  Address,
  BigDecimal,
  BigInt,
  ByteArray,
  Bytes,
  crypto,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import { Transfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as StableTransfer } from "../../../generated/templates/StableDebtToken/StableDebtToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";
import { AaveOracle } from "../../../generated/LendingPool/AaveOracle";
import {
  CollateralConfigurationChanged,
  ReserveFactorChanged,
  ReserveActive,
  ReserveBorrowing,
  ReserveFrozen,
  ReserveInitialized,
  ReservePaused,
  LiquidationProtocolFeeChanged,
  FlashloanPremiumTotalUpdated,
  FlashloanPremiumToProtocolUpdated,
  SiloedBorrowingChanged,
} from "../../../generated/LendingPoolConfigurator/LendingPoolConfigurator";
import {
  Borrow,
  FlashLoan,
  LendingPool as LendingPoolContract,
  LiquidationCall,
  Repay,
  ReserveDataUpdated,
  ReserveUsedAsCollateralDisabled,
  ReserveUsedAsCollateralEnabled,
  Supply,
  SwapBorrowRateMode,
  Withdraw,
  UserEModeSet,
  MintedToTreasury,
} from "../../../generated/LendingPool/LendingPool";
import { Market, _DefaultOracle } from "../../../generated/schema";
import {
  AAVE_DECIMALS,
  getNetworkSpecificConstant,
  InterestRateMode,
  Protocol,
  BALANCE_TRANSFER_DATA_TYPE,
  BALANCE_TRANSFER_SIGNATURE,
  USDC_TOKEN_ADDRESS,
} from "./constants";
import {
  _handleBorrow,
  _handleBorrowingDisabledOnReserve,
  _handleBorrowingEnabledOnReserve,
  _handleCollateralConfigurationChanged,
  _handleDeposit,
  _handleFlashLoan,
  _handleFlashloanPremiumToProtocolUpdated,
  _handleFlashloanPremiumTotalUpdated,
  _handleLiquidate,
  _handleLiquidationProtocolFeeChanged,
  _handleMintedToTreasury,
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
  _handleWithdraw,
} from "../../../src/mapping";
import {
  BIGINT_ONE_RAY,
  BIGINT_TEN,
  BIGINT_ZERO,
  INT_FOUR,
  INT_ONE,
  INT_ZERO,
} from "../../../src/constants";

import { DataManager, ProtocolData } from "../../../src/sdk/manager";
import {
  readValue,
  getMarketFromToken,
  exponentToBigDecimal,
  getOrCreateFlashloanPremium,
  getBorrowBalances,
} from "../../../src/helpers";
import {
  LendingType,
  CollateralizationType,
  PermissionType,
  RiskType,
  InterestRateType,
  PositionSide,
  INT_152,
  INT_THIRTY_TWO,
} from "../../../src/sdk/constants";
import { AccountManager } from "../../../src/sdk/account";
import { IPriceOracleGetter } from "../../../generated/LendingPool/IPriceOracleGetter";

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
    event.params.newReserveFactor.times(BIGINT_TEN),
    protocolData
  );
}

export function handleLiquidationProtocolFeeChanged(
  event: LiquidationProtocolFeeChanged
): void {
  _handleLiquidationProtocolFeeChanged(
    event.params.asset,
    event.params.newFee,
    protocolData
  );
}

export function handleFlashloanPremiumTotalUpdated(
  event: FlashloanPremiumTotalUpdated
): void {
  const rate = event.params.newFlashloanPremiumTotal
    .toBigDecimal()
    .div(exponentToBigDecimal(INT_FOUR));

  _handleFlashloanPremiumTotalUpdated(rate, protocolData);
}

export function handleFlashloanPremiumToProtocolUpdated(
  event: FlashloanPremiumToProtocolUpdated
): void {
  const rate = event.params.newFlashloanPremiumToProtocol
    .toBigDecimal()
    .div(exponentToBigDecimal(INT_FOUR));
  _handleFlashloanPremiumToProtocolUpdated(rate, protocolData);
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
    manager.getOracleAddress(),
    event.transaction.hash.toHexString()
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
  // determine whether the borrow position is in isolated mode
  // borrow in isolated mode will have an IsolationModeTotalDebtUpdated event emitted
  // before the Borrow event
  // https://github.com/aave/aave-v3-core/blob/29ff9b9f89af7cd8255231bc5faf26c3ce0fb7ce/contracts/protocol/libraries/logic/BorrowLogic.sol#L139
  let isIsolated = false;
  const receipt = event.receipt;
  if (!receipt) {
    log.warning(
      "[handleBorrow]No receipt for tx {}; cannot set isIsolated flag",
      [event.transaction.hash.toHexString()]
    );
  } else {
    isIsolated = getIsIsolatedFlag(event);
  }

  let interestRateType: InterestRateType | null = null;
  if (event.params.interestRateMode === InterestRateMode.STABLE) {
    interestRateType = InterestRateType.STABLE;
  } else if (event.params.interestRateMode === InterestRateMode.VARIABLE) {
    interestRateType = InterestRateType.VARIABLE;
  }

  _handleBorrow(
    event,
    event.params.amount,
    event.params.reserve,
    protocolData,
    event.params.onBehalfOf,
    interestRateType,
    isIsolated
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
  const collateralMarket = getMarketFromToken(
    event.params.collateralAsset,
    protocolData
  );
  if (!collateralMarket) {
    log.error("[handleLiquidationCall]Failed to find market for asset {}", [
      event.params.collateralAsset.toHexString(),
    ]);
    return;
  }

  if (!collateralMarket._liquidationProtocolFee) {
    storeLiquidationProtocolFee(
      collateralMarket,
      event.address,
      event.params.collateralAsset
    );
  }

  let balanceTransferValue = BIGINT_ZERO;
  let balanceTransferIndex = BIGINT_ZERO;
  if (event.receipt) {
    const logs = event.receipt!.logs;
    for (let i = 0; i < logs.length; i++) {
      const thisLog = logs[i];
      if (!thisLog.topics.length) continue;

      if (thisLog.topics[0] == BALANCE_TRANSFER_SIGNATURE) {
        const decoded = ethereum.decode(
          BALANCE_TRANSFER_DATA_TYPE,
          thisLog.data
        );
        if (!decoded) return;

        const logData = decoded.toTuple();
        balanceTransferValue = logData[INT_ZERO].toBigInt();
        balanceTransferIndex = logData[INT_ONE].toBigInt();
      }
    }
  }
  const balanceTransferAmount = balanceTransferValue.times(
    balanceTransferIndex.div(BIGINT_ONE_RAY)
  );

  _handleLiquidate(
    event,
    event.params.liquidatedCollateralAmount,
    event.params.collateralAsset,
    protocolData,
    event.params.liquidator,
    event.params.user,
    event.params.debtAsset,
    event.params.debtToCover,
    balanceTransferAmount
  );
}

export function handleFlashloan(event: FlashLoan): void {
  const flashloanPremium = getOrCreateFlashloanPremium(protocolData);

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

export function handleMintedToTreasury(event: MintedToTreasury): void {
  _handleMintedToTreasury(
    event,
    protocolData,
    event.params.reserve,
    event.params.amountMinted
  );
}

/////////////////////////
//// Transfer Events ////
/////////////////////////

export function handleCollateralTransfer(event: CollateralTransfer): void {
  // determine the transfer amount because different versions of the AToken contract
  // pass discounted and undiscounted amount to Transfer() and BalanceTransfer() event
  // here we get the higher of the two amount and use it as the transfer amount
  // e.g. https://arbiscan.io/tx/0x7ee837a19f37f0f74acb75be2eb07de85adcf1fcca1b66e8d2118958ce4fe8a1#eventlog
  // logIndex 18 and 21
  let amount = event.params.value;
  const receipt = event.receipt;
  if (!receipt) {
    log.warning("[handleBorrow]No receipt for tx {}", [
      event.transaction.hash.toHexString(),
    ]);
  } else {
    const btAmount = getBalanceTransferAmount(event);
    amount = btAmount.gt(amount) ? btAmount : amount;
  }

  _handleTransfer(
    event,
    protocolData,
    PositionSide.COLLATERAL,
    event.params.to,
    event.params.from,
    amount
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

export function handleSwapBorrowRateMode(event: SwapBorrowRateMode): void {
  const interestRateMode = event.params.interestRateMode;
  if (
    ![InterestRateMode.STABLE, InterestRateMode.VARIABLE].includes(
      event.params.interestRateMode
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
    return;
  }
  const interestRateType =
    event.params.interestRateMode === InterestRateMode.STABLE
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

export function handleSiloedBorrowingChanged(
  event: SiloedBorrowingChanged
): void {
  const market = getMarketFromToken(event.params.asset, protocolData);
  if (!market) {
    log.error("[handleSiloedBorrowingChanged]market not found for token {}", [
      event.params.asset.toHexString(),
    ]);
    return;
  }
  market._siloedBorrowing = event.params.newState;
  market.save();
}

export function handleUserEModeSet(event: UserEModeSet): void {
  const account = new AccountManager(event.params.user).getAccount();
  account._eMode = true;
  account.save();
}

///////////////////
///// Helpers /////
///////////////////

function getAssetPriceInUSDC(
  tokenAddress: Address,
  priceOracle: Address,
  hash: string
): BigDecimal {
  const oracle = AaveOracle.bind(priceOracle);
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

  // if (equalsIgnoreCase(dataSource.network(), Network.ETHERLINK_MAINNET)) {
  const priceUSDCInEth = readValue<BigInt>(
    oracle.try_getAssetPrice(Address.fromString(USDC_TOKEN_ADDRESS)),
    BIGINT_ZERO
  );

  //   if (priceUSDCInEth.equals(BIGINT_ZERO)) {
  //     return BIGDECIMAL_ZERO;
  //   } else {
  const retval1 = oracleResult
    .toBigDecimal()
    .div(priceUSDCInEth.toBigDecimal());

  //     return retval;
  //   }
  // }

  const retval2 = oracleResult
    .toBigDecimal()
    .div(exponentToBigDecimal(AAVE_DECIMALS));

  log.warning(
    "[getAssetPriceInUSDC] token: {} res: {} usdcineth: {} r1: {} r2: {} tx: {}",
    [
      tokenAddress.toHexString(),
      oracleResult.toString(),
      priceUSDCInEth.toString(),
      retval1.toString(),
      retval2.toString(),
      hash,
    ]
  );

  return retval2;
  // return BIGDECIMAL_ZERO;
}

function storeLiquidationProtocolFee(
  market: Market,
  poolAddress: Address,
  reserve: Address
): void {
  // Store LiquidationProtocolFee if not set, as setLiquidationProtocolFee() may be never called
  // and no LiquidationProtocolFeeChanged event is emitted
  // see https://github.com/aave/aave-v3-core/blob/1e46f1cbb7ace08995cb4c8fa4e4ece96a243be3/contracts/protocol/libraries/configuration/ReserveConfiguration.sol#L491
  // for how to decode configuration data to get _liquidationProtocolFee
  const liquidationProtocolFeeMask =
    "0xFFFFFFFFFFFFFFFFFFFFFF0000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
  const liquidationProtocolFeeStartBitPosition = INT_152 as u8;
  const pool = LendingPoolContract.bind(poolAddress);
  const poolConfigData = pool.getConfiguration(reserve).data;
  const liquidationProtocolFee = decodeConfig(
    poolConfigData,
    liquidationProtocolFeeMask,
    liquidationProtocolFeeStartBitPosition
  )
    .toBigDecimal()
    .div(exponentToBigDecimal(INT_FOUR));

  log.info("[storeLiquidationProtocolFee]market {} liquidationProtocolFee={}", [
    market.id.toHexString(),
    liquidationProtocolFee.toString(),
  ]);
  market._liquidationProtocolFee = liquidationProtocolFee;
  market.save();
}

function decodeConfig(
  storedData: BigInt,
  maskStr: string,
  startBitPosition: u8
): BigInt {
  // aave-v3 stores configuration in packed bits (ReserveConfiguration.sol)
  // decoding them by applying a bit_not mask and right shift by startBitPosition
  // see https://github.com/aave/aave-v3-core/blob/1e46f1cbb7ace08995cb4c8fa4e4ece96a243be3/contracts/protocol/libraries/configuration/ReserveConfiguration.sol#L491
  // for how to decode configuration data to get _liquidationProtocolFee

  const maskArray = new Uint8Array(INT_THIRTY_TWO);
  maskArray.set(Bytes.fromHexString(maskStr));
  // BITWISE NOT
  for (let i = 0; i < maskArray.length; i++) {
    maskArray[i] = ~maskArray[i];
  }
  // reverse for little endian
  const configMaskBigInt = BigInt.fromUnsignedBytes(
    Bytes.fromUint8Array(maskArray.reverse())
  );

  const config = storedData
    .bitAnd(configMaskBigInt)
    .rightShift(startBitPosition);

  return config;
}

function getIsIsolatedFlag(event: ethereum.Event): boolean {
  let isIsolated = false;
  const ISOLATE_MODE = "IsolationModeTotalDebtUpdated(address,uint256)";
  const eventSignature = crypto.keccak256(ByteArray.fromUTF8(ISOLATE_MODE));
  const logs = event.receipt!.logs;
  //IsolationModeTotalDebtUpdated emitted before Borrow's event.logIndex
  // e.g. https://etherscan.io/tx/0x4b038b26555d4b6c057cd612057b39e6482a7c60eb44058ee61d299332efdf29#eventlog
  const eventLogIndex = event.logIndex;
  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs[i];
    if (thisLog.topics.length > INT_ZERO) {
      if (thisLog.logIndex.gt(eventLogIndex)) {
        // no IsolationModeTotalDebtUpdated log before Borrow
        break;
      }
      // topics[0] - signature
      const logSignature = thisLog.topics[0];
      if (thisLog.address == event.address && logSignature == eventSignature) {
        log.info(
          "[getIsIsolatedFlag]found IsolationModeTotalDebtUpdated event isolated=true tx {}",
          [event.transaction.hash.toHexString()]
        );
        isIsolated = true;
        break;
      }
    }
  }
  return isIsolated;
}

function getBalanceTransferAmount(event: ethereum.Event): BigInt {
  let btAmount = BIGINT_ZERO;
  const BALANCE_TRANSFER =
    "BalanceTransfer(address, address, uint256, uint256)";
  const eventSignature = crypto.keccak256(ByteArray.fromUTF8(BALANCE_TRANSFER));
  const logs = event.receipt!.logs;
  // BalanceTransfer emitted after Transfer's event.logIndex
  // e.g. https://arbiscan.io/tx/0x7ee837a19f37f0f74acb75be2eb07de85adcf1fcca1b66e8d2118958ce4fe8a1#eventlog
  const eventLogIndex = event.logIndex;
  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs[i];
    if (thisLog.topics.length > INT_ZERO) {
      if (thisLog.logIndex.le(eventLogIndex)) {
        // skip event with logIndex < event.logIndex
        continue;
      }
      // topics[0] - signature
      const logSignature = thisLog.topics[0];
      if (thisLog.address == event.address && logSignature == eventSignature) {
        const UINT256_UINT256 = "(uint256,uint256)";
        const decoded = ethereum.decode(UINT256_UINT256, thisLog.data);
        if (!decoded) continue;

        const logData = decoded.toTuple();
        btAmount = logData[0].toBigInt();
        log.info(
          "[handleCollateralTransfer] BalanceTransfer amount= {} tx {}",
          [btAmount.toString(), event.transaction.hash.toHexString()]
        );
        break;
      }
    }
  }
  return btAmount;
}
