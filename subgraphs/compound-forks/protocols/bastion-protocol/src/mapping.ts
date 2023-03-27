import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
// import from the generated at root in order to reuse methods from root
import {
  NewPriceOracle,
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  ActionPaused1,
  MarketExited,
  MarketEntered,
  NewRewardDistributor,
} from "../../../generated/Comptroller/Comptroller";
import {
  Mint,
  Redeem,
  Borrow as BorrowEvent,
  RepayBorrow,
  LiquidateBorrow,
  AccrueInterest,
  NewReserveFactor,
  Transfer,
} from "../../../generated/templates/CToken/CToken";
import {
  LendingProtocol,
  Market,
  RewardToken,
  Token,
  _Realm,
  _RewardType,
} from "../../../generated/schema";
import {
  cTokenDecimals,
  Network,
  BIGINT_ZERO,
  SECONDS_PER_YEAR,
  SECONDS_PER_DAY,
  RewardTokenType,
  exponentToBigDecimal,
  BIGDECIMAL_ZERO,
  mantissaFactor,
} from "../../../src/constants";
import {
  ProtocolData,
  _getOrCreateProtocol,
  _handleNewReserveFactor,
  _handleNewCollateralFactor,
  _handleMarketListed,
  MarketListedData,
  TokenData,
  _handleNewLiquidationIncentive,
  _handleMint,
  _handleRedeem,
  _handleBorrow,
  _handleRepayBorrow,
  _handleLiquidateBorrow,
  UpdateMarketData,
  _handleAccrueInterest,
  getOrElse,
  _handleActionPaused,
  _handleMarketEntered,
  _handleTransfer,
  getOrCreateMarketDailySnapshot,
  getOrCreateMarketHourlySnapshot,
} from "../../../src/mapping";
// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { Comptroller } from "../../../generated/Comptroller/Comptroller";
import {
  CToken as CTokenTemplate,
  RewardDistributor as RewardDistributorTemplate,
} from "../../../generated/templates";
import { ERC20 } from "../../../generated/Comptroller/ERC20";
import {
  AURORA_REALM_ADDRESS,
  BSTN_TOKEN_ADDRESS,
  bstnOracle,
  cBSTNContract,
  cNearContract,
  comptrollerAddr,
  cStNearContract,
  MULTICHAIN_REALM_ADDRESS,
  nativeCToken,
  nativeToken,
  NEAR_TOKEN_ADDRESS,
  nearOracle,
  STNEAR_TOKEN_ADDRESS,
  stNearOracle,
  STNEAR_REALM_ADDRESS,
} from "./constants";
import { PriceOracle } from "../../../generated/templates/CToken/PriceOracle";
import {
  RewardAdded,
  RewardAddressChanged,
  RewardBorrowSpeedUpdated,
  RewardSupplySpeedUpdated,
} from "../../../generated/templates/RewardDistributor/RewardDistributor";

export function handleNewRewardDistributor(event: NewRewardDistributor): void {
  log.info(
    "[handleNewRewardDistributor]New RewardDistributor {} for market {} at tx {}",
    [
      event.params.newRewardDistributor.toHexString(),
      event.address.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
  RewardDistributorTemplate.create(event.params.newRewardDistributor);
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let realm = _Realm.load(event.address.toHexString());
  if (!realm) {
    realm = new _Realm(event.address.toHexString());
  }
  realm.priceOracle = event.params.newPriceOracle.toHexString();
  realm.save();
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

export function handleMarketListed(event: MarketListed): void {
  if (event.params.cToken.equals(cBSTNContract)) {
    log.info("[handleMarketListed]cBSTN token {} is skipped", [
      event.params.cToken.toHexString(),
    ]);
    return;
  }

  CTokenTemplate.create(event.params.cToken);
  const cTokenAddr = event.params.cToken;
  const cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market
  const protocol = getOrCreateProtocol();
  const cTokenContract = CToken.bind(event.params.cToken);
  const cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveFactorMantissa(),
    BIGINT_ZERO
  );

  let marketNamePrefix = "";
  if (event.address.equals(AURORA_REALM_ADDRESS)) {
    marketNamePrefix = "Aurora Realm: ";
  } else if (event.address.equals(STNEAR_REALM_ADDRESS)) {
    marketNamePrefix = "STNear Realm: ";
  } else if (event.address.equals(MULTICHAIN_REALM_ADDRESS)) {
    marketNamePrefix = "Multichain Realm: ";
  }

  if (cTokenAddr == nativeCToken.address) {
    const marketListedData = new MarketListedData(
      protocol,
      nativeToken,
      nativeCToken,
      cTokenReserveFactorMantissa
    );
    _handleMarketListed(marketListedData, event);
    const market = Market.load(cTokenAddr.toHexString());
    if (!market) {
      log.critical(
        "[handleMarketListed]market entity {} not added for tx {}-{}",
        [
          cTokenAddr.toHexString(),
          event.transaction.hash.toHexString(),
          event.transactionLogIndex.toString(),
        ]
      );
      return;
    }
    market.name = `${marketNamePrefix}${market.name!}`;
    market._realm = event.address.toHexString();
    market.save();
    return;
  }

  const underlyingTokenAddrResult = cTokenContract.try_underlying();
  if (underlyingTokenAddrResult.reverted) {
    log.warning(
      "[handleMarketListed] could not fetch underlying token of cToken: {}",
      [cTokenAddr.toHexString()]
    );
    return;
  }
  const underlyingTokenAddr = underlyingTokenAddrResult.value;
  const underlyingTokenContract = ERC20.bind(underlyingTokenAddr);
  _handleMarketListed(
    new MarketListedData(
      protocol,
      new TokenData(
        underlyingTokenAddr,
        getOrElse<string>(underlyingTokenContract.try_name(), "unknown"),
        getOrElse<string>(underlyingTokenContract.try_symbol(), "unknown"),
        getOrElse<i32>(underlyingTokenContract.try_decimals(), 0)
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

  const market = Market.load(cTokenAddr.toHexString());
  if (!market) {
    log.critical(
      "[handleMarketListed]market entity {} not added for tx {}-{}",
      [
        cTokenAddr.toHexString(),
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toString(),
      ]
    );
    return;
  }
  market.name = `${marketNamePrefix}${market.name!}`;
  market._realm = event.address.toHexString();
  market.save();
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
  // it seems bastion protocol flips the pauseState, so we invert it here
  // https://github.com/messari/subgraphs/issues/1415#issuecomment-1475407997
  // https://github.com/messari/subgraphs/pull/1805#pullrequestreview-1349739373
  _handleActionPaused(marketID, action, !pauseState);
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  const marketID = event.address.toHexString();
  const newReserveFactorMantissa = event.params.newReserveFactorMantissa;
  _handleNewReserveFactor(marketID, newReserveFactorMantissa);
}

export function handleMint(event: Mint): void {
  const minter = event.params.minter;
  const mintAmount = event.params.mintAmount;
  const contract = CToken.bind(event.address);
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
  const contract = CToken.bind(event.address);
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

export function handleBorrow(event: BorrowEvent): void {
  const borrower = event.params.borrower;
  const borrowAmount = event.params.borrowAmount;
  const totalBorrows = event.params.totalBorrows;
  const contract = CToken.bind(event.address);
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
  const borrower = event.params.borrower;
  const payer = event.params.payer;
  const repayAmount = event.params.repayAmount;
  const totalBorrows = event.params.totalBorrows;
  const contract = CToken.bind(event.address);
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

export function handleAccrueInterest(event: AccrueInterest): void {
  const marketAddress = event.address;
  const market = Market.load(marketAddress.toHexString());
  if (!market || !market._realm) {
    log.error(
      "[handleAccrueInterest]market {} doesn't exist or market.realm{} tx {}-{}",
      [
        marketAddress.toHexString(),
        market && !market._realm ? "=null" : "",
        event.transaction.hash.toHexString(),
        event.transactionLogIndex.toHexString(),
      ]
    );
    return;
  }
  updateRewardTokenPrices(market);

  const realm = _Realm.load(market._realm!);
  if (!realm) {
    log.error("[handleAccrueInterest]realm {} doesn't exist tx {}-{}", [
      market._realm!,
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toString(),
    ]);
    return;
  }

  // replace price oracle for Near and stNear token in the stNear realm
  // as the stNear realm oracle returns prices relative to the Near price
  let priceOracle = Address.fromString(realm.priceOracle);
  let marketAddressForOracle = marketAddress;
  if (Address.fromString(market.inputToken).equals(NEAR_TOKEN_ADDRESS)) {
    priceOracle = nearOracle;
    marketAddressForOracle = cNearContract;
  } else if (
    Address.fromString(market.inputToken).equals(STNEAR_TOKEN_ADDRESS)
  ) {
    priceOracle = stNearOracle;
    marketAddressForOracle = cStNearContract;
  }

  const oracleContract = PriceOracle.bind(priceOracle);
  const cTokenContract = CToken.bind(marketAddress);
  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    oracleContract.try_getUnderlyingPrice(marketAddressForOracle),
    SECONDS_PER_YEAR
  );
  const interestAccumulated = event.params.interestAccumulated;
  const totalBorrows = event.params.totalBorrows;
  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    interestAccumulated,
    totalBorrows,
    false, // do not update all market prices
    event
  );
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

function getOrCreateProtocol(): LendingProtocol {
  const comptroller = Comptroller.bind(comptrollerAddr);
  const protocolData = new ProtocolData(
    comptrollerAddr,
    "Bastion Protocol",
    "bastion-protocol",
    Network.AURORA,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_oracle()
  );
  return _getOrCreateProtocol(protocolData);
}

export function handleRewardAdded(event: RewardAdded): void {
  const rewardTypeId = event.params.rewardType.toString();
  let rewardToken = _RewardType.load(rewardTypeId);
  if (!rewardToken) {
    rewardToken = new _RewardType(rewardTypeId);
  }
  rewardToken.token = event.params.newRewardAddress.toHexString();
  rewardToken.save();
  getOrCreateToken(event.params.newRewardAddress);
}

export function handleRewardAddressChanged(event: RewardAddressChanged): void {
  const rewardTypeId = event.params.rewardType.toString();
  let rewardToken = _RewardType.load(rewardTypeId);
  if (!rewardToken) {
    rewardToken = new _RewardType(rewardTypeId);
  }
  rewardToken.token = event.params.newRewardAddress.toHexString();
  rewardToken.save();
  getOrCreateToken(event.params.newRewardAddress);
}

export function handleRewardBorrowSpeedUpdated(
  event: RewardBorrowSpeedUpdated
): void {
  updateRewardSpeed(
    event.params.rewardType.toString(),
    event.params.cToken,
    event.params.newSpeed,
    RewardTokenType.BORROW,
    event
  );
}

export function handleRewardSupplySpeedUpdated(
  event: RewardSupplySpeedUpdated
): void {
  updateRewardSpeed(
    event.params.rewardType.toString(),
    event.params.cToken,
    event.params.newSpeed,
    RewardTokenType.DEPOSIT,
    event
  );
}

function updateRewardSpeed(
  rewardTypeId: string,
  cToken: Address,
  newSpeed: BigInt,
  rewardTokenType: RewardTokenType,
  event: ethereum.Event
): void {
  const rewardType = _RewardType.load(rewardTypeId);
  if (!rewardType) {
    log.error(
      "[updateRewardSpeed]RewardType {} doesn't exist in _RewardType tx {}",
      [rewardTypeId, event.transaction.hash.toHexString()]
    );
    return;
  }
  const market = Market.load(cToken.toHexString());
  if (!market) {
    log.error("[updateRewardSpeed]market {} doesn't exist", [
      cToken.toHexString(),
    ]);
    return;
  }

  const rewardTokenAddress = Address.fromString(rewardType.token);
  const token = getOrCreateToken(rewardTokenAddress);
  const dailyEmission = newSpeed.times(BigInt.fromI32(SECONDS_PER_DAY));
  const priceUSD = getRewardTokenPrice(token);
  const dailyEmissionUSD = dailyEmission
    .toBigDecimal()
    .div(exponentToBigDecimal(token.decimals))
    .times(priceUSD);

  const rewardToken = getOrCreateRewardToken(token, rewardTokenType);
  const rewardTokens = market.rewardTokens ? market.rewardTokens! : [];
  let rewardEmissions = market.rewardTokenEmissionsAmount
    ? market.rewardTokenEmissionsAmount!
    : [];
  let rewardEmissionsUSD = market.rewardTokenEmissionsUSD
    ? market.rewardTokenEmissionsUSD!
    : [];

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  if (rewardTokenIndex == -1) {
    // this is a new reward token
    rewardTokens.push(rewardToken.id);
    rewardEmissions.push(dailyEmission);
    rewardEmissionsUSD.push(dailyEmissionUSD);

    if (rewardTokens.length > 1) {
      // rewardTokenEmissionsAmount, rewardTokenEmissionsUSD needs to be sorted
      const rewardTokensUnsorted = rewardTokens;
      rewardTokens.sort();
      rewardEmissions = sortArrayByReference<string, BigInt>(
        rewardTokens,
        rewardTokensUnsorted,
        rewardEmissions
      );
      rewardEmissionsUSD = sortArrayByReference<string, BigDecimal>(
        rewardTokens,
        rewardTokensUnsorted,
        rewardEmissionsUSD
      );
    }
  } else {
    // existing reward token, update rewardEmissions and rewardEmissionsUSD at rewardTokenIndex
    rewardEmissions[rewardTokenIndex] = dailyEmission;
    rewardEmissionsUSD[rewardTokenIndex] = dailyEmissionUSD;
  }
  market.rewardTokens = rewardTokens;
  market.rewardTokenEmissionsAmount = rewardEmissions;
  market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
  market.save();

  log.info(
    "[updateRewardSpeed]market {}/{} reward emission updated: rewardTokens [{}], emissions=[{}], emissionsUSD=[{}] at tx {}-{}",
    [
      market.id,
      market.name ? market.name! : "",
      market.rewardTokens!.toString(),
      market.rewardTokenEmissionsAmount!.toString(),
      market.rewardTokenEmissionsUSD!.toString(),
      event.transaction.hash.toHexString(),
      event.transactionLogIndex.toString(),
    ]
  );

  getOrCreateMarketDailySnapshot(
    market,
    event.block.timestamp,
    event.block.number
  );
  getOrCreateMarketHourlySnapshot(
    market,
    event.block.timestamp,
    event.block.number
  );
}

function updateRewardTokenPrices(market: Market): void {
  if (!market.rewardTokens || market.rewardTokens!.length == 0) {
    return;
  }

  const rewardEmissions = market.rewardTokenEmissionsAmount;
  if (!rewardEmissions || rewardEmissions.length == 0) {
    return;
  }
  const rewardEmissionsUSD: BigDecimal[] = [];

  for (let i = 0; i < market.rewardTokens!.length; i++) {
    const rewardTokenId = market.rewardTokens![i];
    const rewardToken = RewardToken.load(rewardTokenId);
    if (!rewardToken) {
      log.error("[]reward token {} for market {} doesn't exist", [
        rewardTokenId,
        market.id,
      ]);
      return;
    }
    const token = getOrCreateToken(Address.fromString(rewardToken.token));
    const priceUSD = getRewardTokenPrice(token);
    rewardEmissionsUSD.push(
      rewardEmissions[i]
        .toBigDecimal()
        .div(exponentToBigDecimal(token.decimals))
        .times(priceUSD)
    );
  }
  market.rewardTokenEmissionsUSD = rewardEmissionsUSD;
  market.save();
}

function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (!token) {
    token = new Token(tokenAddress.toHexString());
    const erc20Contract = ERC20.bind(tokenAddress);
    token.name = getOrElse(erc20Contract.try_name(), "Unknown");
    token.symbol = getOrElse(erc20Contract.try_symbol(), "UNKWN");
    token.decimals = getOrElse(erc20Contract.try_decimals(), 0);
    token.save();
  }
  return token;
}

function getOrCreateRewardToken(token: Token, type: string): RewardToken {
  const rewardTokenId = type + "-" + token.id;
  let rewardToken = RewardToken.load(rewardTokenId);

  if (!rewardToken) {
    rewardToken = new RewardToken(rewardTokenId);
    rewardToken.token = token.id;
    rewardToken.type = type;
    rewardToken.save();
  }

  return rewardToken;
}

function getRewardTokenPrice(token: Token): BigDecimal {
  if (Address.fromString(token.id).equals(BSTN_TOKEN_ADDRESS)) {
    const oracleContract = PriceOracle.bind(bstnOracle);
    const price = getOrElse(
      oracleContract.try_getUnderlyingPrice(cBSTNContract),
      BIGINT_ZERO
    );
    const priceUSD = price
      .toBigDecimal()
      .div(exponentToBigDecimal(mantissaFactor));
    log.info("[getRewardTokenPrice]1 token {}/{} price={}", [
      token.id,
      token.symbol,
      priceUSD.toString(),
    ]);
    return priceUSD;
  }

  if (Address.fromString(token.id).equals(NEAR_TOKEN_ADDRESS)) {
    const oracleContract = PriceOracle.bind(nearOracle);
    const price = getOrElse(
      oracleContract.try_getUnderlyingPrice(cNearContract),
      BIGINT_ZERO
    );
    const priceUSD = price
      .toBigDecimal()
      .div(exponentToBigDecimal(mantissaFactor));
    log.info("[getRewardTokenPrice]2 token {}/{} price={}", [
      token.id,
      token.symbol,
      priceUSD.toString(),
    ]);
    return priceUSD;
  }

  const priceUSD = token.lastPriceUSD ? token.lastPriceUSD! : BIGDECIMAL_ZERO;
  log.info("[getRewardTokenPrice]3 token {}/{} price={}", [
    token.id,
    token.symbol,
    priceUSD.toString(),
  ]);

  return priceUSD;
}

// A function which given 3 arrays of arbitrary types of the same length,
// where the first one holds the reference order, the second one holds the same elements
// as the first but in different order, and the third any arbitrary elements. It will return
// the third array after sorting it according to the order of the first one.
// For example:
// sortArrayByReference(['a', 'c', 'b'], ['a', 'b', 'c'], [1, 2, 3]) => [1, 3, 2]
export function sortArrayByReference<T, K>(
  reference: T[],
  array: T[],
  toSort: K[]
): K[] {
  const sorted: K[] = new Array<K>();
  for (let i = 0; i < reference.length; i++) {
    const index = array.indexOf(reference[i]);
    sorted.push(toSort[index]);
  }
  return sorted;
}
