// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Diamond} from "../src/diamond/Diamond.sol";
import {IDiamondCut} from "../src/diamond/interfaces/IDiamondCut.sol";
import {DiamondCutFacet} from "../src/diamond/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../src/diamond/facets/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "../src/diamond/facets/OwnershipFacet.sol";
import {BandaInit} from "../src/banda/BandaInit.sol";
import {AdminFacet} from "../src/banda/facets/AdminFacet.sol";
import {BasketNFTFacet} from "../src/banda/facets/BasketNFTFacet.sol";
import {DepositFacet} from "../src/banda/facets/DepositFacet.sol";
import {BasketViewFacet} from "../src/banda/facets/BasketViewFacet.sol";
import {RedeemFacet} from "../src/banda/facets/RedeemFacet.sol";
import {NavGuardFacet} from "../src/banda/facets/NavGuardFacet.sol";


import {DemoUSD} from "../src/banda/demo/DemoToken.sol";
import {MockPortfolioRouter, DemoNavAdapter} from "../src/banda/demo/MockPortfolioRouter.sol";
import {ArcBasketAccount} from "../src/banda/accounts/ArcBasketAccount.sol";
import {RegistryAdapter} from "../src/banda/accounts/RegistryAdapter.sol";

abstract contract ArcDeployment {
    Diamond public deployedDiamond;
    DemoUSD public deployedSettlement;
    MockPortfolioRouter public deployedRouter;
    MockPortfolioRouter[] public deployedRouters;
    DemoNavAdapter public deployedNav;
    RegistryAdapter public deployedAdapter;
    ArcBasketAccount public deployedAccount;
    string[] private legSymbols;
    uint16[] private legWeights;
    uint256[] private legPrices;

    /// @notice Strategy IDs 1-5 follow the frontend catalogue order: NEURAL, RAILS, RESERVE, FRONTIER, FORTRESS.
    function _deployArc(address admin, address registry) internal {
        deployedSettlement = new DemoUSD();
        deployedAdapter = new RegistryAdapter(registry);
        deployedAccount = new ArcBasketAccount();
        BandaInit init = new BandaInit();
        deployedDiamond = new Diamond(admin, _deployCuts(), address(init), abi.encodeCall(BandaInit.init,
            (address(deployedSettlement), address(deployedAdapter), address(deployedAccount))));
        _leg("mNVDA", 3000, 100e6); _leg("mTAO", 2000, 200e6); _leg("mGOOGL", 1500, 150e6);
        _leg("mNEAR", 1000, 5e6); _leg("mGLD", 1000, 250e6); _leg("mCASH", 1500, 1e6);
        _router();
        _leg("mCOIN", 2000, 250e6); _leg("mCRCL", 1500, 100e6); _leg("mETH", 2000, 2500e6); _leg("mSOL", 1500, 150e6);
        _leg("mLINK", 1000, 15e6); _leg("mGLD", 500, 250e6); _leg("mCASH", 1500, 1e6);
        _router();
        _leg("mBTC", 3000, 60_000e6); _leg("mSPY", 2500, 500e6); _leg("mGLD", 2000, 250e6);
        _leg("mETH", 1000, 2500e6); _leg("mCASH", 1500, 1e6);
        _router();
        _leg("mQQQ", 2500, 450e6); _leg("mAMD", 1500, 150e6); _leg("mTSLA", 1500, 250e6); _leg("mRENDER", 1500, 5e6);
        _leg("mSOL", 1000, 150e6); _leg("mGLD", 500, 250e6); _leg("mUSO", 500, 75e6); _leg("mCASH", 1000, 1e6);
        _router();
        _leg("mGLD", 3000, 250e6); _leg("mSPY", 2000, 500e6); _leg("mBTC", 1500, 60_000e6);
        _leg("mETH", 1000, 2500e6); _leg("mCASH", 2500, 1e6);
        _router();
        deployedRouter = deployedRouters[0];
        address[] memory routers = new address[](deployedRouters.length);
        for (uint256 i; i < routers.length; ++i) routers[i] = address(deployedRouters[i]);
        deployedNav = new DemoNavAdapter(routers);
        AdminFacet(address(deployedDiamond)).configureNavGuardPolicy(address(deployedNav), 1 days, 100);
        for (uint256 i; i < routers.length; ++i) {
            AdminFacet(address(deployedDiamond)).configureStrategy(0, routers[i], 10e6, 0, admin, true);
        }
    }

    function _leg(string memory symbol, uint16 weight, uint256 price) private {
        legSymbols.push(symbol); legWeights.push(weight); legPrices.push(price);
    }

    function _router() private {
        deployedRouters.push(new MockPortfolioRouter(deployedSettlement, address(deployedDiamond), legSymbols, legWeights, legPrices));
        delete legSymbols; delete legWeights; delete legPrices;
    }
    function _deployCuts() internal returns (IDiamondCut.FacetCut[] memory cuts) {
        cuts = new IDiamondCut.FacetCut[](9);
        cuts[0] = _cut(address(new DiamondCutFacet()), _cutSelectors());
        cuts[1] = _cut(address(new DiamondLoupeFacet()), _loupeSelectors());
        cuts[2] = _cut(address(new OwnershipFacet()), _ownershipSelectors());
        cuts[3] = _cut(address(new AdminFacet()), _adminSelectors());
        cuts[4] = _cut(address(new BasketNFTFacet()), _nftSelectors());
        cuts[5] = _cut(address(new DepositFacet()), _depositSelectors());
        cuts[6] = _cut(address(new BasketViewFacet()), _viewSelectors());
        cuts[7] = _cut(address(new RedeemFacet()), _redeemSelectors());
        cuts[8] = _cut(address(new NavGuardFacet()), _navSelectors());
    }

    function _cut(address facet, bytes4[] memory selectors) internal pure returns (IDiamondCut.FacetCut memory) {
        return IDiamondCut.FacetCut(facet, IDiamondCut.FacetCutAction.Add, selectors);
    }

    function _cutSelectors() internal pure returns (bytes4[] memory x) {
        x = new bytes4[](1);
        x[0] = DiamondCutFacet.diamondCut.selector;
    }

    function _loupeSelectors() internal pure returns (bytes4[] memory x) {
        x = new bytes4[](4);
        x[0] = DiamondLoupeFacet.facets.selector;
        x[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        x[2] = DiamondLoupeFacet.facetAddresses.selector;
        x[3] = DiamondLoupeFacet.facetAddress.selector;
    }

    function _ownershipSelectors() internal pure returns (bytes4[] memory x) {
        x = new bytes4[](2);
        x[0] = OwnershipFacet.owner.selector;
        x[1] = OwnershipFacet.transferOwnership.selector;
    }

    function _adminSelectors() internal pure returns (bytes4[] memory x) {
        x = new bytes4[](4);
        x[0] = AdminFacet.configureStrategy.selector;
        x[1] = AdminFacet.setPaused.selector;
        x[2] = AdminFacet.configureNavGuard.selector;
        x[3] = AdminFacet.configureNavGuardPolicy.selector;
    }

    function _nftSelectors() internal pure returns (bytes4[] memory x) {
        x = new bytes4[](12);
        x[11] = BasketNFTFacet.supportsInterface.selector;
        x[0] = BasketNFTFacet.name.selector;
        x[1] = BasketNFTFacet.symbol.selector;
        x[2] = BasketNFTFacet.ownerOf.selector;
        x[3] = BasketNFTFacet.balanceOf.selector;
        x[4] = BasketNFTFacet.getApproved.selector;
        x[5] = BasketNFTFacet.isApprovedForAll.selector;
        x[6] = BasketNFTFacet.approve.selector;
        x[7] = BasketNFTFacet.setApprovalForAll.selector;
        x[8] = BasketNFTFacet.transferFrom.selector;
        x[9] = bytes4(keccak256("safeTransferFrom(address,address,uint256)"));
        x[10] = bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)"));
    }

    function _depositSelectors() internal pure returns (bytes4[] memory x) {
        x = new bytes4[](1);
        x[0] = DepositFacet.deposit.selector;
    }

    function _viewSelectors() internal pure returns (bytes4[] memory x) {
        x = new bytes4[](5);
        x[0] = BasketViewFacet.settlementAsset.selector;
        x[1] = BasketViewFacet.isPaused.selector;
        x[2] = BasketViewFacet.strategy.selector;
        x[3] = BasketViewFacet.basket.selector;
        x[4] = BasketViewFacet.feeState.selector;
    }

    function _redeemSelectors() internal pure returns (bytes4[] memory x) {
        x = new bytes4[](2);
        x[0] = RedeemFacet.redeem.selector;
        x[1] = RedeemFacet.previewRedeem.selector;
    }

    function _navSelectors() internal pure returns (bytes4[] memory x) {
        x = new bytes4[](3);
        x[0] = NavGuardFacet.navGuard.selector;
        x[1] = NavGuardFacet.previewNav.selector;
        x[2] = NavGuardFacet.navBlockLag.selector;
    }

}
