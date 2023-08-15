import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateTranche } from "../common/initializers";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";

export function updateTranche(
  trancheAddress: Address,
  transactionType: TransactionType,
  inputToken: Token,
  amount: BigInt
): void {
  if (!inputToken.lastPriceUSD) return;
  if (!trancheAddress) return;
  const tranche = getOrCreateTranche(
    Address.fromHexString(trancheAddress.toHexString())
  );

  const amountUSD = utils
    .bigIntToBigDecimal(amount, inputToken.decimals)
    .times(inputToken.lastPriceUSD!);
  if (transactionType == TransactionType.DEPOSIT) {
    tranche.tvl = tranche.tvl.plus(amountUSD);
  }
  if (transactionType == TransactionType.WITHDRAW) {
    tranche.tvl = tranche.tvl.minus(amountUSD);
  }
  tranche.totalSupply = utils.getLpTokenSupply(trancheAddress);
  tranche.save();
}
