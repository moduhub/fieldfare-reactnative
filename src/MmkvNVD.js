/**
 * Fieldfare: Backend framework for distributed networks
 *
 * Copyright 2021-2025 Adan Kvitschal
 * ISC LICENSE
 */

import { NVD, logger } from '@fieldfare/core';
import { MMKV } from 'react-native-mmkv';

export class MmkvNVD {

	constructor() {
		this.db = new MMKV({
			id: 'nvd',
			encryptionKey: 'nvd-encryption-key',
			sync: true,
		});
	}

	static init() {	
		NVD.singleton(new MmkvNVD);
	}
	
	save(key, object) {
		const json = JSON.stringify(object);
		logger.debug('[MMKV-NVD] Save: <' + key + '> = <' + json + '>');
		this.db.set(key, json);
	}

	load(key) {
		const json = this.db.getString(key);
		if (json === undefined || json === null) {
			logger.debug('[MMKV-NVD] load: No data found for key: ' + key);
			return null;
		}
		logger.debug('[MMKV-NVD] Load: <' + key + '> = <' + json + '>');
		return(JSON.parse(json));
	}

}
