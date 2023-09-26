import { Subject, Trader } from "../../generated/schema";

export class TraderResponse {
  trader: Trader;
  isNewTrader: boolean;
}

export class SubjectResponse {
  subject: Subject;
  isNewSubject: boolean;
}
