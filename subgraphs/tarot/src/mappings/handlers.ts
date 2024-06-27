import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
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
import {
  ETH_ADDRESS,
  INT_ZERO,
  BIGINT_ZERO,
  ZERO_ADDRESS,
  DEFAULT_DECIMALS,
  BIGDECIMAL_ZERO,
  BIGINT_TEN_TO_EIGHTEENTH,
  BIGDECIMAL_ONE,
} from "../sdk/util/constants";

import { Token } from "../../generated/schema";
import { LendingPoolInitialized } from "../../generated/Factory1/Factory";
import { _ERC20 } from "../../generated/Factory1/_ERC20";
import {
  VaultToken as VaultTokenTemplate,
  Borrowable as BorrowableTemplate,
  Pair as PairTemplate,
} from "../../generated/templates";
import {
  Mint as MintVaultToken,
  Redeem as RedeemVaultToken,
  Sync as SyncVaultToken,
  VaultToken,
} from "../../generated/templates/VaultToken/VaultToken";
import {
  Borrow as BorrowBorrowable,
  Redeem as RedeemBorrowable,
  Sync as SyncBorrowable,
  Borrowable,
} from "../../generated/templates/Borrowable/Borrowable";
import {
  Mint as MintCollateral,
  Redeem as RedeemCollateral,
} from "../../generated/templates/Collateral/Collateral";
import { Sync as SyncPair, Pair } from "../../generated/templates/Pair/Pair";
import { updateArrayAtIndex } from "../sdk/util/arrays";

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
    const factoryCall = pairContract.try_factoryAddress();
    if (!factoryCall.reverted) {
      return token.lastPriceUSD ? token.lastPriceUSD! : BIGDECIMAL_ZERO;
    }

    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    const pairContract = Pair.bind(Address.fromBytes(token.id));
    const factoryCall = pairContract.try_factoryAddress();
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
  log.debug(
    "[LendingPoolInitialized] id: {} pair: {} token0: {} token1: {} collateral: {} borrowable0: {} borrowable1: {} tx: {}",
    [
      event.params.lendingPoolId.toString(),
      event.params.uniswapV2Pair.toHexString(),
      event.params.token0.toHexString(),
      event.params.token1.toHexString(),
      event.params.collateral.toHexString(),
      event.params.borrowable0.toHexString(),
      event.params.borrowable1.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );

  const context = new DataSourceContext();
  context.setString("vault", event.params.uniswapV2Pair.toHexString());
  context.setString("token0", event.params.token0.toHexString());
  context.setString("token1", event.params.token1.toHexString());
  context.setString("collateral", event.params.collateral.toHexString());
  context.setString("borrowable0", event.params.borrowable0.toHexString());
  context.setString("borrowable1", event.params.borrowable1.toHexString());

  const vaultTokenContract = VaultToken.bind(event.params.uniswapV2Pair);
  const underlyingCall = vaultTokenContract.try_underlying();
  if (!underlyingCall.reverted) {
    PairTemplate.createWithContext(underlyingCall.value, context);
    context.setString("underlying", underlyingCall.value.toHexString());
  } else {
    context.setString("underlying", ZERO_ADDRESS);
  }

  VaultTokenTemplate.createWithContext(event.params.uniswapV2Pair, context);
  BorrowableTemplate.createWithContext(event.params.borrowable0, context);
  BorrowableTemplate.createWithContext(event.params.borrowable1, context);
}

export function handleMintVaultToken(event: MintVaultToken): void {
  const user = event.params.minter;
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeemVaultToken(event: RedeemVaultToken): void {
  const user = event.params.redeemer;
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleSyncVaultToken(event: SyncVaultToken): void {
  const context = dataSource.context();
  const token0Addr = context.getString("token0");
  const token1Addr = context.getString("token1");
  const collateral = context.getString("collateral");
  const borrowable0 = context.getString("borrowable0");
  const borrowable1 = context.getString("borrowable1");
  const underlying = context.getString("underlying");

  const vaultTokenContract = VaultToken.bind(event.address);
  let totalSupply = BIGINT_ZERO;
  const totalSupplyCall = vaultTokenContract.try_totalSupply();
  if (!totalSupplyCall.reverted) {
    totalSupply = totalSupplyCall.value;
  }

  log.debug(
    "[SyncVaultToken] token0: {} token1: {} collateral: {} borrowable0: {} borrowable1: {} underlying: {} totalBalance: {} totalSupply: {} tx: {}",
    [
      token0Addr,
      token1Addr,
      collateral,
      borrowable0,
      borrowable1,
      underlying,
      event.params.totalBalance.toString(),
      totalSupply.toString(),
      event.transaction.hash.toHexString(),
    ]
  );

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token0 = sdk.Tokens.getOrCreateToken(Address.fromString(token0Addr));
  const token1 = sdk.Tokens.getOrCreateToken(Address.fromString(token1Addr));
  const lpToken = sdk.Tokens.getOrCreateToken(Address.fromString(underlying));
  const outputToken = sdk.Tokens.getOrCreateToken(event.address);

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
  const vault = context.getString("vault");
  const token0Addr = context.getString("token0");
  const token1Addr = context.getString("token1");
  const collateral = context.getString("collateral");
  const borrowable0 = context.getString("borrowable0");
  const borrowable1 = context.getString("borrowable1");
  const underlying = context.getString("underlying");

  const user = event.params.borrower;
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
  const outputToken = sdk.Tokens.getOrCreateToken(Address.fromString(vault));

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

  let borrowable = borrowable0;
  let borrowableUnderlying = token0;
  if (event.address == Address.fromString(borrowable1)) {
    borrowable = borrowable1;
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

export function handleRedeemBorrowable(event: RedeemBorrowable): void {
  const user = event.params.redeemer;
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
  const vault = context.getString("vault");
  const token0Addr = context.getString("token0");
  const token1Addr = context.getString("token1");
  const collateral = context.getString("collateral");
  const borrowable0 = context.getString("borrowable0");
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
  const outputToken = sdk.Tokens.getOrCreateToken(Address.fromString(vault));

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

  let borrowable = borrowable0;
  let borrowableUnderlying = token0;
  if (event.address == Address.fromString(borrowable1)) {
    borrowable = borrowable1;
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

  log.debug(
    "[SyncBorrowable] vault: {} token0: {} token1: {} collateral: {} borrowable0: {} borrowable1: {} borrowable: {} borrowableUnderlying: {} totalBalance: {} tx: {}",
    [
      vault,
      token0Addr,
      token1Addr,
      collateral,
      borrowable0,
      borrowable1,
      borrowable,
      borrowableUnderlying.id.toHexString(),
      event.params.totalBalance.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
  pool.addInputTokenBalances(amountsToAdd, true);
}

export function handleMintCollateral(event: MintCollateral): void {
  const user = event.params.minter;
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
  const user = event.params.redeemer;
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleSyncPair(event: SyncPair): void {
  const context = dataSource.context();
  const vault = context.getString("vault");
  const token0Addr = context.getString("token0");
  const token1Addr = context.getString("token1");
  const collateral = context.getString("collateral");
  const borrowable0 = context.getString("borrowable0");
  const borrowable1 = context.getString("borrowable1");

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

  log.debug(
    "[SyncPair] t0: {} r0: {} v0: {} t1: {} r1: {} v1: {} pair: {} decimals: {} supply: {} vLP: {} tx: {}",
    [
      token0Addr,
      reserve0.toString(),
      token0Usd.toString(),
      token1Addr,
      reserve1.toString(),
      token1Usd.toString(),
      event.address.toHexString(),
      decimals.toString(),
      totalSupply.toString(),
      lpTokenUsd.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}
