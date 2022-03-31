/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../lib/InitializableOwnable.sol";

interface IFeeRateImpl {
    function getFeeRate(address pool, address trader) external view returns (uint256);
}

interface IFeeRateModel {
    function getFeeRate(address trader) external view returns (uint256);
}

contract FeeRateModel is InitializableOwnable {
    address public feeRateImpl;

    function setFeeProxy(address _feeRateImpl) public onlyOwner {
        feeRateImpl = _feeRateImpl;
    }
    
    function getFeeRate(address trader) external view returns (uint256) {
        if(feeRateImpl == address(0))
            return 0;
        return IFeeRateImpl(feeRateImpl).getFeeRate(msg.sender,trader);
    }
}
