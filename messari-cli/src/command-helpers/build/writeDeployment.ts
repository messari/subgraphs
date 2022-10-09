import * as fs from 'fs'

interface DeploymentData {
  protocol: string
  base: string
  schema: string
  network: string
  status: string
  versions: Map<string, string>
  files: Map<string, string>
  options: Map<string, string>
}

export function writeDeployment(
  deploymentData: DeploymentData,
  deploymentId: string
) {
  fs.writeFileSync(
    `./protocols/${deploymentData.protocol}/config/deployments/${deploymentId}/deploymentJsonContext.json`,
    JSON.stringify(deploymentData, null, 2)
  )
}
