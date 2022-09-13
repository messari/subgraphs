// map blockchain data to entities outlined in schema.graphql
import {
  BIGINT_ZERO,
  DAI_VAULT_ADDRESS,
  DEFAULT_DECIMALS,
  ETHER_VAULT_ADDRESS,
  ETH_ADDRESS,
  TOKEN_MAPPING,
  TransactionType,
  USDC_VAULT_ADDRESS,
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
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { getUsdPrice } from "../prices";
import { exponentToBigDecimal } from "../common/utils/utils";

////////////////////////////
//// USDC Pool Handlers ////
////////////////////////////

export function handleUSDCDeposit(event: USDCDeposit): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (TOKEN_MAPPING.has(code)) {
    assetAddress = TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  // create withdraw
  createDeposit(event, event.params.amount, assetAddress, USDC_VAULT_ADDRESS);
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updateFinancials(event);

  let vaultId = USDC_VAULT_ADDRESS + "-" + assetAddress;
  updateVaultDailyMetrics(event, vaultId);
  updateVaultHourlyMetrics(event, vaultId);
}

export function handleUSDCWithdrawal(event: USDCWithdrawal): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (TOKEN_MAPPING.has(code)) {
    assetAddress = TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  // create withdraw
  let feeAmount = BigInt.fromString(
    event.params.amount
      .toBigDecimal()
      .times(
        event.params.withdrawalFeeRate
          .toBigDecimal()
          .div(exponentToBigDecimal(DEFAULT_DECIMALS))
      )
      .truncate(0)
      .toString()
  );
  createWithdraw(
    event,
    event.params.amount,
    feeAmount,
    assetAddress,
    USDC_VAULT_ADDRESS
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updateFinancials(event);

  let vaultId = USDC_VAULT_ADDRESS + "-" + assetAddress;
  updateVaultDailyMetrics(event, vaultId);
  updateVaultHourlyMetrics(event, vaultId);
}

/////////////////////////////
//// Yield Pool Handlers ////
/////////////////////////////

export function handleYieldDeposit(event: YieldDeposit): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (TOKEN_MAPPING.has(code)) {
    assetAddress = TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  createDeposit(event, event.params.amount, assetAddress, YIELD_VAULT_ADDRESS);
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updateFinancials(event);

  let vaultId = YIELD_VAULT_ADDRESS + "-" + assetAddress;
  updateVaultDailyMetrics(event, vaultId);
  updateVaultHourlyMetrics(event, vaultId);
}

export function handleYieldWithdrawal(event: YieldWithdrawal): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (TOKEN_MAPPING.has(code)) {
    assetAddress = TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  createWithdraw(
    event,
    event.params.amount,
    event.params.amount.minus(event.params.amountTransferred),
    assetAddress,
    YIELD_VAULT_ADDRESS
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updateFinancials(event);

  let vaultId = YIELD_VAULT_ADDRESS + "-" + assetAddress;
  updateVaultDailyMetrics(event, vaultId);
  updateVaultHourlyMetrics(event, vaultId);
}

///////////////////////////
//// DAI Pool Handlers ////
///////////////////////////

export function handleDAIDeposit(event: DAIDeposit): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (TOKEN_MAPPING.has(code)) {
    assetAddress = TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  createDeposit(event, event.params.amount, assetAddress, DAI_VAULT_ADDRESS);
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updateFinancials(event);

  let vaultId = DAI_VAULT_ADDRESS + "-" + assetAddress;
  updateVaultDailyMetrics(event, vaultId);
  updateVaultHourlyMetrics(event, vaultId);
}

export function handleDAIWithdrawal(event: DAIWithdrawal): void {
  // get address of asset
  let code = event.params.currencyCode.toHexString();
  let assetAddress: string;
  if (TOKEN_MAPPING.has(code)) {
    assetAddress = TOKEN_MAPPING.get(code);
  } else {
    assetAddress = ZERO_ADDRESS;
  }

  let feeAmount = BigInt.fromString(
    event.params.amount
      .toBigDecimal()
      .times(
        event.params.withdrawalFeeRate
          .toBigDecimal()
          .div(exponentToBigDecimal(DEFAULT_DECIMALS))
      )
      .truncate(0)
      .toString()
  );
  createWithdraw(
    event,
    event.params.amount,
    feeAmount,
    assetAddress,
    DAI_VAULT_ADDRESS
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updateFinancials(event);

  let vaultId = DAI_VAULT_ADDRESS + "-" + assetAddress;
  updateVaultDailyMetrics(event, vaultId);
  updateVaultHourlyMetrics(event, vaultId);
}

/////////////////////////////
//// Ether Pool Handlers ////
/////////////////////////////

export function handleEtherDeposit(event: EtherDeposit): void {
  createDeposit(
    event,
    event.params.amount,
    ETH_ADDRESS, // only token in this pool
    ETHER_VAULT_ADDRESS
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updateFinancials(event);

  let vaultId = ETHER_VAULT_ADDRESS + "-" + ETH_ADDRESS;
  updateVaultDailyMetrics(event, vaultId);
  updateVaultHourlyMetrics(event, vaultId);
}

export function handleEtherWithdrawal(event: EtherWithdrawal): void {
  createWithdraw(
    event,
    event.params.amount,
    BIGINT_ZERO,
    ETH_ADDRESS,
    ETHER_VAULT_ADDRESS
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updateFinancials(event);

  let vaultId = ETHER_VAULT_ADDRESS + "-" + ETH_ADDRESS;
  updateVaultDailyMetrics(event, vaultId);
  updateVaultHourlyMetrics(event, vaultId);
}
