// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface INftOwner { function ownerOf(uint256 id) external view returns (address); }

/// @notice ERC-6551 account with Banda's original Diamond-only execution policy.
/// Immutable binding lives in the standard registry proxy footer; no initializer.
contract ArcBasketAccount {
    uint256 public state;
    receive() external payable { revert("Account: native USDC not accepted"); }
    function token() public view returns (uint256 chainId, address tokenContract, uint256 tokenId) {
        require(address(this).code.length == 173, "Account: proxy required");
        bytes memory footer = new bytes(96);
        assembly { extcodecopy(address(), add(footer, 32), 77, 96) }
        return abi.decode(footer, (uint256, address, uint256));
    }
    function owner() public view returns (address) {
        (uint256 chainId, address nft, uint256 id) = token();
        if (chainId != block.chainid) return address(0);
        try INftOwner(nft).ownerOf(id) returns (address holder) { return holder; }
        catch { return address(0); }
    }
    function execute(address target, uint256 value, bytes calldata data) external returns (bytes memory) {
        (uint256 chainId, address nft,) = token();
        require(chainId == block.chainid && msg.sender == nft && owner() != address(0), "Account: controller only");
        require(value == 0, "Account: native value forbidden");
        ++state;
        (bool ok, bytes memory result) = target.call(data);
        if (!ok) { assembly { revert(add(result, 32), mload(result)) } }
        return result;
    }
    // Additional signing restrictions are permitted by ERC-6551. No off-protocol
    // approvals/signatures may bypass Diamond lifecycle custody.
    function isValidSigner(address, bytes calldata) external pure returns (bytes4) { return bytes4(0); }
    function isValidSignature(bytes32, bytes calldata) external pure returns (bytes4) { return 0xffffffff; }
    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x01ffc9a7 || id == 0x6faff5f1 || id == 0x1626ba7e;
    }
}
