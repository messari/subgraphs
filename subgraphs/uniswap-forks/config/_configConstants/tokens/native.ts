import {Network} from '../../../src/common/constants';
import { Network_StringMap } from '../types';
import { WETH9_ADDRESS } from './other';
  
export const WNATIVE_ADDRESS: Network_StringMap = {
    [Network.MAINNET]: WETH9_ADDRESS[Network.MAINNET],
    [Network.ARBITRUM_ONE]: WETH9_ADDRESS[Network.ARBITRUM_ONE],
    [Network.FANTOM]: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    [Network.MATIC]: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    [Network.XDAI]: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    [Network.BSC]: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    [Network.AVALANCHE]: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    [Network.CELO]: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    [Network.MOONRIVER]: '0xf50225a84382c74CbdeA10b0c176f71fc3DE0C4d',
    [Network.FUSE]: '0x0BE9e53fd7EDaC9F859882AfdDa116645287C629',
    [Network.MOONBEAM]: '0xAcc15dC74880C9944775448304B263D191c6077F',
  }
  