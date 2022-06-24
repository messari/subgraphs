/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

interface IDODONFTApprove {
    function isAllowedProxy(address _proxy) external view returns (bool);

    function claimERC721(address nftContract, address who, address dest, uint256 tokenId) external;

    function claimERC1155(address nftContract, address who, address dest, uint256 tokenId, uint256 amount) external;

    function claimERC1155Batch(address nftContract, address who, address dest, uint256[] memory tokenIds, uint256[] memory amounts) external;
}
