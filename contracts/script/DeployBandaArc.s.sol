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
import {RebalanceFacet} from "../src/banda/facets/RebalanceFacet.sol";
import {BasketAccount} from "../src/banda/accounts/BasketAccount.sol";
import {Mock6551Registry} from "../src/banda/mocks/Mock6551Registry.sol";
import {SecureMockNavAdapter} from "../src/banda/mocks/SecureMockNavAdapter.sol";
import {TestUSDC} from "../src/banda/mocks/TestUSDC.sol";
import {GatewayToken} from "../src/banda/gateway/GatewayToken.sol";
import {PricedAssetPool} from "../src/banda/gateway/PricedAssetPool.sol";
import {BasketStrategy} from "../src/banda/gateway/BasketStrategy.sol";

interface BandaArcVm {
    function envAddress(string calldata name) external view returns (address value);
    function envUint(string calldata name) external view returns (uint256 value);
    function envString(string calldata name) external view returns (string memory value);
    function readFile(string calldata path) external view returns (string memory data);
    function parseJsonUint(string calldata json, string calldata key) external pure returns (uint256 value);
    function startBroadcast(address signer) external;
    function stopBroadcast() external;
}

/// @notice Arc Mainnet copy of the live Robinhood testnet system: DeployRobinhoodTestnet followed by
///         MigratePaxosPricedRobinhoodTestnet, collapsed into one fresh deployment.
/// @dev Only chain-dependent parameters differ. Settlement is TestUSDC (Arc has no Paxos USDG). The NAV block-lag
///      window is 1,800 Arc blocks (~15 min at ~0.5 s blocks), matching the 15-minute age limit as 20 Robinhood
///      parent blocks did. Strategies 1-20 are disabled placeholders so the live Baskets keep ids 21-25.
contract DeployBandaArc {
    BandaArcVm private constant vm = BandaArcVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 private constant ARC_MAINNET_CHAIN_ID = 5042;
    uint96 private constant MINIMUM_DEPOSIT = 10_000_000;
    uint16 private constant ANNUAL_FEE_BPS = 25;
    uint48 private constant NAV_MAX_AGE = 15 minutes;
    uint48 private constant NAV_MAX_BLOCK_LAG = 1_800;
    uint32 private constant FIRST_LIVE_STRATEGY = 21;

    PricedAssetPool private pool;
    SecureMockNavAdapter private navAdapter;
    Diamond private diamond;
    TestUSDC private settlement;
    string private prices;
    mapping(string => address) private tokenOf;

    function run() external returns (Diamond, TestUSDC, PricedAssetPool, BasketStrategy[5] memory strategies) {
        require(block.chainid == ARC_MAINNET_CHAIN_ID, "Deploy: wrong chain");
        address admin = vm.envAddress("BANDA_ADMIN");
        address operator = vm.envAddress("BANDA_OPERATOR");
        uint256 buffer = vm.envUint("USDC_BUFFER");
        require(operator != address(0) && operator != admin, "Deploy: distinct operator required");
        prices = vm.readFile(vm.envString("PRICES_FILE"));

        vm.startBroadcast(admin);
        settlement = new TestUSDC(admin);
        navAdapter = new SecureMockNavAdapter(admin, operator, 1_000);
        Mock6551Registry registry = new Mock6551Registry();
        BasketAccount accountImplementation = new BasketAccount(address(0), 0, address(0));
        BandaInit init = new BandaInit();
        diamond = new Diamond(
            admin,
            _deployCuts(),
            address(init),
            abi.encodeCall(BandaInit.init, (address(settlement), address(registry), address(accountImplementation)))
        );
        AdminFacet adminFacet = AdminFacet(address(diamond));
        adminFacet.configureNavGuardPolicy(address(navAdapter), NAV_MAX_AGE, NAV_MAX_BLOCK_LAG);
        adminFacet.setRebalanceOperator(operator);
        for (uint32 id = 1; id < FIRST_LIVE_STRATEGY; ++id) {
            adminFacet.configureStrategy(0, address(settlement), MINIMUM_DEPOSIT, ANNUAL_FEE_BPS, admin, false);
        }

        pool = new PricedAssetPool(address(settlement), admin, operator, 15 minutes, 2_000);
        _listMocks();
        tokenOf["USDG"] = address(settlement);
        if (buffer != 0) settlement.mint(address(pool), buffer);
        strategies = _openBaskets(admin);
        vm.stopBroadcast();
        return (diamond, settlement, pool, strategies);
    }

    function _price(string memory symbol) private view returns (uint128) {
        uint256 value = vm.parseJsonUint(prices, string.concat(".", symbol));
        require(value != 0 && value <= type(uint128).max, "Deploy: missing price");
        return uint128(value);
    }

    function _listMocks() private {
        _mock("NVDA", "NVIDIA");
        _mock("TAO", "Bittensor");
        _mock("GOOGL", "Alphabet");
        _mock("NEAR", "NEAR Protocol");
        _mock("GLD", "SPDR Gold Shares");
        _mock("COIN", "Coinbase");
        _mock("CRCL", "Circle");
        _mock("SOL", "Solana");
        _mock("LINK", "Chainlink");
        _mock("BTC", "Bitcoin");
        _mock("SPY", "SPDR S&P 500 ETF");
        _mock("QQQ", "Invesco QQQ");
        _mock("RENDER", "Render");
        _mock("USO", "United States Oil Fund");
        _mock("AMD", "AMD");
        _mock("TSLA", "Tesla");
        _mock("ETH", "Ether");
    }

    function _mock(string memory symbol, string memory name) private {
        GatewayToken token = new GatewayToken(string.concat(name, " (testnet mock)"), symbol, 18, address(pool));
        pool.list(address(token), _price(symbol), 1e18, true);
        tokenOf[symbol] = address(token);
    }

    function _openBaskets(address admin) private returns (BasketStrategy[5] memory strategies) {
        strategies[0] = _basket(admin, _legs6(["NVDA", "TAO", "GOOGL", "NEAR", "GLD", "USDG"], [uint16(3000), 2000, 1500, 1000, 1000, 1500]));
        strategies[1] = _basket(admin, _legs7(["COIN", "CRCL", "ETH", "SOL", "LINK", "GLD", "USDG"], [uint16(2000), 1500, 2000, 1500, 1000, 500, 1500]));
        strategies[2] = _basket(admin, _legs5(["BTC", "SPY", "GLD", "ETH", "USDG"], [uint16(3000), 2500, 2000, 1000, 1500]));
        strategies[3] = _basket(admin, _legs8(["QQQ", "AMD", "TSLA", "RENDER", "SOL", "GLD", "USO", "USDG"], [uint16(2500), 1500, 1500, 1500, 1000, 500, 500, 1000]));
        strategies[4] = _basket(admin, _legs5(["GLD", "SPY", "BTC", "ETH", "USDG"], [uint16(3000), 2000, 1500, 1000, 2500]));
    }

    function _basket(address admin, Legs memory legs) private returns (BasketStrategy strategy) {
        strategy = new BasketStrategy(address(settlement), address(pool), address(diamond), legs.tokens, legs.weights);
        AdminFacet(address(diamond)).configureStrategy(0, address(strategy), MINIMUM_DEPOSIT, ANNUAL_FEE_BPS, admin, true);
        navAdapter.setQuote(address(strategy), 1e18, 1, 1, true);
    }

    struct Legs {
        address[] tokens;
        uint16[] weights;
    }

    function _legs(string[] memory symbols, uint16[] memory weights) private view returns (Legs memory legs) {
        legs.tokens = new address[](symbols.length);
        for (uint256 i; i < symbols.length; ++i) {
            legs.tokens[i] = tokenOf[symbols[i]];
            require(legs.tokens[i] != address(0), "Deploy: unknown symbol");
        }
        legs.weights = weights;
    }

    function _legs5(string[5] memory symbols, uint16[5] memory weights) private view returns (Legs memory) {
        string[] memory s = new string[](5);
        uint16[] memory w = new uint16[](5);
        for (uint256 i; i < 5; ++i) (s[i], w[i]) = (symbols[i], weights[i]);
        return _legs(s, w);
    }

    function _legs6(string[6] memory symbols, uint16[6] memory weights) private view returns (Legs memory) {
        string[] memory s = new string[](6);
        uint16[] memory w = new uint16[](6);
        for (uint256 i; i < 6; ++i) (s[i], w[i]) = (symbols[i], weights[i]);
        return _legs(s, w);
    }

    function _legs7(string[7] memory symbols, uint16[7] memory weights) private view returns (Legs memory) {
        string[] memory s = new string[](7);
        uint16[] memory w = new uint16[](7);
        for (uint256 i; i < 7; ++i) (s[i], w[i]) = (symbols[i], weights[i]);
        return _legs(s, w);
    }

    function _legs8(string[8] memory symbols, uint16[8] memory weights) private view returns (Legs memory) {
        string[] memory s = new string[](8);
        uint16[] memory w = new uint16[](8);
        for (uint256 i; i < 8; ++i) (s[i], w[i]) = (symbols[i], weights[i]);
        return _legs(s, w);
    }

    function _deployCuts() private returns (IDiamondCut.FacetCut[] memory cuts) {
        cuts = new IDiamondCut.FacetCut[](10);
        cuts[0] = _cut(address(new DiamondCutFacet()), _cutSelectors());
        cuts[1] = _cut(address(new DiamondLoupeFacet()), _loupeSelectors());
        cuts[2] = _cut(address(new OwnershipFacet()), _ownershipSelectors());
        cuts[3] = _cut(address(new AdminFacet()), _adminSelectors());
        cuts[4] = _cut(address(new BasketNFTFacet()), _nftSelectors());
        cuts[5] = _cut(address(new DepositFacet()), _depositSelectors());
        cuts[6] = _cut(address(new BasketViewFacet()), _viewSelectors());
        cuts[7] = _cut(address(new RedeemFacet()), _redeemSelectors());
        cuts[8] = _cut(address(new NavGuardFacet()), _navSelectors());
        cuts[9] = _cut(address(new RebalanceFacet()), _rebalanceSelectors());
    }

    function _cut(address facet, bytes4[] memory selectors) private pure returns (IDiamondCut.FacetCut memory) {
        return IDiamondCut.FacetCut(facet, IDiamondCut.FacetCutAction.Add, selectors);
    }

    function _cutSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](1);
        x[0] = DiamondCutFacet.diamondCut.selector;
    }

    function _loupeSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](4);
        x[0] = DiamondLoupeFacet.facets.selector;
        x[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        x[2] = DiamondLoupeFacet.facetAddresses.selector;
        x[3] = DiamondLoupeFacet.facetAddress.selector;
    }

    function _ownershipSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](2);
        x[0] = OwnershipFacet.owner.selector;
        x[1] = OwnershipFacet.transferOwnership.selector;
    }

    function _adminSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](6);
        x[0] = AdminFacet.configureStrategy.selector;
        x[1] = AdminFacet.setPaused.selector;
        x[2] = AdminFacet.configureNavGuard.selector;
        x[3] = AdminFacet.setRebalanceOperator.selector;
        x[4] = AdminFacet.setRebalanceBounds.selector;
        x[5] = AdminFacet.configureNavGuardPolicy.selector;
    }

    function _nftSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](11);
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

    function _depositSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](1);
        x[0] = DepositFacet.deposit.selector;
    }

    function _viewSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](5);
        x[0] = BasketViewFacet.settlementAsset.selector;
        x[1] = BasketViewFacet.isPaused.selector;
        x[2] = BasketViewFacet.strategy.selector;
        x[3] = BasketViewFacet.basket.selector;
        x[4] = BasketViewFacet.feeState.selector;
    }

    function _redeemSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](2);
        x[0] = RedeemFacet.redeem.selector;
        x[1] = RedeemFacet.previewRedeem.selector;
    }

    function _navSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](3);
        x[0] = NavGuardFacet.navGuard.selector;
        x[1] = NavGuardFacet.previewNav.selector;
        x[2] = NavGuardFacet.navBlockLag.selector;
    }

    function _rebalanceSelectors() private pure returns (bytes4[] memory x) {
        x = new bytes4[](1);
        x[0] = RebalanceFacet.rebalance.selector;
    }
}
