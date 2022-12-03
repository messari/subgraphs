import {
  Address,
  ethereum,
  BigInt,
  log,
  BigDecimal,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  AddAsset,
  CometDeployed,
  SetBaseTokenPriceFeed,
  SetBaseTrackingBorrowSpeed,
  SetBaseTrackingSupplySpeed,
  UpdateAsset,
  UpdateAssetBorrowCollateralFactor,
  UpdateAssetLiquidateCollateralFactor,
  UpdateAssetLiquidationFactor,
  UpdateAssetPriceFeed,
  UpdateAssetSupplyCap,
} from "../../../generated/Configurator/Configurator";
import {
  Comet,
  Supply,
  Withdraw,
  SupplyCollateral,
  WithdrawCollateral,
  AbsorbCollateral,
  TransferCollateral,
} from "../../../generated/templates/Comet/Comet";
import { ERC20 } from "../../../generated/templates/Comet/ERC20";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  bigIntToBigDecimal,
  BIGINT_ONE,
  BIGINT_ZERO,
  exponentToBigDecimal,
  InterestRateSide,
  InterestRateType,
  OracleSource,
  RewardTokenType,
  SECONDS_PER_DAY,
  SECONDS_PER_YEAR,
  TokenType,
} from "../../../src/sdk/constants";
import { MarketClass } from "../../../src/sdk/market";
import {
  BASE_INDEX_SCALE,
  COMPOUND_DECIMALS,
  ENCODED_TRANSFER_SIGNATURE,
  getProtocolData,
  ZERO_ADDRESS,
  DEFAULT_DECIMALS,
  REWARDS_ADDRESS,
  MARKET_PREFIX,
} from "./constants";
import { Comet as CometTemplate } from "../../../generated/templates";
import { Token } from "../../../generated/schema";
import { CometRewards } from "../../../generated/templates/Comet/CometRewards";
import { TokenClass } from "../../../src/sdk/token";

///////////////////////////////
///// Configurator Events /////
///////////////////////////////

//
//
// market creation
export function handleCometDeployed(event: CometDeployed): void {
  CometTemplate.create(event.params.cometProxy);

  // create base token market
  const cometContract = Comet.bind(event.params.cometProxy);
  const tryBaseToken = cometContract.try_baseToken();
  const tryBaseOracle = cometContract.try_baseTokenPriceFeed();
  const protocolData = getProtocolData();

  const baseTokenClass = new TokenClass(
    tryBaseToken.value,
    event,
    TokenType.REBASING
  );
  const baseToken = baseTokenClass.getToken();

  if (!tryBaseToken.reverted) {
    const baseMarketID = event.params.cometProxy.concat(tryBaseToken.value);
    const marketClass = new MarketClass(
      baseMarketID,
      tryBaseToken.value,
      event,
      protocolData
    );

    const marketEntity = marketClass.getMarket();
    marketEntity.canBorrowFrom = true;

    // update market
    marketEntity.name = MARKET_PREFIX.concat(baseToken.symbol)
      .concat(" - ")
      .concat(baseToken.name);
    marketEntity.outputToken = baseToken.id;
    marketEntity.outputTokenSupply = BIGINT_ZERO;
    marketEntity.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    marketEntity.exchangeRate = BIGDECIMAL_ONE;

    marketEntity.relation = event.params.cometProxy;
    marketEntity._baseTrackingBorrowSpeed = BIGINT_ZERO;
    marketEntity._baseTrackingSupplySpeed = BIGINT_ZERO;
    marketEntity.canBorrowFrom = true;
    marketEntity._baseBorrowIndex = BASE_INDEX_SCALE;

    // create base token Oracle
    if (!tryBaseOracle.reverted) {
      marketEntity.oracle = marketClass.getOrCreateOracle(
        tryBaseOracle.value,
        true,
        OracleSource.CHAINLINK
      ).id;
    }
    marketEntity.save();
  }

  // create collateral token markets
  let assetIndex = 0;
  let tryAssetInfo = cometContract.try_getAssetInfo(assetIndex);
  while (!tryAssetInfo.reverted) {
    const inputTokenID = tryAssetInfo.value.asset;
    const marketID = event.params.cometProxy.concat(inputTokenID);
    const marketClass = new MarketClass(
      marketID,
      inputTokenID,
      event,
      protocolData
    );
    const marketEntity = marketClass.getMarket();

    // add unique market fields
    marketEntity.name = MARKET_PREFIX.concat(baseToken.symbol)
      .concat(" - ")
      .concat(marketClass.getInputToken().name);
    marketEntity.canUseAsCollateral = true;
    marketEntity.maximumLTV = bigIntToBigDecimal(
      tryAssetInfo.value.borrowCollateralFactor,
      16
    );
    marketEntity.liquidationThreshold = bigIntToBigDecimal(
      tryAssetInfo.value.liquidateCollateralFactor,
      16
    );
    marketEntity.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
      bigIntToBigDecimal(tryAssetInfo.value.liquidationFactor, 16)
    );
    marketEntity.supplyCap = tryAssetInfo.value.supplyCap;
    marketEntity.relation = event.params.cometProxy;

    // create token Oracle
    marketEntity.oracle = marketClass.getOrCreateOracle(
      tryAssetInfo.value.priceFeed,
      true,
      OracleSource.CHAINLINK
    ).id;
    marketEntity.save();

    // get next asset info
    assetIndex++;
    tryAssetInfo = cometContract.try_getAssetInfo(assetIndex);
  }
}

//
//
// Add a new asset onto an existing market
export function handleAddAsset(event: AddAsset): void {
  const protocolData = getProtocolData();

  const inputTokenID = event.params.assetConfig.asset;
  const marketID = event.params.cometProxy.concat(inputTokenID);
  const marketClass = new MarketClass(
    marketID,
    inputTokenID,
    event,
    protocolData
  );
  const marketEntity = marketClass.getMarket();

  // add unique market fields
  marketEntity.canUseAsCollateral = true;
  marketEntity.maximumLTV = bigIntToBigDecimal(
    event.params.assetConfig.borrowCollateralFactor,
    16
  );
  marketEntity.liquidationThreshold = bigIntToBigDecimal(
    event.params.assetConfig.liquidateCollateralFactor,
    16
  );
  marketEntity.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
    bigIntToBigDecimal(event.params.assetConfig.liquidationFactor, 16)
  );
  marketEntity.supplyCap = event.params.assetConfig.supplyCap;
  marketEntity.relation = event.params.cometProxy;

  // create token Oracle
  marketEntity.oracle = marketClass.getOrCreateOracle(
    event.params.assetConfig.priceFeed,
    true,
    OracleSource.CHAINLINK
  ).id;
  marketEntity.save();
}

//
//
// Update the price feed for the base token
export function handleSetBaseTokenPriceFeed(
  event: SetBaseTokenPriceFeed
): void {
  const cometContract = Comet.bind(event.params.cometProxy);
  const tryBaseToken = cometContract.try_baseToken();
  if (tryBaseToken.reverted) {
    log.warning(
      "[handleSetBaseTokenPriceFeed] Base token not found for comet: {}",
      [event.params.cometProxy.toHexString()]
    );
    return;
  }

  const marketID = event.params.cometProxy.concat(tryBaseToken.value);
  const marketClass = new MarketClass(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  marketClass.getOrCreateOracle(
    event.params.newBaseTokenPriceFeed,
    true,
    OracleSource.CHAINLINK
  );
}

//
//
// Update the reward borrow speed
export function handleSetBaseTrackingBorrowSpeed(
  event: SetBaseTrackingBorrowSpeed
): void {
  const cometContract = Comet.bind(event.params.cometProxy);
  const tryBaseToken = cometContract.try_baseToken();
  if (tryBaseToken.reverted) {
    log.warning(
      "[handleSetBaseTrackingBorrowSpeed] Base token not found for comet: {}",
      [event.params.cometProxy.toHexString()]
    );
    return;
  }

  const marketID = event.params.cometProxy.concat(tryBaseToken.value);
  const marketClass = new MarketClass(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  const marketEntity = marketClass.getMarket();
  marketEntity._baseTrackingBorrowSpeed =
    event.params.newBaseTrackingBorrowSpeed;
  marketEntity.save();

  updateRewards(marketClass, event.address);
}

//
//
// Update the reward supply speed
export function handleSetBaseTrackingSupplySpeed(
  event: SetBaseTrackingSupplySpeed
): void {
  const cometContract = Comet.bind(event.params.cometProxy);
  const tryBaseToken = cometContract.try_baseToken();
  if (tryBaseToken.reverted) {
    log.warning(
      "[handleSetBaseTrackingBorrowSpeed] Base token not found for comet: {}",
      [event.params.cometProxy.toHexString()]
    );
    return;
  }

  const marketID = event.params.cometProxy.concat(tryBaseToken.value);
  const marketClass = new MarketClass(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  const marketEntity = marketClass.getMarket();
  marketEntity._baseTrackingSupplySpeed =
    event.params.newBaseTrackingSupplySpeed;
  marketEntity.save();

  updateRewards(marketClass, event.address);
}

//
//
// Update the AssetConfig for an existing asset
export function handleUpdateAsset(event: UpdateAsset): void {
  const marketID = event.params.cometProxy.concat(
    event.params.newAssetConfig.asset
  );
  const marketClass = new MarketClass(
    marketID,
    event.params.newAssetConfig.asset,
    event,
    getProtocolData()
  );
  const marketEntity = marketClass.getMarket();

  // update market fields
  marketEntity.canUseAsCollateral = true;
  marketEntity.maximumLTV = bigIntToBigDecimal(
    event.params.newAssetConfig.borrowCollateralFactor,
    16
  );
  marketEntity.liquidationThreshold = bigIntToBigDecimal(
    event.params.newAssetConfig.liquidateCollateralFactor,
    16
  );
  marketEntity.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
    bigIntToBigDecimal(event.params.newAssetConfig.liquidationFactor, 16)
  );
  marketEntity.supplyCap = event.params.newAssetConfig.supplyCap;
  marketEntity.save();
}

//
//
// Update the borrow collateral factor on a given collateral asset
export function handleUpdateAssetBorrowCollateralFactor(
  event: UpdateAssetBorrowCollateralFactor
): void {
  const marketID = event.params.cometProxy.concat(event.params.asset);
  const marketClass = new MarketClass(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const marketEntity = marketClass.getMarket();

  marketEntity.maximumLTV = bigIntToBigDecimal(event.params.newBorrowCF, 16);
  marketEntity.save();
}

//
//
// Update the liquidate collateral factor on a given collateral asset
export function handleUpdateAssetLiquidateCollateralFactor(
  event: UpdateAssetLiquidateCollateralFactor
): void {
  const marketID = event.params.cometProxy.concat(event.params.asset);
  const marketClass = new MarketClass(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const marketEntity = marketClass.getMarket();

  marketEntity.liquidationThreshold = bigIntToBigDecimal(
    event.params.newLiquidateCF,
    16
  );
  marketEntity.save();
}

//
//
// Update the liquidation factor on a given collateral asset
export function handleUpdateAssetLiquidationFactor(
  event: UpdateAssetLiquidationFactor
): void {
  const marketID = event.params.cometProxy.concat(event.params.asset);
  const marketClass = new MarketClass(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const marketEntity = marketClass.getMarket();

  marketEntity.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
    bigIntToBigDecimal(event.params.newLiquidationFactor, 16)
  );
  marketEntity.save();
}

//
//
// Update the price feed for a collateral asset
export function handleUpdateAssetPriceFeed(event: UpdateAssetPriceFeed): void {
  const marketID = event.params.cometProxy.concat(event.params.asset);
  const marketClass = new MarketClass(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );

  marketClass.getOrCreateOracle(
    event.params.newPriceFeed,
    true,
    OracleSource.CHAINLINK
  );
}

//
//
// Update the supply cap for a given collateral asset
export function handleUpdateAssetSupplyCap(event: UpdateAssetSupplyCap): void {
  const marketID = event.params.cometProxy.concat(event.params.asset);
  const marketClass = new MarketClass(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const marketEntity = marketClass.getMarket();

  marketEntity.supplyCap = event.params.newSupplyCap;
  marketEntity.save();
}

////////////////////////
///// Comet Events /////
////////////////////////

//
//
// Supplying the base token (could be a Deposit or Repay)
export function handleSupply(event: Supply): void {
  const cometContract = Comet.bind(event.address);
  const tryBaseToken = cometContract.try_baseToken();
  const marketID = event.address.concat(tryBaseToken.value);
  const market = new MarketClass(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const amount = event.params.amount;
  const token = updateMarketData(market);
  if (!token) {
    log.warning("[handleSupply] Could not find token {}", [
      tryBaseToken.value.toHexString(),
    ]);
    return;
  }
  updateRevenue(market, event.address);
  updateRewards(market, event.address);

  const mintAmount = isMint(event);
  if (!mintAmount) {
    // Repay only
    const repay = market.createRepay(
      tryBaseToken.value,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
    );
    repay.accountActor = accountActorID;
    repay.save();
  } else if (mintAmount.le(amount)) {
    // TODO ensure this is correct
    // deposit only
    const deposit = market.createDeposit(
      tryBaseToken.value,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
    );
    deposit.accountActor = accountActorID;
    deposit.save();
  } else {
    // mintAmount > amount
    // partial deposit and partial repay
    const repayAmount = amount.minus(mintAmount);
    const depositAmount = amount.minus(repayAmount);
    const repay = market.createRepay(
      tryBaseToken.value,
      accountID,
      repayAmount,
      bigIntToBigDecimal(repayAmount, token.decimals).times(token.lastPriceUSD!)
    );
    repay.accountActor = accountActorID;
    repay.save();

    const deposit = market.createDeposit(
      tryBaseToken.value,
      accountID,
      depositAmount,
      bigIntToBigDecimal(depositAmount, token.decimals).times(
        token.lastPriceUSD!
      )
    );
    deposit.accountActor = accountActorID;
    deposit.save();
  }
}

//
//
// Supplying collateral tokens
export function handleSupplyCollateral(event: SupplyCollateral): void {
  const marketID = event.address.concat(event.params.asset);
  const market = new MarketClass(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = updateMarketData(market);
  if (!token) {
    log.warning("[handleSupplyCollateral] Could not find token {}", [
      asset.toHexString(),
    ]);
    return;
  }
  updateRevenue(market, event.address);
  updateRewards(market, event.address);

  const deposit = market.createDeposit(
    asset,
    accountID,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
  );
  deposit.accountActor = accountActorID;
  deposit.save();
}

//
//
// withdraws baseToken (could be a Withdrawal or Borrow)
export function handleWithdraw(event: Withdraw): void {
  const cometContract = Comet.bind(event.address);
  const tryBaseToken = cometContract.try_baseToken();
  const marketID = event.address.concat(tryBaseToken.value);
  const market = new MarketClass(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const amount = event.params.amount;
  const token = updateMarketData(market);
  if (!token) {
    log.warning("[handleWithdraw] Could not find token {}", [
      tryBaseToken.value.toHexString(),
    ]);
    return;
  }
  updateRevenue(market, event.address);
  updateRewards(market, event.address);

  const burnAmount = isBurn(event);
  if (!burnAmount) {
    // Borrow only
    const borrow = market.createBorrow(
      tryBaseToken.value,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
    );
    borrow.accountActor = accountActorID;
    borrow.save();
  } else if (burnAmount.ge(amount)) {
    // withdraw only
    const withdraw = market.createWithdraw(
      tryBaseToken.value,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
    );
    withdraw.accountActor = accountActorID;
    withdraw.save();
  } else {
    // burnAmount < amount
    // partial withdraw and partial borrow
    const borrowAmount = amount.minus(burnAmount);
    const withdrawAmount = amount.minus(borrowAmount);
    const borrow = market.createBorrow(
      tryBaseToken.value,
      accountID,
      borrowAmount,
      bigIntToBigDecimal(borrowAmount, token.decimals).times(
        token.lastPriceUSD!
      )
    );
    borrow.accountActor = accountActorID;
    borrow.save();

    const withdraw = market.createWithdraw(
      tryBaseToken.value,
      accountID,
      withdrawAmount,
      bigIntToBigDecimal(withdrawAmount, token.decimals).times(
        token.lastPriceUSD!
      )
    );
    withdraw.accountActor = accountActorID;
    withdraw.save();
  }
}

//
//
// Withdraw collateral tokens (cannot be a Borrow)
export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const marketID = event.address.concat(event.params.asset);
  const market = new MarketClass(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = updateMarketData(market);
  if (!token) {
    log.warning("[handleWithdrawCollateral] Could not find token {}", [
      asset.toHexString(),
    ]);
    return;
  }
  updateRevenue(market, event.address);
  updateRewards(market, event.address);

  const withdraw = market.createWithdraw(
    asset,
    accountID,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
  );
  withdraw.accountActor = accountActorID;
  withdraw.save();
}

//
//
// Transfer user base tokens to another account
// Need to use callHandler
// export function handleTransfer(call: TransferBaseCall): void {
// TODO
// }

//
//
// Transfer user collateral to another account
export function handleTransferCollateral(event: TransferCollateral): void {
  const marketID = event.address.concat(event.params.asset);
  const market = new MarketClass(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const sender = event.params.from;
  const receiver = event.params.to;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = updateMarketData(market);
  if (!token) {
    log.warning("[handleWithdrawCollateral] Could not find token {}", [
      asset.toHexString(),
    ]);
    return;
  }
  // no revenue accrued during this event
  updateRewards(market, event.address);

  market.createTransfer(
    asset,
    sender,
    receiver,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
  );
}

//
//
// Sell liquidated collateral at a discount (of liquidation penalty)
export function handleAbsorbCollateral(event: AbsorbCollateral): void {
  const marketID = event.address.concat(event.params.asset);
  const market = new MarketClass(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const marketEntity = market.getMarket();
  const cometContract = Comet.bind(event.address);
  const liquidator = event.params.absorber;
  const borrower = event.params.borrower;
  const baseAsset = cometContract.baseToken();
  const amount = event.params.collateralAbsorbed;
  const amountUSD = bigIntToBigDecimal(amount, COMPOUND_DECIMALS);
  const liquidationPenalty =
    marketEntity.liquidationPenalty.div(BIGDECIMAL_HUNDRED);
  const profitUSD = amountUSD.times(liquidationPenalty);
  const token = updateMarketData(market);
  if (!token) {
    log.warning("[handleWithdrawCollateral] Could not find token {}", [
      baseAsset.toHexString(),
    ]);
    return;
  }
  updateRevenue(market, event.address);
  updateRewards(market, event.address);

  market.createLiquidate(
    baseAsset,
    liquidator,
    borrower,
    amount,
    amountUSD,
    profitUSD
  );
}

///////////////////
///// Helpers /////
///////////////////

function updateRewards(market: MarketClass, cometAddress: Address): void {
  const cometContract = Comet.bind(cometAddress);
  const tryTrackingIndexScale = cometContract.try_trackingIndexScale();
  const marketEntity = market.getMarket();
  const tryBaseToken = cometContract.try_baseToken();
  if (tryBaseToken.reverted) {
    log.error("[updateRewards] Could not get base token", []);
    return;
  }

  // skip rewards calc if not base token market
  if (market.getInputToken().id != tryBaseToken.value) {
    return;
  }

  const rewardContract = CometRewards.bind(Address.fromString(REWARDS_ADDRESS));
  const tryRewardConfig = rewardContract.try_rewardConfig(cometAddress);

  if (tryTrackingIndexScale.reverted || tryRewardConfig.reverted) {
    log.warning("[updateRewards] Contract call(s) reverted on market: {}", [
      marketEntity.id.toHexString(),
    ]);
    return;
  }

  const rewardToken = new TokenClass(
    tryRewardConfig.value.value0,
    market.event
  );
  const decimals = rewardToken.getToken().decimals;
  const borrowRewardToken = rewardToken.getOrCreateRewardToken(
    RewardTokenType.VARIABLE_BORROW
  );
  const supplyRewardToken = rewardToken.getOrCreateRewardToken(
    RewardTokenType.DEPOSIT
  );

  // Reward tokens emitted per day as follows:
  // tokens/day = (speed * SECONDS_PER_DAY) / trackingIndexScale
  const supplyRewardPerDay = BigInt.fromString(
    marketEntity
      ._baseTrackingBorrowSpeed!.times(BigInt.fromI64(SECONDS_PER_DAY))
      .div(tryTrackingIndexScale.value)
      .toBigDecimal()
      .times(exponentToBigDecimal(decimals))
      .truncate(0)
      .toString()
  );
  const borrowRewardPerDay = BigInt.fromString(
    marketEntity
      ._baseTrackingSupplySpeed!.times(BigInt.fromI64(SECONDS_PER_DAY))
      .div(tryTrackingIndexScale.value)
      .toBigDecimal()
      .times(exponentToBigDecimal(decimals))
      .truncate(0)
      .toString()
  );
  marketEntity.rewardTokenEmissionsAmount = [
    supplyRewardPerDay,
    borrowRewardPerDay,
  ]; // supply first to keep alphabetized
  const supplyRewardPerDayUSD = bigIntToBigDecimal(
    supplyRewardPerDay,
    decimals
  ).times(rewardToken.getPriceUSD());
  const borrowRewardPerDayUSD = bigIntToBigDecimal(
    borrowRewardPerDay,
    decimals
  ).times(rewardToken.getPriceUSD());
  marketEntity.rewardTokenEmissionsUSD = [
    supplyRewardPerDayUSD,
    borrowRewardPerDayUSD,
  ];
  marketEntity.rewardTokens = [supplyRewardToken.id, borrowRewardToken.id];
  marketEntity.save();
}

//
//
// update revenue (only can update base token market revenue)
function updateRevenue(market: MarketClass, cometAddress: Address): void {
  const cometContract = Comet.bind(cometAddress);
  const inputToken = market.getInputToken();
  if (cometContract.baseToken() != inputToken.id) {
    log.info(
      "[updateRevenue] Cannot update revenue for non-base token market",
      []
    );
    return;
  }
  const marketEntity = market.getMarket();
  // TODO use CometExt totalsBasic() for base token TVL and borrow amount
  const tryTotalsBasic = cometContract.try_totalsBasic();
  if (tryTotalsBasic.reverted) {
    log.warning("[updateRevenue] Could not get totalBasics()", []);
    return;
  }

  const totalBorrowBase = tryTotalsBasic.value.totalBorrowBase;
  const newBaseBorrowIndex = tryTotalsBasic.value.baseBorrowIndex;

  const baseBorrowIndexDiff = newBaseBorrowIndex.minus(
    marketEntity._baseBorrowIndex!
  );
  marketEntity._baseBorrowIndex = newBaseBorrowIndex;
  marketEntity.save();

  // the reserve factor is dynamic and is essentially
  // the spread between supply and borrow interest rates
  // reserveFactor = (borrowRate - supplyRate) / borrowRate
  const utilization = cometContract.getUtilization();
  const borrowRate = cometContract.getBorrowRate(utilization).toBigDecimal();
  const supplyRate = cometContract.getSupplyRate(utilization).toBigDecimal();
  const reserveFactor = borrowRate.minus(supplyRate).div(borrowRate);

  const totalRevenueDeltaUSD = baseBorrowIndexDiff
    .toBigDecimal()
    .div(BASE_INDEX_SCALE.toBigDecimal())
    .times(bigIntToBigDecimal(totalBorrowBase, inputToken.decimals))
    .times(inputToken.lastPriceUSD!);
  const protocolRevenueDeltaUSD = totalRevenueDeltaUSD.times(reserveFactor);
  const supplySideRevenueDeltaUSD = totalRevenueDeltaUSD.minus(
    protocolRevenueDeltaUSD
  );
  market.updateRevenue(
    totalRevenueDeltaUSD,
    protocolRevenueDeltaUSD,
    supplySideRevenueDeltaUSD
  );
}

//
//
// Updates market TVL, borrows, prices
// @return inputToken
function updateMarketData(market: MarketClass): Token {
  const marketEntity = market.getMarket();
  const cometContract = Comet.bind(Address.fromBytes(marketEntity.relation!));
  const baseToken = cometContract.baseToken();

  const inputTokenPriceUSD = getPrice(market.getOracleAddress(), cometContract);

  if (marketEntity.inputToken == baseToken) {
    // update base token market data
    const tryTotalSupply = cometContract.try_totalSupply();
    const tryTotalBorrow = cometContract.try_totalBorrow();

    // update reserves
    const tryReserves = cometContract.try_getReserves();
    let reservesBI = BIGINT_ZERO;
    if (!tryReserves.reverted) {
      reservesBI = tryReserves.value;
    }

    market.updateMarketAndProtocolData(
      inputTokenPriceUSD,
      tryTotalSupply.reverted ? BIGINT_ZERO : tryTotalSupply.value,
      tryTotalBorrow.value ? BIGINT_ZERO : tryTotalBorrow.value,
      null,
      reservesBI
    );
  } else {
    // update collateral token market data
    const collateralERC20 = ERC20.bind(
      Address.fromBytes(marketEntity.inputToken)
    );
    const tryBalance = collateralERC20.try_balanceOf(
      Address.fromBytes(marketEntity.relation!)
    );

    // update reserves
    const tryReserves = cometContract.try_getCollateralReserves(
      Address.fromBytes(marketEntity.inputToken)
    );

    market.updateMarketAndProtocolData(
      inputTokenPriceUSD,
      tryBalance.reverted ? BIGINT_ZERO : tryBalance.value,
      null,
      null,
      tryReserves.reverted ? BIGINT_ZERO : tryReserves.value
    );
  }

  // update interest rates if this is the baseToken market
  if (marketEntity.inputToken == baseToken) {
    const utilization = cometContract.getUtilization();
    const supplyRate = cometContract.getSupplyRate(utilization);
    const borrowRate = cometContract.getBorrowRate(utilization);
    market.getOrUpdateRate(
      InterestRateSide.BORROWER,
      InterestRateType.VARIABLE,
      bigIntToBigDecimal(borrowRate, DEFAULT_DECIMALS)
        .times(BigDecimal.fromString(SECONDS_PER_YEAR.toString()))
        .times(BIGDECIMAL_HUNDRED)
    );
    market.getOrUpdateRate(
      InterestRateSide.LENDER,
      InterestRateType.VARIABLE,
      bigIntToBigDecimal(supplyRate, DEFAULT_DECIMALS)
        .times(BigDecimal.fromString(SECONDS_PER_YEAR.toString()))
        .times(BIGDECIMAL_HUNDRED)
    );
  }
  marketEntity.save();

  return market.getInputToken();
}

function getPrice(priceFeed: Address, cometContract: Comet): BigDecimal {
  const tryPrice = cometContract.try_getPrice(priceFeed);
  if (tryPrice.reverted) {
    return BIGDECIMAL_ZERO;
  }

  return bigIntToBigDecimal(tryPrice.value, COMPOUND_DECIMALS);
}

function isMint(event: ethereum.Event): BigInt | null {
  const transfer = findTransfer(event);
  if (!transfer) {
    // ie, this event is a Deposit (not a Repay)
    return null;
  }
  const fromAddress = ethereum
    .decode("address", transfer.topics.at(1))!
    .toAddress();
  if (fromAddress != ZERO_ADDRESS || event.address != transfer.address) {
    // coincidence that there is a transfer, must be a mint from the same comet
    return null;
  }

  // return transfer amount
  return ethereum.decode("uint256", transfer.data)!.toBigInt();
}

function isBurn(event: ethereum.Event): BigInt | null {
  const transfer = findTransfer(event);
  if (!transfer) {
    // ie, this event is a Withdrawal (not a Borrow)
    return null;
  }
  const toAddress = ethereum
    .decode("address", transfer.topics.at(2))!
    .toAddress();
  if (toAddress != ZERO_ADDRESS || event.address != transfer.address) {
    // coincidence that there is a transfer, must be a burn from the same comet
    return null;
  }

  // return transfer amount
  return ethereum.decode("uint256", transfer.data)!.toBigInt();
}

//
//
// Find and return transfer (as long as it is one index after the handled event)
function findTransfer(event: ethereum.Event): ethereum.Log | null {
  if (!event.receipt) {
    log.warning("[findTransfer] No receipt found for event: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return null;
  }

  const logs = event.receipt!.logs;
  const transferLogIndex = event.logIndex.plus(BIGINT_ONE); // expected index
  for (let i = 0; i < logs.length; i++) {
    const thisLog = logs[i];
    const logSignature = thisLog.topics[0];
    if (
      transferLogIndex.equals(thisLog.logIndex) &&
      logSignature == ENCODED_TRANSFER_SIGNATURE
    ) {
      return thisLog;
    }
  }

  return null;
}
