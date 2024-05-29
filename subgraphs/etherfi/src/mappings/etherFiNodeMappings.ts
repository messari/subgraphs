import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { getOrCreatePool, initializeSDKFromCall } from "../common/initializers";
import { WithdrawFundsCall } from "../../generated/templates/EtherFiNode/EtherFiNode";

export function handleWithdrawFunds(call: WithdrawFundsCall): void {
  const amountToOperator = call.inputs._operatorAmount;
  const amountToTNftHolders = call.inputs._tnftAmount;
  const amountToBNftHolders = call.inputs._bnftAmount;
  const amountToTreasury = call.inputs._treasuryAmount;

  const sdk = initializeSDKFromCall(call);

  const pool = getOrCreatePool(
    Address.fromString(constants.EETH_LIQUIDITY_POOL_ADDRESS),
    sdk
  );

  const inputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(constants.ETH_ADDRESS)
  );

  const supplySideRevenue = amountToOperator
    .plus(amountToTNftHolders)
    .plus(amountToBNftHolders);
  const protocolSideRevenue = amountToTreasury;

  pool.addRevenueNative(inputToken, supplySideRevenue, protocolSideRevenue);
}
