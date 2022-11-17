import {
  Address,
  Bytes,
  ethereum,
  BigInt,
  log,
  BigDecimal,
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
} from "../../../src/utils/constants";
import {
  getOrCreateRewardToken,
  MarketClass,
} from "../../../src/utils/getters";
import {
  BASE_INDEX_SCALE,
  COMPOUND_DECIMALS,
  ENCODED_TRANSFER_SIGNATURE,
  getProtocolData,
  ZERO_ADDRESS,
  DEFAULT_DECIMALS,
  REWARDS_ADDRESS,
} from "./constants";
import { Comet as CometTemplate } from "../../../generated/templates";
import { Oracle, Token, TokenData } from "../../../generated/schema";
import { CometRewards } from "../../../generated/templates/Comet/CometRewards";
import { getOrCreateToken } from "../../../src/utils/token";

///////////////////////////////
///// Configurator Events /////
///////////////////////////////

//
//
// market creation
export function handleCometDeployed(event: CometDeployed): void {
  CometTemplate.create(event.params.cometProxy);
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );
  market.market._baseTrackingBorrowSpeed = BIGINT_ZERO;
  market.market._baseTrackingSupplySpeed = BIGINT_ZERO;
  market.market.canBorrowFrom = true;
  market.market._baseBorrowIndex = BASE_INDEX_SCALE;

  // create base token TokenData
  const tokenDataIDs: Bytes[] = [];
  const cometContract = Comet.bind(market.getAddress());
  const tryBaseToken = cometContract.try_baseToken();
  const tryBaseOracle = cometContract.try_baseTokenPriceFeed();

  if (!tryBaseToken.reverted) {
    const baseTokenData = market.getOrCreateTokenData(tryBaseToken.value);
    baseTokenData.canUseAsCollateral = true;

    // create output token
    const outputToken = getOrCreateToken(market.market.id);
    outputToken.type = TokenType.NON_REBASING;
    outputToken.save();

    market.market.name = outputToken.name;

    baseTokenData.outputTokens = [outputToken.id];
    baseTokenData.outputTokenSupplies = [BIGINT_ZERO];
    baseTokenData.outputTokenPricesUSD = [BIGDECIMAL_ZERO];
    baseTokenData.exchangeRates = [BIGDECIMAL_ONE];

    // create base token Oracle
    if (!tryBaseOracle.reverted) {
      const baseToken = getOrCreateToken(tryBaseToken.value);
      baseToken.oracle = market.getOrCreateOracle(
        tryBaseOracle.value,
        tryBaseToken.value,
        true,
        OracleSource.CHAINLINK
      ).id;
      baseToken.save();
    }

    baseTokenData.save();
    tokenDataIDs.push(baseTokenData.id);
  }

  // populate collateral token data
  let assetIndex = 0;
  let tryAssetInfo = cometContract.try_getAssetInfo(assetIndex);
  while (!tryAssetInfo.reverted) {
    const inputTokenID = tryAssetInfo.value.asset;
    const tokenData = market.getOrCreateTokenData(inputTokenID);

    // add unique TokenData fields
    tokenData.canUseAsCollateral = true;
    tokenData.maximumLTV = bigIntToBigDecimal(
      tryAssetInfo.value.borrowCollateralFactor,
      16
    );
    tokenData.liquidationThreshold = bigIntToBigDecimal(
      tryAssetInfo.value.liquidateCollateralFactor,
      16
    );
    tokenData.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
      bigIntToBigDecimal(tryAssetInfo.value.liquidationFactor, 16)
    );
    tokenData.supplyCap = tryAssetInfo.value.supplyCap;
    tokenData.save();
    tokenDataIDs.push(tokenData.id);

    // Create TokenOracle
    const inputToken = getOrCreateToken(inputTokenID);
    inputToken.oracle = market.getOrCreateOracle(
      tryAssetInfo.value.priceFeed,
      inputTokenID,
      true,
      OracleSource.CHAINLINK
    ).id;
    inputToken.save();

    // get next asset info
    assetIndex++;
    tryAssetInfo = cometContract.try_getAssetInfo(assetIndex);
  }

  market.market.tokens = tokenDataIDs;
  market.market.save();
}

//
//
// Add a new asset onto an existing market
export function handleAddAsset(event: AddAsset): void {
  const protocolData = getProtocolData();
  const market = new MarketClass(event.params.cometProxy, event, protocolData);
  const tokenDataIDs = market.market.tokens ? market.market.tokens : [];
  const tokenData = market.getOrCreateTokenData(event.params.assetConfig.asset);

  // add unique TokenData fields
  tokenData.canUseAsCollateral = true;
  tokenData.maximumLTV = bigIntToBigDecimal(
    event.params.assetConfig.borrowCollateralFactor,
    16
  );
  tokenData.liquidationThreshold = bigIntToBigDecimal(
    event.params.assetConfig.liquidateCollateralFactor,
    16
  );
  tokenData.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
    bigIntToBigDecimal(event.params.assetConfig.liquidationFactor, 16)
  );
  tokenData.supplyCap = event.params.assetConfig.supplyCap;
  tokenData.save();
  tokenDataIDs!.push(tokenData.id);

  market.market.tokens = tokenDataIDs;
  market.market.save();
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
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );
  market.getOrCreateOracle(
    event.params.oldBaseTokenPriceFeed,
    tryBaseToken.value,
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
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );
  market.market._baseTrackingBorrowSpeed =
    event.params.newBaseTrackingBorrowSpeed;
  market.market.save();

  updateRewards(market);
}

//
//
// Update the reward supply speed
export function handleSetBaseTrackingSupplySpeed(
  event: SetBaseTrackingSupplySpeed
): void {
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );
  market.market._baseTrackingSupplySpeed =
    event.params.newBaseTrackingSupplySpeed;
  market.market.save();

  updateRewards(market);
}

//
//
// Update the AssetConfig for an existing asset
export function handleUpdateAsset(event: UpdateAsset): void {
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );

  const tokenData = market.getOrCreateTokenData(
    event.params.newAssetConfig.asset
  );

  // add unique TokenData fields
  tokenData.canUseAsCollateral = true;
  tokenData.maximumLTV = bigIntToBigDecimal(
    event.params.newAssetConfig.borrowCollateralFactor,
    16
  );
  tokenData.liquidationThreshold = bigIntToBigDecimal(
    event.params.newAssetConfig.liquidateCollateralFactor,
    16
  );
  tokenData.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
    bigIntToBigDecimal(event.params.newAssetConfig.liquidationFactor, 16)
  );
  tokenData.supplyCap = event.params.newAssetConfig.supplyCap;
  tokenData.save();
}

//
//
// Update the borrow collateral factor on a given collateral asset
export function handleUpdateAssetBorrowCollateralFactor(
  event: UpdateAssetBorrowCollateralFactor
): void {
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );

  const tokenData = market.getOrCreateTokenData(event.params.asset);
  tokenData.maximumLTV = bigIntToBigDecimal(event.params.newBorrowCF, 16);
  tokenData.save();
}

//
//
// Update the liquidate collateral factor on a given collateral asset
export function handleUpdateAssetLiquidateCollateralFactor(
  event: UpdateAssetLiquidateCollateralFactor
): void {
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );

  const tokenData = market.getOrCreateTokenData(event.params.asset);
  tokenData.liquidationThreshold = bigIntToBigDecimal(
    event.params.newLiquidateCF,
    16
  );
  tokenData.save();
}

//
//
// Update the liquidation factor on a given collateral asset
export function handleUpdateAssetLiquidationFactor(
  event: UpdateAssetLiquidationFactor
): void {
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );

  const tokenData = market.getOrCreateTokenData(event.params.asset);
  tokenData.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
    bigIntToBigDecimal(event.params.newLiquidationFactor, 16)
  );
  tokenData.save();
}

//
//
// Update the price feed for a collateral asset
export function handleUpdateAssetPriceFeed(event: UpdateAssetPriceFeed): void {
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );

  market.getOrCreateOracle(
    event.params.oldPriceFeed,
    event.params.asset,
    true,
    OracleSource.CHAINLINK
  );
}

//
//
// Update the supply cap for a given collateral asset
export function handleUpdateAssetSupplyCap(event: UpdateAssetSupplyCap): void {
  const market = new MarketClass(
    event.params.cometProxy,
    event,
    getProtocolData()
  );

  const tokenData = market.getOrCreateTokenData(event.params.asset);
  tokenData.supplyCap = event.params.newSupplyCap;
  tokenData.save();
}

////////////////////////
///// Comet Events /////
////////////////////////

//
//
// Supplying the base token (could be a Deposit or Repay)
export function handleSupply(event: Supply): void {
  const market = new MarketClass(event.address, event, getProtocolData());
  const cometContract = Comet.bind(event.address);
  const tryBaseToken = cometContract.try_baseToken();
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const amount = event.params.amount;
  const token = updateMarketPrices(market, tryBaseToken.value);
  if (!token) {
    log.warning("[handleSupply] Could not find token {}", [
      tryBaseToken.value.toHexString(),
    ]);
    return;
  }
  updateRevenue(market);
  updateRewards(market);

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

  updateMarketData(market);
}

//
//
// Supplying collateral tokens
export function handleSupplyCollateral(event: SupplyCollateral): void {
  const market = new MarketClass(event.address, event, getProtocolData());
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = updateMarketPrices(market, asset);
  if (!token) {
    log.warning("[handleSupplyCollateral] Could not find token {}", [
      asset.toHexString(),
    ]);
    return;
  }
  updateRevenue(market);
  updateRewards(market);

  const deposit = market.createDeposit(
    asset,
    accountID,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
  );
  deposit.accountActor = accountActorID;
  deposit.save();

  updateMarketData(market);
}

//
//
// withdraws baseToken (could be a Withdrawal or Borrow)
export function handleWithdraw(event: Withdraw): void {
  const market = new MarketClass(event.address, event, getProtocolData());
  const cometContract = Comet.bind(event.address);
  const tryBaseToken = cometContract.try_baseToken();
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const amount = event.params.amount;
  const token = updateMarketPrices(market, tryBaseToken.value);
  if (!token) {
    log.warning("[handleWithdraw] Could not find token {}", [
      tryBaseToken.value.toHexString(),
    ]);
    return;
  }
  updateRevenue(market);
  updateRewards(market);

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

  updateMarketData(market);
}

//
//
// Withdraw collateral tokens (cannot be a Borrow)
export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const market = new MarketClass(event.address, event, getProtocolData());
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = updateMarketPrices(market, asset);
  if (!token) {
    log.warning("[handleWithdrawCollateral] Could not find token {}", [
      asset.toHexString(),
    ]);
    return;
  }
  updateRevenue(market);
  updateRewards(market);

  const withdraw = market.createWithdraw(
    asset,
    accountID,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
  );
  withdraw.accountActor = accountActorID;
  withdraw.save();

  updateMarketData(market);
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
  const market = new MarketClass(event.address, event, getProtocolData());
  const sender = event.params.from;
  const receiver = event.params.to;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = updateMarketPrices(market, asset);
  if (!token) {
    log.warning("[handleWithdrawCollateral] Could not find token {}", [
      asset.toHexString(),
    ]);
    return;
  }
  // no revenue accrued during this event
  updateRewards(market);

  const transfer = market.createTransfer(
    asset,
    sender,
    receiver,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!)
  );

  updateMarketData(market);
}

export function handleAbsorbCollateral(event: AbsorbCollateral): void {
  const market = new MarketClass(event.address, event, getProtocolData());
  const cometContract = Comet.bind(event.address);
  const liquidator = event.params.absorber;
  const borrower = event.params.borrower;
  const baseAsset = cometContract.baseToken();
  const amount = event.params.collateralAbsorbed;
  const amountUSD = bigIntToBigDecimal(amount, COMPOUND_DECIMALS);
  const tokenData = market.getOrCreateTokenData(baseAsset);
  const liquidationPenalty =
    tokenData.liquidationPenalty.div(BIGDECIMAL_HUNDRED);
  const profitUSD = amountUSD.times(liquidationPenalty);
  const token = updateMarketPrices(market, baseAsset);
  if (!token) {
    log.warning("[handleWithdrawCollateral] Could not find token {}", [
      baseAsset.toHexString(),
    ]);
    return;
  }
  updateRevenue(market);
  updateRewards(market);

  market.createLiquidate(
    baseAsset,
    liquidator,
    borrower,
    amount,
    amountUSD,
    profitUSD
  );

  updateMarketData(market);
}

///////////////////
///// Helpers /////
///////////////////

function updateRewards(market: MarketClass): void {
  const cometContract = Comet.bind(market.getAddress());
  const tryTrackingIndexScale = cometContract.try_trackingIndexScale();

  const rewardContract = CometRewards.bind(Address.fromString(REWARDS_ADDRESS));
  const tryRewardConfig = rewardContract.try_rewardConfig(
    Address.fromBytes(market.market.id)
  );

  if (tryTrackingIndexScale.reverted || tryRewardConfig.reverted) {
    log.warning("[updateRewards] Contract call(s) reverted on market: {}", [
      market.market.id.toHexString(),
    ]);
    return;
  }

  const rewardToken = getOrCreateToken(tryRewardConfig.value.value0);
  const borrowRewardToken = getOrCreateRewardToken(
    rewardToken.id,
    RewardTokenType.VARIABLE_BORROW
  );
  const supplyRewardToken = getOrCreateRewardToken(
    rewardToken.id,
    RewardTokenType.DEPOSIT
  );

  // Reward tokens emitted per day as follows:
  // tokens/day = (speed * SECONDS_PER_DAY) / trackingIndexScale
  const supplyRewardPerDay = BigInt.fromString(
    market.market
      ._baseTrackingBorrowSpeed!.times(BigInt.fromI64(SECONDS_PER_DAY))
      .div(tryTrackingIndexScale.value)
      .toBigDecimal()
      .times(exponentToBigDecimal(rewardToken.decimals))
      .truncate(0)
      .toString()
  );
  const borrowRewardPerDay = BigInt.fromString(
    market.market
      ._baseTrackingSupplySpeed!.times(BigInt.fromI64(SECONDS_PER_DAY))
      .div(tryTrackingIndexScale.value)
      .toBigDecimal()
      .times(exponentToBigDecimal(rewardToken.decimals))
      .truncate(0)
      .toString()
  );
  market.market.rewardTokenEmissionsAmount = [
    supplyRewardPerDay,
    borrowRewardPerDay,
  ]; // supply first to keep alphabetized
  const supplyRewardPerDayUSD = bigIntToBigDecimal(
    supplyRewardPerDay,
    rewardToken.decimals
  ).times(rewardToken.lastPriceUSD!);
  const borrowRewardPerDayUSD = bigIntToBigDecimal(
    borrowRewardPerDay,
    rewardToken.decimals
  ).times(rewardToken.lastPriceUSD!);
  market.market.rewardTokenEmissionsUSD = [
    supplyRewardPerDayUSD,
    borrowRewardPerDayUSD,
  ];
  market.market.rewardTokens = [supplyRewardToken.id, borrowRewardToken.id];
  market.market.save();
}

function updateRevenue(market: MarketClass): void {
  const cometContract = Comet.bind(market.getAddress());
  // TODO use CometExt totalsBasic() for base token TVL and borrow amount
  const tryTotalsBasic = cometContract.try_totalsBasic();
  const baseToken = getOrCreateToken(cometContract.baseToken());
  if (tryTotalsBasic.reverted) {
    log.warning("[updateRevenue] Could not get totalBasics()", []);
    return;
  }

  const totalBorrowBase = tryTotalsBasic.value.totalBorrowBase;
  const newBaseBorrowIndex = tryTotalsBasic.value.baseBorrowIndex;

  const baseBorrowIndexDiff = newBaseBorrowIndex.minus(
    market.market._baseBorrowIndex!
  );
  market.market._baseBorrowIndex = newBaseBorrowIndex;
  market.market.save();

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
    .times(bigIntToBigDecimal(totalBorrowBase, baseToken.decimals))
    .times(baseToken.lastPriceUSD!);
  const protocolRevenueDeltaUSD = totalRevenueDeltaUSD.times(reserveFactor);
  const supplySideRevenueDeltaUSD = totalRevenueDeltaUSD.minus(
    protocolRevenueDeltaUSD
  );
  market.updateRevenue(
    totalRevenueDeltaUSD,
    protocolRevenueDeltaUSD,
    supplySideRevenueDeltaUSD
  );

  const baseTokenData = market.getOrCreateTokenData(
    Address.fromBytes(baseToken.id)
  );
  baseTokenData.reserveFactor = reserveFactor;
  baseTokenData.save();
}

//
//
// Updates market TVL and borrow values
function updateMarketData(market: MarketClass): void {
  const cometContract = Comet.bind(market.getAddress());
  const tokens = market.market.tokens!;
  const baseToken = cometContract.baseToken();
  let baseTokenData: TokenData | null = null;
  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  let totalBorrowUSD = BIGDECIMAL_ZERO;
  let totalReservesUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < tokens.length; i++) {
    const tokenData = TokenData.load(tokens[i]);
    if (!tokenData) {
      log.warning("[updateMarketData] Could not find token data {}", [
        tokens[i].toHexString(),
      ]);
      continue;
    }
    const token = Token.load(tokenData.inputToken);
    if (!token) {
      continue;
    }

    if (tokenData.inputToken == baseToken) {
      // base token is handled differently
      const tryTotalSupply = cometContract.try_totalSupply();
      const tryTotalBorrow = cometContract.try_totalBorrow();
      if (tryTotalSupply.reverted && tryTotalBorrow.reverted) {
        continue;
      }
      tokenData.inputTokenBalance = tryTotalSupply.value;
      tokenData.outputTokenSupplies = [tryTotalSupply.value];
      tokenData.variableBorrowedTokenBalance = tryTotalBorrow.value;
      totalBorrowUSD = bigIntToBigDecimal(
        tokenData.variableBorrowedTokenBalance!,
        token.decimals
      ).times(tokenData.inputTokenPriceUSD);

      // update reserves
      const tryReserves = cometContract.try_getReserves();
      if (!tryReserves.reverted) {
        tokenData.reserves = bigIntToBigDecimal(
          tryReserves.value,
          token.decimals
        ).times(tokenData.inputTokenPriceUSD);
        totalReservesUSD = totalReservesUSD.plus(tokenData.reserves!);
      }

      baseTokenData = tokenData;
    } else {
      // collateral token update
      const collateralERC20 = ERC20.bind(
        Address.fromBytes(tokenData.inputToken)
      );
      const tryBalance = collateralERC20.try_balanceOf(market.event.address);
      if (!tryBalance.reverted) {
        tokenData.inputTokenBalance = tryBalance.value;
      }

      // update reserves
      const tryReserves = cometContract.try_getCollateralReserves(
        Address.fromBytes(tokenData.inputToken)
      );
      if (!tryReserves.reverted) {
        tokenData.reserves = bigIntToBigDecimal(
          tryReserves.value,
          token.decimals
        ).times(tokenData.inputTokenPriceUSD);
        totalReservesUSD = totalReservesUSD.plus(tokenData.reserves!);
      }
    }

    totalValueLockedUSD = totalValueLockedUSD.plus(
      bigIntToBigDecimal(tokenData.inputTokenBalance, token.decimals).times(
        tokenData.inputTokenPriceUSD
      )
    );
    tokenData.save();
  }

  market.market.totalValueLockedUSD = totalValueLockedUSD;
  market.market.totalReservesUSD = totalReservesUSD;
  market.market.totalDepositBalanceUSD = totalValueLockedUSD;
  market.market.totalBorrowBalanceUSD = totalBorrowUSD;
  market.market.save();

  if (!baseTokenData) {
    log.warning(
      "[updateMarketData] Could not find base token data in market: {}",
      [market.event.address.toHexString()]
    );
    return;
  }

  // update interest rates
  const utilization = cometContract.getUtilization();
  const supplyRate = cometContract.getSupplyRate(utilization);
  const borrowRate = cometContract.getBorrowRate(utilization);
  const borrowerRate = market.getOrCreateInterestRate(
    InterestRateSide.BORROWER,
    InterestRateType.VARIABLE
  );
  borrowerRate.rate = bigIntToBigDecimal(borrowRate, DEFAULT_DECIMALS)
    .times(BigDecimal.fromString(SECONDS_PER_YEAR.toString()))
    .times(BIGDECIMAL_HUNDRED);
  borrowerRate.save();
  const supplierRate = market.getOrCreateInterestRate(
    InterestRateSide.LENDER,
    InterestRateType.VARIABLE
  );
  supplierRate.rate = bigIntToBigDecimal(supplyRate, DEFAULT_DECIMALS)
    .times(BigDecimal.fromString(SECONDS_PER_YEAR.toString()))
    .times(BIGDECIMAL_HUNDRED);
  supplierRate.save();
  baseTokenData.rates = [borrowerRate.id, supplierRate.id]; // borrower before supplier always
  baseTokenData.save();
}

function updateMarketPrices(
  market: MarketClass,
  tokenAddress: Address // token we want the price of
): Token | null {
  const tokens = market.market.tokens!;
  const marketAddress = market.event.address;
  let thisToken: Token | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const tokenData = TokenData.load(tokens[i]);
    if (!tokenData) {
      continue;
    }
    const inputToken = getOrCreateToken(tokenData.inputToken);
    const oracleData = Oracle.load(inputToken.oracle!);
    if (!oracleData) {
      continue;
    }
    const tokenPrice = getPrice(
      Address.fromBytes(oracleData.oracleAddress),
      marketAddress
    );

    tokenData.inputTokenPriceUSD = tokenPrice;
    if (tokenData.outputTokens) {
      tokenData.outputTokenPricesUSD = [tokenPrice];
    }
    tokenData.save();

    inputToken.lastPriceUSD = tokenPrice;
    inputToken.lastPriceBlockNumber = market.event.block.number;
    inputToken.save();

    if (inputToken.id == tokenAddress) {
      thisToken = inputToken;
    }
  }

  return thisToken;
}

function getPrice(priceFeed: Address, cometAddress: Address): BigDecimal {
  const cometContract = Comet.bind(cometAddress);
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
