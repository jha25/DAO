/** @format */
require("dotenv").config()
const HDWalletProvider = require("@truffle/hdwallet-provider")

const private_keys = [process.env.META_KEY]

module.exports = {
	networks: {
		rinkeby: {
			provider: () =>
				new HDWalletProvider({
					privateKeys: private_keys,
					providerOrUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_RINKEBY_ID}`,
				}),
			network_id: 4,
			gas: 5500000,
			// confirmations: 2,
			timeoutBlocks: 200,
			skipDryRun: true,
		},
	},
	// Set default mocha options here, use special reporters etc.
	mocha: {
		// timeout: 100000
	},

	contracts_build_directory: "../frontend/src/utils",

	// Configure your compilers
	compilers: {
		solc: {
			version: "0.8.0", // Fetch exact version from solc-bin (default: truffle's version)
			settings: {
				// See the solidity docs for advice about optimization and evmVersion
				optimizer: {
					enabled: false,
					runs: 200,
				},
				evmVersion: "byzantium",
			},
		},
	},
}
