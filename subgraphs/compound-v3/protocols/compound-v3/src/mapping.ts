/* eslint-disable rulesdir/no-string-literals */
import {
  Address,
  ethereum,
  BigInt,
  log,
  BigDecimal,
  Bytes,
  dataSource,
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
  Transfer,
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
  FeeType,
  InterestRateSide,
  InterestRateType,
  OracleSource,
  PositionSide,
  RewardTokenType,
  SECONDS_PER_DAY,
  SECONDS_PER_YEAR,
  TokenType,
  TransactionType,
  Network,
} from "../../../src/sdk/constants";
import { DataManager, RewardData } from "../../../src/sdk/manager";
import {
  BASE_INDEX_SCALE,
  COMPOUND_DECIMALS,
  ENCODED_TRANSFER_SIGNATURE,
  getProtocolData,
  ZERO_ADDRESS,
  DEFAULT_DECIMALS,
  MARKET_PREFIX,
  USDC_COMET_WETH_MARKET_ID,
  WETH_COMET_ADDRESS,
  getRewardAddress,
  equalsIgnoreCase,
  getCOMPChainlinkFeed,
  NORMALIZE_DECIMALS,
} from "./constants";
import { Comet as CometTemplate } from "../../../generated/templates";
import { Market, Token } from "../../../generated/schema";
import { CometRewards } from "../../../generated/templates/Comet/CometRewards";
import { Chainlink } from "../../../generated/Configurator/Chainlink";
import { TokenManager } from "../../../src/sdk/token";
import { AccountManager } from "../../../src/sdk/account";
import { PositionManager } from "../../../src/sdk/position";

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

  const baseTokenManager = new TokenManager(
    tryBaseToken.value,
    event,
    TokenType.REBASING
  );
  const baseToken = baseTokenManager.getToken();

  if (!tryBaseToken.reverted) {
    const baseMarketID = event.params.cometProxy.concat(tryBaseToken.value);
    const manager = new DataManager(
      baseMarketID,
      tryBaseToken.value,
      event,
      protocolData
    );

    const market = manager.getMarket();
    market.canBorrowFrom = true;

    // update market
    market.name = MARKET_PREFIX.concat(baseToken.symbol)
      .concat(" - ")
      .concat(baseToken.name);
    market.outputToken = baseToken.id;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.exchangeRate = BIGDECIMAL_ONE;

    market.relation = event.params.cometProxy;
    market._baseTrackingBorrowSpeed = BIGINT_ZERO;
    market._baseTrackingSupplySpeed = BIGINT_ZERO;
    market.canBorrowFrom = true;
    market._baseBorrowIndex = BASE_INDEX_SCALE;
    market._baseSupplyIndex = BASE_INDEX_SCALE;

    // create base token Oracle
    if (!tryBaseOracle.reverted) {
      market.oracle = manager.getOrCreateOracle(
        tryBaseOracle.value,
        true,
        OracleSource.CHAINLINK
      ).id;
    }
    market.save();
  }

  // create collateral token markets
  let assetIndex = 0;
  let tryAssetInfo = cometContract.try_getAssetInfo(assetIndex);
  while (!tryAssetInfo.reverted) {
    const inputTokenID = tryAssetInfo.value.asset;
    const marketID = event.params.cometProxy.concat(inputTokenID);
    const manager = new DataManager(
      marketID,
      inputTokenID,
      event,
      protocolData
    );
    const market = manager.getMarket();

    // add unique market fields
    market.name = MARKET_PREFIX.concat(baseToken.symbol)
      .concat(" - ")
      .concat(manager.getInputToken().name);
    market.canUseAsCollateral = true;
    market.maximumLTV = bigIntToBigDecimal(
      tryAssetInfo.value.borrowCollateralFactor,
      NORMALIZE_DECIMALS
    );
    market.liquidationThreshold = bigIntToBigDecimal(
      tryAssetInfo.value.liquidateCollateralFactor,
      NORMALIZE_DECIMALS
    );
    market.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
      bigIntToBigDecimal(
        tryAssetInfo.value.liquidationFactor,
        NORMALIZE_DECIMALS
      )
    );
    market.supplyCap = tryAssetInfo.value.supplyCap;
    market.relation = event.params.cometProxy;

    // create token Oracle
    market.oracle = manager.getOrCreateOracle(
      tryAssetInfo.value.priceFeed,
      true,
      OracleSource.CHAINLINK
    ).id;
    market.save();

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
  const manager = new DataManager(marketID, inputTokenID, event, protocolData);
  const market = manager.getMarket();

  // add unique market fields
  market.canUseAsCollateral = true;
  market.maximumLTV = bigIntToBigDecimal(
    event.params.assetConfig.borrowCollateralFactor,
    NORMALIZE_DECIMALS
  );
  market.liquidationThreshold = bigIntToBigDecimal(
    event.params.assetConfig.liquidateCollateralFactor,
    NORMALIZE_DECIMALS
  );
  market.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
    bigIntToBigDecimal(
      event.params.assetConfig.liquidationFactor,
      NORMALIZE_DECIMALS
    )
  );
  market.supplyCap = event.params.assetConfig.supplyCap;
  market.relation = event.params.cometProxy;

  // create token Oracle
  market.oracle = manager.getOrCreateOracle(
    event.params.assetConfig.priceFeed,
    true,
    OracleSource.CHAINLINK
  ).id;
  market.save();
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
    log.error(
      "[handleSetBaseTokenPriceFeed] Base token not found for comet: {}",
      [event.params.cometProxy.toHexString()]
    );
    return;
  }

  const marketID = event.params.cometProxy.concat(tryBaseToken.value);
  const manager = new DataManager(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  manager.getOrCreateOracle(
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
    log.error(
      "[handleSetBaseTrackingBorrowSpeed] Base token not found for comet: {}",
      [event.params.cometProxy.toHexString()]
    );
    return;
  } else {
    log.warning("base speed; {}", [
      event.params.newBaseTrackingBorrowSpeed.toString(),
    ]);
  }

  const marketID = event.params.cometProxy.concat(tryBaseToken.value);
  const manager = new DataManager(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();
  market._baseTrackingBorrowSpeed = event.params.newBaseTrackingBorrowSpeed;
  market.save();

  updateRewards(manager, event.address, event);
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
    log.error(
      "[handleSetBaseTrackingBorrowSpeed] Base token not found for comet: {}",
      [event.params.cometProxy.toHexString()]
    );
    return;
  }

  const marketID = event.params.cometProxy.concat(tryBaseToken.value);
  const manager = new DataManager(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();
  market._baseTrackingSupplySpeed = event.params.newBaseTrackingSupplySpeed;
  market.save();

  updateRewards(manager, event.address, event);
}

//
//
// Update the AssetConfig for an existing asset
export function handleUpdateAsset(event: UpdateAsset): void {
  const marketID = event.params.cometProxy.concat(
    event.params.newAssetConfig.asset
  );
  const manager = new DataManager(
    marketID,
    event.params.newAssetConfig.asset,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();

  // update market fields
  market.canUseAsCollateral = true;
  market.maximumLTV = bigIntToBigDecimal(
    event.params.newAssetConfig.borrowCollateralFactor,
    NORMALIZE_DECIMALS
  );
  market.liquidationThreshold = bigIntToBigDecimal(
    event.params.newAssetConfig.liquidateCollateralFactor,
    NORMALIZE_DECIMALS
  );
  market.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
    bigIntToBigDecimal(
      event.params.newAssetConfig.liquidationFactor,
      NORMALIZE_DECIMALS
    )
  );
  market.supplyCap = event.params.newAssetConfig.supplyCap;
  market.save();
}

//
//
// Update the borrow collateral factor on a given collateral asset
export function handleUpdateAssetBorrowCollateralFactor(
  event: UpdateAssetBorrowCollateralFactor
): void {
  const marketID = event.params.cometProxy.concat(event.params.asset);
  const manager = new DataManager(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();

  market.maximumLTV = bigIntToBigDecimal(
    event.params.newBorrowCF,
    NORMALIZE_DECIMALS
  );
  market.save();
}

//
//
// Update the liquidate collateral factor on a given collateral asset
export function handleUpdateAssetLiquidateCollateralFactor(
  event: UpdateAssetLiquidateCollateralFactor
): void {
  const marketID = event.params.cometProxy.concat(event.params.asset);
  const manager = new DataManager(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();

  market.liquidationThreshold = bigIntToBigDecimal(
    event.params.newLiquidateCF,
    NORMALIZE_DECIMALS
  );
  market.save();
}

//
//
// Update the liquidation factor on a given collateral asset
export function handleUpdateAssetLiquidationFactor(
  event: UpdateAssetLiquidationFactor
): void {
  const marketID = event.params.cometProxy.concat(event.params.asset);
  const manager = new DataManager(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();

  market.liquidationPenalty = BIGDECIMAL_HUNDRED.minus(
    bigIntToBigDecimal(event.params.newLiquidationFactor, NORMALIZE_DECIMALS)
  );
  market.save();
}

//
//
// Update the price feed for a collateral asset
export function handleUpdateAssetPriceFeed(event: UpdateAssetPriceFeed): void {
  const marketID = event.params.cometProxy.concat(event.params.asset);
  const manager = new DataManager(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );

  manager.getOrCreateOracle(
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
  const manager = new DataManager(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const market = manager.getMarket();

  market.supplyCap = event.params.newSupplyCap;
  market.save();
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
  const market = new DataManager(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const amount = event.params.amount;
  const token = market.getInputToken();
  updateMarketData(market);
  updateRevenue(market, event.address);
  updateRewards(market, event.address, event);

  const mintAmount = isMint(event);
  if (!mintAmount) {
    // Repay only
    createBaseTokenTransactions(
      cometContract,
      market,
      token,
      accountID,
      amount,
      TransactionType.REPAY,
      PositionSide.BORROWER,
      accountActorID
    );
  } else if (mintAmount.le(amount)) {
    // deposit only
    createBaseTokenTransactions(
      cometContract,
      market,
      token,
      accountID,
      amount,
      TransactionType.DEPOSIT,
      PositionSide.COLLATERAL,
      accountActorID
    );
  } else {
    // mintAmount > amount
    // partial deposit and partial repay
    const repayAmount = amount.minus(mintAmount);
    const depositAmount = amount.minus(repayAmount);
    createBaseTokenTransactions(
      cometContract,
      market,
      token,
      accountID,
      repayAmount,
      TransactionType.REPAY,
      PositionSide.BORROWER,
      accountActorID
    );

    createBaseTokenTransactions(
      cometContract,
      market,
      token,
      accountID,
      depositAmount,
      TransactionType.DEPOSIT,
      PositionSide.COLLATERAL,
      accountActorID
    );
  }
}

//
//
// Supplying collateral tokens
export function handleSupplyCollateral(event: SupplyCollateral): void {
  const marketID = event.address.concat(event.params.asset);
  const market = new DataManager(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const accountID = event.params.dst;
  const accountActorID = event.params.from;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = market.getInputToken();
  updateMarketData(market);
  updateRevenue(market, event.address);
  updateRewards(market, event.address, event);

  const cometContract = Comet.bind(event.address);
  const supplyBalance = getUserBalance(cometContract, accountID, asset);
  const deposit = market.createDeposit(
    asset,
    accountID,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!),
    supplyBalance
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
  const market = new DataManager(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const amount = event.params.amount;
  const token = market.getInputToken();
  updateMarketData(market);
  updateRevenue(market, event.address);
  updateRewards(market, event.address, event);

  const burnAmount = isBurn(event);
  if (!burnAmount) {
    // Borrow only
    createBaseTokenTransactions(
      cometContract,
      market,
      token,
      accountID,
      amount,
      TransactionType.BORROW,
      PositionSide.BORROWER,
      accountActorID
    );
  } else if (burnAmount.ge(amount)) {
    // withdraw only
    createBaseTokenTransactions(
      cometContract,
      market,
      token,
      accountID,
      amount,
      TransactionType.WITHDRAW,
      PositionSide.COLLATERAL,
      accountActorID
    );
  } else {
    // burnAmount < amount
    // partial withdraw and partial borrow
    const borrowAmount = amount.minus(burnAmount);
    const withdrawAmount = amount.minus(borrowAmount);
    createBaseTokenTransactions(
      cometContract,
      market,
      token,
      accountID,
      borrowAmount,
      TransactionType.BORROW,
      PositionSide.BORROWER,
      accountActorID
    );

    createBaseTokenTransactions(
      cometContract,
      market,
      token,
      accountID,
      withdrawAmount,
      TransactionType.WITHDRAW,
      PositionSide.COLLATERAL,
      accountActorID
    );
  }
}

//
//
// Withdraw collateral tokens (cannot be a Borrow)
export function handleWithdrawCollateral(event: WithdrawCollateral): void {
  const marketID = event.address.concat(event.params.asset);
  const market = new DataManager(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const accountID = event.params.src;
  const accountActorID = event.params.to;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = market.getInputToken();
  updateMarketData(market);
  updateRevenue(market, event.address);
  updateRewards(market, event.address, event);

  const cometContract = Comet.bind(event.address);
  const supplyBalance = getUserBalance(cometContract, accountID, asset);
  const withdraw = market.createWithdraw(
    asset,
    accountID,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!),
    supplyBalance
  );
  if (withdraw) {
    withdraw.accountActor = accountActorID;
    withdraw.save();
  }
}

//
//
// Transfer user base tokens to another account
// Note: this will only catch transfer function calls where both transfer's are emitted
export function handleTransfer(event: Transfer): void {
  const supplyLog = findTransfer(event);
  if (!supplyLog) {
    // second transfer does not exist
    return;
  }
  const fromAddress = ethereum
    .decode("address", supplyLog.topics.at(1))!
    .toAddress();
  if (fromAddress != ZERO_ADDRESS) {
    // not apart of transferBase() since from address is not null
    return;
  }

  // transfer amounts may not be equal so we will act like this is a base token withdraw / supply
  const cometContract = Comet.bind(event.address);
  const tryBaseToken = cometContract.try_baseToken();
  const marketID = event.address.concat(tryBaseToken.value);
  const market = new DataManager(
    marketID,
    tryBaseToken.value,
    event,
    getProtocolData()
  );
  let amount = event.params.amount;
  const token = market.getInputToken();
  updateMarketData(market);
  updateRevenue(market, event.address);
  updateRewards(market, event.address, event);

  let newBalance = getUserBalance(
    cometContract,
    event.params.from,
    null,
    PositionSide.COLLATERAL
  );
  market.createWithdraw(
    tryBaseToken.value,
    event.params.from,
    amount,
    amount
      .toBigDecimal()
      .div(exponentToBigDecimal(token.decimals))
      .times(token.lastPriceUSD!),
    newBalance,
    InterestRateType.VARIABLE,
    getPrincipal(event.params.from, cometContract)
  );

  amount = ethereum.decode("uint256", supplyLog.data)!.toBigInt();
  const toAddress = ethereum
    .decode("address", supplyLog.topics.at(2))!
    .toAddress();
  newBalance = getUserBalance(
    cometContract,
    toAddress,
    null,
    PositionSide.COLLATERAL
  );
  market.createDeposit(
    tryBaseToken.value,
    toAddress,
    amount,
    amount
      .toBigDecimal()
      .div(exponentToBigDecimal(token.decimals))
      .times(token.lastPriceUSD!),
    newBalance,
    InterestRateType.VARIABLE,
    getPrincipal(toAddress, cometContract)
  );
}

//
//
// Transfer user collateral to another account
export function handleTransferCollateral(event: TransferCollateral): void {
  const marketID = event.address.concat(event.params.asset);
  const market = new DataManager(
    marketID,
    event.params.asset,
    event,
    getProtocolData()
  );
  const sender = event.params.from;
  const receiver = event.params.to;
  const asset = event.params.asset;
  const amount = event.params.amount;
  const token = market.getInputToken();
  updateMarketData(market);
  // no revenue accrued during this event
  updateRewards(market, event.address, event);

  const cometContract = Comet.bind(event.address);
  const senderBalance = getUserBalance(cometContract, sender, asset);
  const receiverBalance = getUserBalance(cometContract, receiver, asset);
  market.createTransfer(
    asset,
    sender,
    receiver,
    amount,
    bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!),
    senderBalance,
    receiverBalance
  );
}

//
//
// Sell liquidated collateral at a discount (of liquidation penalty)
export function handleAbsorbCollateral(event: AbsorbCollateral): void {
  const marketID = event.address.concat(event.params.asset);
  const market = new DataManager(
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
  const amountUSD = bigIntToBigDecimal(
    event.params.usdValue,
    COMPOUND_DECIMALS
  );
  const liquidationPenalty =
    marketEntity.liquidationPenalty.div(BIGDECIMAL_HUNDRED);
  const profitUSD = amountUSD.times(liquidationPenalty);
  updateMarketData(market);
  updateRevenue(market, event.address);
  updateRewards(market, event.address, event);

  const collateralBalance = getUserBalance(
    cometContract,
    borrower,
    event.params.asset,
    PositionSide.COLLATERAL
  );
  const liquidate = market.createLiquidate(
    event.params.asset,
    liquidator,
    borrower,
    amount,
    amountUSD,
    profitUSD,
    collateralBalance
  );
  if (!liquidate) return;
  const positions = liquidate.positions;

  // update liquidatee base asset borrow position
  const liquidateeAcct = new AccountManager(borrower);
  const baseAssetBorrowBalance = getUserBalance(
    cometContract,
    borrower,
    null,
    PositionSide.BORROWER
  );
  const priceUSD = getPrice(cometContract.baseTokenPriceFeed(), cometContract);
  const baseMarketID = event.address.concat(baseAsset);
  const baseMarket = new DataManager(
    baseMarketID,
    baseAsset,
    event,
    getProtocolData()
  );
  const liquidateePosition = new PositionManager(
    liquidateeAcct.getAccount(),
    baseMarket.getMarket(),
    PositionSide.BORROWER,
    InterestRateType.VARIABLE
  );
  liquidateePosition.subtractPosition(
    event,
    baseMarket.getProtocol(),
    baseAssetBorrowBalance,
    TransactionType.LIQUIDATE,
    priceUSD,
    getPrincipal(borrower, cometContract)
  );
  const positionID = liquidateePosition.getPositionID();
  if (!positionID) return;
  positions.push(positionID!);
  liquidate.positions = positions;
  liquidate.save();
}

///////////////////
///// Helpers /////
///////////////////

function createBaseTokenTransactions(
  comet: Comet,
  market: DataManager,
  token: Token,
  accountID: Address,
  amount: BigInt,
  transactionType: string,
  positionSide: string,
  accountActorID: Bytes
): void {
  const principal = getPrincipal(accountID, comet);
  const newBalance = getUserBalance(comet, accountID, null, positionSide);
  if (transactionType == TransactionType.DEPOSIT) {
    const deposit = market.createDeposit(
      token.id,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!),
      newBalance,
      InterestRateType.VARIABLE,
      principal
    );
    deposit.accountActor = accountActorID;
    deposit.save();
  }
  if (transactionType == TransactionType.WITHDRAW) {
    const withdraw = market.createWithdraw(
      token.id,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!),
      newBalance,
      InterestRateType.VARIABLE,
      principal
    );
    if (withdraw) {
      withdraw.accountActor = accountActorID;
      withdraw.save();
    }
  }
  if (transactionType == TransactionType.BORROW) {
    const borrow = market.createBorrow(
      token.id,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!),
      newBalance,
      token.lastPriceUSD!,
      InterestRateType.VARIABLE,
      principal
    );
    borrow.accountActor = accountActorID;
    borrow.save();
  }
  if (transactionType == TransactionType.REPAY) {
    const repay = market.createRepay(
      token.id,
      accountID,
      amount,
      bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!),
      newBalance,
      token.lastPriceUSD!,
      InterestRateType.VARIABLE,
      principal
    );
    if (repay) {
      repay.accountActor = accountActorID;
      repay.save();
    }
  }
}

//
//
// Get user balance
// leave asset empty if base token, but then you must provide a side
function getUserBalance(
  comet: Comet,
  account: Address,
  asset: Address | null = null,
  positionSide: string | null = null
): BigInt {
  if (asset) {
    const tryBalance = comet.try_userCollateral(account, asset);
    return tryBalance.reverted ? BIGINT_ZERO : tryBalance.value.value0;
  } else {
    if (positionSide == PositionSide.COLLATERAL) {
      const tryBalance = comet.try_balanceOf(account);
      return tryBalance.reverted ? BIGINT_ZERO : tryBalance.value;
    }
    if (positionSide == PositionSide.BORROWER) {
      const tryBorrowBalance = comet.try_borrowBalanceOf(account);
      return tryBorrowBalance.reverted ? BIGINT_ZERO : tryBorrowBalance.value;
    }
    return BIGINT_ZERO;
  }
}

function updateRewards(
  dataManager: DataManager,
  cometAddress: Address,
  event: ethereum.Event
): void {
  const cometContract = Comet.bind(cometAddress);
  const tryTrackingIndexScale = cometContract.try_trackingIndexScale();
  const market = dataManager.getMarket();
  const tryBaseToken = cometContract.try_baseToken();
  if (tryBaseToken.reverted) {
    log.error("[updateRewards] Could not get base token", []);
    return;
  }

  // skip rewards calc if not base token market
  if (dataManager.getInputToken().id != tryBaseToken.value) {
    return;
  }

  const rewardContract = CometRewards.bind(getRewardAddress());
  const tryRewardConfig = rewardContract.try_rewardConfig(cometAddress);

  if (tryTrackingIndexScale.reverted || tryRewardConfig.reverted) {
    log.warning("[updateRewards] Contract call(s) reverted on market: {}", [
      market.id.toHexString(),
    ]);
    return;
  }

  const tryBaseTrackingBorrow = cometContract.try_baseTrackingBorrowSpeed();
  const tryBaseTrackingSupply = cometContract.try_baseTrackingSupplySpeed();
  if (tryBaseTrackingBorrow.reverted || tryBaseTrackingSupply.reverted) {
    log.error(
      "[updateRewards] Contract call on base tracking speed failed on market: {}",
      [market.id.toHexString()]
    );
  }

  if (tryRewardConfig.value.value0 == ZERO_ADDRESS) {
    log.warning("[updateRewards] Reward token address is zero address", []);
    return;
  }

  const rewardToken = new TokenManager(tryRewardConfig.value.value0, event);

  // Update price for reward token using Chainlink oracle on Polygon
  if (
    equalsIgnoreCase(dataSource.network(), Network.MATIC) ||
    equalsIgnoreCase(dataSource.network(), Network.ARBITRUM_ONE)
  ) {
    const chainlinkContract = Chainlink.bind(
      getCOMPChainlinkFeed(dataSource.network())
    );
    const tryPrice = chainlinkContract.try_latestAnswer();
    if (tryPrice.reverted) {
      log.error("[updateRewards] Chainlink price reverted on transaction: {}", [
        event.transaction.hash.toHexString(),
      ]);
    } else {
      rewardToken.updatePrice(
        bigIntToBigDecimal(tryPrice.value, COMPOUND_DECIMALS)
      );
    }
  }

  const decimals = rewardToken.getDecimals();
  const borrowRewardToken = rewardToken.getOrCreateRewardToken(
    RewardTokenType.VARIABLE_BORROW
  );
  const supplyRewardToken = rewardToken.getOrCreateRewardToken(
    RewardTokenType.DEPOSIT
  );
  market._baseTrackingBorrowSpeed = tryBaseTrackingBorrow.value;
  market._baseTrackingSupplySpeed = tryBaseTrackingSupply.value;
  market.save();

  // Reward tokens emitted per day as follows:
  // tokens/day = (speed * SECONDS_PER_DAY) / trackingIndexScale
  const borrowRewardPerDay = BigInt.fromString(
    market
      ._baseTrackingBorrowSpeed!.times(BigInt.fromI64(SECONDS_PER_DAY))
      .div(tryTrackingIndexScale.value)
      .toBigDecimal()
      .times(exponentToBigDecimal(decimals))
      .truncate(0)
      .toString()
  );
  const supplyRewardPerDay = BigInt.fromString(
    market
      ._baseTrackingSupplySpeed!.times(BigInt.fromI64(SECONDS_PER_DAY))
      .div(tryTrackingIndexScale.value)
      .toBigDecimal()
      .times(exponentToBigDecimal(decimals))
      .truncate(0)
      .toString()
  );
  const supplyRewardPerDayUSD = bigIntToBigDecimal(
    supplyRewardPerDay,
    decimals
  ).times(rewardToken.getPriceUSD());
  const borrowRewardPerDayUSD = bigIntToBigDecimal(
    borrowRewardPerDay,
    decimals
  ).times(rewardToken.getPriceUSD());

  dataManager.updateRewards(
    new RewardData(borrowRewardToken, borrowRewardPerDay, borrowRewardPerDayUSD)
  );
  dataManager.updateRewards(
    new RewardData(supplyRewardToken, supplyRewardPerDay, supplyRewardPerDayUSD)
  );
}

//
//
// update revenue (only can update base token market revenue)
function updateRevenue(dataManager: DataManager, cometAddress: Address): void {
  const cometContract = Comet.bind(cometAddress);
  const inputToken = dataManager.getInputToken();
  if (cometContract.baseToken() != inputToken.id) {
    log.info(
      "[updateRevenue] Cannot update revenue for non-base token market",
      []
    );
    return;
  }
  const market = dataManager.getMarket();
  const tryTotalsBasic = cometContract.try_totalsBasic();
  if (tryTotalsBasic.reverted) {
    log.error("[updateRevenue] Could not get totalBasics()", []);
    return;
  }

  const totalBorrowBase = tryTotalsBasic.value.totalBorrowBase;
  const newBaseBorrowIndex = tryTotalsBasic.value.baseBorrowIndex;

  const baseBorrowIndexDiff = newBaseBorrowIndex.minus(
    market._baseBorrowIndex!
  );
  market._baseBorrowIndex = newBaseBorrowIndex;
  market._baseSupplyIndex = tryTotalsBasic.value.baseSupplyIndex;

  // the reserve factor is dynamic and is essentially
  // the spread between supply and borrow interest rates
  // reserveFactor = (borrowRate - supplyRate) / borrowRate
  const utilization = cometContract.getUtilization();
  const borrowRate = cometContract.getBorrowRate(utilization).toBigDecimal();
  const supplyRate = cometContract.getSupplyRate(utilization).toBigDecimal();
  if (borrowRate.lt(supplyRate)) {
    log.warning(
      "[updateRevenue] Borrow rate is less than supply rate at transaction: {}",
      [dataManager.event.transaction.hash.toHexString()]
    );
    return;
  }
  const reserveFactor = borrowRate.minus(supplyRate).div(borrowRate);
  market.reserveFactor = reserveFactor;
  market.save();

  const totalRevenueDeltaUSD = baseBorrowIndexDiff
    .toBigDecimal()
    .div(BASE_INDEX_SCALE.toBigDecimal())
    .times(bigIntToBigDecimal(totalBorrowBase, inputToken.decimals))
    .times(inputToken.lastPriceUSD!);
  const protocolRevenueDeltaUSD = totalRevenueDeltaUSD.times(reserveFactor);
  const supplySideRevenueDeltaUSD = totalRevenueDeltaUSD.minus(
    protocolRevenueDeltaUSD
  );
  const fee = dataManager.getOrUpdateFee(FeeType.PROTOCOL_FEE);
  dataManager.addSupplyRevenue(supplySideRevenueDeltaUSD, fee);
  dataManager.addProtocolRevenue(protocolRevenueDeltaUSD, fee);
}

//
//
// Updates market TVL, borrows, prices, reserves
function updateMarketData(dataManager: DataManager): void {
  const market = dataManager.getMarket();
  const cometContract = Comet.bind(Address.fromBytes(market.relation!));
  const baseToken = cometContract.baseToken();

  const inputTokenPriceUSD = getPrice(
    dataManager.getOracleAddress(),
    cometContract
  );

  if (market.inputToken == baseToken) {
    // update base token market data
    const tryTotalSupply = cometContract.try_totalSupply();
    const tryTotalBorrow = cometContract.try_totalBorrow();

    // update reserves
    const tryReserves = cometContract.try_getReserves();
    let reservesBI = BIGINT_ZERO;
    if (!tryReserves.reverted) {
      reservesBI = tryReserves.value;
    }

    dataManager.updateMarketAndProtocolData(
      inputTokenPriceUSD,
      tryTotalSupply.reverted ? BIGINT_ZERO : tryTotalSupply.value,
      tryTotalBorrow.reverted ? BIGINT_ZERO : tryTotalBorrow.value,
      null,
      reservesBI
    );

    // update rates
    const utilization = cometContract.getUtilization();
    const supplyRate = cometContract.getSupplyRate(utilization);
    const borrowRate = cometContract.getBorrowRate(utilization);
    dataManager.getOrUpdateRate(
      InterestRateSide.BORROWER,
      InterestRateType.VARIABLE,
      bigIntToBigDecimal(borrowRate, DEFAULT_DECIMALS)
        .times(BigDecimal.fromString(SECONDS_PER_YEAR.toString()))
        .times(BIGDECIMAL_HUNDRED)
    );
    dataManager.getOrUpdateRate(
      InterestRateSide.LENDER,
      InterestRateType.VARIABLE,
      bigIntToBigDecimal(supplyRate, DEFAULT_DECIMALS)
        .times(BigDecimal.fromString(SECONDS_PER_YEAR.toString()))
        .times(BIGDECIMAL_HUNDRED)
    );
  } else {
    // update collateral token market data
    const collateralERC20 = ERC20.bind(Address.fromBytes(market.inputToken));
    const tryBalance = collateralERC20.try_balanceOf(
      Address.fromBytes(market.relation!)
    );

    // update reserves
    const tryReserves = cometContract.try_getCollateralReserves(
      Address.fromBytes(market.inputToken)
    );

    dataManager.updateMarketAndProtocolData(
      inputTokenPriceUSD,
      tryBalance.reverted ? BIGINT_ZERO : tryBalance.value,
      null,
      null,
      tryReserves.reverted ? BIGINT_ZERO : tryReserves.value
    );
  }
}

function getPrice(priceFeed: Address, cometContract: Comet): BigDecimal {
  const tryPrice = cometContract.try_getPrice(priceFeed);
  if (tryPrice.reverted) {
    return BIGDECIMAL_ZERO;
  }

  // The WETH market was deployed at block 16400710: https://etherscan.io/tx/0xfd5e08c8c8a524fcfa3f481b452067d41033644175bc5c3be6a8397847df27fa
  // In this market the price is returned in ETH, so we need to convert to USD
  // Comet address: 0xA17581A9E3356d9A858b789D68B4d866e593aE94
  if (cometContract._address == Address.fromHexString(WETH_COMET_ADDRESS)) {
    const wethPriceUSD = getWETHPriceUSD();
    return bigIntToBigDecimal(tryPrice.value, COMPOUND_DECIMALS).times(
      wethPriceUSD
    );
  }

  return bigIntToBigDecimal(tryPrice.value, COMPOUND_DECIMALS);
}

// get the price of WETH in USD on Mainnet
function getWETHPriceUSD(): BigDecimal {
  const market = Market.load(Bytes.fromHexString(USDC_COMET_WETH_MARKET_ID));
  if (!market) {
    return BIGDECIMAL_ZERO;
  }

  return market.inputTokenPriceUSD;
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
    log.error("[findTransfer] No receipt found for event: {}", [
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

//
//
// Get the Position Principal
function getPrincipal(account: Address, cometContract: Comet): BigInt {
  const tryUserBasic = cometContract.try_userBasic(account);
  if (tryUserBasic.reverted) {
    log.error("[getPrincipal] Could not get userBasic({})", [
      account.toHexString(),
    ]);
    return BIGINT_ZERO;
  }

  return tryUserBasic.value.getPrincipal();
}
