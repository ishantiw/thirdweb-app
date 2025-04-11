
import liskIcon from "./lisk.svg";
import { handleLogin, liskEcosystemWallet, preLogin } from "./wallet";
import { liskSepolia } from "./lisk_network";
import { ConnectButton, TransactionButton } from "thirdweb/react";
import { client } from "./client";
import { getContract, prepareContractCall, toUnits } from "thirdweb";
import lskIcon from './lsk.svg'

const lsk_coin = getContract({
	address: "0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D",
	chain: liskSepolia,
	client: client,
  });
  
  const wallets = [
	liskEcosystemWallet(),
  ]
export function App() {
	return (
		<main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
			<div className="py-20">
				<Header />

				<ConnectButton
					client={client}
					wallets={wallets}
					theme={"dark"}
					connectModal={{ size: "wide" }}
					connectButton={{ label: "Connect your wallet" }}
					supportedTokens={{
						"4202": [
						  {
							address: "0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D",
							name: "Lisk",
							symbol: "LSK",
							icon: lskIcon,
						  },
						],
					  }}
					
					accountAbstraction={{
						chain: liskSepolia, // replace with the chain you want
						sponsorGas: true,
					  }}
				>
				</ConnectButton>
			</div>
		</main>
	);
}

function SendTransaction() {
	return (
		<div>
		<div className="flex justify-center mb-20">
			<text className="text-zinc-300 text-base">
				Login with your email to get started
			</text>
		</div>
	<TransactionButton
		transaction={() =>
			prepareContractCall({
				contract: lsk_coin,
				method:
					"function transfer(address to, uint256 value) returns (bool)",
				params: ["0x79B6252eE6233b8fCF5a6e4d386E74f8fC65314D", toUnits("1", 18)],
			})
		}
	>
		Send
	</TransactionButton>
	</div>
	)
}

function EcosystemLogin() {
	return (
		<div>
			<div className="flex justify-center mb-20">
				<text className="text-zinc-300 text-base">
					Login with your email to get started
				</text>
			</div>
			<div className="flex justify-center mb-10" id="preLoginContainer" hidden={false}>
				<input
					type="email"
					placeholder="Enter your email"
					className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg mr-4"
					id="email"
				/>

				<div className="flex items-center ml-4">
					<input
						type="checkbox"
						id="termsCheckbox"
						className="mr-2"
					/>
					<label htmlFor="termsCheckbox" className="text-zinc-300 text-sm">
						Ecosystem wallet
					</label>
				</div>

				<button
					className="bg-violet-500 text-white px-4 py-2 rounded-lg hover:bg-violet-600 transition-colors"
					onClick={async () => {
						const emailInput = document.getElementById("email") as HTMLInputElement | null;
						const checkbox = document.getElementById("termsCheckbox") as HTMLInputElement | null;
						const button = document.getElementById("preLoginButton") as HTMLButtonElement | null;

						if (emailInput && checkbox) {
							console.log("email value ", emailInput.value);
							const err = await preLogin(emailInput.value, checkbox.checked);
							if (err && err instanceof Error) {
								const accountLabel = document.getElementById("accountLabel") as HTMLDivElement | null;
								if (accountLabel) {
									accountLabel.hidden = false;
									accountLabel.innerHTML = `Connected Account: <b>${err.message}</b>`;
								}
							}
							if (button) {
								button.disabled = true;
								button.textContent = "Code sent! Please wait...";
								setTimeout(() => {
									button.disabled = false;
									button.textContent = "Get Confirmation Code";
								}, 30000); // 30 seconds
							}
						} else {
							console.error("Email input or checkbox element not found");
						}
					}}
					id="preLoginButton"
				>
					Get Confirmation Code
				</button>
			</div>

			<div className="flex justify-center mb-10" id="loginButtonContainer" hidden={false}>
				<input
					type="text"
					placeholder="Enter your verification code"
					className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg mr-4"
					id="verificationCode"
				/>
				<button
					className="bg-violet-500 text-white px-4 py-2 rounded-lg hover:bg-violet-600 transition-colors"
					onClick={async () => {
						let email: string
						let verificationCode: string
						const emailInput = document.getElementById("email") as HTMLInputElement | null;
						const checkbox = document.getElementById("termsCheckbox") as HTMLInputElement | null;
						if (emailInput) {
							email = emailInput.value;
						} else {
							console.error("Email input element not found");
						}
						const verificationCodeInput = document.getElementById("verificationCode") as HTMLInputElement | null;
						if (verificationCodeInput) {
							verificationCode = verificationCodeInput.value;
						}
						else {
							console.error("Verification code input element not found");
						}

						if (emailInput && verificationCodeInput && checkbox) {
							console.log("email value ", emailInput.value)
							console.log("verification code value ", verificationCodeInput.value)
							try {
								const account = await handleLogin(
									emailInput.value,
									verificationCodeInput.value,
									checkbox.checked,
								)
								console.log("Account connected:", account);

								const accountLabel = document.getElementById("accountLabel") as HTMLDivElement | null;
								if (accountLabel) {
									accountLabel.hidden = false;
									accountLabel.innerHTML = `Connected Account: <b>${account.address}</b>`;
									// Connected Account: Failed to sign typed data - 401
									const signedMessage = await account.signMessage({
										message: {
											raw: "0x1111"
										},
										chainId: liskSepolia.id,
									});
									console.log("signedMessage =>", signedMessage);
								}
							} catch (error: any) {
								console.error("Error during login:", error);
								const accountLabel = document.getElementById("accountLabel") as HTMLDivElement | null;
								if (accountLabel) {
									accountLabel.hidden = false;
									accountLabel.innerHTML = `Connected Account: <b>${error.message}</b>`;
								}
							}

						}
					}
					}
					id="loginButton"
				>
					Login with verification code
				</button>
			</div>
			<div className="flex justify-center mb-10">
				<label hidden={true} id="accountLabel" className="bg-gray-700 text-white px-4 py-2 rounded-lg"></label>
			</div></div>)
}
function Header() {
	return (
		<header className="flex flex-col items-center mb-20 md:mb-20">
			<img
				src={liskIcon}
				alt=""
				className="size-[150px] md:size-[150px]"
				style={{
					filter: "drop-shadow(0px 0px 24px #a726a9a8)",
				}}
			/>

			<h1 className="text-2xl md:text-6xl font-bold tracking-tighter mb-6 text-zinc-100">
				Lisk Ecosystem Wallet using ThirdWeb
				<span className="text-zinc-300 inline-block mx-1"> + </span>
				<span className="inline-block -skew-x-6 text-violet-500"> vite </span>
			</h1>
		</header>
	);
}

function ThirdwebResources() {
	return (
		<div className="grid gap-4 lg:grid-cols-3 justify-center">
			<ArticleCard
				title="thirdweb SDK Docs"
				href="https://portal.thirdweb.com/typescript/v5"
				description="thirdweb TypeScript SDK documentation"
			/>

			<ArticleCard
				title="Components and Hooks"
				href="https://portal.thirdweb.com/typescript/v5/react"
				description="Learn about the thirdweb React components and hooks in thirdweb SDK"
			/>

			<ArticleCard
				title="thirdweb Dashboard"
				href="https://thirdweb.com/dashboard"
				description="Deploy, configure, and manage your smart contracts from the dashboard."
			/>
		</div>
	);
}

function ArticleCard(props: {
	title: string;
	href: string;
	description: string;
}) {
	return (
		<a
			href={`${props.href}?utm_source=vite-template`}
			target="_blank"
			className="flex flex-col border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900 transition-colors hover:border-zinc-700"
			rel="noreferrer"
		>
			<article>
				<h2 className="text-lg font-semibold mb-2">{props.title}</h2>
				<p className="text-sm text-zinc-400">{props.description}</p>
			</article>
		</a>
	);
}
