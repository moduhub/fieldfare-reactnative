/**
 * Fieldfare: Backend framework for distributed networks
 *
 * Copyright 2021-2025 Adan Kvitschal
 * ISC LICENSE
 */

import {
	LocalHost,
	cryptoManager,
	logger,
	NVD,
	Collection,
	ChunkList,
	ChunkSet,
	ChunkMap,
} from '@fieldfare/core';
import {
	WebClientTransceiver
} from '@fieldfare/browser';
import { MmkvNVD } from './MmkvNVD.js'
import { MmkvChunkManager } from './MmkvChunkManager.js'
import { ReactNativeCryptoManager } from './ReactNativeCryptoManager.js'

export async function setEnvironmentUUID(uuid) {
	await NVD.save('envUUID', uuid)
}

export async function setupEnvironment() {
	const envUUID = await NVD.load('envUUID');
	if (!envUUID) {
		throw Error('Environment UUID not defined, please check your setup');
	}
	const env = new Environment(envUUID);
	await env.init();
	return env
}

export function terminate() {
	LocalHost.terminate();
}

function setupBasicCollectionTypes()  {
	Collection.registerType('list', ChunkList);
	Collection.registerType('set', ChunkSet);
	Collection.registerType('map', ChunkMap);
}

export async function getBootWebports() {
	const webportsJSON = await NVD.load('bootWebports');
	let bootWebports;
	if (webportsJSON === null || webportsJSON === undefined) {
		bootWebports = [];
	} else {
		bootWebports = JSON.parse(webportsJSON);
	}
	return bootWebports;
}

export async function init() {
	try {
		logger.debug('>> System initHost - React Native ===================');
		MmkvNVD.init();
		MmkvChunkManager.init();
		await ReactNativeCryptoManager.init();
		setupBasicCollectionTypes();
		const localKeypair = await cryptoManager.getLocalKeypair();
		await LocalHost.init(localKeypair);
		LocalHost.assignWebportTransceiver('ws', new WebClientTransceiver);
		logger.debug(`>> Fieldfare LocalHost ID: ${LocalHost.getID()}`);
		logger.debug('>> Fieldfare React Native Setup Done! ===============');
	} catch (error) {
		console.error(`*** ERROR >> Fieldfare React Native: Could not Setup LocalHost. Error: ${error}`, error.stack);
	}
}