import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { InterestRate, RewardToken, Token, _Loan } from "../../../../generated/schema";

import {
    ETH_ADDRESS,
    ETH_DECIMALS,
    ETH_NAME,
    ETH_SYMBOL,
    OracleType,
    PROTOCOL_INTEREST_RATE_SIDE,
    PROTOCOL_INTEREST_RATE_TYPE,
    RewardTokenType,
    ZERO_BD,
    ZERO_BI
} from "../../constants";
import { getAssetDecimals, getAssetName, getAssetSymbol } from "../../utils";
import { getOrCreateMarket } from "./markets";

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

/**
 * Create an interest rate, this also adds it to the market that the loan belongs to.
 * @param loan loan this interest rate if for
 * @param rate rate in percentage APY (i.e 5.31% should be stored as 5.31)
 * @param durationDays number of days for the loan
 */
export function createInterestRate(
    event: ethereum.Event,
    loan: _Loan,
    rate: BigDecimal,
    durationDays: BigInt
): InterestRate {
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    const count = market.rates.length + 1;
    const id =
        PROTOCOL_INTEREST_RATE_SIDE + "-" + PROTOCOL_INTEREST_RATE_TYPE + "-" + market.id + "-" + count.toString();
    const interestRate = new InterestRate(id);

    interestRate.rate = rate;
    interestRate.duration = durationDays.toI32();
    interestRate.maturityBlock = null; // Doesn't apply here
    interestRate.side = PROTOCOL_INTEREST_RATE_SIDE;
    interestRate.type = PROTOCOL_INTEREST_RATE_TYPE;
    interestRate._loan = loan.id;

    const newRates = market.rates;
    newRates.push(interestRate.id);
    market.rates = newRates;

    interestRate.save();
    market.save();
    return interestRate;
}
