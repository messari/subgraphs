/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IFeeRateModel} from "../../lib/FeeRateModel.sol";
import {IERC20} from "../../intf/IERC20.sol";
import {DPPTrader} from "./DPPTrader.sol";

/**
 * @title DODO PrivatePool
 * @author DODO Breeder
 *
 * @notice DODOPrivatePool initialization
 */
contract DPP is DPPTrader {
    function init(
        address owner,
        address maintainer,
        address baseTokenAddress,
        address quoteTokenAddress,
        uint256 lpFeeRate,
        address mtFeeRateModel,
        uint256 k,
        uint256 i,
        bool isOpenTWAP
    ) external {
        initOwner(owner);

        require(baseTokenAddress != quoteTokenAddress, "BASE_QUOTE_CAN_NOT_BE_SAME");
        _BASE_TOKEN_ = IERC20(baseTokenAddress);
        _QUOTE_TOKEN_ = IERC20(quoteTokenAddress);

        _MAINTAINER_ = maintainer;
        _MT_FEE_RATE_MODEL_ = IFeeRateModel(mtFeeRateModel);
        
        require(lpFeeRate <= 1e18, "LP_FEE_RATE_OUT_OF_RANGE");
        require(k <= 1e18, "K_OUT_OF_RANGE");
        require(i > 0 && i <= 1e36, "I_OUT_OF_RANGE");
        _LP_FEE_RATE_ = uint64(lpFeeRate);
        _K_ = uint64(k);
        _I_ = uint128(i);

        _IS_OPEN_TWAP_ = isOpenTWAP;
        if(isOpenTWAP) _BLOCK_TIMESTAMP_LAST_ = uint32(block.timestamp % 2**32);
        
        _resetTargetAndReserve();
    }

    // ============ Version Control ============

    function version() virtual external pure returns (string memory) {
        return "DPP 1.0.0";
    }
}
