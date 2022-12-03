import { near, BigInt } from '@graphprotocol/graph-ts';
import { Position, PositionSnapshot, Account, Market } from '../../generated/schema';
import { BI_ZERO } from '../utils/const';
import { getOrCreateAccount } from './account';
import { getOrCreateMarket } from './market';

export function getOrCreatePosition(account: Account, market: Market, side: string, receipt: near.ReceiptWithOutcome): Position {
	const id = account.id.concat('-').concat(market.id).concat('-').concat(side).concat('-').concat((account.closedPositionCount + account.openPositionCount).toString());
	let r = Position.load(id);
	if (!r) {
		r = new Position(id);
		r.account = account.id;
		r.market = market.id;
		r.hashOpened = receipt.receipt.id.toBase58();
		r.hashClosed = null;
		r.blockNumberOpened = BigInt.fromU64(receipt.block.header.height);
		r.blockNumberClosed = null;
		r.timestampOpened = BigInt.fromU64(receipt.block.header.timestampNanosec/1000000);
		r.timestampClosed = null;
		r.side = side;
		r.isCollateral = true;
		r.balance = BI_ZERO;
		r.depositCount = 0;
		r.withdrawCount = 0;
		r.borrowCount = 0;
		r.repayCount = 0;
		r.liquidationCount = 0;
		r.save();

		account.openPositionCount += 1;
		account.positionCount += 1;
		
		market.openPositionCount += 1;
		market.positionCount += 1;
		if(side == 'LENDER'){
			market.lendingPositionCount += 1;
		} else {
			market.borrowingPositionCount += 1;
		}
	}
	return r;
}

export function getOrCreatePositionSnapshot(position: Position, receipt: near.ReceiptWithOutcome): PositionSnapshot {
	const id = position.id.concat('-').concat(position.timestampOpened.toString());
	let r = PositionSnapshot.load(id);
	if (!r) {
		r = new PositionSnapshot(id);
		r.position = position.id;
		r.timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec/1000000000) 
		r.blockNumber = BigInt.fromU64(receipt.block.header.height)
		r.nonce = BI_ZERO;
		r.logIndex = 0;
		r.hash = receipt.outcome.id.toBase58();
		r.balance = position.balance;
		r.save();
	}
	return r;
}