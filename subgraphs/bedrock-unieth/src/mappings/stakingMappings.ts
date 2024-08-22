import {
  updatePoolTVL,
  getOrCreatePool,
  initializeSDKFromCall,
  updatePoolOutputTokenSupply,
} from "../common/initializers";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { MintCall } from "../../generated/Staking/Staking";

export function handleMint(call: MintCall): void {
  const sdk = initializeSDKFromCall(call);
  const pool = getOrCreatePool(
    Address.fromString(constants.UNIETH_ADDRESS),
    sdk
  );

  updatePoolOutputTokenSupply(pool);
  updatePoolTVL(pool);

  const account = sdk.Accounts.loadAccount(call.transaction.from);
  account.trackActivity();
}
