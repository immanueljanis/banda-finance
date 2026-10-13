// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {DeployBandaArc} from "../script/DeployBandaArc.s.sol";
import {Diamond} from "../src/diamond/Diamond.sol";
import {TestUSDC} from "../src/banda/mocks/TestUSDC.sol";
import {PricedAssetPool} from "../src/banda/gateway/PricedAssetPool.sol";
import {BasketStrategy} from "../src/banda/gateway/BasketStrategy.sol";
import {SecureMockNavAdapter} from "../src/banda/mocks/SecureMockNavAdapter.sol";
import {DepositFacet} from "../src/banda/facets/DepositFacet.sol";
import {RedeemFacet} from "../src/banda/facets/RedeemFacet.sol";
import {BasketViewFacet} from "../src/banda/facets/BasketViewFacet.sol";
import {NavGuardFacet} from "../src/banda/facets/NavGuardFacet.sol";

interface DeployTestVm {
    function setEnv(string calldata name, string calldata value) external;
    function chainId(uint256) external;
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function roll(uint256) external;
    function warp(uint256) external;
}

contract BandaArcDeployTest {
    DeployTestVm constant vm = DeployTestVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant ADMIN = 0xc924D1236422Ccca9d08e78f059b574f443Ca29d;
    address constant OPERATOR = 0x407dC6447B4D767AB5B5073A8cd7B2D3C9422e13;
    address constant ALICE = address(0xA11CE);
    Diamond diamond;
    TestUSDC usdc;
    PricedAssetPool pool;
    BasketStrategy[5] strategies;

    function setUp() public {
        vm.chainId(5042);
        vm.roll(10_000);
        vm.warp(1_800_000_000);
        vm.setEnv("BANDA_ADMIN", "0xc924D1236422Ccca9d08e78f059b574f443Ca29d");
        vm.setEnv("BANDA_OPERATOR", "0x407dC6447B4D767AB5B5073A8cd7B2D3C9422e13");
        vm.setEnv("USDC_BUFFER", "1000000000000");
        vm.setEnv("PRICES_FILE", "script/data/listing-prices-arc.json");
        (diamond, usdc, pool, strategies) = new DeployBandaArc().run();
    }

    function _freshQuote(uint32 id) internal {
        (address strategy,,,,) = BasketViewFacet(address(diamond)).strategy(id);
        (address adapter,) = NavGuardFacet(address(diamond)).navGuard();
        vm.prank(OPERATOR);
        SecureMockNavAdapter(adapter).setQuote(strategy, 1e18, block.timestamp, block.number, true);
    }

    function testLiveStrategyIdsFeesAndPlaceholders() public view {
        for (uint32 id = 1; id <= 20; ++id) {
            (,,,, bool enabled) = BasketViewFacet(address(diamond)).strategy(id);
            require(!enabled, "placeholder enabled");
        }
        for (uint32 id = 21; id <= 25; ++id) {
            (address strategy, uint96 minimum, uint16 fee,, bool enabled) = BasketViewFacet(address(diamond)).strategy(id);
            require(enabled && fee == 25 && minimum == 10e6 && strategy == address(strategies[id - 21]), "live strategy");
        }
        require(!BasketViewFacet(address(diamond)).isPaused(), "paused");
        require(BasketViewFacet(address(diamond)).settlementAsset() == address(usdc), "settlement");
        require(usdc.balanceOf(address(pool)) == 1_000_000e6, "buffer");
        require(NavGuardFacet(address(diamond)).navBlockLag() == 1_800, "block lag");
    }

    function testEveryBasketDepositsPartiallyAndFullyRedeems() public {
        vm.prank(ALICE); usdc.claim();
        vm.prank(ALICE); usdc.approve(address(diamond), type(uint256).max);
        for (uint32 id = 21; id <= 25; ++id) {
            _freshQuote(id);
            vm.prank(ALICE);
            (uint256 tokenId,,) = DepositFacet(address(diamond)).deposit(id, 100e6);
            vm.roll(block.number + 1_000);
            vm.warp(block.timestamp + 60);
            _freshQuote(id);
            vm.prank(ALICE); RedeemFacet(address(diamond)).redeem(tokenId, 40e6, 0);
            vm.prank(ALICE); RedeemFacet(address(diamond)).redeem(tokenId, 60e6, 0);
        }
        uint256 balance = usdc.balanceOf(ALICE);
        require(balance > 990e6 && balance <= 1_000e6, "round trip at unchanged prices");
    }
}
