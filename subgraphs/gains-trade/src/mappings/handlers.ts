import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";

import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { createTokenAmountArray } from "./helpers";

import { Vault } from "../../generated/Vault/Vault";
import { PairStorage } from "../../generated/Vault/PairStorage";
import { Storage } from "../../generated/Vault/Storage";
import { PairInfo } from "../../generated/Vault/PairInfo";
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
import {
  bigDecimalToBigInt,
  bigIntToBigDecimal,
  safeDivide,
} from "../sdk/util/numbers";
import {
  BIGINT_HUNDRED,
  BIGINT_MINUS_ONE,
  BIGINT_ONE,
  BIGINT_ZERO,
  LiquidityPoolFeeType,
  PositionSide,
  RewardTokenType,
} from "../sdk/util/constants";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { getRewardsPerDay, RewardIntervalType } from "../sdk/util/rewards";

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
      "gDAI Vault",
      "gDAI Vault",
      [depositToken],
      outputToken,
      "chainlink"
    );

    pool.setPoolFee(
      LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE,
      safeDivide(
        BigInt.fromI32(6).toBigDecimal(),
        BigInt.fromI32(100).toBigDecimal()
      )
    );
    pool.setPoolFee(
      LiquidityPoolFeeType.DYNAMIC_LP_FEE,
      safeDivide(
        BigInt.fromI32(6).toBigDecimal(),
        BigInt.fromI32(100).toBigDecimal()
      )
    );
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

export function handleMarketExecuted(event: MarketExecuted): void {
  const trader = event.params.t.trader;
  const positionSide = event.params.t.buy
    ? PositionSide.LONG
    : PositionSide.SHORT;
  const leverage = event.params.t.leverage;

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
  const leveragedAmount = collateralAmount.times(leverage);

  const storageContract = Storage.bind(NetworkConfigs.getStorageAddress());
  const precisionCall = storageContract.try_PRECISION();
  if (precisionCall.reverted) {
    log.warning("[precisionCall reverted] hash: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  const precision = precisionCall.value;

  const pool = sdk.Pools.loadPool(NetworkConfigs.getVaultAddress());

  const pairIndex = event.params.t.pairIndex;
  const openInterestLongCall = storageContract.try_openInterestDai(
    pairIndex,
    BIGINT_ZERO
  );
  if (openInterestLongCall.reverted) {
    log.warning("[openInterestLongCall reverted] hash: {} pairIndex: {}", [
      event.transaction.hash.toHexString(),
      pairIndex.toString(),
    ]);
    return;
  }
  const openInterestLong = openInterestLongCall.value;

  const openInterestShortCall = storageContract.try_openInterestDai(
    pairIndex,
    BIGINT_ONE
  );
  if (openInterestShortCall.reverted) {
    log.warning("[openInterestShortCall reverted] hash: {} pairIndex: {}", [
      event.transaction.hash.toHexString(),
      pairIndex.toString(),
    ]);
    return;
  }
  const openInterestShort = openInterestShortCall.value;
  pool.updateOpenInterestByToken(
    pairIndex,
    collateralToken,
    openInterestLong,
    openInterestShort
  );

  const pairInfoContract = PairInfo.bind(NetworkConfigs.getPairInfoAddress());
  const fundingRatePerBlockCall =
    pairInfoContract.try_getFundingFeePerBlockP(pairIndex);
  if (fundingRatePerBlockCall.reverted) {
    log.warning(
      "[fundingRatePerBlockCall reverted]  hash: {} pairInfoContract: {} pairIndex: {}",
      [
        event.transaction.hash.toHexString(),
        NetworkConfigs.getPairInfoAddress().toHexString(),
        pairIndex.toString(),
      ]
    );
    return;
  }
  const fundingRatePerBlock = fundingRatePerBlockCall.value;
  const fundingRatePerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    fundingRatePerBlock.toBigDecimal(),
    RewardIntervalType.BLOCK
  );
  pool.updateFundingRateByToken(pairIndex, collateralToken, fundingRatePerDay);

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
  const positionID = position.getBytesID();
  const isExistingOpenPosition = loadPositionResponse.isExistingOpenPosition;

  const pairStorageContract = PairStorage.bind(
    NetworkConfigs.getPairStorageAddress()
  );
  const vaultContract = Vault.bind(NetworkConfigs.getVaultAddress());
  const sharesTransferredCall =
    vaultContract.try_convertToShares(collateralAmount);
  if (sharesTransferredCall.reverted) {
    log.warning(
      "[sharesTransferredCall reverted] hash: {} collateralAmount: {}",
      [event.transaction.hash.toHexString(), collateralAmount.toString()]
    );
    return;
  }
  const sharesTransferred = sharesTransferredCall.value;

  if (event.params.open) {
    pool.addInflowVolumeByToken(collateralToken, leveragedAmount);
    pool.addVolumeByToken(collateralToken, leveragedAmount);

    const openFeePCall = pairStorageContract.try_pairOpenFeeP(pairIndex);
    if (openFeePCall.reverted) {
      log.warning("[openFeePCall reverted] hash: {} pairIndex: {}", [
        event.transaction.hash.toHexString(),
        pairIndex.toString(),
      ]);
      return;
    }
    const openFeeP = openFeePCall.value;
    const openingFee = bigDecimalToBigInt(
      safeDivide(
        leveragedAmount.times(openFeeP).toBigDecimal(),
        precision.times(BIGINT_HUNDRED).toBigDecimal()
      )
    );
    pool.addPremiumByToken(
      collateralToken,
      openingFee,
      TransactionType.COLLATERAL_IN
    );

    const collateralAmounts = createTokenAmountArray(
      pool,
      [collateralToken],
      [collateralAmount]
    );
    account.collateralIn(
      pool,
      positionID,
      collateralAmounts,
      sharesTransferred
    );

    if (leverage > BIGINT_ONE) {
      account.borrow(
        pool,
        positionID,
        Address.fromBytes(collateralToken.id),
        leveragedAmount.minus(collateralAmount)
      );
    }

    position.setLeverage(leverage.toBigDecimal());
    position.setBalance(collateralToken, collateralAmount);
    position.setCollateralBalance(collateralToken, collateralAmount);
    position.addCollateralInCount();
    position.setFundingrateOpen(fundingRatePerDay);
  } else {
    const percentProfit = event.params.percentProfit;
    const pnl = safeDivide(
      collateralAmount.times(percentProfit).toBigDecimal(),
      precision.times(BIGINT_HUNDRED).toBigDecimal()
    );
    const pnlAmount = collateralAmount.plus(bigDecimalToBigInt(pnl));

    if (percentProfit <= BIGINT_ZERO) {
      pool.addClosedInflowVolumeByToken(
        collateralToken,
        collateralAmount.minus(pnlAmount)
      );
      pool.addOutflowVolumeByToken(collateralToken, pnlAmount);
      pool.addVolumeByToken(collateralToken, pnlAmount);

      position.setBalanceClosed(collateralToken, pnlAmount);
      position.setCollateralBalanceClosed(collateralToken, pnlAmount);
      position.setRealisedPnlClosed(collateralToken, bigDecimalToBigInt(pnl));
    } else {
      const leveragedPnlAmount = pnlAmount.times(leverage);

      pool.addOutflowVolumeByToken(collateralToken, leveragedPnlAmount);
      pool.addVolumeByToken(collateralToken, leveragedPnlAmount);

      position.setBalanceClosed(collateralToken, leveragedPnlAmount);
      position.setCollateralBalanceClosed(collateralToken, leveragedPnlAmount);
      position.setRealisedPnlClosed(
        collateralToken,
        bigDecimalToBigInt(pnl).times(leverage)
      );
    }

    const closeFeePCall = pairStorageContract.try_pairCloseFeeP(pairIndex);
    if (closeFeePCall.reverted) {
      log.warning("[closeFeePCall reverted] hash: {} pairIndex: {}", [
        event.transaction.hash.toHexString(),
        pairIndex.toString(),
      ]);
      return;
    }
    const closeFeeP = closeFeePCall.value;
    const closingFee = bigDecimalToBigInt(
      safeDivide(
        leveragedAmount.times(closeFeeP).toBigDecimal(),
        precision.times(BIGINT_HUNDRED).toBigDecimal()
      )
    );
    pool.addPremiumByToken(
      collateralToken,
      closingFee,
      TransactionType.COLLATERAL_OUT
    );

    const collateralAmounts = createTokenAmountArray(
      pool,
      [collateralToken],
      [pnlAmount]
    );
    account.collateralOut(
      pool,
      positionID,
      collateralAmounts,
      sharesTransferred
    );

    position.addCollateralOutCount();
    position.setFundingrateClosed(fundingRatePerDay);
    position.closePosition(isExistingOpenPosition);
  }
}

export function handleLimitExecuted(event: LimitExecuted): void {
  const trader = event.params.t.trader;
  const positionSide = event.params.t.buy
    ? PositionSide.LONG
    : PositionSide.SHORT;
  const leverage = event.params.t.leverage;

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
  const leveragedAmount = collateralAmount.times(leverage);

  const storageContract = Storage.bind(NetworkConfigs.getStorageAddress());
  const precisionCall = storageContract.try_PRECISION();
  if (precisionCall.reverted) {
    log.warning("[precisionCall reverted] hash: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  const precision = precisionCall.value;

  const pool = sdk.Pools.loadPool(NetworkConfigs.getVaultAddress());

  const pairIndex = event.params.t.pairIndex;
  const openInterestLongCall = storageContract.try_openInterestDai(
    pairIndex,
    BIGINT_ZERO
  );
  if (openInterestLongCall.reverted) {
    log.warning("[openInterestLongCall reverted] hash: {} pairIndex: {}", [
      event.transaction.hash.toHexString(),
      pairIndex.toString(),
    ]);
    return;
  }
  const openInterestLong = openInterestLongCall.value;

  const openInterestShortCall = storageContract.try_openInterestDai(
    pairIndex,
    BIGINT_ONE
  );
  if (openInterestShortCall.reverted) {
    log.warning("[openInterestShortCall reverted] hash: {} pairIndex: {}", [
      event.transaction.hash.toHexString(),
      pairIndex.toString(),
    ]);
    return;
  }
  const openInterestShort = openInterestShortCall.value;
  pool.updateOpenInterestByToken(
    pairIndex,
    collateralToken,
    openInterestLong,
    openInterestShort
  );

  const pairInfoContract = PairInfo.bind(NetworkConfigs.getPairInfoAddress());
  const fundingRatePerBlockCall =
    pairInfoContract.try_getFundingFeePerBlockP(pairIndex);
  if (fundingRatePerBlockCall.reverted) {
    log.warning(
      "[fundingRatePerBlockCall reverted] pairInfoAddress: {} pairIndex: {}",
      [NetworkConfigs.getPairInfoAddress().toHexString(), pairIndex.toString()]
    );
    return;
  }
  const fundingRatePerBlock = fundingRatePerBlockCall.value;
  const fundingRatePerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    fundingRatePerBlock.toBigDecimal(),
    RewardIntervalType.BLOCK
  );
  pool.updateFundingRateByToken(pairIndex, collateralToken, fundingRatePerDay);

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
    event.params.orderType == 3 ? true : false
  );
  const position = loadPositionResponse.position;
  const positionID = position.getBytesID();
  const isExistingOpenPosition = loadPositionResponse.isExistingOpenPosition;

  const pairStorageContract = PairStorage.bind(
    NetworkConfigs.getPairStorageAddress()
  );
  const vaultContract = Vault.bind(NetworkConfigs.getVaultAddress());
  const sharesTransferredCall =
    vaultContract.try_convertToShares(collateralAmount);
  if (sharesTransferredCall.reverted) {
    log.warning(
      "[sharesTransferredCall reverted] hash: {} collateralAmount: {}",
      [event.transaction.hash.toHexString(), collateralAmount.toString()]
    );
    return;
  }
  const sharesTransferred = sharesTransferredCall.value;

  // orderType [TP, SL, LIQ, OPEN]
  if (event.params.orderType == 3) {
    pool.addInflowVolumeByToken(collateralToken, leveragedAmount);
    pool.addVolumeByToken(collateralToken, leveragedAmount);

    const openFeePCall = pairStorageContract.try_pairOpenFeeP(pairIndex);
    if (openFeePCall.reverted) {
      log.warning("[openFeePCall reverted] hash: {} pairIndex: {}", [
        event.transaction.hash.toHexString(),
        pairIndex.toString(),
      ]);
      return;
    }
    const openFeeP = openFeePCall.value;
    const openingFee = bigDecimalToBigInt(
      safeDivide(
        leveragedAmount.times(openFeeP).toBigDecimal(),
        precision.times(BIGINT_HUNDRED).toBigDecimal()
      )
    );
    pool.addPremiumByToken(
      collateralToken,
      openingFee,
      TransactionType.COLLATERAL_IN
    );

    const collateralAmounts = createTokenAmountArray(
      pool,
      [collateralToken],
      [collateralAmount]
    );
    account.collateralIn(
      pool,
      positionID,
      collateralAmounts,
      sharesTransferred
    );

    if (leverage > BIGINT_ONE) {
      account.borrow(
        pool,
        positionID,
        Address.fromBytes(collateralToken.id),
        leveragedAmount.minus(collateralAmount)
      );
    }

    position.setLeverage(leverage.toBigDecimal());
    position.setBalance(collateralToken, collateralAmount);
    position.setCollateralBalance(collateralToken, collateralAmount);
    position.addCollateralInCount();
    position.setFundingrateOpen(fundingRatePerDay);
  } else {
    const percentProfit = event.params.percentProfit;
    const pnl = safeDivide(
      collateralAmount.times(percentProfit).toBigDecimal(),
      precision.times(BIGINT_HUNDRED).toBigDecimal()
    );
    const pnlAmount = collateralAmount.plus(bigDecimalToBigInt(pnl));

    const closeFeePCall = pairStorageContract.try_pairCloseFeeP(pairIndex);
    if (closeFeePCall.reverted) {
      log.warning("[closeFeePCall reverted] hash: {} pairIndex: {}", [
        event.transaction.hash.toHexString(),
        pairIndex.toString(),
      ]);
      return;
    }
    const closeFeeP = closeFeePCall.value;
    const closingFee = bigDecimalToBigInt(
      safeDivide(
        leveragedAmount.times(closeFeeP).toBigDecimal(),
        precision.times(BIGINT_HUNDRED).toBigDecimal()
      )
    );

    position.setFundingrateClosed(fundingRatePerDay);
    position.closePosition(isExistingOpenPosition);

    if (event.params.orderType == 2) {
      // liquidate
      if (percentProfit <= BIGINT_ZERO) {
        pool.addClosedInflowVolumeByToken(collateralToken, collateralAmount);
      }
      pool.addPremiumByToken(
        collateralToken,
        closingFee,
        TransactionType.LIQUIDATE
      );

      account.liquidate(
        pool,
        Address.fromBytes(collateralToken.id),
        Address.fromBytes(collateralToken.id),
        collateralAmount,
        event.params.nftHolder,
        trader,
        positionID,
        pnl
      );

      position.addLiquidationCount();
      position.setBalanceClosed(collateralToken, BIGINT_ZERO);
      position.setCollateralBalanceClosed(collateralToken, BIGINT_ZERO);
      position.setRealisedPnlClosed(collateralToken, bigDecimalToBigInt(pnl));
    } else {
      if (percentProfit <= BIGINT_ZERO) {
        pool.addClosedInflowVolumeByToken(
          collateralToken,
          collateralAmount.minus(pnlAmount)
        );
        pool.addOutflowVolumeByToken(collateralToken, pnlAmount);
        pool.addVolumeByToken(collateralToken, pnlAmount);

        position.setBalanceClosed(collateralToken, pnlAmount);
        position.setCollateralBalanceClosed(collateralToken, pnlAmount);
        position.setRealisedPnlClosed(collateralToken, bigDecimalToBigInt(pnl));
      } else {
        const leveragedPnlAmount = pnlAmount.times(leverage);

        pool.addOutflowVolumeByToken(collateralToken, leveragedPnlAmount);
        pool.addVolumeByToken(collateralToken, leveragedPnlAmount);

        position.setBalanceClosed(collateralToken, leveragedPnlAmount);
        position.setCollateralBalanceClosed(
          collateralToken,
          leveragedPnlAmount
        );
        position.setRealisedPnlClosed(
          collateralToken,
          bigDecimalToBigInt(pnl).times(leverage)
        );
      }

      pool.addPremiumByToken(
        collateralToken,
        closingFee,
        TransactionType.COLLATERAL_OUT
      );

      const collateralAmounts = createTokenAmountArray(
        pool,
        [collateralToken],
        [pnlAmount]
      );
      account.collateralOut(
        pool,
        positionID,
        collateralAmounts,
        sharesTransferred
      );

      position.addCollateralOutCount();
    }
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

  pool.addRevenueByToken(collateralToken, devGovFee, BIGINT_ZERO);
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

  pool.addRevenueByToken(collateralToken, BIGINT_ZERO, lpFee);
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

  pool.addRevenueByToken(collateralToken, BIGINT_ZERO, vaultFee);
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

  const protocol = sdk.Protocol;
  const sssFeeUSD = protocol.pricer.getAmountValueUSD(collateralToken, sssFee);
  protocol.addStakeSideRevenueUSD(sssFeeUSD);
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
