import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  Withdraw,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  toDecimal,
} from "../utils/constant";
import { normalizedUsdcPrice, usdcPrice } from "../utils/pricing";
import { getOrCreateToken } from "../utils/tokens";

export function createWithdraw(
  event: ethereum.Event,
  pool: LiquidityPool,
  protocol: DexAmmProtocol,
  token_supply: BigDecimal,
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

    // Output Token && Output Token Amount
    let InputTokens: Token[] = [];
    InputTokens.push(getOrCreateToken(Address.fromBytes(pool._lpTokenAddress)));
    withdraw.inputTokens = InputTokens.map<string>((t) => t.id);
    let inputTokenAmounts: BigDecimal[] = [];
    inputTokenAmounts.push(token_supply);
    withdraw.inputTokenAmounts = inputTokenAmounts.map<BigDecimal>((tm) => tm);

    // Output Token && Output Token Amount
    let tokenAmount = token_amount.map<BigInt>((ta) => ta);

    let amountUSD = BIGDECIMAL_ZERO;
    for (let i = 0; i < pool._coinCount.toI32(); ++i) {
      let outputToken = getOrCreateToken(
        Address.fromString(pool.inputTokens[i])
      );
      let outputTokenAmounts = tokenAmount[i];

      // Get the price of 1 input token in usd
      // and multiple with the input token amount
      let outputTokenUSD = normalizedUsdcPrice(
        usdcPrice(outputToken, outputTokenAmounts)
      );
      // Add the price of the total input to amountUSD
      amountUSD = amountUSD.plus(outputTokenUSD);
    }
    withdraw.outputTokenAmounts = tokenAmount.map<BigDecimal>((ta) =>
      toDecimal(ta, DEFAULT_DECIMALS)
    );
    withdraw.amountUSD = amountUSD;
    withdraw.pool = pool.id;

    withdraw.save();
  }
}
