import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts/index'
import { BasePool, LiquidityPool } from '../../generated/schema'
import { CurvePoolCoin128 } from '../../generated/templates/CurvePoolTemplate/CurvePoolCoin128'
import { CurvePool } from '../../generated/templates/RegistryTemplate/CurvePool'
import {
  ADDRESS_ZERO,
  BIG_INT_ONE,
  CRYPTO_FACTORY, CURVE_REGISTRY, CURVE_REGISTRY_V2, METAPOOL_FACTORY, METAPOOL_FACTORY_ADDRESS,
  REGISTRY_V1,
  REGISTRY_V2,
  STABLE_FACTORY,
  UNKNOWN_METAPOOLS
} from '../common/constants/index'
import { CurvePoolTemplate, CurvePoolTemplateV2 } from '../../generated/templates'
import { CurveLendingPool } from '../../generated/templates/CurvePoolTemplate/CurveLendingPool'
import { CurveLendingPoolCoin128 } from '../../generated/templates/CurvePoolTemplate/CurveLendingPoolCoin128'
import { ERC20 } from '../../generated/templates/CurvePoolTemplate/ERC20'
import { getPlatform } from './platform'
import { StableFactory } from '../../generated/AddressProvider/StableFactory'
import { getFactory } from './factory'
import { CryptoFactory } from '../../generated/templates/CryptoRegistryTemplate/CryptoFactory'
import { fetchTokenDecimals } from '../common/tokens'
import { getOrCreateToken } from '../common/getters'
import { setPoolBalances, setPoolCoins, setPoolFees, setPoolOutputTokenSupply, setPoolTokenWeights } from '../common/setters'
import { getLpTokenPriceUSD } from './snapshots'

