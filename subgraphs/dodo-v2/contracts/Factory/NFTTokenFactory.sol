/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {ICloneFactory} from "../lib/CloneFactory.sol";
import {InitializableERC721} from "../external/ERC721/InitializableERC721.sol";
import {InitializableERC1155} from "../external/ERC1155/InitializableERC1155.sol";

/**
 * @title DODO NFTTokenFactory
 * @author DODO Breeder
 *
 * @notice Help user to create erc721 && erc1155 token
 */
contract NFTTokenFactory {
    // ============ Templates ============

    address public immutable _CLONE_FACTORY_;
    address public immutable _ERC721_TEMPLATE_;
    address public immutable _ERC1155_TEMPLATE_;

    // ============ Events ============

    event NewERC721(address erc721, address creator);
    event NewERC1155(address erc1155, address creator);

    // ============ Registry ============
    mapping(address => address[]) public _USER_ERC721_REGISTRY_;
    mapping(address => address[]) public _USER_ERC1155_REGISTRY_;

    // ============ Functions ============

    constructor(
        address cloneFactory,
        address erc721Template,
        address erc1155Tempalte
    ) public {
        _CLONE_FACTORY_ = cloneFactory;
        _ERC721_TEMPLATE_ = erc721Template;
        _ERC1155_TEMPLATE_ = erc1155Tempalte;
    }

    function createERC721(
        string memory uri
    ) external returns (address newERC721) {
        newERC721 = ICloneFactory(_CLONE_FACTORY_).clone(_ERC721_TEMPLATE_);
        InitializableERC721(newERC721).init(msg.sender, "DODONFT", "DODONFT", uri);
        _USER_ERC721_REGISTRY_[msg.sender].push(newERC721);
        emit NewERC721(newERC721, msg.sender);
    }

    function createERC1155(
        uint256 amount,
        string memory uri
    ) external returns (address newERC1155) {
        newERC1155 = ICloneFactory(_CLONE_FACTORY_).clone(_ERC1155_TEMPLATE_);
        InitializableERC1155(newERC1155).init(msg.sender, amount, uri);
        _USER_ERC1155_REGISTRY_[msg.sender].push(newERC1155);
        emit NewERC1155(newERC1155, msg.sender);
    }


    function getERC721TokenByUser(address user) 
        external
        view
        returns (address[] memory tokens)
    {
        return _USER_ERC721_REGISTRY_[user];
    }
}
