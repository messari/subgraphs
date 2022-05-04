import { Network, Protocol } from "../../../src/common/constants"
import { Network_StringMap, Protocol_Network_StringMap } from "../types"

const SUSHI_ADDRESS: Network_StringMap = {
    [Network.MAINNET]: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2',
    [Network.FANTOM]: '0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC',
    [Network.MATIC]: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a',
    [Network.XDAI]: '0x2995D1317DcD4f0aB89f4AE60F3f020A4F17C7CE',
    [Network.BSC]: '0x947950BcC74888a40Ffa2593C5798F11Fc9124C4',
    [Network.ARBITRUM_ONE]: '0xd4d42F0b6DEF4CE0383636770eF773390d85c61A',
    [Network.AVALANCHE]: '0x37B608519F91f70F2EeB0e5Ed9AF4061722e4F76',
    [Network.MOONRIVER]: '0xf390830DF829cf22c53c8840554B98eafC5dCBc2',
    [Network.CELO]: '0x29dFce9c22003A4999930382Fd00f9Fd6133Acd1',
    [Network.FUSE]: '0x90708b20ccC1eb95a4FA7C8b18Fd2C22a0Ff9E78',
    [Network.MOONBEAM]: '0x2C78f1b70Ccf63CDEe49F9233e9fAa99D43AA07e',
  }

const BANANA_ADDRESS: Network_StringMap = {
    [Network.BSC]: '0x5d47bAbA0d66083C52009271faF3F50DCc01023C',
    [Network.MATIC]: '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95',
  }

export const _REWARD_TOKEN: Protocol_Network_StringMap = {
    [Protocol.APESWAP]: BANANA_ADDRESS,
    [Protocol.SUSHISWAP]: SUSHI_ADDRESS,
  }
