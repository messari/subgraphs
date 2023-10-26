import {
  AddressSet as AddressSetEvent,
  AddressSetAsProxy as AddressSetAsProxyEvent,
  IsleGlobalsUpdated as IsleGlobalsUpdatedEvent,
  LoanManagerUpdated as LoanManagerUpdatedEvent,
  MarketIdSet as MarketIdSetEvent,
  PoolConfiguratorUpdated as PoolConfiguratorUpdatedEvent,
  ProxyCreated as ProxyCreatedEvent,
  WithdrawalManagerUpdated as WithdrawalManagerUpdatedEvent,
} from "../../../generated/PoolAddressesProvider/PoolAddressesProvider";
import {
  AddressSet,
  AddressSetAsProxy,
  IsleGlobalsUpdated,
  LoanManagerUpdated,
  MarketIdSet,
  PoolConfiguratorUpdated,
  ProxyCreated,
  WithdrawalManagerUpdated,
} from "../../../generated/schema";

export function handleAddressSet(event: AddressSetEvent): void {
  let entity = new AddressSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.PoolAddressesProvider_id = event.params.id;
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleAddressSetAsProxy(event: AddressSetAsProxyEvent): void {
  let entity = new AddressSetAsProxy(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.PoolAddressesProvider_id = event.params.id;
  entity.proxyAddress = event.params.proxyAddress;
  entity.oldImplementationAddress = event.params.oldImplementationAddress;
  entity.newImplementationAddress = event.params.newImplementationAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleIsleGlobalsUpdated(event: IsleGlobalsUpdatedEvent): void {
  let entity = new IsleGlobalsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleLoanManagerUpdated(event: LoanManagerUpdatedEvent): void {
  let entity = new LoanManagerUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMarketIdSet(event: MarketIdSetEvent): void {
  let entity = new MarketIdSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldMarketId = event.params.oldMarketId;
  entity.newMarketId = event.params.newMarketId;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePoolConfiguratorUpdated(
  event: PoolConfiguratorUpdatedEvent
): void {
  let entity = new PoolConfiguratorUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleProxyCreated(event: ProxyCreatedEvent): void {
  let entity = new ProxyCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.PoolAddressesProvider_id = event.params.id;
  entity.proxyAddress = event.params.proxyAddress;
  entity.implementationAddress = event.params.implementationAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleWithdrawalManagerUpdated(
  event: WithdrawalManagerUpdatedEvent
): void {
  let entity = new WithdrawalManagerUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
