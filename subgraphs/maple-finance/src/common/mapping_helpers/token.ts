import { Address } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";
import { DEFAULT_DECIMALS, ETH_ADDRESS, ETH_NAME, ETH_SYMBOL, ZERO_BD, ZERO_BI } from "../constants";
import { getAssetDecimals, getAssetName, getAssetSymbol } from "../utils";

export function getOrCreateToken(tokenAddress: Address): Token {
    let token = Token.load(tokenAddress.toHexString());

    if (!token) {
        token = new Token(tokenAddress.toHexString());

        // check for ETH token - unique
        if (tokenAddress.toHexString() == ETH_ADDRESS) {
            token.name = ETH_NAME;
            token.symbol = ETH_SYMBOL;
            token.decimals = DEFAULT_DECIMALS;
        } else {
            token.name = getAssetName(tokenAddress);
            token.symbol = getAssetSymbol(tokenAddress);
            token.decimals = getAssetDecimals(tokenAddress);
        }

        // TODO: get token price
        token.lastPriceUSD = ZERO_BD;
        token.lastPriceBlockNumber = ZERO_BI;
    }

    token.save();
    return token;
}
