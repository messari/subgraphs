import {
  Address,
  BigDecimal,
  BigInt,
  DataSourceContext,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { updateArrayAtIndex } from "../sdk/util/arrays";
import {
  ETH_ADDRESS,
  INT_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  BIGDECIMAL_ZERO,
  BIGDECIMAL_ONE,
} from "../sdk/util/constants";

import { Token } from "../../generated/schema";
import { LendingPoolInitialized } from "../../generated/Factory1/Factory";
import { _ERC20 } from "../../generated/Factory1/_ERC20";
import {
  Collateral as CollateralTemplate,
  Borrowable as BorrowableTemplate,
  Pair as PairTemplate,
} from "../../generated/templates";
import {
  Mint as MintCollateral,
  Redeem as RedeemCollateral,
  Sync as SyncCollateral,
  Collateral,
} from "../../generated/templates/Collateral/Collateral";
import {
  Borrow as BorrowBorrowable,
  Mint as MintBorrowable,
  Redeem as RedeemBorrowable,
  Sync as SyncBorrowable,
  Borrowable,
} from "../../generated/templates/Borrowable/Borrowable";
import { Sync as SyncPair, Pair } from "../../generated/templates/Pair/Pair";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);

    const pairContract = Pair.bind(Address.fromBytes(token.id));
    const factoryCall = pairContract.try_factory();
    if (!factoryCall.reverted) {
      return token.lastPriceUSD ? token.lastPriceUSD! : BIGDECIMAL_ZERO;
    }

    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    const pairContract = Pair.bind(Address.fromBytes(token.id));
    const factoryCall = pairContract.try_factory();
    if (!factoryCall.reverted) {
      return token.lastPriceUSD
        ? token.lastPriceUSD!.times(_amount)
        : BIGDECIMAL_ZERO;
    }

    return getUsdPrice(pricedToken, _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const nameCall = erc20.try_name();
      if (!nameCall.reverted) {
        name = nameCall.value;
      } else {
        log.debug("[getTokenParams] nameCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const symbolCall = erc20.try_symbol();
      if (!symbolCall.reverted) {
        symbol = symbolCall.value;
      } else {
        log.debug("[getTokenParams] symbolCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const decimalsCall = erc20.try_decimals();
      if (!decimalsCall.reverted) {
        decimals = decimalsCall.value.toI32();
      } else {
        log.debug("[getTokenParams] decimalsCall reverted for {}", [
          address.toHexString(),
        ]);
      }
    }
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export function handleLendingPoolInitialized(
  event: LendingPoolInitialized
): void {
  const context = new DataSourceContext();
  context.setString("underlying", event.params.uniswapV2Pair.toHexString());
  context.setString("token0", event.params.token0.toHexString());
  context.setString("token1", event.params.token1.toHexString());
  context.setString("collateral", event.params.collateral.toHexString());
  context.setString("borrowable0", event.params.borrowable0.toHexString());
  context.setString("borrowable1", event.params.borrowable1.toHexString());

  PairTemplate.createWithContext(event.params.uniswapV2Pair, context);
  CollateralTemplate.createWithContext(event.params.collateral, context);
  BorrowableTemplate.createWithContext(event.params.borrowable0, context);
  BorrowableTemplate.createWithContext(event.params.borrowable1, context);
}

export function handleMintCollateral(event: MintCollateral): void {
  const user = event.transaction.from;
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeemCollateral(event: RedeemCollateral): void {
  const user = event.transaction.from;
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleSyncCollateral(event: SyncCollateral): void {
  const context = dataSource.context();
  const token0Addr = context.getString("token0");
  const token1Addr = context.getString("token1");
  const collateral = context.getString("collateral");
  const underlying = context.getString("underlying");

  const collateralContract = Collateral.bind(event.address);
  let totalSupply = BIGINT_ZERO;
  const totalSupplyCall = collateralContract.try_totalSupply();
  if (!totalSupplyCall.reverted) {
    totalSupply = totalSupplyCall.value;
  }

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token0 = sdk.Tokens.getOrCreateToken(Address.fromString(token0Addr));
  const token1 = sdk.Tokens.getOrCreateToken(Address.fromString(token1Addr));
  const lpToken = sdk.Tokens.getOrCreateToken(Address.fromString(underlying));
  const outputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(collateral)
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token0.id, token1.id, lpToken.id],
      outputToken,
      true
    );
  }

  const inputTokens = pool.getInputTokens();
  const inputTokenBalances = pool.getInputTokenBalances();

  let amountsToAdd = [BIGINT_ZERO, BIGINT_ZERO, BIGINT_ZERO];
  const lpTokenIdx = inputTokens.indexOf(lpToken.id);
  const diffAmount = event.params.totalBalance.minus(
    inputTokenBalances[lpTokenIdx]
  );
  amountsToAdd = updateArrayAtIndex(amountsToAdd, diffAmount, lpTokenIdx);

  pool.addInputTokenBalances(amountsToAdd, true);
  pool.setOutputTokenSupply(outputToken, totalSupply);
}

export function handleBorrowBorrowable(event: BorrowBorrowable): void {
  const context = dataSource.context();
  const collateral = context.getString("collateral");
  const token0Addr = context.getString("token0");
  const token1Addr = context.getString("token1");
  const borrowable1 = context.getString("borrowable1");
  const underlying = context.getString("underlying");

  const user = event.transaction.from;
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();

  const borrowableContract = Borrowable.bind(event.address);

  let feeAmount = BIGDECIMAL_ZERO;
  const feeCall = borrowableContract.try_BORROW_FEE();
  if (!feeCall.reverted) {
    feeAmount = event.params.borrowAmount
      .toBigDecimal()
      .times(bigIntToBigDecimal(feeCall.value, 16 as i32));
  }

  let reserveFactor = BIGINT_ZERO;
  const reserveFactorCall = borrowableContract.try_reserveFactor();
  if (!reserveFactorCall.reverted) {
    reserveFactor = reserveFactorCall.value;
  }

  const token0 = sdk.Tokens.getOrCreateToken(Address.fromString(token0Addr));
  const token1 = sdk.Tokens.getOrCreateToken(Address.fromString(token1Addr));
  const lpToken = sdk.Tokens.getOrCreateToken(Address.fromString(underlying));
  const outputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(collateral)
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token0.id, token1.id, lpToken.id],
      outputToken,
      true
    );
  }

  let borrowableUnderlying = token0;
  if (event.address == Address.fromString(borrowable1)) {
    borrowableUnderlying = token1;
  }

  const protocolSide = feeAmount.times(bigIntToBigDecimal(reserveFactor, 18));
  const supplySide = feeAmount.times(
    BIGDECIMAL_ONE.minus(bigIntToBigDecimal(reserveFactor, 18))
  );
  pool.addRevenueNative(
    borrowableUnderlying,
    bigDecimalToBigInt(protocolSide),
    bigDecimalToBigInt(supplySide)
  );
}

export function handleMintBorrowable(event: MintBorrowable): void {
  const user = event.transaction.from;
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeemBorrowable(event: RedeemBorrowable): void {
  const user = event.transaction.from;
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleSyncBorrowable(event: SyncBorrowable): void {
  const context = dataSource.context();
  const collateral = context.getString("collateral");
  const token0Addr = context.getString("token0");
  const token1Addr = context.getString("token1");
  const borrowable1 = context.getString("borrowable1");
  const underlying = context.getString("underlying");

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token0 = sdk.Tokens.getOrCreateToken(Address.fromString(token0Addr));
  const token1 = sdk.Tokens.getOrCreateToken(Address.fromString(token1Addr));
  const lpToken = sdk.Tokens.getOrCreateToken(Address.fromString(underlying));
  const outputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(collateral)
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token0.id, token1.id, lpToken.id],
      outputToken,
      true
    );
  }

  const inputTokens = pool.getInputTokens();
  const inputTokenBalances = pool.getInputTokenBalances();

  let amountsToAdd = [BIGINT_ZERO, BIGINT_ZERO, BIGINT_ZERO];

  let borrowableUnderlying = token0;
  if (event.address == Address.fromString(borrowable1)) {
    borrowableUnderlying = token1;
  }
  const borrowableTokenIdx = inputTokens.indexOf(borrowableUnderlying.id);
  const diffAmount = event.params.totalBalance.minus(
    inputTokenBalances[borrowableTokenIdx]
  );
  amountsToAdd = updateArrayAtIndex(
    amountsToAdd,
    diffAmount,
    borrowableTokenIdx
  );

  pool.addInputTokenBalances(amountsToAdd, true);
}

export function handleSyncPair(event: SyncPair): void {
  const context = dataSource.context();
  const token0Addr = context.getString("token0");
  const token1Addr = context.getString("token1");

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token0 = sdk.Tokens.getOrCreateToken(Address.fromString(token0Addr));
  const token1 = sdk.Tokens.getOrCreateToken(Address.fromString(token1Addr));

  const pairContract = Pair.bind(event.address);
  let reserve0 = BIGINT_ZERO;
  let reserve1 = BIGINT_ZERO;
  const reservesCall = pairContract.try_getReserves();
  if (!reservesCall.reverted) {
    reserve0 = reservesCall.value.get_reserve0();
    reserve1 = reservesCall.value.get_reserve1();
  }

  let decimals = DEFAULT_DECIMALS;
  const decimalsCall = pairContract.try_decimals();
  if (!decimalsCall.reverted) {
    decimals = decimalsCall.value;
  }

  let totalSupply = BIGINT_ZERO;
  const totalSupplyCall = pairContract.try_totalSupply();
  if (!totalSupplyCall.reverted) {
    totalSupply = totalSupplyCall.value;
  }

  const token0Usd = getUsdPrice(
    Address.fromBytes(token0.id),
    bigIntToBigDecimal(reserve0, token0.decimals)
  );
  const token1Usd = getUsdPrice(
    Address.fromBytes(token1.id),
    bigIntToBigDecimal(reserve1, token1.decimals)
  );
  const lpTokenUsd = token0Usd
    .plus(token1Usd)
    .div(bigIntToBigDecimal(totalSupply, decimals));

  const lpToken = sdk.Tokens.getOrCreateToken(event.address);
  lpToken.lastPriceUSD = lpTokenUsd;
  lpToken.save();
}
