import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Deposit,
  DexAmmProtocol,
  LiquidityPool,
  Token,
} from "../../generated/schema";
import { getCoinCount } from "../utils/common";
import {
  BIGDECIMAL_ZERO
} from "../utils/constant";

export function createDeposit(
  event: ethereum.Event,
  pool: LiquidityPool,
  protocol: DexAmmProtocol,
  outputTokenAmount: BigInt,
  token_amount: BigInt[],
  provider: Address
): void {
  let deposit_id = event.transaction.hash
    .toHexString()
    .concat("-")
    .concat(event.logIndex.toHexString());
  let deposit = Deposit.load(deposit_id);
  if (deposit == null) {
    deposit = new Deposit(deposit_id);
    deposit.hash = event.transaction.hash.toString();
    deposit.protocol = protocol.id;
    deposit.logIndex = event.logIndex.toI32();
    deposit.to = event.address.toString();
    deposit.from = provider.toString();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.inputTokens = pool.inputTokens;

    
    // Output Token and Output Token Amount
      
    deposit.outputTokens = pool.outputToken
    deposit.outputTokenAmount = outputTokenAmount
    

    // Input Token and Input Token Amount
    let coinCount = getCoinCount(Address.fromString(pool.id))
    let inputTokenAmounts: BigInt[] = []
    for(let i = 0; i < coinCount.toI32(); ++i) {
        inputTokenAmounts.push(token_amount[i])
    }
    deposit.inputTokenAmounts = inputTokenAmounts.map<BigInt>(ta => ta)
    deposit.amountUSD = BIGDECIMAL_ZERO;
    deposit.pool = pool.id;

    deposit.save();
  }
}

