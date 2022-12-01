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
  RewardDistributor as RewardDistributorTemplate,
} from "../../../generated/templates";
import {
  getNetworkSpecificConstant,
  ZERO_ADDRESS,
  anyTrue,
  DF_ADDRESS,
  MKR_ADDRESS,
  DEFAULT_DECIMALS,
  BigDecimalTruncateToBigInt,
} from "./constants";
import {
  RewardDistributor,
  DistributionBorrowSpeedUpdated,
  DistributionSupplySpeedUpdated,
} from "../../../generated/templates/RewardDistributor/RewardDistributor";
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
const blocksPerDay = new BigDecimal(BigInt.fromI32(constant.blocksPerDay));
const blocksPerYear = constant.blocksPerYear;
const rewardTokenAddr = constant.rewardTokenAddress;

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

  initRewards(cTokenAddr);
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
    blocksPerYear
  );

  _handleAccrueInterest(
    updateMarketData,
    comptrollerAddr,
    event.params.interestAccumulated,
    event.params.totalBorrows,
    network.toLowerCase() == Network.MAINNET.toLowerCase(),
    event
  );

  updateRewardPrices(marketAddress);
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

////////////////////////////
///// Reward Functions /////
////////////////////////////

export function handleNewRewardDistributor(event: NewRewardDistributor): void {
  // trigger RewardDistributor template
  RewardDistributorTemplate.create(event.params.newRewardDistributor);
}

export function handleDistributionBorrowSpeedUpdated(
  event: DistributionBorrowSpeedUpdated
): void {
  const market = Market.load(event.params.iToken.toHexString());
  if (!market) {
    log.error("Market not found for address {}", [
      event.params.iToken.toHexString(),
    ]);
    return;
  }

  const emissionsAmount = market.rewardTokenEmissionsAmount!;
  emissionsAmount[0] = BigDecimalTruncateToBigInt(
    event.params.borrowSpeed.toBigDecimal().times(blocksPerDay)
  );
  market.rewardTokenEmissionsAmount = emissionsAmount;
  market.save();

  updateRewardPrices(event.params.iToken);
}

export function handleDistributionSupplySpeedUpdated(
  event: DistributionSupplySpeedUpdated
): void {
  const market = Market.load(event.params.iToken.toHexString());
  if (!market) {
    log.error("Market not found for address {}", [
      event.params.iToken.toHexString(),
    ]);
    return;
  }
  const emissionsAmount = market.rewardTokenEmissionsAmount!;
  emissionsAmount[1] = BigDecimalTruncateToBigInt(
    event.params.supplySpeed.toBigDecimal().times(blocksPerDay)
  );
  market.rewardTokenEmissionsAmount = emissionsAmount;
  market.save();

  updateRewardPrices(event.params.iToken);
}

function initRewards(marketAddr: Address): void {
  const market = Market.load(marketAddr.toHexString());
  if (!market) {
    log.error("Market not found for address {}", [marketAddr.toHexString()]);
    return;
  }

  market.rewardTokens = getOrCreateRewardTokens();
  market.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
  market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  market.save();
}

// initially create reward tokens
// reward is always DForce token
function getOrCreateRewardTokens(): string[] {
  let token = Token.load(rewardTokenAddr.toHexString());
  if (!token) {
    token = new Token(rewardTokenAddr.toHexString());
    token.name = "dForce";
    token.symbol = "DF";
    token.decimals = 18;
    token.save();
  }

  const borrowRewardTokenId = RewardTokenType.BORROW.concat("-").concat(
    token.id
  );
  let borrowRewardToken = RewardToken.load(borrowRewardTokenId);
  if (borrowRewardToken == null) {
    borrowRewardToken = new RewardToken(borrowRewardTokenId);
    borrowRewardToken.token = token.id;
    borrowRewardToken.type = RewardTokenType.BORROW;
    borrowRewardToken.save();
  }

  const depositRewardTokenId = RewardTokenType.DEPOSIT.concat("-").concat(
    token.id
  );
  let depositRewardToken = RewardToken.load(depositRewardTokenId);
  if (depositRewardToken == null) {
    depositRewardToken = new RewardToken(depositRewardTokenId);
    depositRewardToken.token = token.id;
    depositRewardToken.type = RewardTokenType.DEPOSIT;
    depositRewardToken.save();
  }

  return [borrowRewardTokenId, depositRewardTokenId];
}

function updateRewardPrices(marketAddress: Address): void {
  const market = Market.load(marketAddress.toHexString());
  if (!market) {
    log.error("Market not found for address {}", [marketAddress.toHexString()]);
    return;
  }
  const rewardToken = RewardToken.load(market.rewardTokens![0]);
  if (!rewardToken) {
    log.error("Reward token not found for market", [market.id]);
    return;
  }

  const comptroller = Comptroller.bind(comptrollerAddr);
  const tryRewardDistributor = comptroller.try_rewardDistributor();
  if (tryRewardDistributor.reverted) {
    log.info("Reward distributor not found", []);
    return;
  }
  const distributorContract = RewardDistributor.bind(
    tryRewardDistributor.value
  );
  const tryDistributionFactor =
    distributorContract.try_distributionFactorMantissa(marketAddress);
  const distributionFactor = tryDistributionFactor.reverted
    ? BIGDECIMAL_ZERO
    : tryDistributionFactor.value
        .toBigDecimal()
        .div(exponentToBigDecimal(DEFAULT_DECIMALS));

  const token = Token.load(rewardToken.token);
  if (!token) {
    log.error("Token not found for reward token {}", [rewardToken.id]);
    return;
  }
  let priceUSD = token.lastPriceUSD;
  if (!priceUSD) {
    const protocol = getOrCreateProtocol();
    const oracleContract = PriceOracle.bind(
      Address.fromString(protocol._priceOracle)
    );
    const priceRaw = getOrElse(
      oracleContract.try_getAssetPrice(Address.fromString(rewardToken.token)),
      BIGINT_ZERO
    );
    priceUSD = priceRaw
      .toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS));
  }

  market.rewardTokenEmissionsUSD = [
    market
      .rewardTokenEmissionsAmount![0].toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS))
      .times(distributionFactor)
      .times(priceUSD),
    market
      .rewardTokenEmissionsAmount![1].toBigDecimal()
      .div(exponentToBigDecimal(DEFAULT_DECIMALS))
      .times(distributionFactor)
      .times(priceUSD),
  ];
  market.save();
}
