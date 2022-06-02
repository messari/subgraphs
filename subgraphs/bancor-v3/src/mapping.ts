// - PoolAdded(indexed address,indexed address)
// - PoolCollectionAdded(indexed uint16,indexed address)
// - PoolCollectionRemoved(indexed uint16,indexed address)
// - PoolCreated(indexed address,indexed address)
// - PoolRemoved(indexed address,indexed address)

import { TokensTraded } from "../generated/BancorNetwork/BancorNetwork";

export function handleTokensTraded(event: TokensTraded): void {}
