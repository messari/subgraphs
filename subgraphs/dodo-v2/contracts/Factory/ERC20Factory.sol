/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {ICloneFactory} from "../lib/CloneFactory.sol";
import {InitializableERC20} from "../external/ERC20/InitializableERC20.sol";
import {InitializableMintableERC20} from "../external/ERC20/InitializableMintableERC20.sol";


/**
 * @title DODO ERC20Factory
 * @author DODO Breeder
 *
 * @notice Help user to create erc20 token
 */
contract ERC20Factory {
    // ============ Templates ============

    address public immutable _CLONE_FACTORY_;
    address public immutable _ERC20_TEMPLATE_;
    address public immutable _MINTABLE_ERC20_TEMPLATE_;

    // ============ Events ============

    event NewERC20(address erc20, address creator, bool isMintable);

    // ============ Registry ============
    // creator -> token address list
    mapping(address => address[]) public _USER_STD_REGISTRY_;

    // ============ Functions ============

    constructor(
        address cloneFactory,
        address erc20Template,
        address mintableErc20Template
    ) public {
        _CLONE_FACTORY_ = cloneFactory;
        _ERC20_TEMPLATE_ = erc20Template;
        _MINTABLE_ERC20_TEMPLATE_ = mintableErc20Template;
    }

    function createStdERC20(
        uint256 totalSupply,
        string memory name,
        string memory symbol,
        uint8 decimals
    ) external returns (address newERC20) {
        newERC20 = ICloneFactory(_CLONE_FACTORY_).clone(_ERC20_TEMPLATE_);
        InitializableERC20(newERC20).init(msg.sender, totalSupply, name, symbol, decimals);
        _USER_STD_REGISTRY_[msg.sender].push(newERC20);
        emit NewERC20(newERC20, msg.sender, false);
    }

    function createMintableERC20(
        uint256 initSupply,
        string memory name,
        string memory symbol,
        uint8 decimals
    ) external returns (address newMintableERC20) {
        newMintableERC20 = ICloneFactory(_CLONE_FACTORY_).clone(_MINTABLE_ERC20_TEMPLATE_);
        InitializableMintableERC20(newMintableERC20).init(
            msg.sender,
            initSupply,
            name,
            symbol,
            decimals
        );
        emit NewERC20(newMintableERC20, msg.sender, true);
    }


    function getTokenByUser(address user) 
        external
        view
        returns (address[] memory tokens)
    {
        return _USER_STD_REGISTRY_[user];
    }
}
