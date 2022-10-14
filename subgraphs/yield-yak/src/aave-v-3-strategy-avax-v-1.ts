import { BigInt } from "@graphprotocol/graph-ts"
import {
  AaveV3StrategyAvaxV1,
  AddReward,
  AllowDepositor,
  Approval,
  Deposit,
  DepositsEnabled,
  OwnershipTransferred,
  Recovered,
  Reinvest,
  RemoveDepositor,
  RemoveReward,
  Transfer,
  UpdateAdminFee,
  UpdateDevAddr,
  UpdateDevFee,
  UpdateMaxTokensToDepositWithoutReinvest,
  UpdateMinTokensToReinvest,
  UpdateReinvestReward,
  Withdraw
} from "../generated/AaveV3StrategyAvaxV1/AaveV3StrategyAvaxV1"
import { ExampleEntity } from "../generated/schema"

export function handleAddReward(event: AddReward): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.rewardToken = event.params.rewardToken
  entity.swapPair = event.params.swapPair

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.ADMIN_FEE_BIPS(...)
  // - contract.DEPOSITS_ENABLED(...)
  // - contract.DEV_FEE_BIPS(...)
  // - contract.DOMAIN_TYPEHASH(...)
  // - contract.MAX_TOKENS_TO_DEPOSIT_WITHOUT_REINVEST(...)
  // - contract.MIN_TOKENS_TO_REINVEST(...)
  // - contract.PERMIT_TYPEHASH(...)
  // - contract.REINVEST_REWARD_BIPS(...)
  // - contract.VERSION_HASH(...)
  // - contract.allowance(...)
  // - contract.allowedDepositors(...)
  // - contract.approve(...)
  // - contract.balanceOf(...)
  // - contract.checkReward(...)
  // - contract.decimals(...)
  // - contract.depositToken(...)
  // - contract.devAddr(...)
  // - contract.estimateDeployedBalance(...)
  // - contract.estimateReinvestReward(...)
  // - contract.getActualLeverage(...)
  // - contract.getDepositTokensForShares(...)
  // - contract.getDomainSeparator(...)
  // - contract.getSharesForDepositTokens(...)
  // - contract.leverageBips(...)
  // - contract.leverageLevel(...)
  // - contract.minMinting(...)
  // - contract.name(...)
  // - contract.nonces(...)
  // - contract.numberOfAllowedDepositors(...)
  // - contract.owner(...)
  // - contract.rewardCount(...)
  // - contract.rewardSwapPairs(...)
  // - contract.rewardToken(...)
  // - contract.safetyFactor(...)
  // - contract.supportedRewards(...)
  // - contract.symbol(...)
  // - contract.totalDeposits(...)
  // - contract.totalSupply(...)
  // - contract.transfer(...)
  // - contract.transferFrom(...)
}

export function handleAllowDepositor(event: AllowDepositor): void {}

export function handleApproval(event: Approval): void {}

export function handleDeposit(event: Deposit): void {}

export function handleDepositsEnabled(event: DepositsEnabled): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleRecovered(event: Recovered): void {}

export function handleReinvest(event: Reinvest): void {}

export function handleRemoveDepositor(event: RemoveDepositor): void {}

export function handleRemoveReward(event: RemoveReward): void {}

export function handleTransfer(event: Transfer): void {}

export function handleUpdateAdminFee(event: UpdateAdminFee): void {}

export function handleUpdateDevAddr(event: UpdateDevAddr): void {}

export function handleUpdateDevFee(event: UpdateDevFee): void {}

export function handleUpdateMaxTokensToDepositWithoutReinvest(
  event: UpdateMaxTokensToDepositWithoutReinvest
): void {}

export function handleUpdateMinTokensToReinvest(
  event: UpdateMinTokensToReinvest
): void {}

export function handleUpdateReinvestReward(event: UpdateReinvestReward): void {}

export function handleWithdraw(event: Withdraw): void {}
