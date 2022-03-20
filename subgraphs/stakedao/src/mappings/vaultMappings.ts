import * as constants from "../common/constants";
import {
  BigInt,
  Address,
  ethereum,
  log,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  Deposit as DepositTransaction,
  Withdraw as WithdrawTransaction,
  Vault,
} from "../../generated/schema";
import {
  Vault as VaultContract,
  DepositCall,
  WithdrawCall,
  EarnCall,
  HarvestCall,
} from "../../generated/templates/Vault/Vault";
import { getOrCreateToken, getTimestampInMillis } from "../common/utils";
import { normalizedUsdcPrice, usdcPrice } from "../price/usdcOracle";
import { updateUsageMetrics } from "../common/metrics";

export function handleDeposit(call: DepositCall): void {
  log.info("[Vault mappings] Handle deposit Tx Hash: {}", [
    call.transaction.hash.toHexString(),
  ]);

  let vault = Vault.load(call.to.toHexString());
  if (vault) {
    let depositAmount = call.inputs._amount;
    deposit(call, vault, depositAmount);
  }

  updateUsageMetrics(call.block.number, call.block.timestamp, call.from);
}

function deposit(call: ethereum.Call, vault: Vault, depositAmount: BigInt): void {
  let sharesMinted = calculateSharesMinted(
    Address.fromString(vault.id),
    depositAmount
  );

  const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]));
  const amountUSD = normalizedUsdcPrice(usdcPrice(token, depositAmount));
  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(amountUSD);

  const vaultContract = VaultContract.bind(call.to);
  vault.totalValueLockedUSD = normalizedUsdcPrice(
    usdcPrice(token, vaultContract.balance())
  );

  vault.inputTokenBalances = [
    vault.inputTokenBalances[0].plus(depositAmount.toBigDecimal()),
  ];
  vault.outputTokenSupply = vault.outputTokenSupply.plus(
    sharesMinted.toBigDecimal()
  );
  vault.save();

  getOrCreateDepositTransaction(call, depositAmount.toBigDecimal(), amountUSD);
}

export function getOrCreateDepositTransaction(
  call: ethereum.Call,
  amount: BigDecimal,
  amountUSD: BigDecimal
): DepositTransaction {
  log.debug(
    "[Transaction] Get or create deposit transaction hash {} from deposit() to {}",
    [call.transaction.hash.toHexString(), call.to.toHexString()]
  );

  let id = "deposit-" + call.transaction.hash.toHexString();

  let transaction = DepositTransaction.load(id);
  if (transaction == null) {
    transaction = new DepositTransaction(id);
    transaction.logIndex = call.transaction.index.toI32();
    transaction.to = call.to.toHexString();
    transaction.from = call.transaction.from.toHexString();
    transaction.hash = call.transaction.hash.toHexString();

    transaction.timestamp = getTimestampInMillis(call.block);
    transaction.blockNumber = call.block.number;
    transaction.protocol = constants.ETHEREUM_PROTOCOL_ID;
    transaction.vault = call.to.toHexString();

    const vault = Vault.load(call.to.toHexString());
    if (vault) {
      transaction.asset = vault.inputTokens[0];
    }
    transaction.amount = amount;
    transaction.amountUSD = amountUSD;
    transaction.save();
  }

  return transaction;
}

function calculateSharesMinted(vaultAddress: Address, amountDeposited: BigInt): BigInt {
  let vaultContract = VaultContract.bind(vaultAddress);
  let balance = vaultContract.balance();
  let totalSupply = vaultContract.totalSupply();
  let shares = totalSupply.isZero()
    ? amountDeposited
    : amountDeposited.times(totalSupply).div(balance);

  log.info(
    "[Vault] Indirectly calculating token qty minted. amountDeposited: {} - balance {} - totalSupply {} - calc sharesMinted: {}",
    [
      amountDeposited.toString(),
      balance.toString(),
      totalSupply.toString(),
      shares.toString(),
    ]
  );

  return shares;
}

export function handleWithdraw(call: WithdrawCall): void {
  log.info("[Vault Mappings] Handle withdraw. TX hash: {}", [
    call.transaction.hash.toHexString(),
  ]);

  let vault = Vault.load(call.to.toHexString());
  if (vault) {
    let vaultContract = VaultContract.bind(call.to);
    let sharesBurnt = call.inputs._shares;
    let withdrawAmount = vaultContract
      .balance()
      .times(sharesBurnt)
      .div(vaultContract.totalSupply());

    withdraw(call, vault, withdrawAmount, sharesBurnt)
  }
  updateUsageMetrics(call.block.number, call.block.timestamp, call.from)
}

function withdraw(
  call: ethereum.Call,
  vault: Vault,
  withdrawAmount: BigInt,
  sharesBurnt: BigInt
): void {
  const token = getOrCreateToken(Address.fromString(vault.inputTokens[0]));
  let amountUSD = normalizedUsdcPrice(usdcPrice(token, withdrawAmount));

  const vaultContract = VaultContract.bind(call.to);
  vault.totalValueLockedUSD = normalizedUsdcPrice(
    usdcPrice(token, vaultContract.balance())
  );

  vault.outputTokenSupply = vault.outputTokenSupply.minus(
    sharesBurnt.toBigDecimal()
  );
  vault.inputTokenBalances = [
    vault.inputTokenBalances[0].minus(withdrawAmount.toBigDecimal()),
  ];
  vault.save();

  getOrCreateWithdrawTransactionFromCall(
    call,
    withdrawAmount.toBigDecimal(),
    amountUSD,
  );
}

export function getOrCreateWithdrawTransactionFromCall(
  call: ethereum.Call,
  amount: BigDecimal,
  amountUSD: BigDecimal,
): WithdrawTransaction {
  log.debug(
    "[Transaction] Get or create withdraw transaction hash {} from withdraw(), to {}",
    [call.transaction.hash.toHexString(), call.to.toHexString()]
  );

  let tx = call.transaction;
  let id = "withdraw-" + tx.hash.toHexString();
  let transaction = WithdrawTransaction.load(id);
  if (transaction == null) {
    transaction = new WithdrawTransaction(id);
    transaction.logIndex = tx.index.toI32();
    transaction.to = call.to.toHexString();
    transaction.from = tx.from.toHexString();
    transaction.hash = tx.hash.toHexString();
    transaction.timestamp = getTimestampInMillis(call.block);
    transaction.blockNumber = call.block.number;
    transaction.protocol = constants.ETHEREUM_PROTOCOL_ID;
    transaction.vault = call.to.toHexString();

    const vault = Vault.load(call.to.toHexString());
    if (vault) {
      transaction.asset = vault.inputTokens[0];
    }
    transaction.amount = amount;
    transaction.amountUSD = amountUSD;
    transaction.save();
  }
  return transaction;
}


export function handleEarn(call: EarnCall): void {}
export function handleHarvest(call: HarvestCall): void {}
