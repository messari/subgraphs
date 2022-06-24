/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {ERC1155} from "./ERC1155.sol";
import {Strings} from "../utils/Strings.sol";

contract InitializableERC1155 is ERC1155 {
    using Strings for uint256;
    
    mapping (uint256 => string) private _tokenURIs;
    string internal _baseUri = "";
    bool internal _INITIALIZED_;
    
    function init(
        address creator,
        uint256 amount,
        string memory uri
    ) public {
        require(!_INITIALIZED_, "INITIALIZED");
        _INITIALIZED_ = true;
        _mint(creator, 0, amount ,"");
        _setTokenURI(0, uri);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseUri;

        if (bytes(base).length == 0) {
            return _tokenURI;
        }

        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return super.uri(tokenId);
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }

}
