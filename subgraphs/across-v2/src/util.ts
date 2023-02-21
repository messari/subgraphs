import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Token } from "../generated/schema";
import { _ERC20 } from "../generated/SpokePool/_ERC20";
import { getUsdPrice, getUsdPricePerToken } from "./prices";
import { TokenInitializer, TokenParams } from "./sdk/protocols/bridge/tokens";
import { TokenPricer } from "./sdk/protocols/config";
import { bigIntToBigDecimal } from "./sdk/util/numbers";

export class Pricer implements TokenPricer {
  block: ethereum.Block;

  constructor(block: ethereum.Block) {
    this.block = block;
  }

  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id), this.block);
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount, this.block);
  }
}

export class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const name = this.fetchTokenName(address);
    const symbol = this.fetchTokenSymbol(address);
    const decimals = this.fetchTokenDecimals(address) as i32;

    return {
      name,
      symbol,
      decimals,
    };
  }

  fetchTokenName(tokenAddress: Address): string {
    const tokenContract = _ERC20.bind(tokenAddress);
    const call = tokenContract.try_name();
    if (call.reverted) {
      return tokenAddress.toHexString();
    } else {
      return call.value;
    }
  }

  fetchTokenSymbol(tokenAddress: Address): string {
    const tokenContract = _ERC20.bind(tokenAddress);
    const call = tokenContract.try_symbol();
    if (call.reverted) {
      return " ";
    } else {
      return call.value;
    }
  }

  fetchTokenDecimals(tokenAddress: Address): number {
    const tokenContract = _ERC20.bind(tokenAddress);
    const call = tokenContract.try_decimals();
    if (call.reverted) {
      return 0;
    } else {
      return call.value.toI32();
    }
  }
}

// Constants
// TODO: lowercase the address
export const ACROSS_PROTOCOL_NAME = "across-v2";
export const ACROSS_HUB_POOL_CONTRACT =
  "0xc186fa914353c44b2e33ebe05f21846f1048beda";
export const ACROSS_REWARD_TOKEN = "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f";
export const ACROSS_ACCELERATING_DISTRIBUTOR_CONTRACT =
  "0x9040e41ef5e8b281535a96d9a48acb8cfabd9a48";
