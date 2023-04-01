import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";

import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { createTokenAmountArray, safeDivide } from "./helpers";

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
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ONE,
  BIGINT_HUNDRED,
  BIGINT_MINUS_ONE,
  BIGINT_ONE,
  BIGINT_ZERO,
  LiquidityPoolFeeType,
  PositionSide,
  RewardTokenType,
  ZERO_ADDRESS,
} from "../sdk/util/constants";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { getRewardsPerDay, RewardIntervalType } from "../sdk/util/rewards";
import { pairIndexToName } from "./pairList";

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
    pool.initialize("gDAI Vault", "gDAI Vault", [depositToken], outputToken);

    pool.setInputTokenWeights([BIGDECIMAL_ONE]);
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
  const account = sdk.Accounts.loadAccount(caller);
  account.deposit(pool, depositAmounts);
}

export function handleDepositLocked(event: DepositLocked): void {
  const stakeAmount = event.params.d.assetsDeposited;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const pool = sdk.Pools.loadPool(dataSource.address());
  pool.addStakedOutputTokenAmount(stakeAmount);
}

export function handleDepositUnlocked(event: DepositUnlocked): void {
  const unstakeAmount = event.params.d.assetsDeposited;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const pool = sdk.Pools.loadPool(dataSource.address());
  pool.addStakedOutputTokenAmount(unstakeAmount.times(BIGINT_MINUS_ONE));
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
  const account = sdk.Accounts.loadAccount(caller);
  account.withdraw(pool, withdrawAmounts);
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
  pool.addVolumeByToken(Address.fromBytes(collateralToken.id), leveragedAmount);

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

  const openInterest = openInterestLong.plus(openInterestShort);
  pool.setOpenInterest(collateralToken, openInterest);

  const pairName = pairIndexToName.get(pairIndex);
  if (!pairName) {
    log.warning("[pairIndexToName] pairIndex: {} not listed", [
      pairIndex.toString(),
    ]);
    return;
  }
  const pairHex = Bytes.fromUTF8(pairName!).toHexString().replace("0x", "");
  const pairAddr = Address.fromString(
    ZERO_ADDRESS.slice(0, ZERO_ADDRESS.length - pairHex.length) + pairHex
  );

  const tradingPair = sdk.Tokens.getOrCreateSyntheticToken(
    pairAddr,
    pairName!,
    pairName!,
    10 as i32
  );
  pool.addInputToken(tradingPair.id);

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
  pool.setFundingRateByToken(
    Address.fromBytes(tradingPair.id),
    fundingRatePerDay
  );

  const account = sdk.Accounts.loadAccount(trader);
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

  if (event.params.open) {
    pool.addInflowVolumeByToken(
      Address.fromBytes(collateralToken.id),
      leveragedAmount
    );

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
      Address.fromBytes(collateralToken.id),
      openingFee,
      TransactionType.COLLATERAL_IN
    );

    const collateralAmounts = createTokenAmountArray(
      pool,
      [collateralToken],
      [collateralAmount]
    );
    account.collateralIn(pool, positionID, collateralAmounts);

    if (leverage > BIGINT_ONE) {
      account.borrow(
        pool,
        positionID,
        Address.fromBytes(collateralToken.id),
        leveragedAmount.minus(collateralAmount)
      );
    }

    position.setLeverage(leverage.toBigDecimal());
    position.setBalance(
      Address.fromBytes(collateralToken.id),
      collateralAmount
    );
    position.setCollateralBalance(
      Address.fromBytes(collateralToken.id),
      collateralAmount
    );
    position.addCollateralInCount();
    position.setFundingrateOpen(fundingRatePerDay);
  } else {
    const percentProfit = event.params.percentProfit;
    const pnl = safeDivide(
      collateralAmount.times(percentProfit).toBigDecimal(),
      precision.times(BIGINT_HUNDRED).toBigDecimal()
    );
    const pnlAmount = collateralAmount.plus(bigDecimalToBigInt(pnl));
    const leveragedPnlAmount = pnlAmount.times(leverage);

    if (percentProfit <= BIGINT_ZERO) {
      pool.addClosedInflowVolumeByToken(
        Address.fromBytes(collateralToken.id),
        collateralAmount.minus(pnlAmount)
      );
      pool.addOutflowVolumeByToken(
        Address.fromBytes(collateralToken.id),
        pnlAmount
      );
    } else {
      pool.addOutflowVolumeByToken(
        Address.fromBytes(collateralToken.id),
        leveragedPnlAmount
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
      Address.fromBytes(collateralToken.id),
      closingFee,
      TransactionType.COLLATERAL_OUT
    );

    let collateralAmounts = createTokenAmountArray(
      pool,
      [collateralToken],
      [pnlAmount]
    );
    account.collateralOut(pool, positionID, collateralAmounts);

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

  pool.addVolumeByToken(Address.fromBytes(collateralToken.id), leveragedAmount);

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

  const openInterest = openInterestLong.plus(openInterestShort);
  pool.setOpenInterest(collateralToken, openInterest);

  const pairName = pairIndexToName.get(pairIndex);
  if (!pairName) {
    log.warning("[pairIndexToName] pairIndex: {} not listed", [
      pairIndex.toString(),
    ]);
    return;
  }
  const pairHex = Bytes.fromUTF8(pairName!).toHexString().replace("0x", "");
  const pairAddr = Address.fromString(
    ZERO_ADDRESS.slice(0, ZERO_ADDRESS.length - pairHex.length) + pairHex
  );

  const tradingPair = sdk.Tokens.getOrCreateSyntheticToken(
    pairAddr,
    pairName!,
    pairName!,
    10 as i32
  );
  pool.addInputToken(tradingPair.id);

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
  pool.setFundingRateByToken(
    Address.fromBytes(tradingPair.id),
    fundingRatePerDay
  );

  const account = sdk.Accounts.loadAccount(trader);
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

  // orderType [TP, SL, LIQ, OPEN]
  if (event.params.orderType == 3) {
    pool.addInflowVolumeByToken(
      Address.fromBytes(collateralToken.id),
      leveragedAmount
    );

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
      Address.fromBytes(collateralToken.id),
      openingFee,
      TransactionType.COLLATERAL_IN
    );

    const collateralAmounts = createTokenAmountArray(
      pool,
      [collateralToken],
      [collateralAmount]
    );
    account.collateralIn(pool, positionID, collateralAmounts);

    if (leverage > BIGINT_ONE) {
      account.borrow(
        pool,
        positionID,
        Address.fromBytes(collateralToken.id),
        leveragedAmount.minus(collateralAmount)
      );
    }

    position.setLeverage(leverage.toBigDecimal());
    position.setBalance(
      Address.fromBytes(collateralToken.id),
      collateralAmount
    );
    position.setCollateralBalance(
      Address.fromBytes(collateralToken.id),
      collateralAmount
    );
    position.addCollateralInCount();
    position.setFundingrateOpen(fundingRatePerDay);
  } else {
    const percentProfit = event.params.percentProfit;
    const pnl = safeDivide(
      collateralAmount.times(percentProfit).toBigDecimal(),
      precision.times(BIGINT_HUNDRED).toBigDecimal()
    );
    const pnlAmount = collateralAmount.plus(bigDecimalToBigInt(pnl));
    const leveragedPnlAmount = pnlAmount.times(leverage);

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
        pool.addClosedInflowVolumeByToken(
          Address.fromBytes(collateralToken.id),
          collateralAmount
        );
      }
      pool.addPremiumByToken(
        Address.fromBytes(collateralToken.id),
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
    } else {
      if (percentProfit <= BIGINT_ZERO) {
        pool.addClosedInflowVolumeByToken(
          Address.fromBytes(collateralToken.id),
          collateralAmount.minus(pnlAmount)
        );
        pool.addOutflowVolumeByToken(
          Address.fromBytes(collateralToken.id),
          pnlAmount
        );
      } else {
        pool.addOutflowVolumeByToken(
          Address.fromBytes(collateralToken.id),
          leveragedPnlAmount
        );
      }

      pool.addPremiumByToken(
        Address.fromBytes(collateralToken.id),
        closingFee,
        TransactionType.COLLATERAL_OUT
      );

      let collateralAmounts = createTokenAmountArray(
        pool,
        [collateralToken],
        [pnlAmount]
      );
      account.collateralOut(pool, positionID, collateralAmounts);

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

  pool.addRevenueByToken(
    Address.fromBytes(collateralToken.id),
    devGovFee,
    BIGINT_ZERO
  );
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

  pool.addRevenueByToken(
    Address.fromBytes(collateralToken.id),
    BIGINT_ZERO,
    lpFee
  );
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

  pool.addRevenueByToken(
    Address.fromBytes(collateralToken.id),
    BIGINT_ZERO,
    vaultFee
  );
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
