import {
  DepositStETHCall,
  DepositWstETHCall,
} from "../../generated/PufferDepositor/PufferDepositor";
import { initializeSDKFromCall } from "../common/initializers";

export function handleDepositStETH(call: DepositStETHCall): void {
  const recipient = call.inputs.recipient;
  const sdk = initializeSDKFromCall(call);

  const account = sdk.Accounts.loadAccount(recipient);
  account.trackActivity();
}

export function handleDepositWstETH(call: DepositWstETHCall): void {
  const recipient = call.inputs.recipient;
  const sdk = initializeSDKFromCall(call);

  const account = sdk.Accounts.loadAccount(recipient);
  account.trackActivity();
}
