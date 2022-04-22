import { Address, BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { DexAmmProtocol, LiquidityPool, Withdraw } from "../../generated/schema";
import { getCoins, getOrCreateProtocol } from "../utils/common";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, INT_ZERO, ZERO_ADDRESS } from "../utils/constant";

export function getOrCreateWithdraw(event: ethereum.Event, pool: LiquidityPool): Withdraw {
  let transactionHash = event.transaction.hash;
  let logIndex = event.logIndex;
  let blockNumber = event.block.number;
  let timestamp = event.block.timestamp;
  let withdraw_id = transactionHash
    .toHexString()
    .concat("-")
    .concat(logIndex.toHexString());
  let protocol = getOrCreateProtocol();
  let withdraw = Withdraw.load(withdraw_id);
  if (withdraw == null) {
    withdraw = new Withdraw(withdraw_id);
    withdraw.hash = transactionHash.toString();
    withdraw.logIndex = logIndex.toI32();
    withdraw.protocol = protocol.id;
    withdraw.to = ZERO_ADDRESS;
    withdraw.from = ZERO_ADDRESS;
    withdraw.blockNumber = blockNumber;
    withdraw.timestamp = timestamp;
    withdraw.inputTokens = pool.inputTokens;

    // Output Token && Input Token Amount. Note that the input token is the LPToken in this case
    withdraw.outputToken = pool.outputToken;
    withdraw.outputTokenAmount = BIGINT_ZERO;

    // Input Token && Output Token Amount
    let coins = getCoins(Address.fromString(pool.id));
    let inputTokenAmounts: BigInt[] = [];
    for (let i = INT_ZERO; i < getCoins.length; i++) {
      inputTokenAmounts.push(BIGINT_ZERO);
    }
    withdraw.inputTokenAmounts = inputTokenAmounts.map<BigInt>(ta => ta);
    withdraw.amountUSD = BIGDECIMAL_ZERO;
    withdraw.pool = pool.id;

    withdraw.save();

    return withdraw as Withdraw;
  }
  return withdraw as Withdraw;
}
