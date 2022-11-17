import {
  Staked as StakedEvent,
  Withdrawn as WithdrawnEvent,
} from '../generated/templates/PotPool/PotPool'
import { getVaultFromPotPool } from './utils/potPools'

export function handleStaked(event: StakedEvent): void {
  const amount = event.params.amount
  const poolAddress = event.address

  const vault = getVaultFromPotPool(poolAddress)

  if (!vault) return

  vault.stakedOutputTokenAmount = vault.stakedOutputTokenAmount!.plus(amount)

  vault.save()
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  const amount = event.params.amount
  const poolAddress = event.address

  const vault = getVaultFromPotPool(poolAddress)

  if (!vault) return

  vault.stakedOutputTokenAmount = vault.stakedOutputTokenAmount!.minus(amount)

  vault.save()
}
