import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Deposit,
  DexAmmProtocol,
  LiquidityPool,
  Token,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  toDecimal,
} from "../utils/constant";
import { getOrCreateToken } from "../utils/tokens";

export function createDeposit(
  event: ethereum.Event,
  pool: LiquidityPool,
  protocol: DexAmmProtocol,
  token_supply: BigDecimal,
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
    let outputTokens: Token[] = [];
    outputTokens.push(
      getOrCreateToken(Address.fromBytes(pool._lpTokenAddress))
    );
    deposit.outputTokens = outputTokens.map<string>((t) => t.id);
    let outputTokenAmounts: BigDecimal[] = [];
    outputTokenAmounts.push(token_supply);
    deposit.outputTokenAmounts = outputTokenAmounts.map<BigDecimal>((tm) => tm);

    // Input Token and Input Token Amount
    let tokenAmount: BigInt[] = []
    for(let i = 0; i < pool._coinCount.toI32(); ++i) {
      tokenAmount.push(token_amount[i])
    }

    // let amountUSD = BIGDECIMAL_ZERO;
    // for (let i = 0; i < pool._coinCount.toI32(); ++i) {
  
    //     let inputToken = getOrCreateToken(
    //       Address.fromString(deposit.inputTokens[i])
    //     );
    //     let inputTokenAmounts = tokenAmount[i];

    //     // Get the price of 1 input token in usd
    //     // and multiple with the input token amount
    //     let inputTokenUSD = normalizedUsdcPrice(
    //       usdcPrice(inputToken, inputTokenAmounts)
    //     );
    //     // Add the price of the total input to amountUSD
    //     amountUSD = amountUSD.plus(inputTokenUSD);
      
    // }
    deposit.inputTokenAmounts = tokenAmount.map<BigDecimal>((ta) =>
      toDecimal(ta, DEFAULT_DECIMALS)
    );
    // deposit.amountUSD = amountUSD;
    deposit.pool = pool.id;

    deposit.save();
  }
}

