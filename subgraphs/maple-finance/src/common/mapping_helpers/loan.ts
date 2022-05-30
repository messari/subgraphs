import { Address, BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { _Loan } from "../../../generated/schema";
import { Loan } from "../../../generated/templates/Loan/Loan";
import { ZERO_ADDRESS, ZERO_BD, ZERO_BI } from "../constants";

/**
 * Get the loan at loanAddress, or create it if is doesn't already exist.
 * Only loanAddress is required for get, everything should be set for create
 */
export function getOrCreateLoan(
    loanAddress: Address,
    marketAddress: Address = ZERO_ADDRESS,
    amountFunded: BigInt = ZERO_BI
): _Loan {
    let loan = _Loan.load(loanAddress.toHexString());

    if (!loan) {
        loan = new _Loan(loanAddress.toHexString());
        const loanContract = Loan.bind(loanAddress);

        loan.market = marketAddress.toHexString();
        loan.amountFunded = amountFunded;

        const termDaysCall = loanContract.try_termDays();
        if (!termDaysCall.reverted) {
            loan.termDays = termDaysCall.value;
        } else {
            log.error("Unable to read term days in loan creation", []);
        }

        const aprCall = loanContract.try_apr();
        if (!aprCall.reverted) {
            loan.interestRate = aprCall.value.toBigDecimal().div(BigDecimal.fromString("100"));
        } else {
            loan.interestRate = ZERO_BD;
            log.error("Unable to apr loan creation", []);
        }

        loan.drawnDown = ZERO_BI;
        loan.principalPaid = ZERO_BI;
        loan.collateralLiquidatedInPoolInputTokens = ZERO_BI;
        loan.defaultSuffered = ZERO_BI;

        if (ZERO_ADDRESS == marketAddress || ZERO_BI == amountFunded) {
            log.error("Created loan with invalid params: marketAddress={}, amountFunded={}", [
                marketAddress.toHexString(),
                amountFunded.toString()
            ]);
        }
    }

    loan.save();
    return loan;
}
