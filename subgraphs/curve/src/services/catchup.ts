// This is designed to make up for an issue with the way the current main
// registry was added to the address provider. Several pools were registered
// before the registry itself was indexed on the address provider and are
// therefore invisible to the subgraph. We can't backtrack automatically as
// we'd need information that we normally parsed from the event/registry.
// Issue may appear again in the future or on sidechain, so more functions
// might be added in the future.

import { Address, Bytes, log } from '@graphprotocol/graph-ts'
import {
  LENDING,
  REGISTRY_V1,
  CATCHUP_BLOCK,
  CURVE_REGISTRY_V1
} from '../common/constants/index'
import { createNewPool } from './pools'
import { MetaPool } from '../../generated/templates/RegistryTemplate/MetaPool'
import { BigInt } from '@graphprotocol/graph-ts/index'
import { CurvePoolTemplate } from '../../generated/templates'
import { getLpToken } from '../mapping'
import { ERC20 } from '../../generated/templates/CurvePoolTemplate/ERC20'

export function catchUpRegistryMainnet(): void {
  const POOLS = [Address.fromString('0x4ca9b3063ec5866a4b82e437059d2c43d1be596f'),
    Address.fromString('0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56'),
    Address.fromString('0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27'),
    Address.fromString('0x06364f10b501e868329afbc005b3492902d6c763'),
    Address.fromString('0x93054188d876f558f4a66b2ef1d97d16edf0895b'),
    Address.fromString('0xa5407eae9ba41422680e2e00537571bcc53efbfd'),
    Address.fromString('0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c'),
    Address.fromString('0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51'),
    Address.fromString('0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956'),
    Address.fromString('0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604'),
    Address.fromString('0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171'),
    Address.fromString('0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6'),
    Address.fromString('0xc18cc39da8b11da8c3541c598ee022258f9744da'),
    Address.fromString('0x3e01dd8a5e1fb3481f0f589056b428fc308af0fb'),
    Address.fromString('0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1'),
    Address.fromString('0xc25099792e9349c7dd09759744ea681c7de2cb66')]
  const TYPES = [REGISTRY_V1, LENDING, LENDING, LENDING,
    REGISTRY_V1, LENDING, LENDING, LENDING,
    REGISTRY_V1, REGISTRY_V1, REGISTRY_V1, REGISTRY_V1,
    REGISTRY_V1, REGISTRY_V1, REGISTRY_V1, REGISTRY_V1
  ]
  for (let i = 0; i < POOLS.length; i++) {
    log.info('Manually adding pool {}', [POOLS[i].toHexString()])
    const testMetaPool = MetaPool.bind(POOLS[i])
    const testMetaPoolResult = testMetaPool.try_base_pool()
    const lpToken = getLpToken(POOLS[i], CURVE_REGISTRY_V1)
    const lpTokenContract = ERC20.bind(lpToken)
    CurvePoolTemplate.create(POOLS[i])
    createNewPool(
      POOLS[i],
      lpToken,
      lpTokenContract.name(),
      lpTokenContract.symbol(),
      TYPES[i],
      testMetaPoolResult.reverted ? false : true,
      false,
      CATCHUP_BLOCK,
      BigInt.fromI32(1617872135),
      testMetaPoolResult.reverted ? POOLS[i] : testMetaPoolResult.value
    )
  }
}