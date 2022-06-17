import { Address } from "@graphprotocol/graph-ts";

import { RewardToken, Token, _Loan } from "../../../../generated/schema";

import {
    ETH_ADDRESS,
    ETH_DECIMALS,
    ETH_NAME,
    ETH_SYMBOL,
    OracleType,
    RewardTokenType,
    ZERO_BD,
    ZERO_BI
} from "../../constants";
import { getAssetDecimals, getAssetName, getAssetSymbol } from "../../utils";

export function getOrCreateToken(tokenAddress: Address): Token {
    let token = Token.load(tokenAddress.toHexString());

    if (!token) {
        token = new Token(tokenAddress.toHexString());

        // check for ETH token - unique
        if (tokenAddress.toHexString() == ETH_ADDRESS) {
            token.name = ETH_NAME;
            token.symbol = ETH_SYMBOL;
            token.decimals = ETH_DECIMALS;
        } else {
            token.name = getAssetName(tokenAddress);
            token.symbol = getAssetSymbol(tokenAddress);
            token.decimals = getAssetDecimals(tokenAddress);
        }

        token.lastPriceUSD = ZERO_BD;
        token.lastPriceBlockNumber = ZERO_BI;
        token._lastPriceOracle = OracleType.NONE;

        token.save();
    }

    return token;
}

export function getOrCreateRewardToken(tokenAddress: Address): RewardToken {
    let rewardToken = RewardToken.load(tokenAddress.toHexString());

    if (!rewardToken) {
        rewardToken = new RewardToken(tokenAddress.toHexString());

        const token = getOrCreateToken(tokenAddress);

        rewardToken.token = token.id;
        rewardToken.type = RewardTokenType.DEPOSIT;

        rewardToken.save();
    }

    return rewardToken;
}
