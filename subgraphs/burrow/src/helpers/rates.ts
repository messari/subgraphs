import { near } from "@graphprotocol/graph-ts";
import { Market, InterestRate } from "../../generated/schema";

export function getOrCreateSupplyRate(market: Market, receipt: near.ReceiptWithOutcome|null = null): InterestRate {
	let id = "SUPPLY-VARIABLE-".concat(market.id);
	if(receipt) id = id.concat("-").concat((receipt.block.header.timestampNanosec / 86400000000000).toString());
	let rate = InterestRate.load(id);
	if (rate == null) {
		rate = new InterestRate(id);
		rate.side = "LENDER";
		rate.type = "VARIABLE";
	}
	return rate as InterestRate;
}

export function getOrCreateBorrowRate(market: Market, receipt: near.ReceiptWithOutcome|null = null): InterestRate {
	let id = "BORROW-VARIABLE-".concat(market.id);
	if(receipt) id = id.concat("-").concat((receipt.block.header.timestampNanosec / 86400000000000).toString());
	let rate = InterestRate.load(id);
	if (rate == null) {
		rate = new InterestRate(id);
		rate.side = "BORROWER";
		rate.type = "VARIABLE";
	}
	return rate as InterestRate;
}
