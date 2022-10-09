import { Address, BigInt, log, BigDecimal } from "@graphprotocol/graph-ts";
// import from the generated at root in order to reuse methods from root
import {
  ProtocolData,
  _getOrCreateProtocol,
  _handleNewReserveFactor,
  _handleNewCollateralFactor,
  _handleNewPriceOracle,
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
  snapshotFinancials,
  _handleMarketEntered,
  _handleTransfer,
} from "../../../src/mapping";
import {
  cTokenDecimals,
  BIGINT_ZERO,
  RewardTokenType,
  exponentToBigDecimal,
  BIGDECIMAL_ZERO,
  SECONDS_PER_DAY,
  Network,
} from "../../../src/constants";
import {
  LendingProtocol,
  Token,
  Market,
  _DforceMarketStatus,
  RewardToken,
  FinancialsDailySnapshot,
} from "../../../generated/schema";
import { ERC20 } from "../../../generated/Comptroller/ERC20";

// otherwise import from the specific subgraph root
import { CToken } from "../../../generated/Comptroller/CToken";
import { PriceOracle } from "../../../generated/Comptroller/PriceOracle";
import {
  CToken as CTokenTemplate,
  Reward as RewardTemplate,
} from "../../../generated/templates";
import {
  getNetworkSpecificConstant,
  ZERO_ADDRESS,
  prefixID,
  BigDecimalTruncateToBigInt,
  anyTrue,
  PRICE_BASE,
  DISTRIBUTIONFACTOR_BASE,
  DF_ADDRESS,
  MKR_ADDRESS,
} from "./constants";
import {
  RewardDistributor,
  RewardDistributed,
  NewRewardToken,
} from "../../../generated/templates/Reward/RewardDistributor";
import {
  stablecoin,
  Transfer as StablecoinTransfer,
} from "../../../generated/USX/stablecoin";
import {
  NewPriceOracle,
  MarketAdded,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewRewardDistributor,
  MintPaused,
  RedeemPaused,
  BorrowPaused,
  TransferPaused,
  Comptroller,
  MarketEntered,
  MarketExited,
} from "../../../generated/Comptroller/Comptroller";
import {
  Mint,
  Redeem,
  Borrow as BorrowEvent,
  RepayBorrow,
  LiquidateBorrow,
  UpdateInterest as AccrueInterest,
  NewReserveRatio,
  Transfer,
} from "../../../generated/templates/CToken/CToken";

// Constant values
const constant = getNetworkSpecificConstant();
const comptrollerAddr = constant.comptrollerAddr;
const network = constant.network;
const unitPerDay = new BigDecimal(BigInt.fromI32(constant.unitPerDay));
const unitPerYear = constant.unitPerYear;

export function handleNewPriceOracle(event: NewPriceOracle): void {
  const protocol = getOrCreateProtocol();
  const newPriceOracle = event.params.newPriceOracle;
  _handleNewPriceOracle(protocol, newPriceOracle);
}

export function handleMarketEntered(event: MarketEntered): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.iToken.toHexString(),
    event.params.account.toHexString(),
    true
  );
}

export function handleMarketExited(event: MarketExited): void {
  _handleMarketEntered(
    comptrollerAddr,
    event.params.iToken.toHexString(),
    event.params.account.toHexString(),
    false
  );
}

export function handleMarketAdded(event: MarketAdded): void {
  CTokenTemplate.create(event.params.iToken);

  const cTokenAddr = event.params.iToken;
  const cToken = Token.load(cTokenAddr.toHexString());
  if (cToken != null) {
    return;
  }
  // this is a new cToken, a new underlying token, and a new market
  const protocol = getOrCreateProtocol();
  const cTokenContract = CToken.bind(event.params.iToken);
  const cTokenReserveFactorMantissa = getOrElse<BigInt>(
    cTokenContract.try_reserveRatio(),
    BIGINT_ZERO
  );

  // set defaults
  let underlyingTokenAddr = Address.fromString(ZERO_ADDRESS);
  let underlyingName = "unknown";
  let underlyingSymbol = "unknown";
  let underlyingDecimals = 18;
  const underlyingTokenAddrResult = cTokenContract.try_underlying();
  if (!underlyingTokenAddrResult.reverted) {
    underlyingTokenAddr = underlyingTokenAddrResult.value;
    if (underlyingTokenAddr.toHexString() == MKR_ADDRESS) {
      underlyingName = "Maker";
      underlyingSymbol = "MKR";
      underlyingDecimals = 18;
    } else if (underlyingTokenAddr.toHexString() == DF_ADDRESS) {
      underlyingName = "dForce";
      underlyingSymbol = "DF";
      underlyingDecimals = 18;
    } else if (underlyingTokenAddr.toHexString() == ZERO_ADDRESS) {
      // this is eth on ethereum
      if (constant.network == Network.MAINNET) {
        underlyingName = "Ether";
        underlyingSymbol = "ETH";
        underlyingDecimals = 18;
      } else if (constant.network == Network.BSC) {
        underlyingName = "BNB";
        underlyingSymbol = "BNB";
        underlyingDecimals = 18;
      }
    } else {
      const underlyingTokenContract = ERC20.bind(underlyingTokenAddr);
      underlyingName = getOrElse<string>(
        underlyingTokenContract.try_name(),
        "unknown"
      );
      underlyingSymbol = getOrElse<string>(
        underlyingTokenContract.try_symbol(),
        "unknown"
      );
      underlyingDecimals = getOrElse<i32>(
        underlyingTokenContract.try_decimals(),
        18
      );
    }
  } else {
    log.error(
      "[handleMarketAdded] could not fetch underlying token of cToken: {}",
      [cTokenAddr.toHexString()]
    );
    return;
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

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  const marketID = event.params.iToken.toHexString();
  const collateralFactorMantissa = event.params.newCollateralFactorMantissa;
  _handleNewCollateralFactor(marketID, collateralFactorMantissa);
}

export function handleNewLiquidationIncentive(
  event: NewLiquidationIncentive
): void {
  const protocol = getOrCreateProtocol();
  const newLiquidationIncentiveMantissa =
    event.params.newLiquidationIncentiveMantissa;
  _handleNewLiquidationIncentive(protocol, newLiquidationIncentiveMantissa);
}

// toggle market.isActive based on pause status of mint/redeem/transfer
export function handleMintPaused(event: MintPaused): void {
  const marketID = event.params.iToken.toHexString();
  const market = Market.load(marketID);
  if (market == null) {
    log.warning("[handleMintPaused] Market not found: {}", [marketID]);
    return;
  }

  const _marketStatus = getOrCreateMarketStatus(marketID);

  _marketStatus.mintPaused = event.params.paused;
  // isActive = false if any one of mint/redeem/transfer is paused
  market.isActive = !anyTrue([
    _marketStatus.mintPaused,
    _marketStatus.redeemPaused,
    _marketStatus.transferPaused,
  ]);

  market.save();
  _marketStatus.save();
}

// toggle market.isActive based on pause status of mint/redeem/transfer
export function handleRedeemPaused(event: RedeemPaused): void {
  const marketID = event.params.iToken.toHexString();
  const market = Market.load(marketID);
  if (market == null) {
    log.warning("[handleRedeemPaused] Market not found: {}", [marketID]);
    return;
  }

  const _marketStatus = getOrCreateMarketStatus(marketID);

  _marketStatus.redeemPaused = event.params.paused;
  // isActive = false if any one of mint/redeem/transfer is paused
  market.isActive = !anyTrue([
    _marketStatus.mintPaused,
    _marketStatus.redeemPaused,
    _marketStatus.transferPaused,
  ]);

  market.save();
  _marketStatus.save();
}

// toggle market.isActive based on pause status of mint/redeem/transfer
// transfer pause stops transfer of all iTokens
export function handleTransferPaused(event: TransferPaused): void {
  const protocol = getOrCreateProtocol();
  const markets = protocol._marketIDs;
  for (let i = 0; i < markets.length; i++) {
    const marketID = markets[i];
    const market = Market.load(marketID);
    if (market == null) {
      log.warning("[handleTransferPaused] Market not found: {}", [marketID]);
      return;
    }

    const _marketStatus = getOrCreateMarketStatus(marketID);
    _marketStatus.transferPaused = event.params.paused;
    // isActive = false if any one of mint/redeem/transfer is paused
    market.isActive = !anyTrue([
      _marketStatus.mintPaused,
      _marketStatus.redeemPaused,
      _marketStatus.transferPaused,
    ]);

    market.save();
    _marketStatus.save();
  }
}

export function handleBorrowPaused(event: BorrowPaused): void {
  // toggle market.canBorrowFrom based on BorrowPaused event
  const marketId = event.params.iToken.toHexString();
  const market = Market.load(marketId);
  if (market != null) {
    market.canBorrowFrom = !event.params.paused;
    market.save();
  } else {
    log.warning("[handleBorrowPaused] Market {} does not exist.", [marketId]);
  }
}

export function handleNewReserveFactor(event: NewReserveRatio): void {
  const marketID = event.address.toHexString();
  const reserveFactorMantissa = event.params.newReserveRatio;
  _handleNewReserveFactor(marketID, reserveFactorMantissa);
}

export function handleMint(event: Mint): void {
  const minter = event.params.sender;
  const mintAmount = event.params.mintAmount;
  const contract = CToken.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.sender
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
  const redeemer = event.params.recipient;
  const redeemAmount = event.params.redeemUnderlyingAmount;
  const contract = CToken.bind(event.address);
  const outputTokenSupplyResult = contract.try_totalSupply();
  const balanceOfUnderlyingResult = contract.try_balanceOfUnderlying(
    event.params.recipient
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
  const cTokenCollateral = event.params.iTokenCollateral;
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

export function handleUpdateInterest(event: AccrueInterest): void {
  const marketAddress = event.address;
  const cTokenContract = CToken.bind(marketAddress);
  const protocol = getOrCreateProtocol();
  const oracleContract = PriceOracle.bind(
    Address.fromString(protocol._priceOracle)
  );
  const updateMarketData = new UpdateMarketData(
    cTokenContract.try_totalSupply(),
    cTokenContract.try_exchangeRateStored(),
    cTokenContract.try_supplyRatePerBlock(),
    cTokenContract.try_borrowRatePerBlock(),
    oracleContract.try_getUnderlyingPrice(marketAddress),
    unitPerYear
  );

  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    event.params.interestAccumulated,
    event.params.totalBorrows,
    network.toLowerCase() == Network.MAINNET.toLowerCase(),
    event
  );
}

export function handleNewRewardDistributor(event: NewRewardDistributor): void {
  // trigger RewardDistributor template
  RewardTemplate.create(event.params._newRewardDistributor);
}

function _getOrCreateRewardTokens(tokenAddr: string): string[] {
  // add reward token to Token if not already there
  let token = Token.load(tokenAddr);
  if (token == null) {
    token = new Token(tokenAddr);
    // speciall handle for DF token since its name and symbol is byte32
    if (tokenAddr == DF_ADDRESS) {
      token.name = "dForce";
      token.symbol = "DF";
      token.decimals = 18;
    } else {
      const tokenContract = ERC20.bind(Address.fromString(tokenAddr));
      token.name = getOrElse<string>(tokenContract.try_name(), "unknown");
      token.symbol = getOrElse<string>(tokenContract.try_symbol(), "unknown");
      token.decimals = getOrElse<i32>(tokenContract.try_decimals(), 18);
    }
    token.save();
  }

  const borrowRewardTokenId = prefixID(tokenAddr, RewardTokenType.BORROW);
  let borrowRewardToken = RewardToken.load(borrowRewardTokenId);
  if (borrowRewardToken == null) {
    borrowRewardToken = new RewardToken(borrowRewardTokenId);
    borrowRewardToken.token = tokenAddr;
    borrowRewardToken.type = RewardTokenType.BORROW;
    borrowRewardToken.save();
  }

  const depositRewardTokenId = prefixID(tokenAddr, RewardTokenType.DEPOSIT);
  let depositRewardToken = RewardToken.load(depositRewardTokenId);
  if (depositRewardToken == null) {
    depositRewardToken = new RewardToken(depositRewardTokenId);
    depositRewardToken.token = tokenAddr;
    depositRewardToken.type = RewardTokenType.DEPOSIT;
    depositRewardToken.save();
  }

  return [borrowRewardTokenId, depositRewardTokenId];
}

export function handleNewRewardToken(event: NewRewardToken): void {
  // Add new reward token to the rewardToken entity
  const tokenAddr = event.params.newRewardToken.toHexString();

  const rewardTokenIds = _getOrCreateRewardTokens(tokenAddr);

  const protocol = getOrCreateProtocol();
  const markets = protocol._marketIDs;
  for (let i = 0; i < markets.length; i++) {
    const marketID = markets[i];
    const market = Market.load(marketID);
    if (market == null) {
      log.warning("[handleNewRewardToken] Market not found: {}", [marketID]);
      return;
    }
    market.rewardTokens = [rewardTokenIds[0], rewardTokenIds[1]];
    market.save();
  }
}

export function handleRewardDistributed(event: RewardDistributed): void {
  // RewardDistributed event in dforce is emitted when rewards is distributed
  // to individual account (borrower/depositor)
  // Since there is no event for market level/protocol level reward emission
  // we have to do the calculation by ourselves following the logic in
  // function _updateDistributionState in RewardDistributor.sol
  // It'd be more efficient to handle the DistributionSpeedsUpdated event
  // instead, but it was never emitted for some reason
  const distributorContract = RewardDistributor.bind(event.address);

  const marketID = event.params.iToken.toHexString();
  const market = Market.load(marketID);
  if (market == null) {
    log.warning("[handleRewardDistributed] Market not found: {}", [marketID]);
    return;
  }

  const rewardTokens = market.rewardTokens;
  if (rewardTokens == null || rewardTokens.length == 0) {
    const rewardTokenAddr = distributorContract.rewardToken().toHexString();
    market.rewardTokens = _getOrCreateRewardTokens(rewardTokenAddr);
    market.save();
  }

  const rewardTokenId = RewardToken.load(market.rewardTokens![0])!.token;
  const rewardToken = Token.load(rewardTokenId);
  if (rewardToken == null) {
    log.warning("[handleRewardDistributed] Token not found: {}", [
      rewardTokenId,
    ]);
    return;
  }
  const decimals = rewardToken.decimals;
  let rewardTokenPrice = rewardToken.lastPriceUSD;
  if (!rewardTokenPrice) {
    const protocol = getOrCreateProtocol();
    const oracleContract = PriceOracle.bind(
      Address.fromString(protocol._priceOracle)
    );
    rewardTokenPrice = oracleContract
      .getAssetPrice(Address.fromString(rewardTokenId))
      .toBigDecimal()
      .div(exponentToBigDecimal(PRICE_BASE));
  }

  let rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
  rewardTokenEmissionsAmount =
    rewardTokenEmissionsAmount != null
      ? rewardTokenEmissionsAmount
      : [BIGINT_ZERO, BIGINT_ZERO];
  let rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
  rewardTokenEmissionsUSD =
    rewardTokenEmissionsUSD != null
      ? rewardTokenEmissionsUSD
      : [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  const marketAddr = Address.fromString(marketID);
  const distributionFactor = distributorContract
    .distributionFactorMantissa(marketAddr)
    .toBigDecimal()
    .div(exponentToBigDecimal(DISTRIBUTIONFACTOR_BASE));

  // rewards is only affected by speed and deltaBlocks
  const emissionSpeedBorrow = getOrElse<BigInt>(
    distributorContract.try_distributionSpeed(marketAddr),
    BIGINT_ZERO
  );
  const emissionSpeedSupply = getOrElse<BigInt>(
    distributorContract.try_distributionSupplySpeed(marketAddr),
    BIGINT_ZERO
  );

  const emissionBorrow = emissionSpeedBorrow.toBigDecimal().times(unitPerDay);
  rewardTokenEmissionsAmount[0] = BigDecimalTruncateToBigInt(emissionBorrow);
  rewardTokenEmissionsUSD[0] = emissionBorrow
    .div(exponentToBigDecimal(decimals))
    .times(distributionFactor)
    .times(rewardTokenPrice);

  const emissionSupply = emissionSpeedSupply.toBigDecimal().times(unitPerDay);
  rewardTokenEmissionsAmount[1] = BigDecimalTruncateToBigInt(emissionSupply);
  rewardTokenEmissionsUSD[1] = emissionSupply
    .div(exponentToBigDecimal(decimals))
    .times(distributionFactor)
    .times(rewardTokenPrice);

  market.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  market.save();
}

// update USX/EUX supply for
//    - protocol.mintedTokens
//    - protocl.mintedTokensSupplies
//    - FinancialsDailySnapshot.mintedTokensSupplies
export function handleStablecoinTransfer(event: StablecoinTransfer): void {
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    // supply won't change for non-minting/burning transfers
    log.info(
      "[handleStablecoinTransfer] Not a minting or burning event, skipping",
      []
    );
    return;
  }

  const tokenId = event.address.toHexString();
  const protocol = getOrCreateProtocol();

  const contract = stablecoin.bind(event.address);
  const supply = contract.totalSupply();
  let token = Token.load(tokenId);
  if (token == null) {
    token = new Token(tokenId);
    token.name = contract.name();
    token.symbol = contract.symbol();
    token.decimals = contract.decimals();
    token.save();
  }

  // since mintedTokens will be sorted by address, we need to make sure
  // mintedTokenSupplies is sorted in the same order
  let mintedTokens = protocol.mintedTokens;
  let mintedTokenSupplies = protocol.mintedTokenSupplies;
  if (mintedTokens == null || mintedTokens.length == 0) {
    protocol.mintedTokens = [tokenId];
    protocol.mintedTokenSupplies = [supply];
  } else {
    const tokenIndex = mintedTokens.indexOf(tokenId);
    if (tokenIndex >= 0) {
      // token already in protocol.mintedTokens
      mintedTokenSupplies![tokenIndex] = supply;
      protocol.mintedTokenSupplies = mintedTokenSupplies;
    } else {
      if (tokenId < mintedTokens[0]) {
        // insert as the first token into mintedTokens
        protocol.mintedTokens = [tokenId].concat(mintedTokens);
        protocol.mintedTokenSupplies = [supply].concat(mintedTokenSupplies!);
      } else {
        // insert as the last token into mintedTokens
        mintedTokens = mintedTokens.concat([tokenId]);
        mintedTokenSupplies = mintedTokenSupplies!.concat([supply]);
        protocol.mintedTokens = mintedTokens;
        protocol.mintedTokenSupplies = mintedTokenSupplies;
      }
    }
  }

  protocol.save();

  const blockTimeStamp = event.block.timestamp;
  const snapshotID = (blockTimeStamp.toI32() / SECONDS_PER_DAY).toString();

  let snapshot = FinancialsDailySnapshot.load(snapshotID);
  if (snapshot == null) {
    snapshotFinancials(comptrollerAddr, event.block.number, blockTimeStamp);
    snapshot = FinancialsDailySnapshot.load(snapshotID);
  }

  // There is no financialDailySnapshot.mintedTokens in the schema
  // financialDailySnapshot.mintedTokens = mintedTokens;
  snapshot!.mintedTokenSupplies = protocol.mintedTokenSupplies;
  snapshot!.save();
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
    "dForce v2",
    "dforce-v2",
    "2.0.1",
    "1.2.1",
    "1.0.0",
    network,
    comptroller.try_liquidationIncentiveMantissa(),
    comptroller.try_priceOracle()
  );
  return _getOrCreateProtocol(protocolData);
}

// helper entity to determine market status
export function getOrCreateMarketStatus(marketId: string): _DforceMarketStatus {
  let marketStatus = _DforceMarketStatus.load(marketId);

  if (marketStatus == null) {
    marketStatus = new _DforceMarketStatus(marketId);

    marketStatus.mintPaused = false;
    marketStatus.redeemPaused = false;
    marketStatus.transferPaused = false;

    marketStatus.save();
  }
  return marketStatus;
}
