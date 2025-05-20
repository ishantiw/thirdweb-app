import { ConnectButton } from "thirdweb/react";
import { FlowClient } from "../client";
import { liskSepolia } from "../lisk_network";
import lskIcon from '../lsk.svg'
import { Wallet } from "thirdweb/wallets";
import gameIcon from '../test_game_asset.jpg';


export function FlowConnect({wallets}: { wallets: Wallet[] }) {
	return (
		<ConnectButton
			client={FlowClient}
			wallets={wallets}
			theme={"dark"}
			connectModal={{ size: "compact", showThirdwebBranding: false, title: "Connect your wallet", welcomeScreen() {
                return (<span>blabla</span>)
            },}}
			connectButton={{ label: "Connect your wallet" }}
			supportedTokens={{
				"4202": [
					{
						address: "0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D",
						name: "Lisk",
						symbol: "LSK",
						icon: lskIcon,
					},
                    {
						address: "0xed875CABEE46D734F38B5ED453ED1569347c0da8",
						name: "USDC",
						symbol: "usdc",
						// icon: lskIcon,
					},
				],
			}}
            appMetadata={{name: "Lisk App", description: "Lisk App"}}
            // detailsButton={{ render: () => { return <button>Bla </button>} }} // render the details button after logged in
            signInButton={{ label: "Sign in", style: { backgroundColor: "#000000", color: "#ffffff" } }}
            detailsModal={{}}
			accountAbstraction={{
				chain: liskSepolia, // replace with the chain you want
				sponsorGas: true,
			}}
		>
		</ConnectButton>
	)
}

// assetTabs: When you click on "View Assets", by default the "Tokens" tab is shown first.
// If you want to show the "NFTs" tab first, change the order of the asset tabs to: ["nft", "token"] Note: 
// If an empty array is passed, the [View Funds] button will be hidden

// networkSelector.renderChainOverride how the chain button is rendered in the Modal
