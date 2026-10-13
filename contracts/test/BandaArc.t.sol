// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ArcDeployment} from "../script/ArcDeployment.sol";
import {ERC6551Registry} from "../src/banda/accounts/ERC6551Registry.sol";
import {ArcBasketAccount} from "../src/banda/accounts/ArcBasketAccount.sol";
import {DemoToken, DemoUSD} from "../src/banda/demo/DemoToken.sol";
import {MockPortfolioRouter} from "../src/banda/demo/MockPortfolioRouter.sol";
import {DepositFacet} from "../src/banda/facets/DepositFacet.sol";
import {RedeemFacet} from "../src/banda/facets/RedeemFacet.sol";
import {BasketNFTFacet} from "../src/banda/facets/BasketNFTFacet.sol";
import {DiamondLoupeFacet} from "../src/diamond/facets/DiamondLoupeFacet.sol";
interface ArcVm { function prank(address) external; function warp(uint256) external; function chainId(uint256) external; }

contract BandaArcTest is ArcDeployment {
    ArcVm constant vm = ArcVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant ALICE = address(0xA11CE);
    address constant BOB = address(0xB0B);
    ERC6551Registry registry;
    function setUp() public {
        vm.chainId(5042);
        registry = new ERC6551Registry();
        _deployArc(address(this), address(registry));
        _fund(ALICE); _fund(BOB);
    }
    function _fund(address who) internal {
        vm.prank(who); deployedSettlement.claim();
        vm.prank(who); deployedSettlement.approve(address(deployedDiamond), type(uint256).max);
    }
    function _deposit(address who, uint256 amount) internal returns (uint256 id, address account) {
        vm.prank(who);
        (id, account,) = DepositFacet(address(deployedDiamond)).deposit(1, amount);
    }
    function _fails(address caller, address target, bytes memory data) internal {
        vm.prank(caller); (bool ok,) = target.call(data); require(!ok, "expected rejection");
    }
    function testDeploymentMetadataAndSelectors() public view {
        require(deployedSettlement.decimals() == 6, "credit decimals");
        require(address(deployedSettlement) != address(0x3600000000000000000000000000000000000000), "real USDC");
        require(BasketNFTFacet(address(deployedDiamond)).supportsInterface(0x80ac58cd), "ERC721");
        require(DiamondLoupeFacet(address(deployedDiamond)).facetAddress(DepositFacet.deposit.selector) != address(0), "deposit selector");
        (address[] memory tokens, uint16[] memory weights) = deployedRouter.legs();
        uint256 total;
        for (uint256 i; i < 6; ++i) {
            require(DemoToken(tokens[i]).decimals() == 18 && DemoToken(tokens[i]).issuer() == address(deployedRouter), "token setup");
            total += weights[i];
        }
        require(total == 10_000, "weights");
    }
    function testFaucetDailyLifetimeLimitsAndNoPublicMint() public {
        _fails(ALICE, address(deployedSettlement), abi.encodeCall(DemoUSD.claim, ()));
        _fails(ALICE, address(deployedSettlement), abi.encodeCall(DemoToken.mint, (ALICE, 1e6)));
        for (uint256 i; i < 4; ++i) { vm.warp(block.timestamp + 1 days); vm.prank(ALICE); deployedSettlement.claim(); }
        vm.warp(block.timestamp + 1 days);
        _fails(ALICE, address(deployedSettlement), abi.encodeCall(DemoUSD.claim, ()));
        require(deployedSettlement.balanceOf(ALICE) == 5000e6, "limit");
    }
    function testDeterministicAccountCanBePrecreatedSafely() public {
        address predicted = deployedAdapter.account(address(deployedAccount), block.chainid, address(deployedDiamond), 1, 0);
        registry.createAccount(address(deployedAccount), 0, block.chainid, address(deployedDiamond), 1);
        (uint256 id, address account) = _deposit(ALICE, 100e6);
        require(account == predicted && account.code.length == 173, "deterministic proxy");
        (uint256 chain, address nft, uint256 tokenId) = ArcBasketAccount(payable(account)).token();
        require(chain == 5042 && nft == address(deployedDiamond) && tokenId == id, "binding");
        require(ArcBasketAccount(payable(account)).owner() == ALICE, "account owner");
        _fails(ALICE, account, abi.encodeCall(ArcBasketAccount.execute, (address(deployedSettlement), 0, abi.encodeCall(DemoToken.transfer, (ALICE, 1)))));
    }
    function testFixedAllocationCustodyAndFullRedemption() public {
        (uint256 id, address account) = _deposit(ALICE, 100e6);
        (address[] memory tokens,) = deployedRouter.legs();
        uint256[6] memory expected = [uint256(3e17), 1e17, 1e17, 2e18, 4e16, 15e18];
        for (uint256 i; i < 6; ++i) require(DemoToken(tokens[i]).balanceOf(account) == expected[i], "allocation");
        require(deployedSettlement.balanceOf(address(deployedRouter)) == 100e6 && deployedRouter.totalLiability() == 100e6, "reserve");
        vm.prank(ALICE); RedeemFacet(address(deployedDiamond)).redeem(id, 100e6, 100e6);
        for (uint256 i; i < 6; ++i) require(DemoToken(tokens[i]).balanceOf(account) == 0 && DemoToken(tokens[i]).totalSupply() == 0, "burn");
        require(deployedSettlement.balanceOf(ALICE) == 1000e6 && deployedRouter.totalLiability() == 0, "refund");
        require(ArcBasketAccount(payable(account)).owner() == address(0), "closed account");
        _fails(ALICE, address(deployedDiamond), abi.encodeCall(RedeemFacet.redeem, (id, 100e6, 0)));
    }
    function testRepeatedDepositsUsersAndDonationsAreIsolated() public {
        (uint256 first, address a) = _deposit(ALICE, 100e6);
        (, address b) = _deposit(BOB, 200e6);
        (, address c) = _deposit(ALICE, 50e6);
        require(a != b && a != c && b != c, "account collision");
        vm.prank(BOB); deployedSettlement.transfer(address(deployedRouter), 7e6);
        _fails(BOB, address(deployedDiamond), abi.encodeCall(RedeemFacet.redeem, (first, 100e6, 0)));
        vm.prank(ALICE); RedeemFacet(address(deployedDiamond)).redeem(first, 100e6, 100e6);
        require(deployedSettlement.balanceOf(ALICE) == 950e6, "donation leakage");
        require(deployedRouter.shareBalance(b) == 200e6 && deployedRouter.shareBalance(c) == 50e6, "other accounts changed");
        require(deployedSettlement.balanceOf(address(deployedRouter)) == 257e6, "reserves swept");
    }
    function testTransferMovesControlAndApprovedRedeemPaysCurrentOwner() public {
        (uint256 id, address account) = _deposit(ALICE, 100e6);
        vm.prank(ALICE); BasketNFTFacet(address(deployedDiamond)).transferFrom(ALICE, BOB, id);
        require(ArcBasketAccount(payable(account)).owner() == BOB, "owner follows NFT");
        _fails(ALICE, address(deployedDiamond), abi.encodeCall(RedeemFacet.redeem, (id, 100e6, 0)));
        vm.prank(BOB); BasketNFTFacet(address(deployedDiamond)).approve(ALICE, id);
        vm.prank(ALICE); RedeemFacet(address(deployedDiamond)).redeem(id, 100e6, 100e6);
        require(deployedSettlement.balanceOf(BOB) == 1100e6, "recipient");
    }
    function testZeroMinimumPartialAndSlippageRevertAtomically() public {
        _fails(ALICE, address(deployedDiamond), abi.encodeCall(DepositFacet.deposit, (1, 0)));
        _fails(ALICE, address(deployedDiamond), abi.encodeCall(DepositFacet.deposit, (1, 9999999)));
        (uint256 id, address account) = _deposit(ALICE, 10e6);
        _fails(ALICE, address(deployedDiamond), abi.encodeCall(RedeemFacet.redeem, (id, 5e6, 0)));
        _fails(ALICE, address(deployedDiamond), abi.encodeCall(RedeemFacet.redeem, (id, 10e6, 10e6+1)));
        require(deployedRouter.shareBalance(account) == 10e6, "rollback");
    }
    function testInvalidAllocationAndRealUSDCRejected() public {
        uint16[] memory w = new uint16[](6); uint256[] memory p = new uint256[](6); string[] memory s = new string[](6);
        for(uint256 i; i < 6; ++i) { w[i]=1000; p[i]=1e6; s[i]="mX"; }
        try new MockPortfolioRouter(deployedSettlement, address(deployedDiamond), s, w, p) { revert("bad weights accepted"); } catch {}
        w[5]=5000; p[0]=0;
        try new MockPortfolioRouter(deployedSettlement, address(deployedDiamond), s, w, p) { revert("zero price accepted"); } catch {}
        p[0]=1e6;
        try new MockPortfolioRouter(DemoUSD(0x3600000000000000000000000000000000000000), address(deployedDiamond), s, w, p) { revert("real USDC accepted"); } catch {}
        string[] memory short = new string[](5);
        try new MockPortfolioRouter(deployedSettlement, address(deployedDiamond), short, w, p) { revert("symbol mismatch accepted"); } catch {}
    }
    function testEveryCatalogueBasketDepositsAndRedeemsExactly() public {
        require(deployedRouters.length == 5, "five baskets");
        for (uint32 id = 1; id <= 5; ++id) {
            MockPortfolioRouter router = deployedRouters[id - 1];
            (address[] memory tokens, uint16[] memory weights) = router.legs();
            uint256 total;
            for (uint256 i; i < weights.length; ++i) total += weights[i];
            require(total == 10_000 && keccak256(bytes(DemoToken(tokens[tokens.length - 1]).symbol())) == keccak256("mCASH"), "cash sleeve last");
            vm.prank(ALICE);
            (uint256 tokenId, address account,) = DepositFacet(address(deployedDiamond)).deposit(id, 10e6);
            for (uint256 i; i < tokens.length; ++i) require(DemoToken(tokens[i]).balanceOf(account) != 0, "leg funded");
            vm.prank(ALICE); RedeemFacet(address(deployedDiamond)).redeem(tokenId, 10e6, 10e6);
            require(router.totalLiability() == 0, "liability cleared");
        }
        require(deployedSettlement.balanceOf(ALICE) == 1000e6, "exact principal");
    }
    function testDirectRouterAndMockMintDenied() public {
        (address[] memory tokens,) = deployedRouter.legs();
        _fails(ALICE, tokens[0], abi.encodeCall(DemoToken.mint, (ALICE, 1)));
        _fails(ALICE, address(deployedRouter), abi.encodeCall(MockPortfolioRouter.deposit, (100e6, ALICE)));
        _fails(ALICE, address(deployedRouter), abi.encodeCall(MockPortfolioRouter.redeem, (100e6, ALICE, ALICE)));
    }
    function testFuzzRoundingReturnsExactPrincipal(uint64 seed) public {
        uint256 amount = 10e6 + uint256(seed) % 990e6;
        (uint256 id, address account) = _deposit(ALICE, amount);
        require(deployedRouter.shareBalance(account) == amount, "principal");
        vm.prank(ALICE); RedeemFacet(address(deployedDiamond)).redeem(id, amount, amount);
        require(deployedSettlement.balanceOf(ALICE) == 1000e6, "dust lost");
    }
}
