import {
  BasePoolAdded,
  MetaPoolDeployed,
  PlainPoolDeployed,
  LiquidityGaugeDeployed,
} from "../../generated/templates/PoolTemplate/Registry";

export function handleBasePoolAdded(event: BasePoolAdded): void {}

export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {}

export function handleLiquidityGaugeDeployed(
  event: LiquidityGaugeDeployed
): void {}
