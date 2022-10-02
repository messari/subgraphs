import { LoanTokenCreated } from "../../generated/LoanFactory/LoanFactory";
import { LoanToken } from "../../generated/templates";

export function handleLoanTokenCreated(event: LoanTokenCreated): void {
  LoanToken.create(event.params.contractAddress);
}
