import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Stake, Unstake } from "../../generated/Vault/Vault";
import { incrementProtocolEventCount } from "../entities/protocol";
import {
  getOrCreateLiquidityPool,
  updatePoolTvl,
  updatePoolOutputToken,
  addPoolInputToken,
} from "../entities/pool";
import { createDeposit, createWithdraw, EventType } from "../entities/event";
import {
  getOrCreateAccount,
  incrementAccountEventCount,
} from "../entities/account";
import { takeSnapshots, updateTempUsageMetrics } from "../entities/snapshots";
import { convertTokenToDecimal } from "../utils/numbers";
import { BIGDECIMAL_ZERO, INT_ZERO, VLP_ADDRESS } from "../utils/constants";
import { getOrCreateToken } from "../entities/token";

export function handleStake(event: Stake): void {
  handleUpdateLiquidityEvent(
    event,
    event.params.account,
    event.params.token,
    event.params.amount,
    event.params.mintAmount,
    EventType.Deposit
  );
}

export function handleUnstake(event: Unstake): void {
  handleUpdateLiquidityEvent(
    event,
    event.params.account,
    event.params.token,
    event.params.amountOut,
    event.params.vlpAmount,
    EventType.Withdraw
  );
}

function handleUpdateLiquidityEvent(
  event: ethereum.Event,
  accountAddress: Address,
  inputTokenAddress: Address,
  inputTokenAmount: BigInt,
  outputTokenAmount: BigInt,
  eventType: EventType
): void {
  takeSnapshots(event);

  const account = getOrCreateAccount(event, accountAddress);
  incrementAccountEventCount(event, account, eventType, BIGDECIMAL_ZERO);
  incrementProtocolEventCount(event, eventType, BIGDECIMAL_ZERO);

  const pool = getOrCreateLiquidityPool(event);
  const inputToken = getOrCreateToken(event, inputTokenAddress);
  addPoolInputToken(event, pool, inputToken);
  const usdAmount = convertTokenToDecimal(
    inputTokenAmount,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  if (eventType == EventType.Deposit) {
    if (!pool.outputToken) {
      updatePoolOutputToken(event, pool, Address.fromString(VLP_ADDRESS));
    }

    createDeposit(
      event,
      accountAddress,
      inputTokenAddress,
      inputTokenAmount,
      usdAmount,
      outputTokenAmount
    );
  } else if (eventType == EventType.Withdraw) {
    createWithdraw(
      event,
      accountAddress,
      inputTokenAddress,
      inputTokenAmount,
      usdAmount,
      outputTokenAmount
    );
  }

  updatePoolTvl(event, pool);

  updateTempUsageMetrics(event, accountAddress, eventType, INT_ZERO, null);
}
