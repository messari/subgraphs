/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity ^0.6.9;

import {SafeERC20} from "../lib/SafeERC20.sol";
import {IERC20} from "../intf/IERC20.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {IDODOApproveProxy} from "../SmartRoute/DODOApproveProxy.sol";


contract DODORecharge is InitializableOwnable {
    using SafeERC20 for IERC20;

    address public immutable _DODO_TOKEN_;
    address public immutable _DODO_APPROVE_PROXY_;

    event DeductDODO(address user,uint256 _amount);
    
    constructor(address dodoAddress, address dodoApproveProxy) public {
        _DODO_TOKEN_ = dodoAddress;
        _DODO_APPROVE_PROXY_ = dodoApproveProxy;
    }

    function deductionDODO(uint256 amount) external {
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(_DODO_TOKEN_, msg.sender, address(this), amount);
        emit DeductDODO(msg.sender, amount);
    }

    // ============ Owner Functions ============
    function claimToken(address token) public onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance>0,"no enough token can claim");
        IERC20(token).safeTransfer(_OWNER_, balance);
    }
}