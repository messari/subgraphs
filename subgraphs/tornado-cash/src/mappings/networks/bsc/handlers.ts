import { createDeposit, createWithdrawal } from "./helpers";
import {
  updateFinancials,
  updatePoolMetrics,
  updateUsageMetrics,
} from "../../../common/metrics";

import {
  Deposit,
  Withdrawal,
} from "../../../../generated/TornadoCash01/TornadoCashETH";

export function handleDeposit(event: Deposit): void {
  createDeposit(event.address.toHexString(), event);

  updatePoolMetrics(event.address.toHexString(), event);
  updateUsageMetrics(event);
  updateFinancials(event);
}

export function handleWithdrawal(event: Withdrawal): void {
  createWithdrawal(event.address.toHexString(), event);

  updatePoolMetrics(event.address.toHexString(), event);
  updateUsageMetrics(event);
  updateFinancials(event);
}
