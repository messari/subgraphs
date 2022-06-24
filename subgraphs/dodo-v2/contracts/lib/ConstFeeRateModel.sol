/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

interface IConstFeeRateModel {
    function init(uint256 feeRate) external;

    function getFeeRate(address) external view returns (uint256);
}

contract ConstFeeRateModel {
    uint256 public _FEE_RATE_;

    function init(uint256 feeRate) external {
        _FEE_RATE_ = feeRate;
    }

    function getFeeRate(address) external view returns (uint256) {
        return _FEE_RATE_;
    }
}
