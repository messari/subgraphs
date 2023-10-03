import { _Account, _ActiveAccount } from "../../generated/schema";

export class AccountResponse {
  account: _Account;
  isNewAccount: boolean;
}

export class ActiveAccountResponse {
  activeAccount: _ActiveAccount;
  isNewActiveAccount: boolean;
}
