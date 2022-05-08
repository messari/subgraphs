// map blockchain data to entities outlined in schema.graphql
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  DAI_VAULT_ADDRESS,
  ETHER_VAULT_ADDRESS,
  ETH_ADDRESS,
  TransactionType,
  USDC_VAULT_ADDRESS,
  YIELD_TOKEN_MAPPING,
  YIELD_VAULT_ADDRESS,
  ZERO_ADDRESS,
} from "../common/utils/constants";
import {
  Deposit as YieldDeposit,
  Withdrawal as YieldWithdrawal,
} from "../../generated/RariYieldFundManager/RariYieldFundManager";
import {
  Deposit as USDCDeposit,
  Withdrawal as USDCWithdrawal,
} from "../../generated/RariUSDCFundManager/RariStableFundManager";
import {
  Deposit as DAIDeposit,
  Withdrawal as DAIWithdrawal,
} from "../../generated/RariDAIFundManager/RariStableFundManager";
import {
  Deposit as EtherDeposit,
  Withdrawal as EtherWithdrawal,
} from "../../generated/RariEtherFundManager/RariEtherFundManager";
import { createDeposit, createWithdraw } from "./helpers";
import {
  updateFinancials,
  updateUsageMetrics,
  updateVaultDailyMetrics,
  updateVaultHourlyMetrics,
} from "../common/metrics";
import { log } from "@graphprotocol/graph-ts";

////////////////////////////
//// USDC Pool Handlers ////
////////////////////////////

export function handleUSDCDeposit(event: USDCDeposit): void {
  log.warning("USDC Deposit {}", [event.transaction.hash.toHexString()]);
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (YIELD_TOKEN_MAPPING.has(code)) {
    assetAddress = YIELD_TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  // create withdraw
  createDeposit(
    event,
    event.params.amount,
    event.params.amountUsd,
    event.params.rftMinted,
    assetAddress,
    USDC_VAULT_ADDRESS,
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updateFinancials(event);
  updateVaultDailyMetrics(event, USDC_VAULT_ADDRESS);
  updateVaultHourlyMetrics(event, USDC_VAULT_ADDRESS);
}

export function handleUSDCWithdrawal(event: USDCWithdrawal): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (YIELD_TOKEN_MAPPING.has(code)) {
    assetAddress = YIELD_TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  // create withdraw
  createWithdraw(
    event,
    event.params.amount,
    event.params.amountUsd,
    BIGINT_ZERO,
    event.params.rftBurned,
    assetAddress,
    USDC_VAULT_ADDRESS,
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updateFinancials(event);
  updateVaultDailyMetrics(event, USDC_VAULT_ADDRESS);
  updateVaultHourlyMetrics(event, USDC_VAULT_ADDRESS);
}

/////////////////////////////
//// Yield Pool Handlers ////
/////////////////////////////

export function handleYieldDeposit(event: YieldDeposit): void {
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

export function handleYieldWithdrawal(event: YieldWithdrawal): void {
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

///////////////////////////
//// DAI Pool Handlers ////
///////////////////////////

export function handleDAIDeposit(event: DAIDeposit): void {
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
    DAI_VAULT_ADDRESS,
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updateFinancials(event);
  updateVaultDailyMetrics(event, DAI_VAULT_ADDRESS);
  updateVaultHourlyMetrics(event, DAI_VAULT_ADDRESS);
}

export function handleDAIWithdrawal(event: DAIWithdrawal): void {
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
    BIGINT_ZERO,
    event.params.rftBurned,
    assetAddress,
    DAI_VAULT_ADDRESS,
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updateFinancials(event);
  updateVaultDailyMetrics(event, DAI_VAULT_ADDRESS);
  updateVaultHourlyMetrics(event, DAI_VAULT_ADDRESS);
}

/////////////////////////////
//// Ether Pool Handlers ////
/////////////////////////////

export function handleEtherDeposit(event: EtherDeposit): void {
  // TODO: get ether price
  let ethPrice = BIGINT_ONE;

  createDeposit(
    event,
    event.params.amount,
    event.params.amount.times(ethPrice),
    event.params.reptMinted,
    ETH_ADDRESS, // only token in this pool
    ETHER_VAULT_ADDRESS,
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updateFinancials(event);
  updateVaultDailyMetrics(event, ETHER_VAULT_ADDRESS);
  updateVaultHourlyMetrics(event, ETHER_VAULT_ADDRESS);
}

export function handleEtherWithdrawal(event: EtherWithdrawal): void {
  // TODO: get eth price
  let ethPrice = BIGINT_ONE;

  createWithdraw(
    event,
    event.params.amount,
    event.params.amount.times(ethPrice),
    BIGINT_ZERO,
    event.params.reptBurned,
    ETH_ADDRESS,
    ETHER_VAULT_ADDRESS,
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updateFinancials(event);
  updateVaultDailyMetrics(event, ETHER_VAULT_ADDRESS);
  updateVaultHourlyMetrics(event, ETHER_VAULT_ADDRESS);
}
