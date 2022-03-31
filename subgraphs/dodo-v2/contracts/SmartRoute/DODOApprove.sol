/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {IERC20} from "../intf/IERC20.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";


/**
 * @title DODOApprove
 * @author DODO Breeder
 *
 * @notice Handle authorizations in DODO platform
 */
contract DODOApprove is InitializableOwnable {
    using SafeERC20 for IERC20;
    
    // ============ Storage ============
    uint256 private constant _TIMELOCK_DURATION_ = 3 days;
    uint256 private constant _TIMELOCK_EMERGENCY_DURATION_ = 24 hours;
    uint256 public _TIMELOCK_;
    address public _PENDING_DODO_PROXY_;
    address public _DODO_PROXY_;

    // ============ Events ============

    event SetDODOProxy(address indexed oldProxy, address indexed newProxy);

    
    // ============ Modifiers ============
    modifier notLocked() {
        require(
            _TIMELOCK_ <= block.timestamp,
            "SetProxy is timelocked"
        );
        _;
    }

    function init(address owner, address initProxyAddress) external {
        initOwner(owner);
        _DODO_PROXY_ = initProxyAddress;
    }

    function unlockSetProxy(address newDodoProxy) public onlyOwner {
        if(_DODO_PROXY_ == address(0))
            _TIMELOCK_ = block.timestamp + _TIMELOCK_EMERGENCY_DURATION_;
        else
            _TIMELOCK_ = block.timestamp + _TIMELOCK_DURATION_;
        _PENDING_DODO_PROXY_ = newDodoProxy;
    }


    function lockSetProxy() public onlyOwner {
       _PENDING_DODO_PROXY_ = address(0);
       _TIMELOCK_ = 0;
    }


    function setDODOProxy() external onlyOwner notLocked() {
        emit SetDODOProxy(_DODO_PROXY_, _PENDING_DODO_PROXY_);
        _DODO_PROXY_ = _PENDING_DODO_PROXY_;
        lockSetProxy();
    }


    function claimTokens(
        address token,
        address who,
        address dest,
        uint256 amount
    ) external {
        require(msg.sender == _DODO_PROXY_, "DODOApprove:Access restricted");
        if (amount > 0) {
            IERC20(token).safeTransferFrom(who, dest, amount);
        }
    }

    function getDODOProxy() public view returns (address) {
        return _DODO_PROXY_;
    }
}
