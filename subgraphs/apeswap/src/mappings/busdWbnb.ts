import { BIGINT_ZERO } from "../utils/constant";
import {
  BUSD_WBNB_PAIR,
  Sync,
} from "../../generated/BUSD_WBNB_PAIR/BUSD_WBNB_PAIR";
import { PancakeswapPair, Bundle } from "../../generated/schema";
import { getBnbPriceInUSD } from "../utils/pricing";
import { getOrCreatePancakeToken } from "../utils/token";

export function handleSync(event: Sync): void {
  // create new bundle, if it doesn't already exist
  let bundle = Bundle.load("1");
  if (bundle == null) {
    bundle = new Bundle("1");
    bundle.bnbPrice = BIGINT_ZERO;
    bundle.save();
  }

  // create the tokens
  let contract = BUSD_WBNB_PAIR.bind(event.address);
  let pair = PancakeswapPair.load(event.address.toHexString());

  if (pair == null) {
    // create pair
    pair = new PancakeswapPair(event.address.toHexString()) as PancakeswapPair;
    let tryToken0 = contract.try_token0();
    if (!tryToken0.reverted) {
      let token0 = getOrCreatePancakeToken(tryToken0.value);
      pair.token0 = token0.id;
    }
    let tryToken1 = contract.try_token1();
    if (!tryToken1.reverted) {
      let token1 = getOrCreatePancakeToken(tryToken1.value);
      pair.token1 = token1.id;
    }
    pair.reserve0 = BIGINT_ZERO;
    pair.reserve1 = BIGINT_ZERO;
    pair.totalSupply = BIGINT_ZERO;
    pair.token0Price = BIGINT_ZERO;
    pair.token1Price = BIGINT_ZERO;
    pair.volumeToken0 = BIGINT_ZERO;
    pair.volumeToken1 = BIGINT_ZERO;
    pair.untrackedVolumeUSD = BIGINT_ZERO;
    pair.volumeUSD = BIGINT_ZERO;
    pair.txCount = BIGINT_ZERO;
    pair.createdAtTimestamp = event.block.timestamp;
    pair.createdAtBlockNumber = event.block.number;

    pair.save();
  }

  pair.reserve0 = event.params.reserve0;
  pair.reserve1 = event.params.reserve1;

  if (pair.reserve1.notEqual(BIGINT_ZERO))
    pair.token0Price = pair.reserve0.div(pair.reserve1);
  else pair.token0Price = BIGINT_ZERO;
  if (pair.reserve0.notEqual(BIGINT_ZERO))
    pair.token1Price = pair.reserve1.div(pair.reserve0);
  else pair.token1Price = BIGINT_ZERO;

  // update BNB price now that reserves could have changed
  bundle.bnbPrice = getBnbPriceInUSD();
  bundle.save();

  // save entities
  pair.save();
}
