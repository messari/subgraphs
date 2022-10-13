import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  ActionPaused1,
  Comptroller,
  MarketEntered,
  MarketExited,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from "../../../generated/Comptroller/Comptroller";
import {
  Mint,
  Redeem,
  Borrow,
  RepayBorrow,
  LiquidateBorrow,
  NewReserveFactor,
  Transfer,
  AccrueInterest as AccrueInterestNew,
} from "../../../generated/templates/CToken/CToken";
import { AccrueInterest as AccrueInterestOld } from "../../../generated/templates/CTokenOld/CTokenOld";
import { CToken as CTokenContract } from "../../../generated/templates/CToken/CToken";
import {
  LendingProtocol,
  Market,
  RewardToken,
  Token,
} from "../../../generated/schema";
import {
  CCOMP_ADDRESS,
  CETH_ADDRESS,
  comptrollerAddr,
  COMPTROLLER_ADDRESS,
  COMP_ADDRESS,
  ETH_ADDRESS,
  ETH_DECIMALS,
  ETH_NAME,
  ETH_SYMBOL,
  METHODOLOGY_VERSION,
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  RewardTokenType,
  SCHEMA_VERSION,
  SUBGRAPH_VERSION,
} from "./constants";
import {
  convertRatePerUnitToAPY,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
  getOrElse,
  MarketListedData,
  ProtocolData,
  setBorrowInterestRate,
  setSupplyInterestRate,
  snapshotFinancials,
  TokenData,
  updateAllMarketPrices,
  UpdateMarketData,
  _getOrCreateProtocol,
  _handleActionPaused,
  _handleBorrow,
  _handleLiquidateBorrow,
  _handleMarketEntered,
  _handleMarketListed,
  _handleMint,
  _handleNewCollateralFactor,
  _handleNewLiquidationIncentive,
  _handleNewPriceOracle,
  _handleNewReserveFactor,
  _handleRedeem,
  _handleRepayBorrow,
  _handleTransfer,
} from "../../../src/mapping";
import { CToken, CTokenOld } from "../../../generated/templates";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  cTokenDecimals,
  DAYS_PER_YEAR,
  exponentToBigDecimal,
  mantissaFactor,
} from "../../../src/constants";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import {
  getOrCreateCircularBuffer,
  getRewardsPerDay,
  RewardIntervalType,
} from "./rewards";
import { getUSDPriceOfToken } from "./prices";
import { getUsdPricePerToken } from "./prices/index";
import { PriceOracle2 } from "../../../generated/Comptroller/PriceOracle2";
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol } from "./token";

///////////////////////////////
//// CToken Level Handlers ////
///////////////////////////////

export function handleMint(event: Mint): void {
  const minter = event.params.minter;
  const mintAmount = event.params.mintAmount;
  const contract = CTokenContract.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.minter
  );
  _handleMint(
    comptrollerAddr,
    minter,
    mintAmount,
    outputTokenSupplyResult,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleRedeem(event: Redeem): void {
  const redeemer = event.params.redeemer;
  const redeemAmount = event.params.redeemAmount;
  const contract = CTokenContract.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.redeemer
  );
  _handleRedeem(
    comptrollerAddr,
    redeemer,
    redeemAmount,
    outputTokenSupplyResult,
    balanceOfUnderlyingResult,
    event
  );
}

export function handleBorrow(event: Borrow): void {
  const borrower = event.params.borrower;
  const borrowAmount = event.params.borrowAmount;
  const totalBorrows = event.params.totalBorrows;
  const contract = CTokenContract.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleBorrow(
    comptrollerAddr,
    borrower,
    borrowAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event
  );
}

export function handleRepayBorrow(event: RepayBorrow): void {
  const payer = event.params.payer;
  const borrower = event.params.borrower;
  const repayAmount = event.params.repayAmount;
  const totalBorrows = event.params.totalBorrows;
  const contract = CTokenContract.bind(event.address);
  const borrowBalanceStoredResult = contract.try_borrowBalanceStored(
    event.params.borrower
  );
  _handleRepayBorrow(
    comptrollerAddr,
    borrower,
    payer,
    repayAmount,
    borrowBalanceStoredResult,
    totalBorrows,
    event
  );
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const cTokenCollateral = event.params.cTokenCollateral;
  const liquidator = event.params.liquidator;
  const borrower = event.params.borrower;
  const seizeTokens = event.params.seizeTokens;
  const repayAmount = event.params.repayAmount;
  _handleLiquidateBorrow(
    comptrollerAddr,
    cTokenCollateral,
    liquidator,
    borrower,
    seizeTokens,
    repayAmount,
    event
  );
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  const marketID = event.address.toHexString();
  const newReserveFactorMantissa = event.params.newReserveFactorMantissa;
  _handleNewReserveFactor(marketID, newReserveFactorMantissa);
}

export function handleTransfer(event: Transfer): void {
  _handleTransfer(
    event,
    event.address.toHexString(),
    event.params.to,
    event.params.from,
    comptrollerAddr
  );
}

export function handleAccrueInterestNew(event: AccrueInterestNew): void {
  handleAccrueInterest(
    event,
    event.params.interestAccumulated,
    event.params.totalBorrows
  );
}

export function handleAccrueInterestOld(event: AccrueInterestOld): void {
  handleAccrueInterest(
    event,
    event.params.interestAccumulated,
    event.params.totalBorrows
  );
}

////////////////////////////////////
//// Comptroller Level Handlers ////
////////////////////////////////////

export function handleMarketListed(event: MarketListed): void {
  // CToken ABI changes at block 8983575
  // To handle we must create the old CToken in order to capture the old acrueInterest signature
  if (event.block.number.toI32() <= 8983575) {
    CTokenOld.create(event.params.cToken);
  }
  CToken.create(event.params.cToken);
  const cTokenAddr = event.params.cToken;
  const cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market

  const protocol = getOrCreateProtocol();
  const cTokenContract = CTokenContract.bind(event.params.cToken);
  const cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO
  );

  // get underlying token data
  let underlyingTokenAddr: Address;
  let underlyingName: string;
  let underlyingSymbol: string;
  let underlyingDecimals: i32;
  if (event.params.cToken == Address.fromString(CETH_ADDRESS)) {
    // must hard code ETH bc it cannot fetch 0x0 address
    underlyingTokenAddr = Address.fromString(ETH_ADDRESS);
    underlyingName = ETH_NAME;
    underlyingSymbol = ETH_SYMBOL;
    underlyingDecimals = ETH_DECIMALS;
  } else {
    // grab token normally
    const underlyingTokenAddrResult = cTokenContract.try_underlying();
    if (underlyingTokenAddrResult.reverted) {
      log.warning(
        "[handleMarketListed] could not fetch underlying token of cToken: {}",
        [cTokenAddr.toHexString()]
      );
      return;
    }
    underlyingTokenAddr = underlyingTokenAddrResult.value;
    underlyingName = fetchTokenName(underlyingTokenAddr);
    underlyingSymbol = fetchTokenSymbol(underlyingTokenAddr);
    underlyingDecimals = fetchTokenDecimals(underlyingTokenAddr);
  }

  _handleMarketListed(
    new MarketListedData(
      protocol,
      new TokenData(
        underlyingTokenAddr,
        underlyingName,
        underlyingSymbol,
        underlyingDecimals
      ),
      new TokenData(
        cTokenAddr,
        getOrElse<string>(cTokenContract.try_name(), "unknown"),
        getOrElse<string>(cTokenContract.try_symbol(), "unknown"),
        cTokenDecimals
      ),

      cTokenReserveFactorMantissa
    ),
    event
  );
}

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.cToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const protocol = getOrCreateProtocol();
  const newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const marketID = event.params.cToken.toHexString();
  const collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, collateralFactorMantissa);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  const protocol = getOrCreateProtocol();
  const newLiquidationIncentive = event.params.newLiquidationIncentiveMantissa;
  _handleNewLiquidationIncentive(protocol, newLiquidationIncentive);
}

export function handleActionPaused(event: ActionPaused1): void {
  const marketID = event.params.cToken.toHexString();
  const action = event.params.action;
  const pauseState = event.params.pauseState;
  _handleActionPaused(marketID, action, pauseState);
}

/////////////////
//// Helpers ////
/////////////////

function getOrCreateProtocol(): LendingProtocol {
  const comptroller = Comptroller.bind(comptrollerAddr);
  const protocolData = new ProtocolData(
    comptrollerAddr,
    PROTOCOL_NAME,
    PROTOCOL_SLUG,
    SCHEMA_VERSION,
    SUBGRAPH_VERSION,
    METHODOLOGY_VERSION,
    Network.MAINNET,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}

// "override" _handleAccrueInterest in ../src/mapping.ts
// Compound v2 calculates price differently in certain stuations
function handleAccrueInterest(
  event: ethereum.Event,
  interestAccumulated: BigInt,
  totalBorrows: BigInt
): void {
  const marketAddress = event.address;
  const cTokenContract = CTokenContract.bind(marketAddress);
  const protocol = getOrCreateProtocol();
  const oracleContract = PriceOracle2.bind(
    Address.fromString(protocol._priceOracle)
  );

  // update blocksPerDay using rewards.ts
  getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    BIGDECIMAL_ZERO,
    RewardIntervalType.BLOCK
  );
  const blocksPerDay = BigInt.fromString(
    getOrCreateCircularBuffer().blocksPerDay.truncate(0).toString()
  ).toI32();

  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    blocksPerDay * DAYS_PER_YEAR
  );

  //
  // Replacing _handleAccrueInterest() to properly derive asset price
  //

  const marketID = event.address.toHexString();
  const market = Market.load(marketID);
  if (!market) {
    log.warning("[handleAccrueInterest] Market not found: {}", [marketID]);
    return;
  }

  // update rewards for market is necessary
  updateRewards(event, market);

  // creates and initializes market snapshots

  //
  // daily snapshot
  //
  getOrCreateMarketDailySnapshot(
    market,
    event.block.timestamp,
    event.block.number
  );

  //
  // hourly snapshot
  //
  getOrCreateMarketHourlySnapshot(
    market,
    event.block.timestamp,
    event.block.number
  );

  updateMarket(
    updateMarketData,
    marketID,
    interestAccumulated,
    totalBorrows,
    event.block.number,
    event.block.timestamp,
    false, // do not update all prices
    comptrollerAddr
  );
  updateProtocol(comptrollerAddr);

  snapshotFinancials(
    comptrollerAddr,
    event.block.number,
    event.block.timestamp
  );
}

// "override" updateMarket() in ../src/mapping.ts
// Compound v2 calculates price differently in certain stuations
function updateMarket(
  updateMarketData: UpdateMarketData,
  marketID: string,
  interestAccumulatedMantissa: BigInt,
  newTotalBorrow: BigInt,
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  updateMarketPrices: boolean,
  comptrollerAddress: Address
): void {
  const market = Market.load(marketID);
  if (!market) {
    log.warning("[updateMarket] Market not found: {}", [marketID]);
    return;
  }

  const underlyingToken = Token.load(market.inputToken);
  if (!underlyingToken) {
    log.warning("[updateMarket] Underlying token not found: {}", [
      market.inputToken,
    ]);
    return;
  }

  if (updateMarketPrices) {
    updateAllMarketPrices(comptrollerAddress, blockNumber);
  }

  // compound v2 specific price calculation (see ./prices.ts)
  const underlyingTokenPriceUSD = getUSDPriceOfToken(
    market,
    blockNumber.toI32()
  );

  underlyingToken.lastPriceUSD = underlyingTokenPriceUSD;
  underlyingToken.lastPriceBlockNumber = blockNumber;
  underlyingToken.save();

  market.inputTokenPriceUSD = underlyingTokenPriceUSD;

  if (updateMarketData.totalSupplyResult.reverted) {
    log.warning("[updateMarket] Failed to get totalSupply of Market {}", [
      marketID,
    ]);
  } else {
    market.outputTokenSupply = updateMarketData.totalSupplyResult.value;
  }

  // get correct outputTokenDecimals for generic exchangeRate calculation
  let outputTokenDecimals = cTokenDecimals;
  if (market.outputToken) {
    const outputToken = Token.load(market.outputToken!);
    if (!outputToken) {
      log.warning("[updateMarket] Output token not found: {}", [
        market.outputToken!,
      ]);
    } else {
      outputTokenDecimals = outputToken.decimals;
    }
  }

  if (updateMarketData.exchangeRateStoredResult.reverted) {
    log.warning(
      "[updateMarket] Failed to get exchangeRateStored of Market {}",
      [marketID]
    );
  } else {
    // Formula: check out "Interpreting Exchange Rates" in https://compound.finance/docs#protocol-math
    const oneCTokenInUnderlying =
      updateMarketData.exchangeRateStoredResult.value
        .toBigDecimal()
        .div(
          exponentToBigDecimal(
            mantissaFactor + underlyingToken.decimals - outputTokenDecimals
          )
        );
    market.exchangeRate = oneCTokenInUnderlying;
    market.outputTokenPriceUSD = oneCTokenInUnderlying.times(
      underlyingTokenPriceUSD
    );

    // calculate inputTokenBalance only if exchangeRate is updated properly
    // mantissaFactor = (inputTokenDecimals - outputTokenDecimals)  (Note: can be negative)
    // inputTokenBalance = (outputSupply * exchangeRate) * (10 ^ mantissaFactor)
    if (underlyingToken.decimals > outputTokenDecimals) {
      // we want to multiply out the difference to expand BD
      const mantissaFactorBD = exponentToBigDecimal(
        underlyingToken.decimals - outputTokenDecimals
      );
      const inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .times(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(
        inputTokenBalanceBD.toString()
      );
    } else {
      // we want to divide back the difference to decrease the BD
      const mantissaFactorBD = exponentToBigDecimal(
        outputTokenDecimals - underlyingToken.decimals
      );
      const inputTokenBalanceBD = market.outputTokenSupply
        .toBigDecimal()
        .times(market.exchangeRate!)
        .div(mantissaFactorBD)
        .truncate(0);
      market.inputTokenBalance = BigInt.fromString(
        inputTokenBalanceBD.toString()
      );
    }
  }

  const underlyingSupplyUSD = market.inputTokenBalance
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);
  market.totalValueLockedUSD = underlyingSupplyUSD;
  market.totalDepositBalanceUSD = underlyingSupplyUSD;

  market._borrowBalance = newTotalBorrow;
  market.totalBorrowBalanceUSD = newTotalBorrow
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);

  if (updateMarketData.supplyRateResult.reverted) {
    log.warning("[updateMarket] Failed to get supplyRate of Market {}", [
      marketID,
    ]);
  } else {
    setSupplyInterestRate(
      marketID,
      convertRatePerUnitToAPY(
        updateMarketData.supplyRateResult.value,
        updateMarketData.unitPerYear
      )
    );
  }

  if (updateMarketData.borrowRateResult.reverted) {
    log.warning("[updateMarket] Failed to get borrowRate of Market {}", [
      marketID,
    ]);
  } else {
    setBorrowInterestRate(
      marketID,
      convertRatePerUnitToAPY(
        updateMarketData.borrowRateResult.value,
        updateMarketData.unitPerYear
      )
    );
  }

  const interestAccumulatedUSD = interestAccumulatedMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(underlyingToken.decimals))
    .times(underlyingTokenPriceUSD);
  const protocolSideRevenueUSDDelta = interestAccumulatedUSD.times(
    market._reserveFactor
  );
  const supplySideRevenueUSDDelta = interestAccumulatedUSD.minus(
    protocolSideRevenueUSDDelta
  );

  market.cumulativeTotalRevenueUSD = market.cumulativeTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  market.cumulativeProtocolSideRevenueUSD =
    market.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  market.cumulativeSupplySideRevenueUSD =
    market.cumulativeSupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  market.save();

  // update daily fields in marketDailySnapshot
  const dailySnapshot = getOrCreateMarketDailySnapshot(
    market,
    blockTimestamp,
    blockNumber
  );
  dailySnapshot.dailyTotalRevenueUSD = dailySnapshot.dailyTotalRevenueUSD.plus(
    interestAccumulatedUSD
  );
  dailySnapshot.dailyProtocolSideRevenueUSD =
    dailySnapshot.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSDDelta);
  dailySnapshot.dailySupplySideRevenueUSD =
    dailySnapshot.dailySupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  dailySnapshot.save();

  // update hourly fields in marketHourlySnapshot
  const hourlySnapshot = getOrCreateMarketHourlySnapshot(
    market,
    blockTimestamp,
    blockNumber
  );
  hourlySnapshot.hourlyTotalRevenueUSD =
    hourlySnapshot.hourlyTotalRevenueUSD.plus(interestAccumulatedUSD);
  hourlySnapshot.hourlyProtocolSideRevenueUSD =
    hourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSDDelta
    );
  hourlySnapshot.hourlySupplySideRevenueUSD =
    hourlySnapshot.hourlySupplySideRevenueUSD.plus(supplySideRevenueUSDDelta);
  hourlySnapshot.save();
}

export function updateProtocol(comptrollerAddr: Address): void {
  const protocol = LendingProtocol.load(comptrollerAddr.toHexString());
  if (!protocol) {
    log.error(
      "[updateProtocol] Protocol not found, this SHOULD NOT happen",
      []
    );
    return;
  }

  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  let totalDepositBalanceUSD = BIGDECIMAL_ZERO;
  let totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
  let cumulativeBorrowUSD = BIGDECIMAL_ZERO;
  let cumulativeDepositUSD = BIGDECIMAL_ZERO;
  let cumulativeLiquidateUSD = BIGDECIMAL_ZERO;
  let cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  let cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  let cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;

  for (let i = 0; i < protocol._marketIDs.length; i++) {
    const market = Market.load(protocol._marketIDs[i]);
    if (!market) {
      log.warning("[updateProtocol] Market not found: {}", [
        protocol._marketIDs[i],
      ]);
      // best effort
      continue;
    }
    totalValueLockedUSD = totalValueLockedUSD.plus(market.totalValueLockedUSD);
    totalDepositBalanceUSD = totalDepositBalanceUSD.plus(
      market.totalDepositBalanceUSD
    );
    totalBorrowBalanceUSD = totalBorrowBalanceUSD.plus(
      market.totalBorrowBalanceUSD
    );
    cumulativeBorrowUSD = cumulativeBorrowUSD.plus(market.cumulativeBorrowUSD);
    cumulativeDepositUSD = cumulativeDepositUSD.plus(
      market.cumulativeDepositUSD
    );
    cumulativeLiquidateUSD = cumulativeLiquidateUSD.plus(
      market.cumulativeLiquidateUSD
    );
    cumulativeTotalRevenueUSD = cumulativeTotalRevenueUSD.plus(
      market.cumulativeTotalRevenueUSD
    );
    cumulativeProtocolSideRevenueUSD = cumulativeProtocolSideRevenueUSD.plus(
      market.cumulativeProtocolSideRevenueUSD
    );
    cumulativeSupplySideRevenueUSD = cumulativeSupplySideRevenueUSD.plus(
      market.cumulativeSupplySideRevenueUSD
    );
  }

  protocol.totalValueLockedUSD = totalValueLockedUSD;
  protocol.totalDepositBalanceUSD = totalDepositBalanceUSD;
  protocol.totalBorrowBalanceUSD = totalBorrowBalanceUSD;
  protocol.cumulativeBorrowUSD = cumulativeBorrowUSD;
  protocol.cumulativeDepositUSD = cumulativeDepositUSD;
  protocol.cumulativeLiquidateUSD = cumulativeLiquidateUSD;
  protocol.cumulativeTotalRevenueUSD = cumulativeTotalRevenueUSD;
  protocol.cumulativeProtocolSideRevenueUSD = cumulativeProtocolSideRevenueUSD;
  protocol.cumulativeSupplySideRevenueUSD = cumulativeSupplySideRevenueUSD;
  protocol.save();
}

function updateRewards(event: ethereum.Event, market: Market): void {
  // COMP was not created until block 10271924: https://etherscan.io/tx/0x03dab5602fb58bb44c1a248fd1b283ca46b539969fe02db144983247d00cfb89
  if (event.block.number.toI32() > 10271924) {
    let rewardTokenBorrow: RewardToken | null = null;
    let rewardTokenDeposit: RewardToken | null = null;

    // check if market has COMP reward tokens
    if (market.rewardTokens == null) {
      // get or create COMP token
      let compToken = Token.load(COMP_ADDRESS);
      if (!compToken) {
        const tokenContract = ERC20.bind(Address.fromString(COMP_ADDRESS));
        compToken = new Token(COMP_ADDRESS);
        compToken.name = getOrElse(tokenContract.try_name(), "unkown");
        compToken.symbol = getOrElse(tokenContract.try_symbol(), "unkown");
        compToken.decimals = getOrElse(tokenContract.try_decimals(), 0);
        compToken.save();
      }

      const borrowID = RewardTokenType.BORROW.concat("-").concat(COMP_ADDRESS);
      rewardTokenBorrow = RewardToken.load(borrowID);
      if (!rewardTokenBorrow) {
        rewardTokenBorrow = new RewardToken(borrowID);
        rewardTokenBorrow.token = compToken.id; // COMP already made from cCOMP market
        rewardTokenBorrow.type = RewardTokenType.BORROW;
        rewardTokenBorrow.save();
      }
      const depositID =
        RewardTokenType.DEPOSIT.concat("-").concat(COMP_ADDRESS);
      rewardTokenDeposit = RewardToken.load(depositID);
      if (!rewardTokenDeposit) {
        rewardTokenDeposit = new RewardToken(depositID);
        rewardTokenDeposit.token = compToken.id; // COMP already made from cCOMP market
        rewardTokenDeposit.type = RewardTokenType.DEPOSIT;
        rewardTokenDeposit.save();
      }

      market.rewardTokens = [rewardTokenDeposit.id, rewardTokenBorrow.id];
    }

    // get COMP distribution/block
    const rewardDecimals = Token.load(COMP_ADDRESS)!.decimals; // COMP is already made from cCOMP market
    const troller = Comptroller.bind(Address.fromString(COMPTROLLER_ADDRESS));
    const blocksPerDay = BigInt.fromString(
      getOrCreateCircularBuffer().blocksPerDay.truncate(0).toString()
    );

    let compPriceUSD = BIGDECIMAL_ZERO;
    let supplyCompPerDay = BIGINT_ZERO;
    let borrowCompPerDay = BIGINT_ZERO;
    // get comp speeds (changed storage after block 13322798)
    // See proposal 62: https://compound.finance/governance/proposals/62
    if (event.block.number.toI32() > 13322798) {
      // comp speeds can be different for supply/borrow side
      const tryBorrowSpeed = troller.try_compBorrowSpeeds(event.address);
      const trySupplySpeed = troller.try_compSupplySpeeds(event.address);
      borrowCompPerDay = tryBorrowSpeed.reverted
        ? BIGINT_ZERO
        : tryBorrowSpeed.value.times(blocksPerDay);
      supplyCompPerDay = trySupplySpeed.reverted
        ? BIGINT_ZERO
        : trySupplySpeed.value.times(blocksPerDay);
    } else {
      // comp speeds are the same for supply/borrow side
      const tryCompSpeed = troller.try_compSpeeds(event.address);
      supplyCompPerDay = tryCompSpeed.reverted
        ? BIGINT_ZERO
        : tryCompSpeed.value.times(blocksPerDay);
      borrowCompPerDay = supplyCompPerDay;
    }

    // get COMP price
    // cCOMP was made at this block height 10960099
    if (event.block.number.toI32() > 10960099) {
      const compMarket = Market.load(CCOMP_ADDRESS);
      if (!compMarket) {
        log.warning("[updateRewards] Market not found: {}", [CCOMP_ADDRESS]);
        return;
      }

      compPriceUSD = compMarket.inputTokenPriceUSD;
    } else {
      // try to get COMP price between blocks 10271924 - 10960099 using price oracle library
      const customPrice = getUsdPricePerToken(Address.fromString(COMP_ADDRESS));
      compPriceUSD = customPrice.usdPrice.div(customPrice.decimalsBaseTen);
    }

    const borrowCompPerDayUSD = borrowCompPerDay
      .toBigDecimal()
      .div(exponentToBigDecimal(rewardDecimals))
      .times(compPriceUSD);
    const supplyCompPerDayUSD = supplyCompPerDay
      .toBigDecimal()
      .div(exponentToBigDecimal(rewardDecimals))
      .times(compPriceUSD);
    market.rewardTokenEmissionsAmount = [borrowCompPerDay, supplyCompPerDay]; // same order as market.rewardTokens
    market.rewardTokenEmissionsUSD = [borrowCompPerDayUSD, supplyCompPerDayUSD];
    market.save();
  }
}
