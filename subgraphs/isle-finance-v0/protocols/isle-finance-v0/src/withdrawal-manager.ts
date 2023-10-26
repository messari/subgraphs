import {
  ConfigurationUpdated as ConfigurationUpdatedEvent,
  Initialized as InitializedEvent,
  WithdrawalCancelled as WithdrawalCancelledEvent,
  WithdrawalProcessed as WithdrawalProcessedEvent,
  WithdrawalUpdated as WithdrawalUpdatedEvent,
} from "../../../generated/WithdrawalManager/WithdrawalManager";
import {
  ConfigurationUpdated,
  Initialized,
  WithdrawalCancelled,
  WithdrawalProcessed,
  WithdrawalUpdated,
} from "../../../generated/schema";

export function handleConfigurationUpdated(
  event: ConfigurationUpdatedEvent
): void {
  let entity = new ConfigurationUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.configId_ = event.params.configId_;
  entity.initialCycleId_ = event.params.initialCycleId_;
  entity.initialCycleTime_ = event.params.initialCycleTime_;
  entity.cycleDuration_ = event.params.cycleDuration_;
  entity.windowDuration_ = event.params.windowDuration_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.poolAddressesProvider_ = event.params.poolAddressesProvider_;
  entity.cycleDuration_ = event.params.cycleDuration_;
  entity.windowDuration_ = event.params.windowDuration_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleWithdrawalCancelled(
  event: WithdrawalCancelledEvent
): void {
  let entity = new WithdrawalCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.account_ = event.params.account_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleWithdrawalProcessed(
  event: WithdrawalProcessedEvent
): void {
  let entity = new WithdrawalProcessed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.account_ = event.params.account_;
  entity.sharesToRedeem_ = event.params.sharesToRedeem_;
  entity.assetsToWithdraw_ = event.params.assetsToWithdraw_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleWithdrawalUpdated(event: WithdrawalUpdatedEvent): void {
  let entity = new WithdrawalUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.account_ = event.params.account_;
  entity.lockedShares_ = event.params.lockedShares_;
  entity.windowStart_ = event.params.windowStart_;
  entity.windowEnd_ = event.params.windowEnd_;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
