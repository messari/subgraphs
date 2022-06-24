/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {Ownable} from "../lib/Ownable.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {IERC20} from "../intf/IERC20.sol";


interface IDODORewardVault {
    function reward(address to, uint256 amount) external;
}


contract DODORewardVault is Ownable {
    using SafeERC20 for IERC20;

    address public dodoToken;

    constructor(address _dodoToken) public {
        dodoToken = _dodoToken;
    }

    function reward(address to, uint256 amount) external onlyOwner {
        IERC20(dodoToken).safeTransfer(to, amount);
    }
}
