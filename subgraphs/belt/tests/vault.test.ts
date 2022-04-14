import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { assert, clearStore, test } from "matchstick-as";
import { handleDeposit, handleWithdraw } from "../src/handlers/vault";
import { getDay } from "../src/utils/numbers";
import * as c from "./constants";
import { mockChainlinkPriceFunction } from "./mocks/chainlink";
import { mockStrategyFunctions } from "./mocks/strategy";
import { mockERC20Functions } from "./mocks/token";
import {
  createDepositEvent,
  createWithdrawEvent,
  mockVaultFeeFunction,
  mockVaultInputBalance,
  mockVaultSharePrice,
  mockVaultSupply,
} from "./mocks/vault";

let decimals = BigInt.fromString("10").pow(18);
let numerator = BigInt.fromString("100");
let denominator = BigInt.fromString("1000");
let inputTokenBalance = BigInt.fromString("620").times(decimals);
let outputTokenBalance = BigInt.fromString("620").times(decimals);
let price = BigInt.fromString("43500").times(decimals);
let ratio = BigInt.fromString("1").times(decimals);

mockERC20Functions(c.INPUT_TOKEN_ADDRESS, "BTC", "18");
mockERC20Functions(c.VAULT_ADDRESS, "beltBTC", "18");
mockStrategyFunctions(c.STRATEGY_ADDRESS_1, numerator, denominator); // 10% withdrawal fee
mockStrategyFunctions(c.STRATEGY_ADDRESS_2, numerator, denominator); // 10% withdrawal fee
mockVaultFeeFunction(c.VAULT_ADDRESS, numerator, denominator); // 10% entrance fee
mockVaultInputBalance(c.VAULT_ADDRESS, inputTokenBalance); // input token balance
mockVaultSupply(c.VAULT_ADDRESS, outputTokenBalance); // output token balances
mockChainlinkPriceFunction(c.CHAINLINK, c.INPUT_TOKEN_ADDRESS, price); // setting to 43.5K
mockVaultSharePrice(c.VAULT_ADDRESS, ratio); /// setting ratio t0 1

test("vault deposit event", () => {
  clearStore();

  let depositAmount = BigInt.fromString("1000").times(decimals);
  let sharesMinted = BigInt.fromString("100").times(decimals);

  let depositEvent = createDepositEvent(
    c.VAULT_ADDRESS,
    c.STRATEGY_ADDRESS_1,
    c.INPUT_TOKEN_ADDRESS,
    depositAmount,
    sharesMinted,
  );

  handleDeposit(depositEvent);

  // vaildating vault
  assert.fieldEquals("Vault", c.VAULT_ADDRESS, "id", c.VAULT_ADDRESS);
  assert.fieldEquals("Vault", c.VAULT_ADDRESS, "name", "beltBTC");
  assert.fieldEquals("Vault", c.VAULT_ADDRESS, "symbol", "beltBTC");
  assert.fieldEquals("Vault", c.VAULT_ADDRESS, "protocol", c.PROTOCOL_ID);
  assert.fieldEquals("Vault", c.VAULT_ADDRESS, "inputTokens", `[${c.INPUT_TOKEN_ADDRESS}]`);
  assert.fieldEquals("Vault", c.VAULT_ADDRESS, "outputToken", c.VAULT_ADDRESS);
  assert.fieldEquals(
    "Vault",
    c.VAULT_ADDRESS,
    "totalValueLockedUSD",
    price
      .toBigDecimal()
      .div(decimals.toBigDecimal())
      .times(inputTokenBalance.toBigDecimal().div(decimals.toBigDecimal()))
      .toString(),
  );
  assert.fieldEquals(
    "Vault",
    c.VAULT_ADDRESS,
    "totalVolumeUSD",
    price
      .toBigDecimal()
      .div(decimals.toBigDecimal())
      .times(depositAmount.toBigDecimal().div(decimals.toBigDecimal()))
      .toString(),
  );
  assert.fieldEquals("Vault", c.VAULT_ADDRESS, "inputTokenBalances", `[${inputTokenBalance}]`);
  assert.fieldEquals("Vault", c.VAULT_ADDRESS, "outputTokenSupply", outputTokenBalance.toString());
  assert.fieldEquals(
    "Vault",
    c.VAULT_ADDRESS,
    "outputTokenPriceUSD",
    price
      .toBigDecimal()
      .div(decimals.toBigDecimal())
      .toString(),
  );

  let withdrawFeeId = "withdrawal-fee-"
    .concat(c.STRATEGY_ADDRESS_1)
    .concat("-")
    .concat(c.VAULT_ADDRESS);

  let depositFeeId = "deposit-fee-"
    .concat(c.STRATEGY_ADDRESS_1)
    .concat("-")
    .concat(c.VAULT_ADDRESS);

  assert.fieldEquals("Vault", c.VAULT_ADDRESS, "fees", `[${withdrawFeeId}, ${depositFeeId}]`);

  // validating vault fees
  assert.fieldEquals("VaultFee", withdrawFeeId, "feePercentage", "10");
  assert.fieldEquals("VaultFee", depositFeeId, "feePercentage", "10");

  // validating deposit
  let depositId = "deposit-"
    .concat(depositEvent.transaction.hash.toHex())
    .concat("-")
    .concat(depositEvent.transaction.index.toHex());

  assert.fieldEquals("Deposit", depositId, "to", c.VAULT_ADDRESS);
  assert.fieldEquals("Deposit", depositId, "from", depositEvent.transaction.from.toHex().toLowerCase());
  assert.fieldEquals("Deposit", depositId, "asset", c.INPUT_TOKEN_ADDRESS);
  assert.fieldEquals("Deposit", depositId, "amount", depositAmount.toString());
  assert.fieldEquals(
    "Deposit",
    depositId,
    "amountUSD",
    price
      .toBigDecimal()
      .div(decimals.toBigDecimal())
      .times(depositAmount.toBigDecimal().div(decimals.toBigDecimal()))
      .toString(),
  );
  assert.fieldEquals("Deposit", depositId, "vault", c.VAULT_ADDRESS);

  // validating protocol
  assert.fieldEquals(
    "YieldAggregator",
    c.PROTOCOL_ID,
    "totalValueLockedUSD",
    price
      .toBigDecimal()
      .div(decimals.toBigDecimal())
      .times(inputTokenBalance.toBigDecimal().div(decimals.toBigDecimal()))
      .toString(),
  );
});

test("vault withdraw event", () => {
  clearStore();

  let depositAmount = BigInt.fromString("1000").times(decimals);
  let sharesMinted = BigInt.fromString("100").times(decimals);

  let withdrawAmount = BigInt.fromString("1000").times(decimals);
  let sharesBurned = BigInt.fromString("100").times(decimals);

  let depositEvent = createDepositEvent(
    c.VAULT_ADDRESS,
    c.STRATEGY_ADDRESS_1,
    c.INPUT_TOKEN_ADDRESS,
    depositAmount,
    sharesMinted,
  );

  handleDeposit(depositEvent);

  // after deposit increase
  assert.fieldEquals(
    "YieldAggregator",
    c.PROTOCOL_ID,
    "totalValueLockedUSD",
    price
      .toBigDecimal()
      .div(decimals.toBigDecimal())
      .times(inputTokenBalance.toBigDecimal().div(decimals.toBigDecimal()))
      .toString(),
  );

  let withdrawalEvent = createWithdrawEvent(
    c.VAULT_ADDRESS,
    c.STRATEGY_ADDRESS_1,
    c.INPUT_TOKEN_ADDRESS,
    withdrawAmount,
    sharesBurned,
  );

  handleWithdraw(withdrawalEvent);

  // validating deposit
  let withdrawId = "withdraw-"
    .concat(withdrawalEvent.transaction.hash.toHex())
    .concat("-")
    .concat(withdrawalEvent.transaction.index.toHex());

  assert.fieldEquals("Withdraw", withdrawId, "to", c.VAULT_ADDRESS);
  assert.fieldEquals("Withdraw", withdrawId, "from", withdrawalEvent.transaction.from.toHex().toLowerCase());
  assert.fieldEquals("Withdraw", withdrawId, "asset", c.INPUT_TOKEN_ADDRESS);
  assert.fieldEquals("Withdraw", withdrawId, "amount", withdrawAmount.toString());
  assert.fieldEquals(
    "Withdraw",
    withdrawId,
    "amountUSD",
    withdrawAmount
      .toBigDecimal()
      .div(decimals.toBigDecimal())
      .times(price.toBigDecimal().div(decimals.toBigDecimal()))
      .toString(),
  );
  assert.fieldEquals("Withdraw", withdrawId, "vault", c.VAULT_ADDRESS);
});

test("fees entity", () => {
  clearStore();

  let depositAmount = BigInt.fromString("1000").times(decimals);
  let sharesMinted = BigInt.fromString("100").times(decimals);

  handleDeposit(
    createDepositEvent(c.VAULT_ADDRESS, c.STRATEGY_ADDRESS_1, c.INPUT_TOKEN_ADDRESS, depositAmount, sharesMinted),
  );

  handleDeposit(
    createDepositEvent(c.VAULT_ADDRESS, c.STRATEGY_ADDRESS_2, c.INPUT_TOKEN_ADDRESS, depositAmount, sharesMinted),
  );

  let withdrawFeeId = "withdrawal-fee-"
    .concat(c.STRATEGY_ADDRESS_1)
    .concat("-")
    .concat(c.VAULT_ADDRESS);

  let withdrawFeeId2 = "withdrawal-fee-"
    .concat(c.STRATEGY_ADDRESS_2)
    .concat("-")
    .concat(c.VAULT_ADDRESS);

  let depositFeeId = "deposit-fee-"
    .concat(c.STRATEGY_ADDRESS_1)
    .concat("-")
    .concat(c.VAULT_ADDRESS);

  let depositFeeId2 = "deposit-fee-"
    .concat(c.STRATEGY_ADDRESS_2)
    .concat("-")
    .concat(c.VAULT_ADDRESS);

  assert.fieldEquals(
    "Vault",
    c.VAULT_ADDRESS,
    "fees",
    `[${withdrawFeeId}, ${depositFeeId}, ${withdrawFeeId2}, ${depositFeeId2}]`,
  );
  assert.fieldEquals("VaultFee", withdrawFeeId, "feePercentage", "10");

  mockStrategyFunctions(c.STRATEGY_ADDRESS_1, BigInt.fromString("5"), BigInt.fromString("100")); // 5% withdrawal fee

  handleDeposit(
    createDepositEvent(c.VAULT_ADDRESS, c.STRATEGY_ADDRESS_1, c.INPUT_TOKEN_ADDRESS, depositAmount, sharesMinted),
  );

  assert.fieldEquals("VaultFee", withdrawFeeId, "feePercentage", "5");
});

test("financial metrics", () => {
  clearStore();

  mockStrategyFunctions(c.STRATEGY_ADDRESS_1, numerator, denominator); // 10% withdrawal fee
  mockStrategyFunctions(c.STRATEGY_ADDRESS_2, numerator, denominator); // 10% withdrawal fee

  let withdrawAmount = BigInt.fromString("1000").times(decimals);
  let sharesMinted = BigInt.fromString("100").times(decimals);

  let withdrawEvent = createWithdrawEvent(
    c.VAULT_ADDRESS,
    c.STRATEGY_ADDRESS_1,
    c.INPUT_TOKEN_ADDRESS,
    withdrawAmount,
    sharesMinted,
  );

  handleWithdraw(withdrawEvent);

  let day = getDay(withdrawEvent.block.timestamp).toString();
  let amountUSD = withdrawAmount
    .toBigDecimal()
    .div(decimals.toBigDecimal())
    .times(price.toBigDecimal().div(decimals.toBigDecimal()));

  // 10% of the amount
  let totalRevenueUSD = numerator
    .toBigDecimal()
    .div(denominator.toBigDecimal())
    .times(amountUSD);

  // for deposit and withdraw
  let protocolSideRevenueUSD = totalRevenueUSD;
  let supplySideRevenueUSD = amountUSD.minus(BigDecimal.fromString("2").times(totalRevenueUSD));

  assert.fieldEquals("FinancialsDailySnapshot", day, "protocolSideRevenueUSD", protocolSideRevenueUSD.toString());
  assert.fieldEquals("FinancialsDailySnapshot", day, "totalRevenueUSD", protocolSideRevenueUSD.toString());
  assert.fieldEquals("FinancialsDailySnapshot", day, "supplySideRevenueUSD", supplySideRevenueUSD.toString());
});
