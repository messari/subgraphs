import { DeploymentCompleted } from '../generated/MegaFactory/MegaFactory'
import { rewardTokens } from './utils/rewardTokens'

export function handleDeploymentCompleted(event: DeploymentCompleted): void {
  // First we have to track the new vault created and then we can track the reward tokens
  // Create new vault entity
  // Bind PotPoolContract
  // Obtain rewardTokenAddress
  // Obtain vaultAddress
  // Create rewardToken entity
  // Add rewardToken to vault
}
