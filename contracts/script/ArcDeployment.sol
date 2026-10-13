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
    DemoNavAdapter public deployedNav;
    RegistryAdapter public deployedAdapter;
    ArcBasketAccount public deployedAccount;
    function _deployArc(address admin, address registry) internal {
        deployedSettlement = new DemoUSD();
        deployedAdapter = new RegistryAdapter(registry);
        deployedAccount = new ArcBasketAccount();
        BandaInit init = new BandaInit();
        deployedDiamond = new Diamond(admin, _deployCuts(), address(init), abi.encodeCall(BandaInit.init,
            (address(deployedSettlement), address(deployedAdapter), address(deployedAccount))));
        uint16[] memory weights = new uint16[](6);
        weights[0]=3000; weights[1]=2000; weights[2]=1500; weights[3]=1000; weights[4]=1000; weights[5]=1500;
        uint256[] memory prices = new uint256[](6);
        prices[0]=100e6; prices[1]=200e6; prices[2]=150e6; prices[3]=5e6; prices[4]=250e6; prices[5]=1e6;
        deployedRouter = new MockPortfolioRouter(deployedSettlement, address(deployedDiamond), weights, prices);
        deployedNav = new DemoNavAdapter(address(deployedRouter));
        AdminFacet(address(deployedDiamond)).configureNavGuardPolicy(address(deployedNav), 1 days, 100);
        AdminFacet(address(deployedDiamond)).configureStrategy(0, address(deployedRouter), 10e6, 0, admin, true);
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
