import { Address } from "@graphprotocol/graph-ts";
import { ADDRESS_ZERO } from "@protofire/subgraph-toolkit";
import { ProfitAndBuybackLog, ProfitLogInReward, StrategyContract } from "../../generated/ControllerListener/StrategyContract";
import { shared, tokens } from "../modules";


export function handleProfitAndBuybackLog(event: ProfitAndBuybackLog): void {
	let strategyContract = StrategyContract.bind(event.address)
	let result = strategyContract.try_rewardToken()
	let rewardTokenAddress = !result.reverted ? result.value : Address.fromHexString(ADDRESS_ZERO) as Address
	let token = tokens.setValuesForToken(
		tokens.loadOrCreateToken(rewardTokenAddress),
		tokens.getValuesForToken(rewardTokenAddress)
	)
	token.save()

	// TODO calc profit

	let reward = tokens.loadOrCreateRewardToken(rewardTokenAddress, "")
	reward.token = token.id
	reward.save()



}
export function handleProfitLogInReward(event: ProfitLogInReward): void { }
