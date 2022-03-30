import {
  AddLiquidity,
  RemoveLiquidity,
  RemoveLiquidityOne,
  RemoveLiquidityImbalance,
  TokenExchange,
} from "../../generated/templates/PoolLPToken/StableSwapLending3";
import {
  AddLiquidity as AddLiquidityTriCrypto,
  RemoveLiquidity as RemoveLiquidityTriCrypto,
  Remove_liquidity_one_coinCall as Remove_liquidity_one_coin_tricrypto_Call,
  TokenExchange as TokenExchangeTriCrypto,
} from "../../generated/TRICRYPTOPool/StableSwapTriCrypto";

import {
  Coin,
  LiquidityPool,
  RemoveLiqudityOneEvent,
  Token,
} from "../../generated/schema";

import {
  getOrCreateProtocol
} from "../utils/common";
import {
  toDecimal,
  ZERO_ADDRESS,
} from "../utils/constant";
import { addLiquidity } from "../helpers/pools/AddLiquidity";
import { removeLiquidity } from "../helpers/pools/RemoveLiquidity";
import { handleRLOEEntityUpdate } from "../helpers/pools/RemoveLiquidityOneUpdate";
import { tokenExchange } from "../helpers/pools/TokenExchange";

export function handleAddLiquidity(event: AddLiquidity): void {
  let fees = event.params.fees;
  let invariant = event.params.invariant;
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

export function handleAddLiquidityTriCrypto(
  event: AddLiquidityTriCrypto
): void {
  let fee = event.params.fee;
  let provider = event.params.provider;
  let token_amounts = event.params.token_amounts;
  let token_supply = event.params.token_supply;


  addLiquidity(
    event,
    event.address,
    token_supply,
    token_amounts,
    provider,
    [fee]
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
  let pool = LiquidityPool.load(event.address.toHexString());

  if (pool != null) {
    let coinSold = Coin.load(pool.id + "-" + event.params.sold_id.toString())!;
    let tokenSold = Token.load(coinSold.token)!;
    let amountSold = toDecimal(event.params.tokens_sold, tokenSold.decimals);

    let coinBought = Coin.load(
      pool.id + "-" + event.params.bought_id.toString()
    )!;
    let tokenBought = Token.load(coinBought.token)!;
    let amountBought = toDecimal(
      event.params.tokens_bought,
      tokenBought.decimals
    );

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

export function handleTokenExchangeTriCrypto(
  event: TokenExchangeTriCrypto
): void {
  let pool = LiquidityPool.load(event.address.toHexString());

  if (pool != null) {
    let coinSold = Coin.load(pool.id + "-" + event.params.sold_id.toString())!;
    let tokenSold = Token.load(coinSold.token)!;
    let amountSold = toDecimal(event.params.tokens_sold, tokenSold.decimals);

    let coinBought = Coin.load(
      pool.id + "-" + event.params.bought_id.toString()
    )!;
    let tokenBought = Token.load(coinBought.token)!;
    let amountBought = toDecimal(
      event.params.tokens_bought,
      tokenBought.decimals
    );

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






