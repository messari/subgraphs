import { TokenPricer, ProtocolConfig } from "../sdk/protocols/config";
import { SDK } from "../sdk/protocols/perpfutures";
import { NetworkConfigs } from "../../configurations/configure";
import { Versions } from "../versions";
import {
  _SmartMarginAccount,
  Token,
  _FundingRate,
  _MarketKey,
} from "../../generated/schema";
import { _ERC20 } from "../../generated/FuturesMarketManager2/_ERC20";
import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { bigIntToBigDecimal } from "../sdk/util/numbers";

import {
  TokenInitializer,
  TokenParams,
} from "../sdk/protocols/perpfutures/tokens";
import {
  BIGINT_MINUS_ONE,
  PositionSide,
  BIGINT_ZERO,
  BIGINT_TEN_TO_EIGHTEENTH,
  LiquidityPoolFeeType,
  ParameterKeys,
  BIGDECIMAL_ZERO,
} from "../sdk/util/constants";
import { MarketAdded as MarketAddedEvent } from "../../generated/FuturesMarketManager2/FuturesMarketManager";
import {
  PositionLiquidated1 as PositionLiquidatedEvent,
  PositionModified1 as PositionModifiedEvent,
  MarginTransferred as MarginTransferredEvent,
  FundingRecomputed as FundingRecomputedEvent,
} from "../../generated/templates/PerpsV2Market/PerpsV2MarketProxyable";
import { PerpsV2Market } from "../../generated/templates";
import {
  createTokenAmountArray,
  getFundingRateId,
  updateOpenInterest,
  liquidation,
  loadMarketKey,
} from "./helpers";
import { NewAccount as NewSmartMarginAccountEvent } from "../../generated/SmartMarginFactory1/SmartMarginFactory";

import { ParameterUpdated as ParameterUpdatedEvent } from "../../generated/PerpsV2MarketSettings1/PerpsV2MarketSettings";

import { TransactionType } from "../sdk/protocols/perpfutures/enums";

class Pricer implements TokenPricer {
  getTokenPrice(token: Token, block: ethereum.Block): BigDecimal {
    log.info("Block: {}", [block.number.toString()]);
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(
    token: Token,
    amount: BigInt,
    block: ethereum.Block
  ): BigDecimal {
    log.info("Block: {}", [block.number.toString()]);
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

// Implement TokenInitializer
class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    const name = erc20.name();
    const symbol = erc20.symbol();
    const decimals = erc20.decimals().toI32();
    return {
      name,
      symbol,
      decimals,
    };
  }
}

const conf = new ProtocolConfig(
  NetworkConfigs.getFactoryAddress().toHexString(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

/*
  This function is called when a new market added
  We just checks if it is a market, and then stores it 
*/
export function handleMarketAdded(event: MarketAddedEvent): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  // check that it's a v1 market before adding
  if (event.params.marketKey.toString().endsWith("PERP")) {
    const pool = sdk.Pools.loadPool(event.params.market);
    const marketKey = loadMarketKey(event.params.marketKey, pool).toString();

    if (!pool.isInitialized) {
      const token = sdk.Tokens.getOrCreateToken(
        NetworkConfigs.getSUSDAddress()
      );
      pool.initialize(marketKey, marketKey, [token], null, "chainlink");
    }

    pool.setPoolFee(LiquidityPoolFeeType.DYNAMIC_TAKER_FEE, BIGDECIMAL_ZERO);
    pool.setPoolFee(
      LiquidityPoolFeeType.DYNAMIC_TAKER_DELAYED_FEE,
      BIGDECIMAL_ZERO
    );
    pool.setPoolFee(
      LiquidityPoolFeeType.DYNAMIC_TAKER_DELAYED_OFFCHAIN_FEE,
      BIGDECIMAL_ZERO
    );
    pool.setPoolFee(LiquidityPoolFeeType.DYNAMIC_MAKER_FEE, null);
    pool.setPoolFee(LiquidityPoolFeeType.DYNAMIC_MAKER_DELAYED_FEE, null);
    pool.setPoolFee(
      LiquidityPoolFeeType.DYNAMIC_MAKER_DELAYED_OFFCHAIN_FEE,
      BIGDECIMAL_ZERO
    );
    pool.setPoolFee(
      LiquidityPoolFeeType.DYNAMIC_MAKER_DELAYED_OFFCHAIN_FEE,
      BIGDECIMAL_ZERO
    );

    // perps v2 market
    PerpsV2Market.create(event.params.market);
  }
}

/*
  This function is fired when a new smart margin account is created.
  We are storing the new smart margin account with it's owner address for future reference.
*/
export function handleNewAccountSmartMargin(
  event: NewSmartMarginAccountEvent
): void {
  // create a new entity to store the cross-margin account owner
  const smAccountAddress = event.params.account as Address;
  let smartMarginAccount = _SmartMarginAccount.load(smAccountAddress);
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  if (smartMarginAccount == null) {
    smartMarginAccount = new _SmartMarginAccount(smAccountAddress);

    const loadAccountResponse = sdk.Accounts.loadAccount(event.params.creator);
    if (loadAccountResponse.isNewUser) {
      const protocol = sdk.Protocol;
      protocol.addUser();
    }
    smartMarginAccount.owner = loadAccountResponse.account.getBytesId();

    smartMarginAccount.version = event.params.version;
    smartMarginAccount.save();
  }
}

/*
 This function is fired when a Margin is transferred from or to a market position of an account.
 If marginDelta > 0 then it is "deposit", else it is "withdraw".
*/
export function handleMarginTransferred(event: MarginTransferredEvent): void {
  const marketAddress = dataSource.address();
  const marginDelta = event.params.marginDelta;
  const caller = event.params.account;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const pool = sdk.Pools.loadPool(marketAddress);
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getSUSDAddress());

  const loadAccountResponse = sdk.Accounts.loadAccount(caller);
  const account = loadAccountResponse.account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }
  const amounts = createTokenAmountArray(pool, [token], [marginDelta.abs()]);
  // Deposit
  if (marginDelta.gt(BIGINT_ZERO)) {
    account.deposit(pool, amounts, BIGINT_ZERO);
    pool.addInflowVolumeByToken(token, marginDelta.abs());

    pool.addInputTokenBalances(amounts);
  }
  // Withdraw
  if (marginDelta.lt(BIGINT_ZERO)) {
    account.withdraw(pool, amounts, BIGINT_ZERO);

    pool.addInputTokenBalances(
      amounts.map<BigInt>((amount) => amount.times(BIGINT_MINUS_ONE))
    );
  }
}

/*
  This function is fired when the funding of a pool is recomputed
  We are storing the position with index for future reference
*/
export function handleFundingRecomputed(event: FundingRecomputedEvent): void {
  const marketAddress = dataSource.address();
  const fundingRate = event.params.funding;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const pool = sdk.Pools.loadPool(marketAddress);
  const fundingRateEntity = new _FundingRate(
    getFundingRateId(pool, event.params.index)
  );
  fundingRateEntity.funding = event.params.funding;
  fundingRateEntity.save();
  pool.setFundingRate([bigIntToBigDecimal(fundingRate)]);
}

/*
 This function is first when a position of a account is modified, in the following cases:
  1. A new position is created
  2. An existing position changes side, ex : LONG becomes SHORT, or SHORT becomes LONG
  3. An existing position is on same side just increase or decrease in the size
  4. A position is closed
  5. A position is liquidated
 */
export function handlePositionModified(event: PositionModifiedEvent): void {
  const marketAddress = dataSource.address();
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const pool = sdk.Pools.loadPool(marketAddress);
  const isClose = event.params.size.isZero();
  const sendingAccount = event.params.account;

  const smartMarginAccount = _SmartMarginAccount.load(sendingAccount);

  const accountAddress = smartMarginAccount
    ? Address.fromBytes(smartMarginAccount.owner)
    : sendingAccount;

  const loadAccountResponse = sdk.Accounts.loadAccount(accountAddress);
  const account = loadAccountResponse.account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }

  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getSUSDAddress());

  const fees = event.params.fee;

  /* if tradeSize == 0 then either margin transferred or position liquidated 
   (both these events are not checked here) */
  if (event.params.tradeSize.gt(BIGINT_ZERO)) {
    // loading account last position in this pool, otherwise create new one
    const isLong = event.params.size.gt(BIGINT_ZERO);
    const positionResponse = sdk.Positions.loadPosition(
      pool,
      account,
      token,
      token,
      isLong ? PositionSide.LONG : PositionSide.SHORT,
      event,
      true
    );

    const position = positionResponse.position;
    const newPositionSize = event.params.size;
    const oldPositionSize = position.getSize();
    const oldPositionPrice = position.getPrice();

    const margin = event.params.margin;
    const amounts = createTokenAmountArray(pool, [token], [margin]);
    let fundingAccrued = BIGINT_ZERO;
    let currentFundingRate = BIGINT_ZERO;

    const previousFunding = _FundingRate.load(
      getFundingRateId(pool, position.getFundingIndex())
    );
    const currentFunding = _FundingRate.load(
      getFundingRateId(pool, event.params.fundingIndex)
    );

    if (currentFunding != null) {
      currentFundingRate = currentFunding.funding;
    }
    if (
      position.getFundingIndex() != event.params.fundingIndex &&
      currentFunding &&
      previousFunding
    ) {
      fundingAccrued = currentFunding.funding
        .minus(previousFunding.funding)
        .times(oldPositionSize)
        .div(BIGINT_TEN_TO_EIGHTEENTH);
    }

    // position closed
    if (isClose) {
      const pnl = event.params.lastPrice
        .minus(oldPositionPrice)
        .times(oldPositionSize)
        .div(BIGINT_TEN_TO_EIGHTEENTH)
        .plus(fundingAccrued)
        .minus(fees);

      account.collateralOut(pool, position.getBytesID(), amounts, BIGINT_ZERO);

      position.setBalanceClosed(token, margin);
      position.setCollateralBalanceClosed(token, margin);
      position.setRealisedPnlUsdClosed(bigIntToBigDecimal(pnl));
      position.setFundingrateClosed(bigIntToBigDecimal(currentFundingRate));
      position.addCollateralOutCount();
      position.closePosition();

      pool.addPremiumByToken(token, fees, TransactionType.COLLATERAL_OUT);
      pool.addOutflowVolumeByToken(token, margin);
    } else {
      const totalMarginRemaining = event.params.margin;

      const positionTotalPrice = event.params.lastPrice.times(newPositionSize);
      const leverage = positionTotalPrice.div(totalMarginRemaining);

      account.collateralIn(pool, position.getBytesID(), amounts, BIGINT_ZERO);

      position.setBalance(token, totalMarginRemaining);
      position.setCollateralBalance(token, totalMarginRemaining);
      position.setPrice(event.params.lastPrice);
      position.setSize(event.params.size);
      position.setFundingIndex(event.params.fundingIndex);
      position.setLeverage(bigIntToBigDecimal(leverage));
      position.addCollateralInCount();

      pool.addPremiumByToken(token, fees, TransactionType.COLLATERAL_IN);
      pool.addInflowVolumeByToken(token, margin);
    }
    const volume = event.params.lastPrice
      .times(newPositionSize)
      .div(BIGINT_TEN_TO_EIGHTEENTH)
      .abs();
    pool.addVolumeByToken(token, volume);
  }
  updateOpenInterest(marketAddress, pool, event.params.lastPrice);
  pool.addRevenueByToken(token, BIGINT_ZERO, fees, BIGINT_ZERO);
}

/* 
  This function is fired when a position is liquidated
*/
export function handlePositionLiquidated(event: PositionLiquidatedEvent): void {
  const totalFee = event.params.flaggerFee
    .plus(event.params.liquidatorFee)
    .plus(event.params.stakersFee);
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  liquidation(
    event,
    event.params.account,
    event.params.liquidator,
    totalFee,
    event.params.stakersFee,
    sdk
  );
}

export function handleParameterUpdated(event: ParameterUpdatedEvent): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const marketKey = _MarketKey.load(event.params.marketKey);
  if (marketKey != null) {
    const paramKey = event.params.parameter.toString();
    const poolFee = ParameterKeys.get(paramKey);
    if (poolFee != null) {
      const market = sdk.Pools.loadPool(marketKey.market);
      market.setPoolFee(poolFee!, bigIntToBigDecimal(event.params.value));
    }
  }
}
