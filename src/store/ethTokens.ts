import Vue from "src/vue-ts"
import { StoreOptions, Store as IStore } from "./vuex-type-ext"
import { IChainId, defaultChainId } from "src/blockchains/eth-chains"
import { IWallet } from "./interop"
import { calcWalletId } from "./utils"
import { typedBlockchains } from "src/blockchains"
import { verifiedTokens } from "src/blockchains/eth"

export const options: SOptions = {
	state: {
		ethTokens: {
			accounts: { },
			tokens: {
				1: { },
				3: { },
				4: { },
				42: { },
			},
		}
	},
	getters: {
		ethTokens_getTokenList: (state, getters) => wallet =>
		{
			let key = calcWalletId(wallet)
			let tokens = state.ethTokens.accounts[key]
			if (!tokens)
				return []
			
			return Object.keys(tokens)
		},
		ethTokens_getTokenBalance: (state, getters) => (wallet, tokenAddr) =>
		{
			let key = calcWalletId(wallet)
			let tokens = state.ethTokens.accounts[key]
			if (!tokens)
				return ''
			
			return tokens[tokenAddr] ? tokens[tokenAddr].amount : ''
		},
		ethTokens_hasLoadedBalance: (state, getters) => (wallet, tokenAddr) =>
		{
			let key = calcWalletId(wallet)
			let tokens = state.ethTokens.accounts[key]
			if (!tokens)
				return false
			
			let loaded = tokens[tokenAddr] ? !tokens[tokenAddr].loading : false
			return loaded
		},
		ethTokens_getTokenInfo: (state, getters) => (chainId, tokenAddr) =>
		{
			let info = state.ethTokens.tokens[chainId][tokenAddr.toLowerCase()]
			return info
		},
		ethTokens_getTokensInfo: (state, getters) => (chainId, tokenAddrs) =>
		{
			return tokenAddrs
				.map(addr => addr.toLowerCase())
				.map(x => state.ethTokens.tokens[chainId][x])
		},
		ethTokens_hasLoadedTokenList: (state, getters) => (wallet) =>
		{
			let key = calcWalletId(wallet)
			let tokens = state.ethTokens.accounts[key]
			return !!tokens
		}
	},
	mutations: {
		ethTokens_setBalanceLoading(state, { wallet, tokenAddr, loading })
		{
			let key = calcWalletId(wallet)
			let w = state.ethTokens.accounts[key]
			if (!w)
				w = Vue.set(state.ethTokens.accounts, key, {})
			
			let tkn = w[tokenAddr]
			if (tkn)
				tkn.loading = loading
			else
				Vue.set(w, tokenAddr, { amount: '', loading: loading })
		},
		ethTokens_setTokenBalance(state, { wallet, contractAddr, amount })
		{
			let key = calcWalletId(wallet)
			let w = state.ethTokens.accounts[key]
			if (!w)
				w = Vue.set(state.ethTokens.accounts, key, {})
			
			let tkn = w[contractAddr]
			if (tkn)
				tkn.amount = amount
			else
				Vue.set(w, contractAddr, { amount: amount, loading: false })
		},
		ethTokens_setTokenBalanceEmpty(state, { wallet })
		{
			let key = calcWalletId(wallet)
			Vue.set(state.ethTokens.accounts, key, {})
		},
		ethTokens_setTokenInfo(state, { chainId, contractAddr, info })
		{
			let tokens = state.ethTokens.tokens[chainId]
			Vue.set(tokens, contractAddr, info)
		},
	},
	actions: {
		async ethTokens_updateTokenList(store, { wallet })
		{
			let web3 = typedBlockchains.eth(wallet.chainId)
			let txs = await web3.etherscan.getTokenTxList(wallet.address)
			let addressesObj = txs.reduce((addresses, tx) => (addresses[tx.contractAddress] = 1, addresses), {} as { [addr: string]: 1 })
			let addresses = Object.keys(addressesObj)
			if (!addresses.length)
				store.commit('ethTokens_setTokenBalanceEmpty', { wallet })
			addresses.forEach(addr =>
			{
				store.dispatch('ethTokens_updateTokenBalance', {
					wallet,
					tokenAddr: addr
				})
				store.dispatch('ethTokens_updateTokenInfo', {
					chainId: wallet.chainId as IChainId,
					tokenAddr: addr,
				})
			})
		},
		async ethTokens_updateTokenBalance(store, { wallet, tokenAddr })
		{
			store.commit('ethTokens_setBalanceLoading', {
				wallet,
				tokenAddr,
				loading: true
			})
			let net = typedBlockchains.eth(wallet.chainId)
			let balance = await net.web3.getErc20Balance(wallet.address, tokenAddr)
			store.commit('ethTokens_setTokenBalance', {
				wallet: wallet,
				contractAddr: tokenAddr,
				amount: balance
			})
			store.commit('ethTokens_setBalanceLoading', {
				wallet: wallet,
				tokenAddr: tokenAddr,
				loading: false
			})
			store.dispatch('ethTokens_updateTokenInfo', {
				chainId: wallet.chainId as IChainId,
				tokenAddr
			})
		},
		async ethTokens_updateTokenInfo(store, { chainId, tokenAddr })
		{
			if (store.state.ethTokens.tokens[chainId][tokenAddr])
				return /* console.log(`Store.EthTokens: token ${tokenAddr} on ${chainId} already loaded`), */ Promise.resolve()
			
			if (chainId == defaultChainId)
			{
				let verified = verifiedTokens.map[tokenAddr.toLowerCase()]
				if (verified)
				{
					store.commit('ethTokens_setTokenInfo', {
						chainId,
						contractAddr: tokenAddr,
						info: {
							notatoken: false,
							symbol: verified.symbol,
							decimals: verified.decimals,
							name: verified.name,
							price: 0,
							verified: true,
						}
					})
					return Promise.resolve()
				}
			}
			
			let info = await typedBlockchains.eth(chainId).web3.getTokenInfo(tokenAddr)
			if (info.notatoken)
				return store.commit('ethTokens_setTokenInfo', {
					chainId,
					contractAddr: tokenAddr,
					info: { notatoken: true }
				})
			let price = 0
			store.commit('ethTokens_setTokenInfo', {
				chainId: chainId,
				contractAddr: tokenAddr,
				info: {
					notatoken: false,
					symbol: info.symbol,
					decimals: info.decimals,
					name: info.name,
					price,
					verified: false,
				}
			})
		}
	},
}

export type Store = IStore<IState, MutationPayloadMap, ActionPayloadMap, GettersReturnMap>
export type SOptions = StoreOptions<IState, MutationPayloadMap, ActionPayloadMap, GettersReturnMap>

export interface IState
{
	ethTokens: {
		// lastAddressInfoTime: number
		// addressInfoQueue: Promise<any>[]
		tokens: {
			[chainId in IChainId]: {
				[contractAddr: string]: ITokenInfo
			}
		},
		accounts: {
			[walletKey: string]: {
				[contractAddr: string]: {
					loading: boolean
					amount: string
				}
			}
		}
	}
}
export type ITokenInfo = ITokenInfoOk | INotAToken
interface ITokenInfoOk
{
	notatoken: false

	name: string
	symbol: string
	decimals: number
	price: number
	verified?: boolean
}
interface INotAToken
{
	notatoken: true
}

type MutationPayloadMap = {
	// ethTokens_updateTokens: { address: string, tokens: { [token: string]: number } }
	ethTokens_setTokenBalanceEmpty: { wallet: IWallet }
	ethTokens_setTokenBalance: { wallet: IWallet, contractAddr: string, amount: string }
	ethTokens_setTokenInfo: { chainId: IChainId, contractAddr: string, info: ITokenInfo }
	ethTokens_setBalanceLoading: { wallet: IWallet, tokenAddr: string, loading: boolean }
}

type ActionPayloadMap = {
	ethTokens_updateTokenList: { wallet: IWallet }
	ethTokens_updateTokenBalance: { wallet: IWallet, tokenAddr: string }
	ethTokens_updateTokenInfo: { chainId: IChainId, tokenAddr: string }
}

type GettersReturnMap = {
	// ethTokens_timePassed: number
	// ethTokens_canGetAddressInfo: boolean
	ethTokens_getTokenList: (wallet: IWallet) => string[]
	ethTokens_hasLoadedTokenList: (wallet: IWallet) => boolean
	ethTokens_getTokenBalance: (wallet: IWallet, tokenAddr: string) => string
	ethTokens_hasLoadedBalance: (wallet: IWallet, tokenAddr: string) => boolean
	ethTokens_getTokenInfo: (chainId: IChainId, tokenAddr: string) => ITokenInfo | undefined
	ethTokens_getTokensInfo: (chainId: IChainId, tokenAddrs: string[]) => (ITokenInfo | undefined)[]
}