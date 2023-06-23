import { WebCryptoManager, NVD } from '@fieldfare/core'

import crypto from 'isomorphic-webcrypto'


export class ReactNativeCryptoManager extends WebCryptoManager 
{
	static async init()
	{
		// Only needed for crypto.getRandomValues
		// but only wait once, future calls are secure
		await crypto.ensureSecure()
		const array = new Uint8Array(1)
		crypto.getRandomValues(array)
		
		global.crypto = crypto

		WebCryptoManager.singleton(new ReactNativeCryptoManager)
	}


	async generateLocalKeypair()
	{
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


	async getLocalKeypair()
	{
		const publicKeyJWK = await NVD.load('publicKey')
		const privateKeyJWK = await NVD.load('privateKey')
		
		if (publicKeyJWK === undefined || 
			publicKeyJWK === null || 
			privateKeyJWK === undefined || 
			privateKeyJWK === null) 
		{
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