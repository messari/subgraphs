import { BigInt, log, BigDecimal, near } from "@graphprotocol/graph-ts";
import { Token, Market, RewardToken } from "../../generated/schema";
import { assets, BI_ZERO, BD_ZERO, ADDRESS_ZERO } from "../utils/const";


export function getOrCreateToken(id: string): Token {
	let token = Token.load(id);
	if (!token) {
		token = new Token(id);
		token.name = "";
		token.decimals = 0;
		token.symbol = "";
		token.extraDecimals = 0;
		token.lastPriceUSD = BD_ZERO;
		token.lastPriceBlockNumber = BI_ZERO;

		let metadata = assets.get(id);
		if (metadata) {
			token.name = metadata.name;
			token.decimals = metadata.decimals as i32;
			token.symbol = metadata.symbol;
		} else {
			log.warning("Token metadata not found {}", [id]);
		}

		token.save();
	}
	return token;
}

export function getOrCreateRewardToken(tokenAddress: string, type: string): RewardToken {
	let id = type.concat("-").concat(tokenAddress);
	let rewardToken = RewardToken.load(id);
	if (!rewardToken) {
		rewardToken = new RewardToken(id);
		let token = getOrCreateToken(tokenAddress);
		rewardToken.token = token.id;
		rewardToken.type = type;
		rewardToken.save();
	}
	return rewardToken as RewardToken;
}