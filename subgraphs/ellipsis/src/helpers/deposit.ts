import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Deposit,
  DexAmmProtocol,
  LiquidityPool,
  Token,
} from "../../generated/schema";
import { getCoins, getOrCreateProtocol } from "../utils/common";
import {
  BIGDECIMAL_ZERO, BIGINT_ZERO, INT_ZERO, ZERO_ADDRESS
} from "../utils/constant";

export function getOrCreateDeposit(
  event: ethereum.Event,
  pool: LiquidityPool
): Deposit {
  let deposit_id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toHexString());
    let protocol = getOrCreateProtocol();
  let deposit = Deposit.load(deposit_id);
  if (deposit == null) {
    deposit = new Deposit(deposit_id);
    deposit.hash = event.transaction.hash.toString();
    deposit.protocol = protocol.id;
    deposit.logIndex = event.logIndex.toI32();
    deposit.to = ZERO_ADDRESS;
    deposit.from = ZERO_ADDRESS;
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.inputTokens = pool.inputTokens;
    deposit.outputToken = pool.outputToken;
    deposit.outputTokenAmount = BIGINT_ZERO;

    // Input Token and Input Token Amount
    let coins: Address[] = getCoins(Address.fromString(pool.id))
    let inputTokenAmounts: BigInt[] = []
    for(let i = INT_ZERO; i < coins.length; i++) {
      inputTokenAmounts.push(BIGINT_ZERO);
    }
    deposit.inputTokenAmounts = inputTokenAmounts.map<BigInt>(ta => ta)
    deposit.amountUSD = BIGDECIMAL_ZERO;
    deposit.pool = pool.id;
    deposit.save();

    return deposit as Deposit;
  }
  return deposit as Deposit;
}

