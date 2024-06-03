import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { getOrCreatePool, initializeSDKFromCall } from "../common/initializers";
import { WithdrawFundsCall } from "../../generated/templates/EtherFiNode/EtherFiNode";

export function handleWithdrawFunds(call: WithdrawFundsCall): void {
  const amountToOperator = call.inputs._operatorAmount;
  const amountToTreasury = call.inputs._treasuryAmount;

  let amountToTNftHolders = call.inputs._tnftAmount;
  let amountToBNftHolders = call.inputs._bnftAmount;

  const totalWithdawAmount = amountToOperator
    .plus(amountToTreasury)
    .plus(amountToBNftHolders)
    .plus(amountToTNftHolders);

  if (totalWithdawAmount >= constants.MINIMUM_FULL_WITHDRAW_AMOUNT) {
    // This implies that this call is because of a FullWithdraw event. We need to remove the principal
    // amount from the TNFT and BNFT amount.

    amountToTNftHolders = amountToTNftHolders.minus(
      constants.TNFT_STAKING_AMOUNT
    );
    amountToTNftHolders =
      amountToTNftHolders >= constants.BIGINT_ZERO
        ? amountToTNftHolders
        : constants.BIGINT_ZERO;

    amountToBNftHolders = amountToBNftHolders.minus(
      constants.BNFT_STAKING_AMOUNT
    );
    amountToBNftHolders =
      amountToBNftHolders >= constants.BIGINT_ZERO
        ? amountToBNftHolders
        : constants.BIGINT_ZERO;
  }

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
