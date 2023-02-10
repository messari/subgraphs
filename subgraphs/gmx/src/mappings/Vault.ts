import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Swap,
  IncreasePoolAmount,
  DecreasePoolAmount,
  IncreasePosition,
  DecreasePosition,
  CollectSwapFees,
  CollectMarginFees,
} from "../../generated/Vault/Vault";
import { getOrCreatePool } from "../entities/pool";
import { getOrCreateToken } from "../entities/token";
import { updateUsageMetrics } from "../entityUpdates/usageMetrics";
import {
  updateSupplySideRevenueMetrics,
  updateProtocolSideRevenueMetrics,
  updateTotalRevenueMetrics,
} from "../entityUpdates/financialMetrics";
import {
  PRICE_PRECISION,
  PROTOCOL_SIDE_REVENUE_PERCENT,
} from "../utils/constants";
import { insert } from "../utils/numbers";

export function handleSwap(event: Swap): void {
  // update metrics
  updateUsageMetrics(event.block, event.params.account);
}

export function handleIncreasePosition(event: IncreasePosition): void {
  // update metrics
  updateUsageMetrics(event.block, event.params.account);
}

export function handleDecreasePosition(event: DecreasePosition): void {
  // update metrics
  updateUsageMetrics(event.block, event.params.account);
}

export function handleCollectSwapFees(event: CollectSwapFees): void {
  handleCollectFees(event.block, event.params.feeUsd);
}

export function handleCollectMarginFees(event: CollectMarginFees): void {
  handleCollectFees(event.block, event.params.feeUsd);
}

export function handleIncreasePoolAmount(event: IncreasePoolAmount): void {
  handleChangePoolAmount(
    event.params.token,
    event.params.amount,
    event.block,
    true
  );
}

export function handleDecreasePoolAmount(event: DecreasePoolAmount): void {
  handleChangePoolAmount(
    event.params.token,
    event.params.amount,
    event.block,
    false
  );
}

function handleChangePoolAmount(
  token: Address,
  amount: BigInt,
  block: ethereum.Block,
  isIncreasePoolAmount: bool
): void {
  const pool = getOrCreatePool(block.number, block.timestamp);
  const inputToken = getOrCreateToken(token, block.number);

  let inputTokens = pool.inputTokens;
  let inputTokenBalances = pool.inputTokenBalances;
  let appendData = false;
  const length = inputTokens.length;
  if (length == 0) {
    // need to append data to the array
    appendData = true;
  } else {
    for (let i = 0; i < length; i++) {
      const index = inputToken.id.localeCompare(inputTokens[i]);
      if (index < 0) {
        // insert data at index i
        inputTokens = insert(inputTokens, i, inputToken.id);
        inputTokenBalances = insert(inputTokenBalances, i, amount);

        break;
      } else if (index == 0) {
        // update the data at index i
        if (isIncreasePoolAmount) {
          inputTokenBalances[i] = inputTokenBalances[i].plus(amount);
        } else {
          inputTokenBalances[i] = inputTokenBalances[i].minus(amount);
        }

        break;
      } else {
        if (i == inputTokens.length - 1) {
          // need to append data at end of array
          appendData = true;

          break;
        }
      }
    }
  }

  if (isIncreasePoolAmount && appendData) {
    // append data at end of array
    inputTokens.push(inputToken.id);
    inputTokenBalances.push(amount);
  }

  pool.inputTokens = inputTokens;
  pool.inputTokenBalances = inputTokenBalances;

  pool.save();
}

function handleCollectFees(block: ethereum.Block, feeUsd: BigInt): void {
  const totalFee = feeUsd.div(PRICE_PRECISION).toBigDecimal();
  updateTotalRevenueMetrics(block, totalFee);
  updateProtocolSideRevenueMetrics(
    block,
    totalFee.times(PROTOCOL_SIDE_REVENUE_PERCENT)
  );
  updateSupplySideRevenueMetrics(block);
}
