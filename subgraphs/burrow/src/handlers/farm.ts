import { JSONValue, JSONValueKind, log, near, TypedMap, BigInt, BigDecimal } from '@graphprotocol/graph-ts';
import { getOrCreateMarket } from '../helpers/market';
import { getOrCreateRewardToken, getOrCreateToken } from '../helpers/token';
import { BD_ZERO } from '../utils/const';

/**
 * {
 *      \'farm_id\':{\'Supplied\':\'aurora\'},
 *      \'reward_token_id\':\'token.burrow.near\',
 *      \'new_reward_per_day\':\'864000\',
 *      \'new_booster_log_base\':\'0\',
 *      \'reward_amount\':\'864000000\'
 * }
 */
export function handleAddAssetFarmReward(
    method: string,
	args: string, // only for logging: remove afterwards
	data: TypedMap<string, JSONValue>,
	receipt: near.ReceiptWithOutcome
): void {
    const farm_id = data.get('farm_id');
    if (!farm_id) {
		log.warning('handleAddAssetFarmReward() :: farm_id not found {}', [args]);
        return;
    }
    if (farm_id.kind != JSONValueKind.OBJECT) {
		log.info('handleAddAssetFarmReward() :: Incorrect type farm_id {}', [
			farm_id.kind.toString(),
		]);
		return;
	}
    const farm_id_obj = farm_id.toObject();
    let farm_id_asset = farm_id_obj.get('Supplied');
    let farmType = 'DEPOSIT';
    if (!farm_id_asset) {
        farm_id_asset = farm_id_obj.get('Borrowed');
        farmType = 'BORROW';
        if(!farm_id_asset) {
            log.warning('handleAddAssetFarmReward() :: farm_id_asset not found {}', [args]);
            return;
        }
    }
    const farm = farm_id_asset.toString();

    const reward_token_id = data.get('reward_token_id');
    if (!reward_token_id) {
        log.warning('handleAddAssetFarmReward() :: reward_token_id not found {}', [args]);
        return;
    }
    const reward_token = reward_token_id.toString();

    const new_reward_per_day_ = data.get('new_reward_per_day');
    if (!new_reward_per_day_) {
        log.warning('handleAddAssetFarmReward() :: new_reward_per_day not found {}', [args]);
        return;
    }
    const new_reward_per_day = new_reward_per_day_.toString();

    const new_booster_log_base = data.get('new_booster_log_base');
    if (!new_booster_log_base) {
        log.warning('handleAddAssetFarmReward() :: new_booster_log_base not found {}', [args]);
        return;
    }

    const reward_amount = data.get('reward_amount');
    if (!reward_amount) {
        log.warning('handleAddAssetFarmReward() :: reward_amount not found {}', [args]);
        return;
    }

    const rewardToken = getOrCreateRewardToken(reward_token, farmType);

    const market = getOrCreateMarket(farm);
    const reward_tokens = market.rewardTokens!;
    // push if reward token does not exists, get index
    let reward_token_index = reward_tokens.indexOf(rewardToken.id);
    if (reward_token_index == -1) {
        reward_tokens.push(rewardToken.id);
        market.rewardTokens = reward_tokens;
        reward_token_index = reward_tokens.length - 1;
    }
    
    // add reward_amount to _reward_remaining_amounts
    const _reward_remaining_amounts = market._reward_remaining_amounts;
    if(_reward_remaining_amounts.length <= reward_token_index)  {
        _reward_remaining_amounts.push(BigInt.fromString(reward_amount.toString()));
    } else {
        _reward_remaining_amounts[reward_token_index] = market._reward_remaining_amounts[reward_token_index].plus(BigInt.fromString(reward_amount.toString()));
    }
    market._reward_remaining_amounts = _reward_remaining_amounts;
    
    // rewardTokenEmissionsAmount
    const rewardTokenEmissionsAmount = market.rewardTokenEmissionsAmount;
    if(rewardTokenEmissionsAmount!.length <= reward_token_index) {
        rewardTokenEmissionsAmount!.push(BigInt.fromString(new_reward_per_day.toString()));
    } else {
        rewardTokenEmissionsAmount![reward_token_index] = BigInt.fromString(new_reward_per_day.toString());
    }
    market.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;

    // rewardTokenEmissionsUSD
    const rewardTokenEmissionsUSD = market.rewardTokenEmissionsUSD;
    const token = getOrCreateToken(rewardToken.token)
    let price = token.lastPriceUSD!;
    if(price.equals(BD_ZERO)){
        price = BigDecimal.fromString('0.001');
    }
    const rewardUSD = BigDecimal.fromString(new_reward_per_day.toString()).div(BigInt.fromString('10').pow((token.decimals + token.extraDecimals) as u8).toBigDecimal()).times(price);
    if(rewardTokenEmissionsUSD!.length <= reward_token_index) {
        rewardTokenEmissionsUSD!.push(rewardUSD);
    } else {
        rewardTokenEmissionsUSD![reward_token_index] = rewardUSD
    }
    market.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

    market.save();
}