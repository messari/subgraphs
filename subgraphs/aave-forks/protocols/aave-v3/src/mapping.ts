import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  log,
  Bytes,
  crypto,
  ByteArray,
  ethereum,
} from "@graphprotocol/graph-ts";
import { PriceOracleUpdated } from "../../../generated/LendingPoolAddressesProvider/LendingPoolAddressesProvider";
import {
  AAVE_DECIMALS,
  getNetworkSpecificConstant,
  InterestRateMode,
  Protocol,
  USDC_POS_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS,
} from "./constants";
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
import {
  _handleAssetConfigUpdated,
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
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  Network,
  INT_FOUR,
} from "../../../src/constants";
import {
  getMarketFromToken,
  readValue,
  equalsIgnoreCase,
  exponentToBigDecimal,
  getOrCreateFlashloanPremium,
  getBorrowBalances,
} from "../../../src/helpers";
import { Market, _DefaultOracle } from "../../../generated/schema";
import { AssetConfigUpdated } from "../../../generated/RewardsController/RewardsController";
import { Transfer as CollateralTransfer } from "../../../generated/templates/AToken/AToken";
import { Transfer as StableTransfer } from "../../../generated/templates/StableDebtToken/StableDebtToken";
import { Transfer as VariableTransfer } from "../../../generated/templates/VariableDebtToken/VariableDebtToken";
import { IPriceOracleGetter } from "../../../generated/LendingPool/IPriceOracleGetter";
import { AaveOracle } from "../../../generated/LendingPool/AaveOracle";
import { DataManager, ProtocolData } from "../../../src/sdk/manager";
import {
  CollateralizationType,
  INT_152,
  INT_SIXTY_FOUR,
  INT_TEN,
  INT_THIRTY_TWO,
  InterestRateType,
  LendingType,
  PermissionType,
  PositionSide,
  RiskType,
} from "../../../src/sdk/constants";
import { AccountManager } from "../../../src/sdk/account";

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
///// PoolAddressProvider Handlers /////
///////////////////////////////////////////////r
export function handlePriceOracleUpdated(event: PriceOracleUpdated): void {
  _handlePriceOracleUpdated(event.params.newAddress, protocolData, event);
}

///////////////////////////////////////////////
///// RewardController Handlers /////
///////////////////////////////////////////////
export function handleAssetConfigUpdated(event: AssetConfigUpdated): void {
  // it is not clear which market.oracle should be used,
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
      Address.fromBytes(defaultOracle.oracle),
      event.block.number
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

///////////////////////////////////////////////
///// PoolConfigurator Handlers /////
///////////////////////////////////////////////
export function handleReserveInitialized(event: ReserveInitialized): void {
  // This function handles market entity from reserve creation event
  // Attempt to load or create the market implementation

  _handleReserveInitialized(
    event,
    event.params.asset, //input Token/underlying asset
    event.params.aToken, //output Token
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
  // rate is in 1/10000 (bps)
  const rate = event.params.newFlashloanPremiumTotal
    .toBigDecimal()
    .div(exponentToBigDecimal(INT_FOUR));
  _handleFlashloanPremiumTotalUpdated(rate, protocolData);
}

export function handleFlashloanPremiumToProtocolUpdated(
  event: FlashloanPremiumToProtocolUpdated
): void {
  // rate is in 1/10000 (bps)
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
    log.warning("[handleReserveDataUpdated]Market not found for reserve {}", [
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
    event.block.number
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
  // decode reserve factor from contract storage
  // as there may be no ReserveFactorChanged event emitted
  const market = getMarketFromToken(event.params.reserve, protocolData);
  if (!market) {
    log.error("[handleBorrow]Failed to find market for asset {}", [
      event.params.reserve.toHexString(),
    ]);
    return;
  }
  storeReserveFactor(market, event.address, event.params.reserve);
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

export function handleSwapBorrowRateMode(event: SwapBorrowRateMode): void {
  const interestRateMode = event.params.interestRateMode;
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
    log.warning("[handleCollateralTransfer]No receipt for tx {}", [
      event.transaction.hash.toHexString(),
    ]);
  } else if (
    ![event.params.from, event.params.to].includes(Address.zero()) &&
    ![event.params.from, event.params.to].includes(event.address)
  ) {
    // only try to find BalanceTransfer amount for non-burn/mint event
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
  blockNumber: BigInt
): BigDecimal {
  const oracle = AaveOracle.bind(priceOracle);
  const priceDecimals = readValue<BigInt>(
    oracle.try_BASE_CURRENCY_UNIT(),
    BigInt.fromI32(INT_TEN).pow(AAVE_DECIMALS as u8)
  ).toBigDecimal();

  const oracleResult = readValue<BigInt>(
    oracle.try_getAssetPrice(tokenAddress),
    BIGINT_ZERO
  );

  if (oracleResult.gt(BIGINT_ZERO)) {
    return oracleResult.toBigDecimal().div(priceDecimals);
  }

  //fall back to v2 price oracle
  return getAssetPriceFallback(tokenAddress, priceOracle, blockNumber);
}

function getAssetPriceFallback(
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
  return oracleResult.toBigDecimal().div(exponentToBigDecimal(AAVE_DECIMALS));
}

function storeReserveFactor(
  market: Market,
  poolAddress: Address,
  reserve: Address
): void {
  // Set reserveFactor if not set, as setReserveFactor() may be never called
  // and no ReserveFactorChanged event is emitted
  if (market.reserveFactor || market.reserveFactor!.gt(BIGDECIMAL_ZERO)) {
    // we should only need to do this when market.reserveFactor is not set or equal to 0.0
    // changing reserveFactor config should emit ReserveFactorChanged event and handled
    // by handleReserveFactorChanged
    return;
  }
  // see https://github.com/aave/aave-v3-core/blob/1e46f1cbb7ace08995cb4c8fa4e4ece96a243be3/contracts/protocol/libraries/configuration/ReserveConfiguration.sol#L377
  // for how to decode configuration data to get reserve factor
  const reserveFactorMask =
    "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000FFFFFFFFFFFFFFFF";
  const reserveFactorStartBitPosition = INT_SIXTY_FOUR as u8;

  const pool = LendingPoolContract.bind(poolAddress);
  const poolConfigData = pool.getConfiguration(reserve).data;
  const reserveFactor = decodeConfig(
    poolConfigData,
    reserveFactorMask,
    reserveFactorStartBitPosition
  )
    .toBigDecimal()
    .div(exponentToBigDecimal(INT_FOUR)); // reserveFactor in bps, 1/10000

  log.info("[setReserveFactor]reserveFactor set to {}", [
    reserveFactor.toString(),
  ]);
  market.reserveFactor = reserveFactor;
  market.save();
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
  const reserveFactorStartBitPosition = INT_152 as u8;

  const pool = LendingPoolContract.bind(poolAddress);
  const poolConfigData = pool.getConfiguration(reserve).data;
  const liquidationProtocolFee = decodeConfig(
    poolConfigData,
    liquidationProtocolFeeMask,
    reserveFactorStartBitPosition
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
  log.info(
    "[getBalanceTransferAmount]tx {}-{},logs.length={},event.logIndex={}",
    [
      event.transaction.hash.toHexString(),
      event.logIndex.toString(),
      logs.length.toString(),
      eventLogIndex.toString(),
    ]
  );
  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs[i];
    if (thisLog.logIndex.le(eventLogIndex)) {
      // skip event with logIndex < event.logIndex
      continue;
    }
    // topics[0] - signature
    const logSignature = thisLog.topics[0];
    if (thisLog.address == event.address && logSignature == eventSignature) {
      const UINT256_UINT256 = "(uint256,uint256)";
      const decoded = ethereum.decode(UINT256_UINT256, thisLog.data)!.toTuple();
      btAmount = decoded[0].toBigInt();

      break;
    }
  }
  return btAmount;
}
