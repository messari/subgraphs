import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultSnapshots,
} from "../modules/Metrics";
import {
  getOrCreateToken,
  getOrCreateLockerVault,
} from "../common/initializers";
import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  RewardDataUpdate as RewardDataUpdateEvent,
} from "../../generated/templates/LockersGauge/LockersGauge";
import { Deposit } from "../modules/Deposit";
import { Withdraw } from "../modules/Withdraw";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "../modules/Revenue";

export function handleDeposit(event: DepositEvent): void {
  const depositor = event.params.provider;
  const lockerGaugeAddress = event.address;
  const depositAmount = event.params.value;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const vault = getOrCreateLockerVault(lockerGaugeAddress, event.block);

  Deposit(
    lockerGaugeAddress,
    depositAmount,
    null,
    event.transaction,
    event.block
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, depositor);
  updateVaultSnapshots(lockerGaugeAddress, event.block);
}

export function handleWithdraw(event: WithdrawEvent): void {
  const depositor = event.params.provider;
  const lockerGaugeAddress = event.address;
  const sharesBurnt = event.params.value;
  const withdrawAmount = event.params.value;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const vault = getOrCreateLockerVault(lockerGaugeAddress, event.block);

  Withdraw(
    lockerGaugeAddress,
    withdrawAmount,
    sharesBurnt,
    event.transaction,
    event.block
  );

  updateFinancials(event.block);
  updateUsageMetrics(event.block, depositor);
  updateVaultSnapshots(lockerGaugeAddress, event.block);
}

export function handleRewardDataUpdate(event: RewardDataUpdateEvent): void {
  const vaultAddress = event.address;
  const rewardTokenAmount = event.params._amount;
  const rewardTokenAddress = event.params._token;

  const vault = getOrCreateLockerVault(vaultAddress, event.block);

  const rewardToken = getOrCreateToken(rewardTokenAddress, event.block);
  const rewardTokenDecimals = constants.BIGINT_TEN.pow(
    rewardToken.decimals as u8
  ).toBigDecimal();

  const vaultFees = rewardTokenAddress.notEqual(constants.SDT_TOKEN_ADDRESS)
    ? constants.BIGDECIMAL_HUNDRED.div(constants.FEE_DENOMINATOR)
    : constants.BIGDECIMAL_ZERO;

  const totalRevenue = rewardTokenAmount
    .divDecimal(constants.BIGDECIMAL_ONE.minus(vaultFees))
    .div(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  const supplySideRevenue = rewardTokenAmount
    .divDecimal(rewardTokenDecimals)
    .times(rewardToken.lastPriceUSD!);

  const protocolSideRevenue = totalRevenue.minus(supplySideRevenue);

  updateRevenueSnapshots(
    vault,
    supplySideRevenue,
    protocolSideRevenue,
    event.block
  );
}
