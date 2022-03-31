/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

interface IFilter {
    function init(
        address filterAdmin,
        address nftCollection,
        bool[] memory toggles,
        string memory filterName,
        uint256[] memory numParams,
        uint256[] memory priceRules,
        uint256[] memory spreadIds
    ) external;

    function isNFTValid(address nftCollectionAddress, uint256 nftId) external view returns (bool);

    function _NFT_COLLECTION_() external view returns (address);

    function queryNFTIn(uint256 NFTInAmount)
        external
        view
        returns (uint256 rawReceive, uint256 received);

    function queryNFTTargetOut(uint256 NFTOutAmount)
        external
        view
        returns (uint256 rawPay, uint256 pay);

    function queryNFTRandomOut(uint256 NFTOutAmount)
        external
        view
        returns (uint256 rawPay, uint256 pay);

    function ERC721In(uint256[] memory tokenIds, address to) external returns (uint256 received);

    function ERC721TargetOut(uint256[] memory tokenIds, address to) external returns (uint256 paid);

    function ERC721RandomOut(uint256 amount, address to) external returns (uint256 paid);

    function ERC1155In(uint256[] memory tokenIds, address to) external returns (uint256 received);

    function ERC1155TargetOut(
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        address to
    ) external returns (uint256 paid);

    function ERC1155RandomOut(uint256 amount, address to) external returns (uint256 paid);
}
