import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { Token } from "../generated/schema";
import { _ERC20 } from "../generated/SpokePool1/_ERC20";
import { getUsdPrice, getUsdPricePerToken } from "./prices";
import { TokenInitializer, TokenParams } from "./sdk/protocols/bridge/tokens";
import { TokenPricer } from "./sdk/protocols/config";
import { bigIntToBigDecimal } from "./sdk/util/numbers";
import { ETH_ADDRESS, ETH_NAME, ETH_SYMBOL } from "./sdk/util/constants";
import { BIGINT_ZERO } from "./prices/common/constants";
import { BridgePermissionType } from "./sdk/protocols/bridge/enums";
import { BridgeConfig } from "./sdk/protocols/bridge/config";
import { Versions } from "./versions";

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
    let name: string;
    let symbol: string;
    let decimals: i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = ETH_NAME;
      symbol = ETH_SYMBOL;
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      decimals = 18;
    } else {
      name = this.fetchTokenName(address);
      symbol = this.fetchTokenSymbol(address);
      decimals = this.fetchTokenDecimals(address) as i32;
    }

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

// TVL
export function getTokenBalance(
  tokenAddress: Address,
  gatewayAddress: Address
): BigInt {
  let inputTokenBalance: BigInt = BIGINT_ZERO;
  const erc20 = _ERC20.bind(tokenAddress);
  const inputTokenBalanceResult = erc20.try_balanceOf(gatewayAddress);
  if (inputTokenBalanceResult.reverted) {
    log.critical(
      "[ERC20:balanceOf()] calculate token balance owned by bridge contract reverted",
      []
    );
  } else {
    inputTokenBalance = inputTokenBalanceResult.value;
  }
  return inputTokenBalance;
}

// Constants
export const ACROSS_PROTOCOL_NAME = "across-v2";
export const ACROSS_HUB_POOL_CONTRACT =
  "0xc186fa914353c44b2e33ebe05f21846f1048beda";
export const ACROSS_REWARD_TOKEN = "0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f";
export const ACROSS_ACCELERATING_DISTRIBUTOR_CONTRACT =
  "0x9040e41ef5e8b281535a96d9a48acb8cfabd9a48";
export const ACROSS_PROTOCOL_DEPLOYER_CONTRACT =
  "0x9a8f92a830a5cb89a3816e3d267cb7791c16b04d";

// Use ACROSS_PROTOCOL_DEPLOYER_CONTRACT to unify
// all activity from different SpokePools on a chain
export const DEPLOYER_BRIDGE_CONFIG = new BridgeConfig(
  ACROSS_PROTOCOL_DEPLOYER_CONTRACT,
  ACROSS_PROTOCOL_NAME,
  ACROSS_PROTOCOL_NAME,
  BridgePermissionType.WHITELIST,
  Versions
);

// Use ACROSS_HUB_POOL_CONTRACT to manage all
// liquidity and staking related activity
export const MAINNET_BRIDGE_CONFIG = new BridgeConfig(
  ACROSS_HUB_POOL_CONTRACT,
  ACROSS_PROTOCOL_NAME,
  ACROSS_PROTOCOL_NAME,
  BridgePermissionType.WHITELIST,
  Versions
);
