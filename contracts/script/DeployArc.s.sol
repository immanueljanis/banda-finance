// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ArcDeployment} from "./ArcDeployment.sol";
import {ERC6551Registry} from "../src/banda/accounts/ERC6551Registry.sol";

interface ArcDeployVm {
    function envAddress(string calldata) external view returns (address);
    function envUint(string calldata) external view returns (uint256);
    function startBroadcast(address) external;
    function stopBroadcast() external;
    function readFile(string calldata) external view returns (string memory);
    function parseBytes(string calldata) external pure returns (bytes memory);
}

/// @notice Dry-run by default. Foundry requires explicit --broadcast to send transactions.
/// Use an encrypted keystore / hardware signer. No private key is read or logged here.
contract DeployArc is ArcDeployment {
    ArcDeployVm private constant vm = ArcDeployVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address public constant REGISTRY = 0x000000006551c19487814612e58FE06813775758;
    address public constant FACTORY = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    event ArcDeploymentCompleted(address diamond, address demoUSD, address router, address nav, address registry, address adapter, address account);

    function run() external {
        uint256 expected = vm.envUint("BANDA_CHAIN_ID");
        require(expected == 5042 || expected == 5042002 || expected == 31337, "Deploy: unsupported chain");
        require(block.chainid == expected, "Deploy: wrong chain");
        address admin = vm.envAddress("BANDA_DEPLOYER");
        require(admin != address(0), "Deploy: zero admin");
        bytes memory data = vm.parseBytes(vm.readFile("./script/data/erc6551-deployment.hex"));
        // The published transaction includes 32-byte salt + 32-byte init prefix.
        bytes memory runtime = new bytes(data.length - 64);
        for(uint256 i; i < runtime.length; ++i) runtime[i] = data[i + 64];
        vm.startBroadcast(admin);
        address registry;
        if (expected == 31337) {
            registry = address(new ERC6551Registry());
        } else {
            if (REGISTRY.code.length == 0) {
                require(keccak256(FACTORY.code) == keccak256(hex"7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3"), "Deploy: factory bytecode mismatch");
                (bool ok,) = FACTORY.call(data);
                require(ok, "Deploy: singleton creation failed");
            }
            require(REGISTRY.codehash == keccak256(runtime), "Deploy: registry bytecode mismatch");
            registry = REGISTRY;
        }
        _deployArc(admin, registry);
        vm.stopBroadcast();
        emit ArcDeploymentCompleted(address(deployedDiamond), address(deployedSettlement), address(deployedRouter), address(deployedNav), registry, address(deployedAdapter), address(deployedAccount));
    }
}
