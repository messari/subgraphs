import { BigDecimal, BigInt, near, log } from "@graphprotocol/graph-ts";
import { BI_ZERO } from "./const";

// convert token amounts to output shares
export function amount_to_shares(amount: BigInt, total_shares: BigInt, total_amount: BigInt): BigInt {
	if (total_amount.equals(BI_ZERO)) {
		return amount;
	}
	return amount.times(total_shares).div(total_amount);
}