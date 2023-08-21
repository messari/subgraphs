import { TokenPricer, ProtocolConfig } from "../sdk/protocols/config";
import { SDK } from "../sdk/protocols/perpfutures";
import { NetworkConfigs } from "../../configurations/configure";
import { Versions } from "../versions";
import {
  _SmartMarginAccount,
  Token,
  _FundingRate,
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
} from "../sdk/util/constants";
import { MarketAdded as MarketAddedEvent } from "../../generated/FuturesMarketManager2/FuturesMarketManager";
import {
  FundingRecomputed as FundingRecomputedEvent,
  MarginTransferred as MarginTransferredEvent,
  PositionLiquidated as PositionLiquidatedEvent,
  PositionModified as PositionModifiedEvent,
} from "../../generated/templates/FuturesV1Market/FuturesMarket";
import {
  PerpsV2MarketProxyable,
  PositionLiquidated1 as PositionLiquidatedV2Event,
  PositionModified1 as PositionModifiedV2Event,
} from "../../generated/templates/PerpsV2Market/PerpsV2MarketProxyable";
import { FuturesV1Market, PerpsV2Market } from "../../generated/templates";
import { createTokenAmountArray, getFundingRateId } from "./helpers";
import { NewAccount as NewSmartMarginAccountEvent } from "../../generated/SmartMarginFactory1/SmartMarginFactory";
import { Pool } from "../sdk/protocols/perpfutures/pool";

class Pricer implements TokenPricer {
  getTokenPrice(token: Token, block: ethereum.Block): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(
    token: Token,
    amount: BigInt,
    block: ethereum.Block
  ): BigDecimal {
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
  This function is called when a new v1 market added
  We just checks if it is a v1 market, and then stores it 
*/
export function handleV1MarketAdded(event: MarketAddedEvent): void {
  const marketKey = event.params.marketKey.toString();
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  // check that it's a v1 market before adding
  if (marketKey.startsWith("s") && !marketKey.endsWith("PERP")) {
    log.info("New V1 market added: {}", [marketKey]);

    const pool = sdk.Pools.loadPool(event.params.market);
    if (!pool.isInitialized) {
      const token = sdk.Tokens.getOrCreateToken(
        NetworkConfigs.getSUSDAddress()
      );
      pool.initialize(marketKey, marketKey, [token], null, "chainlink");
    }

    // futures v1 market
    FuturesV1Market.create(event.params.market);
  }
}

/*
  This function is called when a new v2 market added
  We just checks if it is a v2 market, and then stores it 
*/
export function handleV2MarketAdded(event: MarketAddedEvent): void {
  const marketKey = event.params.marketKey.toString();
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  // check that it's a v1 market before adding
  if (marketKey.endsWith("PERP")) {
    log.info("New V2 market added: {}", [marketKey]);

    const pool = sdk.Pools.loadPool(event.params.market);
    if (!pool.isInitialized) {
      const token = sdk.Tokens.getOrCreateToken(
        NetworkConfigs.getSUSDAddress()
      );
      pool.initialize(marketKey, marketKey, [token], null, "chainlink");

      // keeper dynamic fees
      pool.setPoolFee(LiquidityPoolFeeType.DYNAMIC_LP_FEE, null);
    }

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
  let smartMarginAccount = _SmartMarginAccount.load(smAccountAddress.toHex());
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  if (smartMarginAccount == null) {
    smartMarginAccount = new _SmartMarginAccount(smAccountAddress.toHex());

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

    pool.addOutflowVolumeByToken(token, marginDelta.abs());

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

  const smartMarginAccount = _SmartMarginAccount.load(sendingAccount.toHex());

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

      const totalMarginRemaining = event.params.margin;
      position.setBalanceClosed(token, totalMarginRemaining);
      position.setCollateralBalanceClosed(token, totalMarginRemaining);
      position.setRealisedPnlUsdClosed(bigIntToBigDecimal(pnl));
      position.setFundingrateClosed(bigIntToBigDecimal(currentFundingRate));
      position.closePosition();
    } else {
      const totalMarginRemaining = event.params.margin;

      const positionTotalPrice = event.params.lastPrice.times(newPositionSize);
      const leverage = positionTotalPrice.div(totalMarginRemaining);

      position.setBalance(token, totalMarginRemaining);
      position.setCollateralBalance(token, totalMarginRemaining);
      position.setPrice(event.params.lastPrice);
      position.setSize(event.params.size);
      position.setFundingIndex(event.params.fundingIndex);
      position.setLeverage(bigIntToBigDecimal(leverage));
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
  This function is fired when a position is modified in v2 markets, 
  everything else similar to v1 market position modified event
*/
export function handlePositionModifiedV2(event: PositionModifiedV2Event): void {
  const v1Params = event.parameters.filter((value) => {
    return value.name !== "skew";
  });

  const v1Event = new PositionModifiedEvent(
    event.address,
    event.logIndex,
    event.transactionLogIndex,
    event.logType,
    event.block,
    event.transaction,
    v1Params,
    event.receipt
  );
  handlePositionModified(v1Event);
}

/* 
  This function is fired when a position is liquidated in v1 market
*/
export function handlePositionLiquidated(event: PositionLiquidatedEvent): void {
  liquidation(
    event,
    event.params.account,
    event.params.liquidator,
    event.params.fee
  );
}

/* 
  This function is fired when a position is liquidated in v2 market
*/
export function handlePositionLiquidatedV2(
  event: PositionLiquidatedV2Event
): void {
  const totalFee = event.params.flaggerFee
    .plus(event.params.liquidatorFee)
    .plus(event.params.stakersFee);

  liquidation(event, event.params.account, event.params.liquidator, totalFee);
}

// common liquidation logic
function liquidation(
  event: ethereum.Event,
  sendingAccount: Address,
  liquidator: Address,
  totalFees: BigInt
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const pool = sdk.Pools.loadPool(dataSource.address());
  const smartMarginAccount = _SmartMarginAccount.load(sendingAccount.toHex());
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

  const position = sdk.Positions.loadLastPosition(pool, account, token, token);
  if (position != null) {
    const pnl = position
      .getRealisedPnlUsd()
      .minus(bigIntToBigDecimal(totalFees));
    account.liquidate(
      pool,
      Address.fromBytes(token.id),
      Address.fromBytes(token.id),
      position.position.collateralBalance,
      liquidator,
      accountAddress,
      position.getBytesID(),
      pnl
    );
    position.addLiquidationCount();
    position.setBalanceClosed(token, BIGINT_ZERO);
    position.setCollateralBalanceClosed(token, BIGINT_ZERO);
    position.setRealisedPnlUsdClosed(pnl);
    position.closePosition();
  }
}

function updateOpenInterest(
  marketAddress: Address,
  pool: Pool,
  lastPrice: BigInt
): void {
  const contract = PerpsV2MarketProxyable.bind(marketAddress);
  const marketSizeCall = contract.try_marketSize();
  const marketSkewCall = contract.try_marketSkew();
  let marketSize = BIGINT_ZERO;
  let marketSkew = BIGINT_ZERO;
  if (!marketSizeCall.reverted && !marketSkewCall.reverted) {
    marketSize = marketSizeCall.value;
    marketSkew = marketSkewCall.value;
  }

  const shortOpenInterstAmount = marketSize
    .minus(marketSkew)
    .div(BigInt.fromI32(2));
  const longOpenInterstAmount = marketSize
    .plus(marketSkew)
    .div(BigInt.fromI32(2));
  pool.setLongOpenInterest(longOpenInterstAmount, lastPrice);
  pool.setShortOpenInterest(shortOpenInterstAmount, lastPrice);
}
