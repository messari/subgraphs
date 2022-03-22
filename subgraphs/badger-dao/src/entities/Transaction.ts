import { BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Deposit, Withdraw } from '../../generated/schema';

export function getOrCreateDeposit(hash: Bytes, logIndex: BigInt): Deposit {
  const id: string = hash
    .toHex()
    .concat('-')
    .concat(logIndex.toHex());

  let deposit = Deposit.load(id);

  if (deposit) {
    return deposit;
  }

  deposit = new Deposit(id);

  deposit.hash = hash.toHex();
  deposit.logIndex = logIndex.toI32();
  deposit.protocol = '';
  deposit.to = '';
  deposit.from = '';
  deposit.blockNumber = BigInt.zero();
  deposit.timestamp = BigInt.zero();
  deposit.market = '';
  deposit.asset = '';
  deposit.amount = BigDecimal.zero();
  deposit.amountUSD = BigDecimal.zero();
  deposit.save();

  return deposit;
}

export function getOrCreateWithdraw(hash: Bytes, logIndex: BigInt): Withdraw {
  const id: string = hash
    .toHex()
    .concat('-')
    .concat(logIndex.toHex());

  let withdraw = Withdraw.load(id);

  if (withdraw) {
    return withdraw;
  }

  withdraw = new Withdraw(id);

  withdraw.hash = hash.toHex();
  withdraw.logIndex = logIndex.toI32();
  withdraw.protocol = '';
  withdraw.to = '';
  withdraw.from = '';
  withdraw.blockNumber = BigInt.zero();
  withdraw.timestamp = BigInt.zero();
  withdraw.market = '';
  withdraw.asset = '';
  withdraw.amount = BigDecimal.zero();
  withdraw.amountUSD = BigDecimal.zero();
  withdraw.save();

  return withdraw;
}
