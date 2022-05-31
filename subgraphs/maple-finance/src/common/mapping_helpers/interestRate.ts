import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { InterestRate, _Loan } from "../../../generated/schema";

import { PROTOCOL_INTEREST_RATE_SIDE, PROTOCOL_INTEREST_RATE_TYPE } from "../constants";
import { getOrCreateMarket } from "./market";

/**
 * Create an interest rate, this also adds it to the market that the loan belongs to
 * @param loan loan this interest rate if for
 * @param rate rate in percentage APY (i.e 5.31% should be stored as 5.31)
 * @param durationDays number of days for the loan
 */
export function createInterestRate(loan: _Loan, rate: BigDecimal, durationDays: BigInt): InterestRate {
    const market = getOrCreateMarket(Address.fromString(loan.market));
    const count = market.rates.length + 1;
    const id =
        PROTOCOL_INTEREST_RATE_SIDE + "-" + PROTOCOL_INTEREST_RATE_TYPE + "-" + market.id + "-" + count.toString();
    const interestRate = new InterestRate(id);

    interestRate.rate = rate;
    interestRate.duration = durationDays.toI32();
    interestRate.maturityBlock = null; // Doesn't apply here
    interestRate.side = PROTOCOL_INTEREST_RATE_SIDE;
    interestRate.type = PROTOCOL_INTEREST_RATE_TYPE;
    interestRate._loan = loan.id;

    const newRates = market.rates;
    newRates.push(interestRate.id);
    market.rates = newRates;

    interestRate.save();
    market.save();
    return interestRate;
}
