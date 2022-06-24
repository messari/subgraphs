/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IFeeRateModel} from "../../../lib/FeeRateModel.sol";
import {IERC20} from "../../../intf/IERC20.sol";
import {DPPTrader} from "./DPPTrader.sol";

/**
 * @title DODO PrivatePool
 * @author DODO Breeder
 *
 * @notice DODOPrivatePool with oracle price
 */
contract DPPOracle is DPPTrader {

    function init(
        address owner,
        address maintainer,
        address baseTokenAddress,
        address quoteTokenAddress,
        uint256 lpFeeRate,
        address mtFeeRateModel,
        uint256 k,
        address i,
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
        require(i !=  address(0), "INVALID_ORACLE");

        _LP_FEE_RATE_ = uint64(lpFeeRate);
        _K_ = uint64(k);
        _I_ = i;

        _IS_OPEN_TWAP_ = isOpenTWAP;
        if(isOpenTWAP) _BLOCK_TIMESTAMP_LAST_ = uint32(block.timestamp % 2**32);
        
        _resetTargetAndReserve();
    }


    function tuneParameters(
        uint256 newLpFeeRate,
        uint256 newK,
        uint256 minBaseReserve,
        uint256 minQuoteReserve
    ) public preventReentrant onlyOwner returns (bool) {
        require(
            _BASE_RESERVE_ >= minBaseReserve && _QUOTE_RESERVE_ >= minQuoteReserve,
            "RESERVE_AMOUNT_IS_NOT_ENOUGH"
        );
        require(newLpFeeRate <= 1e18, "LP_FEE_RATE_OUT_OF_RANGE");
        require(newK <= 1e18, "K_OUT_OF_RANGE");

        _LP_FEE_RATE_ = uint64(newLpFeeRate);
        _K_ = uint64(newK);

        emit LpFeeRateChange(newLpFeeRate);
        return true;
    }


    // ============ Version Control ============

    function version() external pure returns (string memory) {
        return "DPP Oracle 1.0.0";
    }
}
