import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { ZERO_ADDRESS, WAVAX_CONTRACT_ADDRESS, DEFUALT_DECIMALS, DEFUALT_AMOUNT } from "../helpers/constants";
import { YakERC20 } from "../../generated/YakERC20/YakERC20";
import { calculatePriceInUSD } from "../calculators/priceInUSDCalculator";

export function initInputToken(tokenAddress: Address, blockNumber: BigInt): Token {
  if (tokenAddress == ZERO_ADDRESS) {
    tokenAddress = WAVAX_CONTRACT_ADDRESS;
  }

  const tokenContract = YakERC20.bind(tokenAddress);
  let token = Token.load(tokenAddress.toHexString());

  if (token == null) {
    token = new Token(tokenAddress.toHexString());

    if (tokenContract.try_name().reverted) {
      token.name = "";
    } else {
      token.name = tokenContract.name();
    }

    if (tokenContract.try_symbol().reverted) {
      token.symbol = "";
    } else {
      token.symbol = tokenContract.symbol();
    }

    if (tokenContract.try_decimals().reverted) {
      token.decimals = DEFUALT_DECIMALS.toI32();
    } else {
      token.decimals = tokenContract.decimals();
    }
  }

  token.lastPriceUSD = calculatePriceInUSD(tokenAddress, DEFUALT_AMOUNT);
  token.lastPriceBlockNumber = blockNumber;
  token.save();

  return token;
}