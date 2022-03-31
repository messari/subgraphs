/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {Ownable} from "../lib/Ownable.sol";


// Oracle only for test
contract NaiveOracle is Ownable {
    uint256 public tokenPrice;

    function setPrice(uint256 newPrice) external onlyOwner {
        tokenPrice = newPrice;
    }

    function getPrice() external view returns (uint256) {
        return tokenPrice;
    }
}
