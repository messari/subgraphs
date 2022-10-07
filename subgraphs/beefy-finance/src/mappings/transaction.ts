import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Deposit, Vault, VaultFee, Withdraw } from "../../generated/schema";
import { BIGDECIMAL_ZERO, PROTOCOL_ID } from "../utils/constants";
import { getFees, getOrCreateVaultDailySnapshot } from "../utils/getters";
import { updateProtocolRevenue } from "./protocol";
import { updateVaultAndSnapshots } from "./vault";

export function createDeposit(
  event: ethereum.Event,
  accountAddress: string,
  assetAddress: string,
  amount: BigInt,
  amountUSD: BigDecimal,
  vaultId: string // this is the strategy address
): void {
  const deposit = new Deposit(
    event.transaction.hash.toHexString().concat(`-${event.transactionLogIndex}`)
  );

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.transaction.index.toI32();
  deposit.protocol = PROTOCOL_ID;
  deposit.to = vaultId;
  deposit.from = accountAddress;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.asset = assetAddress;
  deposit.amount = amount;
  deposit.amountUSD = amountUSD;
  deposit.vault = vaultId;

  deposit.save();
}

export function createWithdraw(
  event: ethereum.Event,
  accountAddress: string,
  assetAddress: string,
  amount: BigInt,
  amountUSD: BigDecimal,
  vaultId: string // this is the strategy address
): void {
  const withdraw = new Withdraw(
    event.transaction.hash.toHexString().concat(`-${event.transactionLogIndex}`)
  );

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.transaction.index.toI32();
  withdraw.protocol = PROTOCOL_ID;
  withdraw.to = accountAddress;
  withdraw.from = vaultId;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.asset = assetAddress;
  withdraw.amount = amount;
  withdraw.amountUSD = amountUSD;
  withdraw.vault = vaultId;

  withdraw.save();

  // calculate withdrawal fee if there is one
  const vault = Vault.load(vaultId);
  if (!vault) {
    log.warning("[createWithdraw] vault not found: {}", [vaultId]);
    return;
  }

  if (vault.fees.length == 2) {
    const withdrawalFee = VaultFee.load(vault.fees[1]); // withdraw fee always at index 1 (if exists)
    if (!withdrawalFee) {
      log.warning("[createWithdraw] withdrawalFee not found: {}", [
        vault.fees[1],
      ]);
      return;
    }
    const feeUSD = amountUSD.times(withdrawalFee.feePercentage);

    updateProtocolRevenue(feeUSD, BIGDECIMAL_ZERO, feeUSD, event);

    // update vault.dailyTotalRevenueUSD
    const vaultDailySnapshot = getOrCreateVaultDailySnapshot(vault.id, event);
    vaultDailySnapshot.dailyTotalRevenueUSD =
      vaultDailySnapshot.dailyTotalRevenueUSD.plus(feeUSD);
    vaultDailySnapshot.save();

    // udpate vault values and snapshots
    updateVaultAndSnapshots(vault, event);
  }
}
