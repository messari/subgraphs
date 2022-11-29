import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts"

import {BackerRewardsData} from "../../generated/schema"
import {BackerRewards as BackerRewardsContract} from "../../generated/BackerRewards/BackerRewards"
import {GFI_DECIMALS} from "../constants"

const BACKER_REWARDS_ID = "1"

export function getBackerRewards(): BackerRewardsData {
  let backerRewards = BackerRewardsData.load(BACKER_REWARDS_ID)
  if (!backerRewards) {
    backerRewards = new BackerRewardsData(BACKER_REWARDS_ID)
    backerRewards.contractAddress = ""
    backerRewards.totalRewards = BigInt.zero()
    backerRewards.totalRewardPercentOfTotalGFI = BigDecimal.zero()
    backerRewards.maxInterestDollarsEligible = BigInt.zero()
  }
  return backerRewards
}

export function updateBackerRewardsData(contractAddress: Address): void {
  const contract = BackerRewardsContract.bind(contractAddress)
  const backerRewards = getBackerRewards()
  backerRewards.contractAddress = contractAddress.toHexString()
  backerRewards.totalRewards = contract.totalRewards()
  backerRewards.totalRewardPercentOfTotalGFI = contract
    .totalRewardPercentOfTotalGFI()
    .toBigDecimal()
    .div(GFI_DECIMALS.toBigDecimal())
    .div(BigDecimal.fromString("100"))
  // Note that this is actually measured in GFI, not dollars
  backerRewards.maxInterestDollarsEligible = contract.maxInterestDollarsEligible()
  backerRewards.save()
}
