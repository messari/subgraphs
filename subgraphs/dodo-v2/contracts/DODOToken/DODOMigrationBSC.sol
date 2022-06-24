/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IERC20} from "../intf/IERC20.sol";
import {SafeMath} from "../lib/SafeMath.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {IDODOApproveProxy} from "../SmartRoute/DODOApproveProxy.sol";

/**
 * @title DODOMigration between Ethereum and BSC
 * @author DODO Breeder
 */
contract DODOMigrationBSC is InitializableOwnable {
    using SafeMath for uint256;

    // ============ Storage ============

    address public immutable _ETH_DODO_TOKEN_;
    address public immutable _DODO_APPROVE_PROXY_;
    mapping(address => uint256) public balances;

    constructor(address ethDodoToken, address dodoApproveProxy) public {
        _ETH_DODO_TOKEN_ = ethDodoToken;
        _DODO_APPROVE_PROXY_ = dodoApproveProxy;
    }

    // ============ Events ============

    event Lock(address indexed sender, address indexed mintToBscAccount, uint256 amount);
    event Unlock(address indexed to, uint256 amount);

    // ============ Functions ============

    function lock(uint256 amount, address mintToBscAccount) external {
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(
            _ETH_DODO_TOKEN_,
            msg.sender,
            address(this),
            amount
        );
        balances[msg.sender] = balances[msg.sender].add(amount);
        emit Lock(msg.sender, mintToBscAccount, amount);
    }

    function unlock(address unlockTo, uint256 amount) external onlyOwner {
        require(balances[unlockTo] >= amount);
        balances[unlockTo] = balances[unlockTo].sub(amount);
        IERC20(_ETH_DODO_TOKEN_).transfer(unlockTo, amount);
        emit Unlock(unlockTo, amount);
    }

}
