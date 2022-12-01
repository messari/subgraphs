import {
	near,
	BigInt,
	JSONValue,
	TypedMap,
	log,
	BigDecimal,
	JSONValueKind,
	json,
} from '@graphprotocol/graph-ts';
import { getOrCreateAccount } from '../helpers/account';
import { updatePosition } from '../update/position';
import { getOrCreatePosition, getOrCreatePositionSnapshot } from '../helpers/position';

import { getOrCreateBorrow, getOrCreateDeposit, getOrCreateLiquidation, getOrCreateRepayment, getOrCreateWithdrawal,  } from '../helpers/actions';
import { getOrCreateMarket, getOrCreateMarketDailySnapshot, getOrCreateMarketHourlySnapshot } from '../helpers/market';
import { getOrCreateToken } from '../helpers/token';

import { updateMarket } from '../update/market';
import { amount_to_shares } from '../utils/shares';
import { updateProtocol } from '../update/protocol';
import { getOrCreateUsageMetricsDailySnapshot, getOrCreateUsageMetricsHourlySnapshot, getOrCreateFinancialDailySnapshot } from '../helpers/protocol';
import { parse0 } from '../utils/parser';

// ------------------------------------------------------------------
// ----------------------------- Events -----------------------------
// ------------------------------------------------------------------
// deposit_to_reserve     { account_id, amount, token_id }
// deposit                - same as above
// withdraw_started       - same as above
// withdraw_failed        - same as above
// withdraw_succeeded     - same as above
// increase_collateral    - same as above
// decrease_collateral    - same as above
// borrow                 - same as above
// repay                  - same as above
// liquidate              { account_id, liquidation_account_id, collateral_sum, repaid_sum }
// force_close            { liquidation_account_id, collateral_sum, repaid_sum }
// booster_stake          { account_id, booster_amount, duration, x_booster_amount, total_booster_amount, total_x_booster_amount }
// booster_unstake        { account_id, total_booster_amount, total_x_booster_amount }
// ------------------------------------------------------------------

export function handleDeposit(
	data: TypedMap<string, JSONValue>, 
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
	let deposit = getOrCreateDeposit(
		receipt.outcome.id
			.toBase58()
			.concat('-')
			.concat((logIndex as i32).toString()),
		receipt
	);
	deposit.logIndex = logIndex as i32;
	let parsedData = parse0(data);
	let account_id = parsedData[0];
	let amount = parsedData[1];
	let token_id = parsedData[2];
	
	let market = getOrCreateMarket(token_id);
	let dailySnapshot = getOrCreateMarketDailySnapshot(market, receipt);
	let hourlySnapshot = getOrCreateMarketHourlySnapshot(market, receipt);
	let usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(receipt);
	let usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(receipt);
	let financialDailySnapshot = getOrCreateFinancialDailySnapshot(receipt);
	let account = getOrCreateAccount(account_id);
	let position = getOrCreatePosition(account_id, token_id, "LENDER");
	let token = getOrCreateToken(token_id);

	deposit.account = account.id;
	deposit.amount = BigInt.fromString(amount);
	deposit.asset = token.id;
	deposit.market = market.id;
	deposit.position = position.id;

	deposit.amountUSD = deposit.amount
		.divDecimal(
			BigInt.fromI32(10)
				.pow((token.decimals + token.extraDecimals) as u8)
				.toBigDecimal()
		)
		.times(token.lastPriceUSD!);

		
	// usage metrics
	if(position._last_active_timestamp.lt(usageDailySnapshot.timestamp)){
		usageDailySnapshot.dailyActiveDepositors += 1;
	}
	if(account._last_active_timestamp.lt(usageDailySnapshot.timestamp)){
		usageDailySnapshot.dailyActiveUsers += 1;
		usageHourlySnapshot.hourlyActiveUsers += 1;
	}
	usageDailySnapshot.dailyDepositCount += 1;
	usageDailySnapshot.dailyTransactionCount += 1;
	usageHourlySnapshot.hourlyDepositCount += 1;
	usageHourlySnapshot.hourlyTransactionCount += 1;
		
	// update position
	if (position.balance.isZero()) {
		account.positionCount += 1;
		account.openPositionCount += 1;

		market.positionCount += 1;
		market.lendingPositionCount += 1;
		market.openPositionCount += 1;

		position.hashOpened = receipt.outcome.id.toBase58();
		position.timestampOpened = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000);
		position.blockNumberOpened = BigInt.fromU64(receipt.block.header.height);
	}
	position.depositCount += 1;
	position.balance = position.balance.plus(deposit.amount);
	position._last_active_timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000);
	
	// update account
	account.depositCount += 1;
	account._last_active_timestamp = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000);

	// deposit amount
	market.outputTokenSupply = market.outputTokenSupply.plus(amount_to_shares(deposit.amount, market.outputTokenSupply, market.inputTokenBalance));
	market.inputTokenBalance = market.inputTokenBalance.plus(deposit.amount);
	
	// historical
	market._totalDepositedHistory = market._totalDepositedHistory.plus(deposit.amount);

	// snapshot
	dailySnapshot.dailyDepositUSD = dailySnapshot.dailyDepositUSD.plus(deposit.amountUSD);
	hourlySnapshot.hourlyDepositUSD = hourlySnapshot.hourlyDepositUSD.plus(deposit.amountUSD);
	financialDailySnapshot.dailyDepositUSD = financialDailySnapshot.dailyDepositUSD.plus(deposit.amountUSD);

	let positionSnapshot = getOrCreatePositionSnapshot(position, receipt);
	positionSnapshot.logIndex = logIndex as i32;

	updateMarket(market, dailySnapshot, hourlySnapshot, financialDailySnapshot, receipt);
	updatePosition(position, market);

	positionSnapshot.save();
	financialDailySnapshot.save();
	usageDailySnapshot.save();
	usageHourlySnapshot.save();
	dailySnapshot.save();
	hourlySnapshot.save();
    market.save()
	account.save();
	deposit.save();
	position.save();

	updateProtocol();
}

export function handleDepositToReserve(
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
	let parsedData = parse0(data);
	let account_id = parsedData[0];
	let amount = parsedData[1];
	let token_id = parsedData[2];

	let market = getOrCreateMarket(token_id);

	market._totalReserved = market._totalReserved.plus(BigInt.fromString(amount));
	market._added_to_reserve = market._added_to_reserve.plus(BigInt.fromString(amount));

	market.save();
}

export function handleWithdraw(
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
	let withdraw = getOrCreateWithdrawal(
		receipt.outcome.id
			.toBase58()
			.concat('-')
			.concat((logIndex as i32).toString()),
		receipt
	);
	withdraw.logIndex = logIndex as i32;
	let account_id = data.get('account_id');
	if (!account_id) {
		log.info('{} data not found', ['account_id']);
		return;
	}
	let amount = data.get('amount');
	if (!amount) {
		log.info('{} data not found', ['amount']);
		return;
	}
	let token_id = data.get('token_id');
	if (!token_id) {
		log.info('{} data not found', ['token_id']);
		return;
	}

	let market = getOrCreateMarket(token_id.toString());
	let dailySnapshot = getOrCreateMarketDailySnapshot(market, receipt);
	let hourlySnapshot = getOrCreateMarketHourlySnapshot(market, receipt);
	let usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(receipt);
	let usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(receipt);
	let financialDailySnapshot = getOrCreateFinancialDailySnapshot(receipt);
	let account = getOrCreateAccount(account_id.toString());
	let position = getOrCreatePosition(
		account_id.toString(),
		token_id.toString(),
		"LENDER"
	);

	let token = getOrCreateToken(token_id.toString());
	withdraw.account = account.id;
	withdraw.amount = BigInt.fromString(amount.toString());
	withdraw.asset = token.id;
	withdraw.market = market.id;
	withdraw.position = position.id;

	withdraw.amountUSD = withdraw.amount
		.divDecimal(
			BigInt.fromI32(10)
				.pow((token.decimals + token.extraDecimals) as u8)
				.toBigDecimal()
		)
		.times(token.lastPriceUSD!);

	// usage metrics
	if(account._last_active_timestamp.lt(usageDailySnapshot.timestamp)){
		usageDailySnapshot.dailyActiveUsers += 1;
		usageHourlySnapshot.hourlyActiveUsers += 1;
	}
	usageDailySnapshot.dailyWithdrawCount += 1;
	usageDailySnapshot.dailyTransactionCount += 1;
	usageHourlySnapshot.hourlyWithdrawCount += 1;
	usageHourlySnapshot.hourlyTransactionCount += 1;

	// update position
	if(position.balance.lt(withdraw.amount)){
		market._added_to_reserve = market._added_to_reserve.minus(position.balance);
		market._totalReserved = market._totalReserved.minus(position.balance);
	} else {
		position.balance = position.balance.minus(withdraw.amount);
		position.withdrawCount += 1;
		// close if balance is zero
		if (position.balance.isZero()) {
			account.openPositionCount -= 1;
			account.closedPositionCount += 1;
	
			market.openPositionCount -= 1;
			market.closedPositionCount += 1;
			market.lendingPositionCount -= 1;
	
			position.hashClosed = receipt.outcome.id.toBase58();
			position.timestampClosed = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000);
			position.blockNumberClosed = BigInt.fromU64(receipt.block.header.height);
		}
	}

	account.withdrawCount = account.withdrawCount + 1;
	market._totalWithrawnHistory = market._totalWithrawnHistory.plus(withdraw.amount);

	market.outputTokenSupply = market.outputTokenSupply.minus(amount_to_shares(withdraw.amount, market.outputTokenSupply, market.inputTokenBalance));
	market.inputTokenBalance = market.inputTokenBalance.minus(withdraw.amount);

	// snapshot
	dailySnapshot.dailyWithdrawUSD = dailySnapshot.dailyWithdrawUSD.plus(withdraw.amountUSD);
	hourlySnapshot.hourlyWithdrawUSD = hourlySnapshot.hourlyWithdrawUSD.plus(withdraw.amountUSD);
	financialDailySnapshot.dailyWithdrawUSD = financialDailySnapshot.dailyWithdrawUSD.plus(withdraw.amountUSD);

	let positionSnapshot = getOrCreatePositionSnapshot(position, receipt);
	positionSnapshot.logIndex = logIndex as i32;

	updateMarket(market, dailySnapshot, hourlySnapshot, financialDailySnapshot, receipt);
	updatePosition(position, market);

	positionSnapshot.save();
	financialDailySnapshot.save();
	dailySnapshot.save();
	hourlySnapshot.save();
	usageDailySnapshot.save();
	usageHourlySnapshot.save();
    market.save()
	account.save();
	withdraw.save();
	position.save();

	updateProtocol();
}

export function handleBorrow(
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
	let borrow = getOrCreateBorrow(
		receipt.outcome.id
			.toBase58()
			.concat('-')
			.concat((logIndex as i32).toString()),
		receipt
	);
	borrow.logIndex = logIndex as i32;
	let account_id = data.get('account_id');
	if (!account_id) {
		log.info('{} data not found', ['account_id']);
		return;
	}
	let amount = data.get('amount');
	if (!amount) {
		log.info('{} data not found', ['amount']);
		return;
	}
	let token_id = data.get('token_id');
	if (!token_id) {
		log.info('{} data not found', ['token_id']);
		return;
	}

	let market = getOrCreateMarket(token_id.toString());
	let dailySnapshot = getOrCreateMarketDailySnapshot(market, receipt);
	let hourlySnapshot = getOrCreateMarketHourlySnapshot(market, receipt);
	let usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(receipt);
	let usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(receipt);
	let financialDailySnapshot = getOrCreateFinancialDailySnapshot(receipt);
	let account = getOrCreateAccount(account_id.toString());
	let position = getOrCreatePosition(
		account_id.toString(),
		token_id.toString(),
		"BORROWER"
	);

	let token = getOrCreateToken(token_id.toString());
	borrow.account = account.id;
	borrow.amount = BigInt.fromString(amount.toString());
	borrow.asset = token.id;
	borrow.market = market.id;
	borrow.position = position.id;

	borrow.amountUSD = borrow.amount
		.divDecimal(
			BigInt.fromI32(10)
				.pow((token.decimals + token.extraDecimals) as u8)
				.toBigDecimal()
		)
		.times(token.lastPriceUSD!);
	
	if(position._last_active_timestamp.lt(usageDailySnapshot.timestamp)){
		usageDailySnapshot.dailyActiveBorrowers += 1;
	}
	if(account._last_active_timestamp.lt(usageDailySnapshot.timestamp)){
		usageDailySnapshot.dailyActiveUsers += 1;
		usageHourlySnapshot.hourlyActiveUsers += 1;
	}
	usageDailySnapshot.dailyBorrowCount += 1;
	usageDailySnapshot.dailyTransactionCount += 1;
	usageHourlySnapshot.hourlyBorrowCount += 1;
	usageHourlySnapshot.hourlyTransactionCount += 1;

	// open position if balance is zero
	if (position.balance.isZero()) {
		account.positionCount += 1;
		account.openPositionCount += 1;

		market.positionCount += 1;
		market.openPositionCount += 1;
		market.borrowingPositionCount += 1;
		
		position.hashOpened = receipt.outcome.id.toBase58();
		position.timestampOpened = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000);
		position.blockNumberOpened = BigInt.fromU64(receipt.block.header.height);
	}
	position.balance = position.balance.plus(borrow.amount);

	account.borrowCount += 1;
	market._totalBorrowed = market._totalBorrowed.plus(borrow.amount);
	market._totalBorrowedHistory = market._totalBorrowedHistory.plus(borrow.amount);
	
	// borrowed amount gets withdrawn from the account => so we need to add that to deposits
	market.inputTokenBalance = market.inputTokenBalance.plus(borrow.amount);
	market.outputTokenSupply = market.outputTokenSupply.plus(amount_to_shares(borrow.amount, market.outputTokenSupply, market.inputTokenBalance));

	// snapshot
	dailySnapshot.dailyBorrowUSD = dailySnapshot.dailyBorrowUSD.plus(borrow.amountUSD);
	hourlySnapshot.hourlyBorrowUSD = hourlySnapshot.hourlyBorrowUSD.plus(borrow.amountUSD);
	financialDailySnapshot.dailyBorrowUSD = financialDailySnapshot.dailyBorrowUSD.plus(borrow.amountUSD);

	let positionSnapshot = getOrCreatePositionSnapshot(position, receipt);
	positionSnapshot.logIndex = logIndex as i32;

	updateMarket(market, dailySnapshot, hourlySnapshot, financialDailySnapshot, receipt);
	updatePosition(position, market);

	positionSnapshot.save();
	financialDailySnapshot.save();
	usageDailySnapshot.save();
	usageHourlySnapshot.save();
	hourlySnapshot.save()
	dailySnapshot.save();
    market.save()
	account.save();
	borrow.save();
	position.save();

	updateProtocol();
}

export function handleRepayment(
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome,
	logIndex: number,
	method?: string,
	args?: TypedMap<string, JSONValue>
): void {
	let repay = getOrCreateRepayment(
		receipt.outcome.id
			.toBase58()
			.concat('-')
			.concat((logIndex as i32).toString()),
		receipt
	);
	repay.logIndex = logIndex as i32;
	let account_id = data.get('account_id');

	if (!account_id) {
		log.info('{} data not found', ['account_id']);
		return;
	}
	let amount = data.get('amount');
	if (!amount) {
		log.info('{} data not found', ['amount']);
		return;
	}
	let token_id = data.get('token_id');
	if (!token_id) {
		log.info('{} data not found', ['token_id']);
		return;
	}

	let market = getOrCreateMarket(token_id.toString());
	let dailySnapshot = getOrCreateMarketDailySnapshot(market, receipt);
	let hourlySnapshot = getOrCreateMarketHourlySnapshot(market, receipt);
	let usageDailySnapshot = getOrCreateUsageMetricsDailySnapshot(receipt);
	let usageHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(receipt);
	let financialDailySnapshot = getOrCreateFinancialDailySnapshot(receipt);
	let account = getOrCreateAccount(account_id.toString());
	let position = getOrCreatePosition(
		account_id.toString(),
		token_id.toString(),
		"BORROWER"
	);

	let token = getOrCreateToken(token_id.toString());
	repay.market = market.id;
	repay.account = account.id;
	repay.amount = BigInt.fromString(amount.toString());
	repay.asset = token.id;
	repay.position = position.id;
	repay.amountUSD = repay.amount
	.divDecimal(
		BigInt.fromI32(10)
			.pow((token.decimals + token.extraDecimals) as u8)
			.toBigDecimal()
	)
	.times(token.lastPriceUSD!);

	if(account._last_active_timestamp.lt(usageDailySnapshot.timestamp)){
		usageDailySnapshot.dailyActiveUsers += 1;
		usageHourlySnapshot.hourlyActiveUsers += 1;
	}
	usageDailySnapshot.dailyRepayCount += 1;
	usageDailySnapshot.dailyTransactionCount += 1;
	usageHourlySnapshot.hourlyRepayCount += 1;
	usageHourlySnapshot.hourlyTransactionCount += 1;

	position.balance = position.balance.minus(repay.amount);
	if (position.balance.isZero()) {
		account.openPositionCount -= 1;
		account.closedPositionCount += 1;

		market.openPositionCount -= 1;
		market.closedPositionCount += 1;
		market.borrowingPositionCount -= 1;

		position.hashClosed = receipt.outcome.id.toBase58();
		position.timestampClosed = BigInt.fromU64(receipt.block.header.timestampNanosec / 1000000000);
		position.blockNumberClosed = BigInt.fromU64(receipt.block.header.height);
	}

	account.repayCount += 1;

	market._totalRepaidHistory = market._totalRepaidHistory.plus(repay.amount);
	market._totalBorrowed = market._totalBorrowed.minus(repay.amount);

	// minus repay amount from total deposited => because user has to deposit first to repay loan
	market.outputTokenSupply = market.outputTokenSupply.minus(amount_to_shares(repay.amount, market.outputTokenSupply, market.inputTokenBalance));
	market.inputTokenBalance = market.inputTokenBalance.minus(repay.amount);

	// snapshot
	dailySnapshot.dailyRepayUSD = dailySnapshot.dailyRepayUSD.plus(repay.amountUSD);
	hourlySnapshot.hourlyRepayUSD = hourlySnapshot.hourlyRepayUSD.plus(repay.amountUSD);
	financialDailySnapshot.dailyRepayUSD = financialDailySnapshot.dailyRepayUSD.plus(repay.amountUSD);

	let positionSnapshot = getOrCreatePositionSnapshot(position, receipt);
	positionSnapshot.logIndex = logIndex as i32;

	updateMarket(market, dailySnapshot, hourlySnapshot, financialDailySnapshot, receipt);
	updatePosition(position, market);

	positionSnapshot.save();
	financialDailySnapshot.save();
	hourlySnapshot.save()
	dailySnapshot.save();
	usageDailySnapshot.save();
	usageHourlySnapshot.save();
    market.save()
	account.save();
	repay.save();
	position.save();

	updateProtocol();
}