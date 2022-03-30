import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { DexAmmProtocol, LiquidityPool, Withdraw } from "../../generated/schema";
import { getCoinCount } from "../utils/common";
import { BIGDECIMAL_ZERO } from "../utils/constant";

export function createWithdraw(
    event: ethereum.Event,
    pool: LiquidityPool,
    protocol: DexAmmProtocol,
    token_supply: BigInt,
    token_amount: BigInt[],
    provider: Address
  ): void {
    let withdraw_id = event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toHexString());
    let withdraw = Withdraw.load(withdraw_id);
    if (withdraw == null) {
      withdraw = new Withdraw(withdraw_id);
      withdraw.hash = event.transaction.hash.toString();
      withdraw.logIndex = event.logIndex.toI32();
      withdraw.protocol = protocol.id;
      withdraw.to = provider.toString();
      withdraw.from = event.address.toString();
      withdraw.blockNumber = event.block.number;
      withdraw.timestamp = event.block.timestamp;
      withdraw.outputTokens = pool.inputTokens
  
      // Input Token && Input Token Amount. Note that the input token is the LPToken in this case
      withdraw.inputTokens = pool.outputToken
      withdraw.inputTokenAmounts = token_supply
  
      // Output Token && Output Token Amount
      let coinCount = getCoinCount(Address.fromString(pool.id))
      for (let i = 0; i < coinCount.toI32(); ++i) {
        withdraw.outputTokenAmount[i] = token_amount[i]
      }
      withdraw.amountUSD = BIGDECIMAL_ZERO;
      withdraw.pool = pool.id;
  
      withdraw.save();
    }
  }
  
  