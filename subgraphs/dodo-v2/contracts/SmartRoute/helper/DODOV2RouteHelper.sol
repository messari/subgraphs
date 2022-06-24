/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IDODOV2} from "../intf/IDODOV2.sol";

contract DODOV2RouteHelper {
    address public immutable _DVM_FACTORY_;
    address public immutable _DPP_FACTORY_;
    address public immutable _DSP_FACTORY_;

    struct PairDetail {
        uint256 i;
        uint256 K;
        uint256 B;
        uint256 Q;
        uint256 B0;
        uint256 Q0;
        uint256 R;
        uint256 lpFeeRate;
        uint256 mtFeeRate;
        address baseToken;
        address quoteToken;
        address curPair;
        uint256 pairVersion;
    }

    constructor(address dvmFactory,address dppFactory,address dspFactory) public {
        _DVM_FACTORY_ = dvmFactory;
        _DPP_FACTORY_ = dppFactory;
        _DSP_FACTORY_ = dspFactory;
    }

    function getPairDetail(address token0,address token1,address userAddr) external view returns (PairDetail[] memory res) {
        (address[] memory baseToken0DVM, address[] memory baseToken1DVM) = IDODOV2(_DVM_FACTORY_).getDODOPoolBidirection(token0,token1);
        (address[] memory baseToken0DPP, address[] memory baseToken1DPP) = IDODOV2(_DPP_FACTORY_).getDODOPoolBidirection(token0,token1);
        (address[] memory baseToken0DSP, address[] memory baseToken1DSP) = IDODOV2(_DSP_FACTORY_).getDODOPoolBidirection(token0,token1);

        uint256 len = baseToken0DVM.length + baseToken1DVM.length + baseToken0DPP.length + baseToken1DPP.length + baseToken0DSP.length + baseToken1DSP.length;
        res = new PairDetail[](len);
        for(uint8 i = 0; i < len; i++) {
            PairDetail memory curRes = PairDetail(0,0,0,0,0,0,0,0,0,address(0),address(0),address(0),2);
            address cur;
            if(i < baseToken0DVM.length) {
                cur = baseToken0DVM[i];
                curRes.baseToken = token0;
                curRes.quoteToken = token1;
            } else if(i < baseToken0DVM.length + baseToken1DVM.length) {
                cur = baseToken1DVM[i - baseToken0DVM.length];
                curRes.baseToken = token1;
                curRes.quoteToken = token0;
            } else if(i < baseToken0DVM.length + baseToken1DVM.length + baseToken0DPP.length) {
                cur = baseToken0DPP[i - baseToken0DVM.length - baseToken1DVM.length];
                curRes.baseToken = token0;
                curRes.quoteToken = token1;
            } else if(i < baseToken0DVM.length + baseToken1DVM.length + baseToken0DPP.length + baseToken1DPP.length)  {
                cur = baseToken1DPP[i - baseToken0DVM.length - baseToken1DVM.length - baseToken0DPP.length];
                curRes.baseToken = token1;
                curRes.quoteToken = token0;
            } else if(i < baseToken0DVM.length + baseToken1DVM.length + baseToken0DPP.length + baseToken1DPP.length + baseToken0DSP.length)  {
                cur = baseToken0DSP[i - baseToken0DVM.length - baseToken1DVM.length - baseToken0DPP.length - baseToken1DPP.length];
                curRes.baseToken = token0;
                curRes.quoteToken = token1;
            } else {
                cur = baseToken1DSP[i - baseToken0DVM.length - baseToken1DVM.length - baseToken0DPP.length - baseToken1DPP.length - baseToken0DSP.length];
                curRes.baseToken = token1;
                curRes.quoteToken = token0;
            }

            (            
                curRes.i,
                curRes.K,
                curRes.B,
                curRes.Q,
                curRes.B0,
                curRes.Q0,
                curRes.R
            ) = IDODOV2(cur).getPMMStateForCall();

            (curRes.lpFeeRate, curRes.mtFeeRate) = IDODOV2(cur).getUserFeeRate(userAddr);
            curRes.curPair = cur;
            res[i] = curRes;
        }
    }
}