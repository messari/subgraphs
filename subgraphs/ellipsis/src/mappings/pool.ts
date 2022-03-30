import {
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityImbalance,
  RemoveLiquidityOne,
  TokenExchange,
} from "../../generated/Factory/StableSwap";
import { LiquidityPool, RemoveLiqudityOneEvent, Token } from "../../generated/schema";
import { addLiquidity } from "../helpers/pool/AddLiquidity";
import { removeLiquidity } from "../helpers/pool/RemoveLiquidity";
import { handleRLOEEntityUpdate } from "../helpers/pool/RemoveLiquidityOneUpdate";
import { tokenExchange } from "../helpers/pool/TokenExchange";
import { getCoins } from "../utils/common";
import { ZERO_ADDRESS } from "../utils/constant";

export function handleAddLiquidity(event: AddLiquidity): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  addLiquidity(
    event,
    event.address,
    token_supply,
    token_amounts,
    provider,
    fees
  );
}

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  removeLiquidity(
    event,
    event.address,
    token_supply,
    token_amounts,
    provider,
    fees
  );
}

export function handleRemoveLiquidityImbalance(
  event: RemoveLiquidityImbalance
): void {
  let fees = event.params.fees;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;

  removeLiquidity(
    event,
    event.address,
    token_supply,
    token_amounts,
    provider,
    fees
  );
}

export function handleRemoveLiquidityOne(event: RemoveLiquidityOne): void {
    let coin_amount = event.params.coin_amount;
    let provider = event.params.provider;
    let token_amount = event.params.token_amount;
  
    // Check if pool exist
    let pool = LiquidityPool.load(event.address.toHexString());
    if (pool != null && pool.id != ZERO_ADDRESS) {
      // create RemoveLiquidityOne entity
      let id = event.transaction.hash
        .toHexString()
        .concat("-")
        .concat(pool.id);
  
      let entity = new RemoveLiqudityOneEvent(id);
      entity.eventApplied = true;
      entity.provider = provider;
      entity.tokenAmount = token_amount;
      entity.dy = coin_amount;
      entity.logIndex = event.logIndex;
      entity.save();
  
      handleRLOEEntityUpdate(event, entity, pool);
    }
  }

export function handleTokenExchange(event: TokenExchange): void {
    let soldId = event.params.sold_id
    let boughtId = event.params.bought_id
  let pool = LiquidityPool.load(event.address.toHexString());

  if (pool != null) {
    let coins = getCoins(event.address)
    let tokenSold = Token.load(coins[soldId.toI32()].toHexString())!;
    let amountSold = event.params.tokens_sold;

    let tokenBought = Token.load(coins[boughtId.toI32()].toHexString())!;
    let amountBought = event.params.tokens_bought

    let buyer = event.params.buyer;

    tokenExchange(
      event,
      event.address,
      tokenSold,
      amountSold,
      tokenBought,
      amountBought,
      buyer
    );
  }
}
