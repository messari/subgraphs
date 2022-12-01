import { Account } from "../../generated/schema";

export function getOrCreateAccount(account: string): Account {
	let r = Account.load(account);
	if (!r) {
		r = new Account(account);
		r.borrowCount = 0;
		r.depositCount = 0;
		r.withdrawCount = 0;
		r.repayCount = 0;
		r.liquidateCount = 0;
		r.liquidationCount = 0;
		r.closedPositionCount = 0;
		r.openPositionCount = 0;
		r.save();
	}
	return r;
}
