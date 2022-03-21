import { BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Deposit } from '../../generated/schema';

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
  deposit.logIndex = logIndex.toI64();
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
