/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {ERC721URIStorage} from "./ERC721URIStorage.sol";

contract InitializableERC721 is ERC721URIStorage {
    function init(
        address creator,
        string memory name,
        string memory symbol,
        string memory uri
    ) public {
        _name = name;
        _symbol = symbol;
        _mint(creator, 0);
        _setTokenURI(0, uri);
    }
}