import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
} from "@graphprotocol/graph-ts";

import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import {
  closeTrade,
  createTokenAmountArray,
  getFundingRate,
  getPairOpenInterest,
  getSharesTransferred,
  openTrade,
} from "./helpers";
import { ORACLE, STANDARD_FEE, VAULT_NAME } from "../common/constants";

import {
  DaiVaultFeeCharged,
  DevGovFeeCharged,
  LimitExecuted,
  LpFeeCharged,
  MarketExecuted,
  SssFeeCharged,
} from "../../generated/Vault/Callbacks";
import {
  DepositLocked,
  DepositUnlocked,
  Deposit,
  Withdraw,
  RewardDistributed,
} from "../../generated/Vault/Vault";
import { Token } from "../../generated/schema";
import { _ERC20 } from "../../generated/Vault/_ERC20";

import { SDK } from "../sdk/protocols/perpfutures";
import { PerpetualConfig } from "../sdk/protocols/perpfutures/config";
import { TokenPricer } from "../sdk/protocols/config";
import {
  TokenInitializer,
  TokenParams,
} from "../sdk/protocols/perpfutures/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGINT_MINUS_ONE,
  BIGINT_ZERO,
  INT_THREE,
  LiquidityPoolFeeType,
  PositionSide,
  RewardTokenType,
} from "../sdk/util/constants";

// Implement TokenPricer to pass it to the SDK constructor
class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
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

const conf = new PerpetualConfig(
  NetworkConfigs.getFactoryAddress().toHexString(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

export function handleDeposit(event: Deposit): void {
  const caller = event.params.sender;
  const depositAmount = event.params.assets;
  const mintAmount = event.params.shares;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const depositToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getDaiAddress()
  );
  const outputToken = sdk.Tokens.getOrCreateToken(dataSource.address());

  const pool = sdk.Pools.loadPool(dataSource.address());
  if (!pool.isInitialized) {
    pool.initialize(
      VAULT_NAME,
      VAULT_NAME,
      [depositToken],
      outputToken,
      ORACLE
    );

    pool.setPoolFee(LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE, STANDARD_FEE);
    pool.setPoolFee(LiquidityPoolFeeType.DYNAMIC_LP_FEE, STANDARD_FEE);
  }
  pool.addOutputTokenSupply(mintAmount);

  const depositAmounts = createTokenAmountArray(
    pool,
    [depositToken],
    [depositAmount]
  );
  const loadAccountResponse = sdk.Accounts.loadAccount(caller);
  const account = loadAccountResponse.account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }

  account.deposit(pool, depositAmounts, mintAmount);
  pool.addInputTokenBalances(depositAmounts);
}

export function handleWithdraw(event: Withdraw): void {
  const caller = event.params.receiver;
  const withdrawAmount = event.params.assets;
  const burnAmount = event.params.shares;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const withdrawToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getDaiAddress()
  );

  const pool = sdk.Pools.loadPool(dataSource.address());
  pool.addOutputTokenSupply(burnAmount.times(BIGINT_MINUS_ONE));

  const withdrawAmounts = createTokenAmountArray(
    pool,
    [withdrawToken],
    [withdrawAmount]
  );
  const loadAccountResponse = sdk.Accounts.loadAccount(caller);
  const account = loadAccountResponse.account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }

  account.withdraw(pool, withdrawAmounts, burnAmount);
  pool.addInputTokenBalances(
    withdrawAmounts.map<BigInt>((amount) => amount.times(BIGINT_MINUS_ONE))
  );
}

export function handleDepositLocked(event: DepositLocked): void {
  const sender = event.params.sender;
  const stakeAmount = event.params.d.assetsDeposited;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const pool = sdk.Pools.loadPool(dataSource.address());
  pool.addStakedOutputTokenAmount(stakeAmount);

  const loadAccountResponse = sdk.Accounts.loadAccount(sender);
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }
}

export function handleDepositUnlocked(event: DepositUnlocked): void {
  const receiver = event.params.receiver;
  const unstakeAmount = event.params.d.assetsDeposited;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const pool = sdk.Pools.loadPool(dataSource.address());
  pool.addStakedOutputTokenAmount(unstakeAmount.times(BIGINT_MINUS_ONE));

  const loadAccountResponse = sdk.Accounts.loadAccount(receiver);
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }
}

// Event emitted when a trade executes immediately, at the market price
export function handleMarketExecuted(event: MarketExecuted): void {
  const trader = event.params.t.trader;
  const positionSide = event.params.t.buy
    ? PositionSide.LONG
    : PositionSide.SHORT;
  const leverage = event.params.t.leverage;
  const pairIndex = event.params.t.pairIndex;
  const percentProfit = event.params.percentProfit;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const collateralToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getDaiAddress()
  );
  const collateralAmount = event.params.positionSizeDai;

  const pool = sdk.Pools.loadPool(NetworkConfigs.getVaultAddress());

  const openInterest = getPairOpenInterest(pairIndex, event);
  pool.updateOpenInterestByToken(
    pairIndex,
    collateralToken,
    openInterest.long,
    openInterest.short
  );

  const fundingRatePerDay = getFundingRate(pairIndex, event);
  pool.updateFundingRateByToken(pairIndex, collateralToken, fundingRatePerDay);

  const sharesTransferred = getSharesTransferred(collateralAmount, event);

  const loadAccountResponse = sdk.Accounts.loadAccount(trader);
  const account = loadAccountResponse.account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }

  const loadPositionResponse = sdk.Positions.loadPosition(
    pool,
    account,
    collateralToken,
    collateralToken,
    positionSide,
    event.params.open
  );
  const position = loadPositionResponse.position;
  const isExistingOpenPosition = loadPositionResponse.isExistingOpenPosition;

  if (event.params.open) {
    openTrade(
      pool,
      account,
      position,
      pairIndex,
      collateralToken,
      collateralAmount,
      leverage,
      sharesTransferred,
      fundingRatePerDay,
      event
    );
  } else {
    closeTrade(
      pool,
      account,
      position,
      pairIndex,
      collateralToken,
      collateralAmount,
      leverage,
      sharesTransferred,
      fundingRatePerDay,
      percentProfit,
      isExistingOpenPosition,
      event,
      false
    );
  }
}

// Event emitted when a trade executes at exact price set if price reaches threshold
export function handleLimitExecuted(event: LimitExecuted): void {
  const trader = event.params.t.trader;
  const positionSide = event.params.t.buy
    ? PositionSide.LONG
    : PositionSide.SHORT;
  const leverage = event.params.t.leverage;
  const pairIndex = event.params.t.pairIndex;
  const percentProfit = event.params.percentProfit;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const collateralToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getDaiAddress()
  );
  const collateralAmount = event.params.positionSizeDai;

  const pool = sdk.Pools.loadPool(NetworkConfigs.getVaultAddress());

  const openInterest = getPairOpenInterest(pairIndex, event);
  pool.updateOpenInterestByToken(
    pairIndex,
    collateralToken,
    openInterest.long,
    openInterest.short
  );

  const fundingRatePerDay = getFundingRate(pairIndex, event);
  pool.updateFundingRateByToken(pairIndex, collateralToken, fundingRatePerDay);

  const sharesTransferred = getSharesTransferred(collateralAmount, event);

  const loadAccountResponse = sdk.Accounts.loadAccount(trader);
  const account = loadAccountResponse.account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }

  const loadPositionResponse = sdk.Positions.loadPosition(
    pool,
    account,
    collateralToken,
    collateralToken,
    positionSide,
    event.params.orderType == INT_THREE ? true : false
  );
  const position = loadPositionResponse.position;
  const isExistingOpenPosition = loadPositionResponse.isExistingOpenPosition;

  // orderType [TP, SL, LIQ, OPEN] (0-index)
  if (event.params.orderType == INT_THREE) {
    openTrade(
      pool,
      account,
      position,
      pairIndex,
      collateralToken,
      collateralAmount,
      leverage,
      sharesTransferred,
      fundingRatePerDay,
      event
    );
  } else if (event.params.orderType == 2) {
    closeTrade(
      pool,
      account,
      position,
      pairIndex,
      collateralToken,
      collateralAmount,
      leverage,
      sharesTransferred,
      fundingRatePerDay,
      percentProfit,
      isExistingOpenPosition,
      event,
      true,
      event.params.nftHolder,
      trader
    );
  } else {
    closeTrade(
      pool,
      account,
      position,
      pairIndex,
      collateralToken,
      collateralAmount,
      leverage,
      sharesTransferred,
      fundingRatePerDay,
      percentProfit,
      isExistingOpenPosition,
      event,
      false
    );
  }
}

export function handleDevGovFeeCharged(event: DevGovFeeCharged): void {
  const devGovFee = event.params.valueDai;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const collateralToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getDaiAddress()
  );
  const pool = sdk.Pools.loadPool(NetworkConfigs.getVaultAddress());

  pool.addRevenueByToken(collateralToken, devGovFee, BIGINT_ZERO, BIGINT_ZERO);
}

export function handleLpFeeCharged(event: LpFeeCharged): void {
  const lpFee = event.params.valueDai;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const collateralToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getDaiAddress()
  );
  const pool = sdk.Pools.loadPool(NetworkConfigs.getVaultAddress());

  pool.addRevenueByToken(collateralToken, BIGINT_ZERO, lpFee, BIGINT_ZERO);
}

export function handleDaiVaultFeeCharged(event: DaiVaultFeeCharged): void {
  const vaultFee = event.params.valueDai;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const collateralToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getDaiAddress()
  );
  const pool = sdk.Pools.loadPool(NetworkConfigs.getVaultAddress());

  pool.addRevenueByToken(collateralToken, BIGINT_ZERO, vaultFee, BIGINT_ZERO);
}

export function handleSssFeeCharged(event: SssFeeCharged): void {
  const sssFee = event.params.valueDai;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const collateralToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getDaiAddress()
  );
  const pool = sdk.Pools.loadPool(NetworkConfigs.getVaultAddress());

  pool.addRevenueByToken(collateralToken, BIGINT_ZERO, BIGINT_ZERO, sssFee);
}

export function handleRewardDistributed(event: RewardDistributed): void {
  const rewardAmount = event.params.assets;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const collateralToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getDaiAddress()
  );
  const pool = sdk.Pools.loadPool(NetworkConfigs.getVaultAddress());

  pool.addDailyRewards(RewardTokenType.DEPOSIT, collateralToken, rewardAmount);
}
