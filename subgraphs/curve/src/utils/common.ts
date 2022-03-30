import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Factory/ERC20";

import { LiquidityPool, Coin, DexAmmProtocol } from "../../generated/schema";

import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  FACTORY_ADDRESS,
  FEE_DECIMALS,
  Network,
  ProtocolType,
  toDecimal,
} from "./constant";
import { getOrCreateToken } from "./tokens";

export function getOrCreateProtocol(): DexAmmProtocol {
  let id = Address.fromString(FACTORY_ADDRESS).toHexString();
  let protocol = DexAmmProtocol.load(id);
  if (!protocol) {
    protocol = new DexAmmProtocol(id);
    protocol.name = "curve finance";
    protocol.slug = "curve-finance";
    protocol.network = Network.ETHEREUM;
    protocol.version = "1.0.0";
    protocol.type = ProtocolType.EXCHANGE;

    protocol.save();

    return protocol as DexAmmProtocol;
  }
  return protocol as DexAmmProtocol;
}

// export function getOutTokenPriceUSD(pool: LiquidityPool): BigDecimal {
//   return normalizedUsdcPrice(
//     usdcPricePerToken(Address.fromBytes(pool._lpTokenAddress))
//   );
// }

export function getTVLUSD(pool: LiquidityPool): BigDecimal {
  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < pool._coinCount.toI32(); ++i) {
    let coin = Coin.load(pool.id.concat("-").concat(i.toString()));
    if (coin !== null) {
      let token = getOrCreateToken(Address.fromString(coin.token))
      // @TODO: Get the USD Value of the coin.balance first
      totalValueLockedUSD.plus(toDecimal(coin.balance, token.decimals));
    }
  }
  return totalValueLockedUSD;
}

export function getCurrentTokenSupply(
  pool: LiquidityPool,
  token_supply: BigInt
): BigDecimal {
  // If token supply in event is 0, then check directly from contract
  let currentTokenSupply = toDecimal(token_supply, DEFAULT_DECIMALS);
  if (currentTokenSupply == toDecimal(BigInt.fromI32(0), DEFAULT_DECIMALS)) {
    let lpContract = ERC20.bind(Address.fromBytes(pool._lpTokenAddress));
    let supply = lpContract.try_totalSupply();
    if (!supply.reverted) {
      currentTokenSupply = toDecimal(supply.value, DEFAULT_DECIMALS);
    }
  }

  return currentTokenSupply;
}

