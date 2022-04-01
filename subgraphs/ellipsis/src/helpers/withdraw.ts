import { Address, BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { DexAmmProtocol, LiquidityPool, Withdraw } from "../../generated/schema";
import { getCoinCount } from "../utils/common";
import { BIGDECIMAL_ZERO } from "../utils/constant";

export function createWithdraw(
    pool: LiquidityPool,
    protocol: DexAmmProtocol,
    token_supply: BigInt,
    token_amount: BigInt[],
    provider: Address,
    transactionHash: Bytes,
    logIndex: BigInt,
    blockNumber: BigInt,
    timestamp: BigInt
  ): void {
    let withdraw_id = transactionHash
      .toHexString()
      .concat("-")
      .concat(logIndex.toHexString());
    let withdraw = Withdraw.load(withdraw_id);
    if (withdraw == null) {
      withdraw = new Withdraw(withdraw_id);
      withdraw.hash = transactionHash.toString();
      withdraw.logIndex = logIndex.toI32();
      withdraw.protocol = protocol.id;
      withdraw.to = provider.toString();
      withdraw.from = pool.id;
      withdraw.blockNumber = blockNumber;
      withdraw.timestamp = timestamp;
      withdraw.inputTokens = pool.inputTokens
  
      // Output Token && Input Token Amount. Note that the input token is the LPToken in this case
      withdraw.outputTokens = pool.outputToken
      withdraw.outputTokenAmount = token_supply
  
      // Input Token && Output Token Amount
      let coinCount = getCoinCount(Address.fromString(pool.id))
      let inputTokenAmounts: BigInt[] = []
      for (let i = 0; i < coinCount.toI32(); ++i) {
        inputTokenAmounts.push(token_amount[i])
      }
      withdraw.inputTokenAmounts = inputTokenAmounts.map<BigInt>(ta => ta)
      withdraw.amountUSD = BIGDECIMAL_ZERO;
      withdraw.pool = pool.id;
  
      withdraw.save();
    }
  }
  
  