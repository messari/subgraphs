/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "./InitializableOwnable.sol";

interface IPermissionManager {
    function initOwner(address) external;

    function isAllowed(address) external view returns (bool);
}

contract PermissionManager is InitializableOwnable {
    bool public _WHITELIST_MODE_ON_;

    mapping(address => bool) internal _whitelist_;
    mapping(address => bool) internal _blacklist_;

    function isAllowed(address account) external view returns (bool) {
        if (_WHITELIST_MODE_ON_) {
            return _whitelist_[account];
        } else {
            return !_blacklist_[account];
        }
    }

    function openBlacklistMode() external onlyOwner {
        _WHITELIST_MODE_ON_ = false;
    }

    function openWhitelistMode() external onlyOwner {
        _WHITELIST_MODE_ON_ = true;
    }

    function addToWhitelist(address account) external onlyOwner {
        _whitelist_[account] = true;
    }

    function removeFromWhitelist(address account) external onlyOwner {
        _whitelist_[account] = false;
    }

    function addToBlacklist(address account) external onlyOwner {
        _blacklist_[account] = true;
    }

    function removeFromBlacklist(address account) external onlyOwner {
        _blacklist_[account] = false;
    }
}
