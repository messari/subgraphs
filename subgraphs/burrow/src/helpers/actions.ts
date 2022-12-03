import { near, BigInt } from '@graphprotocol/graph-ts';
import {
	Deposit,
	Withdraw,
	Borrow,
	Repay,
	Liquidate,
} from '../../generated/schema';
import { BI_ZERO, BD_ZERO, ADDRESS_ZERO } from '../utils/const';
import { getOrCreateAccount } from './account';

export function getOrCreateDeposit(
	id: string,
	receipt: near.ReceiptWithOutcome
): Deposit {
	let d = Deposit.load(id);
	if (!d) {
		d = new Deposit(id);
		d.hash = receipt.outcome.id.toBase58();
		d.nonce = BI_ZERO;
		d.logIndex = 0 as i32;
		d.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
		d.timestamp = BigInt.fromString(
			receipt.block.header.timestampNanosec.toString()
		).div(BigInt.fromString('1000000000'));
		d.account = getOrCreateAccount(ADDRESS_ZERO).id;
		d.market = '';
		d.position = '';
		d.asset = '';
		d.amount = BI_ZERO;
		d.amountUSD = BD_ZERO;
		d.save();
	}
	return d;
}

export function getOrCreateWithdrawal(
	id: string,
	receipt: near.ReceiptWithOutcome
): Withdraw {
	let w = Withdraw.load(id);
	if (!w) {
		w = new Withdraw(id);
		w.hash = receipt.outcome.id.toBase58();
		w.nonce = BI_ZERO;
		w.logIndex = 0 as i32;
		w.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
		w.timestamp = BigInt.fromString(
			receipt.block.header.timestampNanosec.toString()
		).div(BigInt.fromString('1000000000'));
		w.account = getOrCreateAccount(ADDRESS_ZERO).id;
		w.market = '';
		w.position = '';
		w.asset = '';
		w.amount = BI_ZERO;
		w.amountUSD = BD_ZERO;
		w.save();
	}
	return w;
}

export function getOrCreateBorrow(
	id: string,
	receipt: near.ReceiptWithOutcome
): Borrow {
	let b = Borrow.load(id);
	if (!b) {
		b = new Borrow(id);
		b.hash = receipt.outcome.id.toBase58();
		b.nonce = BI_ZERO;
		b.logIndex = 0 as i32;
		b.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
		b.timestamp = BigInt.fromString(
			receipt.block.header.timestampNanosec.toString()
		).div(BigInt.fromString('1000000000'));
		b.account = getOrCreateAccount(ADDRESS_ZERO).id;
		b.market = '';
		b.position = '';
		b.asset = '';
		b.amount = BI_ZERO;
		b.amountUSD = BD_ZERO;
		b.save();
	}
	return b;
}

export function getOrCreateRepayment(
	id: string,
	receipt: near.ReceiptWithOutcome
): Repay {
	let r = Repay.load(id);
	if (!r) {
		r = new Repay(id);
		r.hash = receipt.outcome.id.toBase58();
		r.nonce = BI_ZERO;
		r.logIndex = 0 as i32;
		r.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
		r.timestamp = BigInt.fromString(
			receipt.block.header.timestampNanosec.toString()
		).div(BigInt.fromString('1000000000'));
		r.account = getOrCreateAccount(ADDRESS_ZERO).id;
		r.market = '';
		r.position = '';
		r.asset = '';
		r.amount = BI_ZERO;
		r.amountUSD = BD_ZERO;
		r.save();
	}
	return r;
}

export function getOrCreateLiquidation(
	id: string,
	receipt: near.ReceiptWithOutcome
): Liquidate {
	let r = Liquidate.load(id);
	if (!r) {
		r = new Liquidate(id);
		r.hash = receipt.outcome.id.toBase58();
		r.nonce = BI_ZERO;
		r.logIndex = 0 as i32;
		r.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
		r.timestamp = BigInt.fromString(
			receipt.block.header.timestampNanosec.toString()
		).div(BigInt.fromI32(1000));
		r.liquidatee = getOrCreateAccount(ADDRESS_ZERO).id;
		r.liquidator = getOrCreateAccount(ADDRESS_ZERO).id;
		r.market = '';
		r.position = '';
		r.asset = '';
		r.amount = BI_ZERO;
		r.amountUSD = BD_ZERO;
		r.profitUSD = BD_ZERO;
		r.save();
	}
	return r;
}
