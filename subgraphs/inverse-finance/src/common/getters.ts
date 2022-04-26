import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { PriceOracle } from "../../generated/Factory/PriceOracle";
import { CErc20 } from "../../generated/templates/CToken/CErc20";
import { ERC20 } from "../../generated/Factory/ERC20";
import { decimalsToBigDecimal, prefixID } from "./utils";
import { InterestRate } from "../../generated/schema";
import {
  Token,
  LendingProtocol,
  Market,
  UsageMetricsDailySnapshot,
  MarketDailySnapshot,
  FinancialsDailySnapshot,
  Account,
  ActiveAccount,
} from "../../generated/schema";
import {
  Network,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  FACTORY_ADDRESS,
  INV_ADDRESS,
  ZERO_ADDRESS,
  ProtocolType,
  LendingType,
  RiskType,
  SECONDS_PER_DAY,
  MANTISSA_DECIMALS,
  RewardTokenType,
  InterestRateType,
  InterestRateSide,
} from "../common/constants";

export function getOrCreateToken(cToken: Address): Token {
  let tokenId: string = cToken.toHexString();
  let token = Token.load(tokenId);

  if (token == null) {
    token = new Token(tokenId);

    let contract = CErc20.bind(cToken);
    token.name = contract.name();
    token.symbol = contract.symbol();
    token.decimals = contract.decimals();

    token.save();
  }
  return token;
}

export function getOrCreateUnderlyingToken(cToken: Address): Token {
  // use default for cETH, which has no underlying
  let tokenId = ZERO_ADDRESS;
  let name = "Ether";
  let symbol = "ETH";
  let decimals = 18;

  //even if the underlying token is not always a CErc20,
  // it should work for the purpose of getting name, symbol, & decimals
  let cTokenContract = CErc20.bind(cToken);
  let tryUnderlyingTokenAddr = cTokenContract.try_underlying();
  if (!tryUnderlyingTokenAddr.reverted) {
    let tokenId = tryUnderlyingTokenAddr.value.toHexString();
    let underlyingTokenContract = ERC20.bind(tryUnderlyingTokenAddr.value);
    let name = underlyingTokenContract.name();
    let symbol = underlyingTokenContract.symbol();
    let decimals = underlyingTokenContract.decimals();
  }

  let token = Token.load(tokenId);

  if (token == null) {
    token = new Token(tokenId);
    token.name = name;
    token.symbol = symbol;
    token.decimals = decimals;

    token.save();
  }
  return token;
}

export function getUnderlyingTokenPrice(cToken: Address): BigDecimal {
  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
  let oracleAddress = factoryContract.oracle() as Address;
  let oracleContract = PriceOracle.bind(oracleAddress);
  let underlyingPrice = oracleContract
    .getUnderlyingPrice(cToken)
    .toBigDecimal()
    .div(decimalsToBigDecimal(MANTISSA_DECIMALS));

  return underlyingPrice;
}

export function getUnderlyingTokenPricePerAmount(cToken: Address): BigDecimal {
  //return price of 1 underlying token
  let underlyingPrice = getUnderlyingTokenPrice(cToken);
  let decimals = getOrCreateUnderlyingToken(cToken).decimals;
  //let denominator = new BigDecimal(BigInt.fromI64(10^decimals))
  let denominator = decimalsToBigDecimal(decimals);
  return underlyingPrice.div(denominator);
}

export function getOrCreateProtocol(): LendingProtocol {
  let protocol = LendingProtocol.load(FACTORY_ADDRESS);

  if (!protocol) {
    protocol = new LendingProtocol(FACTORY_ADDRESS);
    protocol.name = "Inverse Finance v1";
    protocol.slug = "inverse-finance-v1";
    protocol.schemaVersion = "1.1.0";
    protocol.subgraphVersion = "1.1.0";
    protocol.methodologyVersion = "1.1.0";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.LENDING;
    ////// quantitative data //////
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    protocol.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    //protocol.usageMetrics
    //protocol.financialMetrics
    //protocol.markets
    protocol.lendingType = LendingType.CDP;
    protocol.riskType = RiskType.GLOBAL;

    protocol.save();
  }
  return protocol;
}

export function getOrCreateMarket(marketAddr: string, event: ethereum.Event): Market {
  let market = Market.load(marketAddr);

  if (market == null) {
    let contract = CErc20.bind(Address.fromString(marketAddr));

    let asset = ZERO_ADDRESS; //default
    let tryAsset = contract.try_underlying();
    if (!tryAsset.reverted) {
      let asset = tryAsset.value.toHexString();
    }

    market = new Market(marketAddr);
    market.protocol = FACTORY_ADDRESS;
    market.inputToken = asset;
    market.outputToken = marketAddr; //Token.load(marketAddr).id
    market.rewardTokens = [
      prefixID(INV_ADDRESS, RewardTokenType.DEPOSIT),
      prefixID(INV_ADDRESS, RewardTokenType.BORROW),
    ];

    market.totalValueLockedUSD = BIGDECIMAL_ZERO;
    market.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    market.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    market.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    market.inputTokenBalance = BIGINT_ZERO;
    market.inputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.outputTokenSupply = BIGINT_ZERO;
    market.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    market.rewardTokenEmissionsAmount = [BIGINT_ZERO];
    market.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

    //market.snapshots
    market.name = contract.name();
    // markets[address].isListed never resets after set to true
    market.isActive = true;
    market.canUseAsCollateral = false;
    market.canBorrowFrom = true; //borrowGuardianPaused is default to false
    market.maximumLTV = BIGDECIMAL_ZERO;
    market.liquidationThreshold = BIGDECIMAL_ZERO;
    market.liquidationPenalty = BIGDECIMAL_ZERO;
    market.rates = []; //TODO: use InterestRate entity
    //inverse finance does not have stable borrow rate
    //market.stableBorrowRate = BIGDECIMAL_ZERO

    //market.deposits
    //market.withdraws
    //market.borrows
    //market.repays
    //market.liquidates
  }

  market.createdTimestamp = event.block.timestamp;
  market.createdBlockNumber = event.block.number;
  market.save();

  return market;
}

export function getOrCreateFinancialsDailySnapshot(event: ethereum.Event): FinancialsDailySnapshot {
  let days: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let financialMetrics = FinancialsDailySnapshot.load(days);
  if (financialMetrics == null) {
    financialMetrics = new FinancialsDailySnapshot(days);
    financialMetrics.protocol = FACTORY_ADDRESS;
    financialMetrics.protocolControlledValueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalDepositBalanceUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalBorrowBalanceUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }
  return financialMetrics;
}

export function getOrCreateInterestRate(
  id: string | null = null,
  side: string = InterestRateSide.BORROWER,
  type: string = InterestRateType.VARIABLE,
  marketId: string = ZERO_ADDRESS,
): InterestRate {
  if (id == null) {
    assert(marketId != ZERO_ADDRESS, "The marketId must be specified when InterestRate id is null");
    id = prefixID(marketId, side, type);
  }

  let interestRate = InterestRate.load(id!);
  if (interestRate == null) {
    interestRate = new InterestRate(id!);
    interestRate.rate = BIGDECIMAL_ZERO;
    interestRate.side = side;
    interestRate.type = type;
  }
  return interestRate;
}
