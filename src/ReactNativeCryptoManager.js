/**
 * Fieldfare: Backend framework for distributed networks
 *
 * Copyright 2021-2025 Adan Kvitschal
 * ISC LICENSE
 */

import { WebCryptoManager, NVD } from '@fieldfare/core'

import QuickCrypto from 'react-native-quick-crypto';

export class ReactNativeCryptoManager extends WebCryptoManager {
	
	static async init() {
		global.crypto = QuickCrypto;
		WebCryptoManager.singleton(new ReactNativeCryptoManager)
	}

	async generateLocalKeypair() {
		const newKeypair = await crypto.subtle.generateKey(
			{
				name: "ECDSA",
				namedCurve: "P-256"
			},
			true,
			['sign', 'verify']
		)

		const publicKey = newKeypair.publicKey
		const privateKey = newKeypair.privateKey
		const privateKeyJWK = await crypto.subtle.exportKey("jwk", newKeypair.privateKey)
		const publicKeyJWK = await crypto.subtle.exportKey("jwk", newKeypair.publicKey)
		
		await NVD.save('privateKey', privateKeyJWK)
		await NVD.save('publicKey', publicKeyJWK)
		
		return {
			publicKey: 
			{
				index: 0,
				platformData: publicKey
			},
			privateKey: 
			{
				index: 0,
				platformData: privateKey
			}
		}
	}

	async getLocalKeypair() {
		const publicKeyJWK = await NVD.load('publicKey')
		const privateKeyJWK = await NVD.load('privateKey')
		
		if (publicKeyJWK === undefined || 
			publicKeyJWK === null || 
			privateKeyJWK === undefined || 
			privateKeyJWK === null) {
			return this.generateLocalKeypair()
		}
		
		// logger.debug('privateKeyJWK: ' + JSON.stringify(privateKeyJWK))
		const privateKey = await crypto.subtle.importKey(
			'jwk',
			privateKeyJWK,
			{
				name: 'ECDSA',
				namedCurve: 'P-256'
			},
			true,
			['sign']
		)
		
		const publicKey = await crypto.subtle.importKey(
			'jwk',
			publicKeyJWK,
			{
				name: 'ECDSA',
				namedCurve: 'P-256'
			},
			true,
			['verify']
		)
		
		return {
			publicKey: 
			{
				index: 0,
				platformData: publicKey
			},
			privateKey: 
			{
				index: 0,
				platformData: privateKey
			}
		}
	}

}