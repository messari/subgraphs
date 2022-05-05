// map blockchain data to entities outlined in schema.graphql
import { TransactionType, YIELD_TOKEN_MAPPING, YIELD_VAULT_ADDRESS, ZERO_ADDRESS } from "../common/utils/constants";
import { Deposit, Withdrawal } from "../../generated/RariYieldFundManager/RariYieldFundManager";
import { createDeposit, createWithdraw } from "./helpers";
import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultDailyMetrics,
  updateVaultHourlyMetrics,
} from "../common/metrics";

export function handleYieldDeposit(event: Deposit): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (YIELD_TOKEN_MAPPING.has(code)) {
    assetAddress = YIELD_TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  createDeposit(
    event,
    event.params.amount,
    event.params.amountUsd,
    event.params.rftMinted,
    assetAddress,
    YIELD_VAULT_ADDRESS,
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updateFinancials(event);
  updateVaultDailyMetrics(event, YIELD_VAULT_ADDRESS);
  updateVaultHourlyMetrics(event, YIELD_VAULT_ADDRESS);
}

export function handleYieldWithdrawal(event: Withdrawal): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (YIELD_TOKEN_MAPPING.has(code)) {
    assetAddress = YIELD_TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  createWithdraw(
    event,
    event.params.amount,
    event.params.amountUsd,
    event.params.amountTransferred,
    event.params.rftBurned,
    assetAddress,
    YIELD_VAULT_ADDRESS,
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updateFinancials(event);
  updateVaultDailyMetrics(event, YIELD_VAULT_ADDRESS);
  updateVaultHourlyMetrics(event, YIELD_VAULT_ADDRESS);
}
