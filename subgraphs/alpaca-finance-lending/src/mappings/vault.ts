import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Vault,
  Kill,
  Transfer,
  RemoveDebt,
  AddDebt,
} from "../../generated/ibALPACA/Vault";
import { ConfigurableInterestVaultConfig } from "../../generated/ibALPACA/ConfigurableInterestVaultConfig";
import { FairLaunch } from "../../generated/ibALPACA/FairLaunch";
import { Market, MarketDailySnapshot } from "../../generated/schema";
import { getOrCreateToken, getOrCreateRewardToken } from "../entities/token";
import {
  createDeposit,
  createWithdraw,
  createBorrow,
  createLiquidate,
  createRepay,
} from "../entities/event";
import { updateUserPosition } from "../entities/position";
import {
  getMarket,
  updateMarketRewardTokens,
  changeMarketBorrowBalance,
  addMarketProtocolSideRevenue,
  addMarketSupplySideRevenue,
  updateMarketRates,
  updateTokenSupply,
  getOrCreateMarket,
} from "../entities/market";
import { amountInUSD } from "../entities/price";
import {
  BIGDECIMAL_ONE,
  BIGINT_ZERO,
  BIGDECIMAL_HUNDRED,
  BIGINT_NEGATIVE_ONE,
  InterestRateType,
  RewardTokenType,
  PositionSide,
  PROTOCOL_LENDING_FEE,
  SECONDS_PER_YEAR,
  ZERO_ADDRESS,
  FAIRLAUNCH_ADDRESS_BSC,
  BIGINT_ONE,
  SECONDS_PER_DAY,
  BIGINT_SECONDS_PER_DAY,
  BIGINT_PROTOCOL_LENDING_FEE,
  BIGINT_HUNDRED,
  BIGINT_TEN_TO_EIGHTEENTH,
  LIQUIDATION_PROTOCOL_SIDE_RATIO,
} from "../utils/constants";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../utils/numbers";

export function handleTransfer(event: Transfer): void {
  if (event.params.value.equals(BIGINT_ZERO)) {
    return;
  }

  if (
    event.params.from == Address.fromString(ZERO_ADDRESS) &&
    event.params.to == Address.fromString(ZERO_ADDRESS)
  ) {
    return;
  }

  if (event.params.from == Address.fromString(ZERO_ADDRESS)) {
    _handleMint(event);
    return;
  }

  if (event.params.to == Address.fromString(ZERO_ADDRESS)) {
    _handleBurn(event);
    return;
  }

  const market = getMarket(event.address);
  const contract = Vault.bind(event.address);
  // Handle transfer as withdraw + deposit
  createWithdraw(
    event,
    market,
    Address.fromString(market.inputToken),
    event.params.from,
    event.params.value,
    true
  );
  updateUserPosition(
    event,
    event.params.from,
    market,
    contract.balanceOf(event.params.from),
    PositionSide.LENDER,
    true
  );

  createDeposit(
    event,
    market,
    Address.fromString(market.inputToken),
    event.params.to,
    event.params.value,
    true
  );
  updateUserPosition(
    event,
    event.params.to,
    market,
    contract.balanceOf(event.params.to),
    PositionSide.LENDER,
    true
  );
}

function _handleMint(event: Transfer): void {
  const contract = Vault.bind(event.address);
  const tryTokenResult = contract.try_token();
  if (tryTokenResult.reverted) {
    log.warning(
      "[handleMint] could not get token info from vault contract",
      []
    );
    return;
  }
  const market = getOrCreateMarket(event, tryTokenResult.value, event.address);
  updateInterest(event, market);

  createDeposit(
    event,
    market,
    tryTokenResult.value,
    event.params.to,
    event.params.value
  );

  updateUserPosition(
    event,
    event.params.to,
    market,
    contract.balanceOf(event.params.to),
    PositionSide.LENDER,
    true
  );
  updateTokenSupply(event, market, event.params.value);
}

function _handleBurn(event: Transfer): void {
  const market = getMarket(event.address);
  updateInterest(event, market);
  const contract = Vault.bind(event.address);
  const tryTokenResult = contract.try_token();
  if (tryTokenResult.reverted) {
    return;
  }

  createWithdraw(
    event,
    market,
    tryTokenResult.value,
    event.params.from,
    event.params.value
  );

  updateUserPosition(
    event,
    event.params.to,
    market,
    contract.balanceOf(event.params.to),
    PositionSide.LENDER,
    true
  );

  updateTokenSupply(
    event,
    market,
    event.params.value.times(BIGINT_NEGATIVE_ONE)
  );
}

export function handleAddDebt(event: AddDebt): void {
  const market = getMarket(event.address);
  updateInterest(event, market);
  const contract = Vault.bind(event.address);
  const trytoken = contract.try_token();
  const tryDebtVal = contract.try_debtShareToVal(event.params.debtShare);
  if (trytoken.reverted || tryDebtVal.reverted) {
    log.error("[handleAddDebt]Failed to handle add debt for market {} tx={}", [
      market.id,
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  const tryPositions = contract.try_positions(event.params.id);
  if (tryPositions.reverted) {
    return;
  }
  createBorrow(
    event,
    market,
    trytoken.value,
    tryPositions.value.getOwner(),
    tryDebtVal.value
  );
  changeMarketBorrowBalance(event, market, tryDebtVal.value);
  updateUserPosition(
    event,
    tryPositions.value.getOwner(),
    market,
    tryDebtVal.value,
    PositionSide.BORROWER,
    false
  );
}

export function handleRemoveDebt(event: RemoveDebt): void {
  const market = getMarket(event.address);
  updateInterest(event, market);
  const contract = Vault.bind(event.address);
  const trytoken = contract.try_token();
  const tryDebtVal = contract.try_debtShareToVal(event.params.debtShare);
  if (trytoken.reverted || tryDebtVal.reverted) {
    log.error(
      "[handleRemoveDebt]Failed to handle remove debt from market {} tx={}",
      [market.id, event.transaction.hash.toHexString()]
    );
    return;
  }
  const tryPositions = contract.try_positions(event.params.id);
  if (tryPositions.reverted) {
    return;
  }
  createRepay(
    event,
    market,
    trytoken.value,
    tryPositions.value.getOwner(),
    tryDebtVal.value
  );
  changeMarketBorrowBalance(
    event,
    market,
    tryDebtVal.value.times(BIGINT_NEGATIVE_ONE)
  );
  updateUserPosition(
    event,
    tryPositions.value.getOwner(),
    market,
    tryDebtVal.value,
    PositionSide.BORROWER,
    false
  );
}

export function handleKill(event: Kill): void {
  const market = getMarket(event.address);
  updateInterest(event, market);

  let protocolSideProfitRatio = LIQUIDATION_PROTOCOL_SIDE_RATIO;
  const vaultContract = Vault.bind(event.address);
  const tryConfig = vaultContract.try_config();
  if (tryConfig.reverted) {
    log.warning("[handleKill] could not fetch config contract address", []);
    return;
  }
  const configContract = ConfigurableInterestVaultConfig.bind(tryConfig.value);
  const tryGetKillBps = configContract.try_getKillBps();
  const tryGetKillTreasuryBps = configContract.try_getKillTreasuryBps();
  if (tryGetKillBps.reverted || tryGetKillTreasuryBps.reverted) {
    log.warning("[handleKill] could not fetch liquidation config data", []);
    return;
  }
  protocolSideProfitRatio = tryGetKillTreasuryBps.value.divDecimal(
    tryGetKillTreasuryBps.value.plus(tryGetKillBps.value).toBigDecimal()
  );

  createLiquidate(
    event,
    market,
    Address.fromString(market.inputToken),
    event.params.posVal,
    Address.fromString(market.inputToken),
    event.params.prize,
    bigDecimalToBigInt(
      event.params.prize.toBigDecimal().times(protocolSideProfitRatio)
    ),
    event.params.killer,
    event.params.owner
  );
}

export function updateInterest(event: ethereum.Event, market: Market): void {
  // Compute interest rate once per day. Otherwise, it will greatly slow down the indexing.
  const day: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const id = `${market.id}-${day}`;
  const marketSnapshot = MarketDailySnapshot.load(id);
  if (marketSnapshot != null) {
    return;
  }

  const vaultContract = Vault.bind(event.address);
  const tryReservePool = vaultContract.try_reservePool();
  if (tryReservePool.reverted) {
    log.warning("[updateInterest] could not fetch reservePool", []);
    return;
  }

  const tryTotalToken = vaultContract.try_totalToken();
  const tryVaultDebtVal = vaultContract.try_vaultDebtVal();
  const tryConfig = vaultContract.try_config();
  if (
    tryTotalToken.reverted ||
    tryVaultDebtVal.reverted ||
    tryConfig.reverted
  ) {
    log.warning("[updateInterest] failed on vault contract call", []);
    return;
  }

  const vaultDebtVal = tryVaultDebtVal.value;
  const totalTokenAmount = tryTotalToken.value;
  let floating = totalTokenAmount.minus(vaultDebtVal);
  // config.getInterestRate(vaultDebtVal, floating) matches
  // to how alpaca front end calculates APY, but floating may
  // be negative, in this case, add back reservePool
  if (floating.lt(BIGINT_ZERO)) {
    floating = floating.plus(tryReservePool.value);
  }

  const configContract = ConfigurableInterestVaultConfig.bind(tryConfig.value);
  const tryGetInterestRate = configContract.try_getInterestRate(
    vaultDebtVal,
    floating
  );
  if (tryGetInterestRate.reverted || totalTokenAmount.equals(BIGINT_ZERO)) {
    log.warning("[updateInterest] could not update interest rate", []);
    return;
  }

  const ratePerSec = tryGetInterestRate.value;
  const borrowerAPY = bigIntToBigDecimal(
    ratePerSec.times(SECONDS_PER_YEAR)
  ).times(BIGDECIMAL_HUNDRED);
  const lenderAPY = borrowerAPY
    .times(vaultDebtVal.toBigDecimal())
    .times(BIGDECIMAL_ONE.minus(PROTOCOL_LENDING_FEE.div(BIGDECIMAL_HUNDRED)))
    .div(totalTokenAmount.toBigDecimal());
  updateMarketRates(event, market, borrowerAPY, lenderAPY);
  log.info(
    "[updateInterestRate]market={},vaultDebtValu={},totalToken={},RatePerSec={},borrowerAPY={},lenderAPY={},tx={}",
    [
      market.id,
      vaultDebtVal.toString(),
      totalTokenAmount.toString(),
      ratePerSec.toString(),
      borrowerAPY.toString(),
      lenderAPY.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
  const dailyInterest = ratePerSec
    .times(vaultDebtVal)
    .times(BIGINT_SECONDS_PER_DAY)
    .div(BIGINT_TEN_TO_EIGHTEENTH);
  const protocolSideProfitUSD = amountInUSD(
    dailyInterest.times(BIGINT_PROTOCOL_LENDING_FEE).div(BIGINT_HUNDRED),
    getOrCreateToken(Address.fromString(market.inputToken)),
    event.block.number
  );
  const supplySideProfitUSD = protocolSideProfitUSD
    .div(PROTOCOL_LENDING_FEE)
    .times(BIGDECIMAL_HUNDRED.minus(PROTOCOL_LENDING_FEE));
  addMarketProtocolSideRevenue(event, market, protocolSideProfitUSD);
  addMarketSupplySideRevenue(event, market, supplySideProfitUSD);
}

export function updateRewardTokens(
  event: ethereum.Event,
  market: Market
): void {
  const vaultContract = Vault.bind(event.address);
  const fairlaunchContract = FairLaunch.bind(
    Address.fromString(FAIRLAUNCH_ADDRESS_BSC)
  );

  const tryDebtToken = vaultContract.try_debtToken();
  let tryDebtTokenValue: Address | null = null;
  if (!tryDebtToken.reverted) {
    tryDebtTokenValue = tryDebtToken.value;
  }

  const tryAlpaca = fairlaunchContract.try_alpaca();
  const tryAlpacaPerBlock = fairlaunchContract.try_alpacaPerBlock();
  const tryTotalAllocPoint = fairlaunchContract.try_totalAllocPoint();
  const tryPoolLength = fairlaunchContract.try_poolLength();
  if (
    tryAlpaca.reverted ||
    tryAlpacaPerBlock.reverted ||
    tryTotalAllocPoint.reverted ||
    tryPoolLength.reverted
  ) {
    return;
  }

  let ibTokenRewardUpdated = false;
  let debtTokenRewardUpdated = false;
  if (tryDebtTokenValue === null) {
    debtTokenRewardUpdated = true;
  }

  for (let i = BIGINT_ZERO; i.lt(tryPoolLength.value); i = i.plus(BIGINT_ONE)) {
    const tryPoolInfo = fairlaunchContract.try_poolInfo(i);
    if (!tryPoolInfo.reverted) {
      const stakeTokenValue = tryPoolInfo.value.getStakeToken();
      if (
        stakeTokenValue == event.address ||
        (tryDebtTokenValue !== null && stakeTokenValue == tryDebtTokenValue)
      ) {
        let rewardTokenType = RewardTokenType.BORROW;
        if (event.address == stakeTokenValue) {
          rewardTokenType = RewardTokenType.DEPOSIT;
          ibTokenRewardUpdated = true;
        } else {
          debtTokenRewardUpdated = true;
        }

        const rewardToken = getOrCreateRewardToken(
          tryAlpaca.value,
          rewardTokenType,
          InterestRateType.VARIABLE
        );
        updateMarketRewardTokens(
          event,
          market,
          rewardToken,
          tryAlpacaPerBlock.value
            .times(tryPoolInfo.value.getAllocPoint())
            .div(tryTotalAllocPoint.value)
        );

        if (ibTokenRewardUpdated && debtTokenRewardUpdated) {
          break;
        }
      }
    }
  }
}
