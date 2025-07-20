/**
 * Fieldfare: Backend framework for distributed networks
 *
 * Copyright 2021-2025 Adan Kvitschal
 * ISC LICENSE
 */

import { ChunkManager, ChunkingUtils, logger } from '@fieldfare/core'

import { MMKV } from 'react-native-mmkv';

export class MmkvChunkManager extends ChunkManager {
	
	constructor() {
		super()
		this.completeChunks = new MMKV({
			id: 'complete-chunks',
			encryptionKey: 'complete-chunks-encryption-key',
			sync: true,
		});
        this.incompleteChunks = new MMKV({
			id: 'incomplete-chunks',
			encryptionKey: 'incomplete-chunks-encryption-key',
			sync: true,
		});
	}
	
	static init() {
		const newInstance = new MmkvChunkManager;
		ChunkManager.addInstance(newInstance)
	}

	async storeChunkContents(base64data) {
		let complete = true;
        let depth = 0;
        let size = base64data.length;
        if(size > 1024) {
            throw Error('Chunk size limit exceeded');
        }
        const childrenIdentifiers = await ChunkingUtils.getChildrenIdentifiers(base64data);
        for(const childIdentifier of childrenIdentifiers) {
            const childChunkJson = this.completeChunks.getString(childIdentifier);
			if(!childChunkJson) {
                complete = false;
                break;
            }
			const childChunk = JSON.parse(childChunkJson);
            size += childChunk.size;
            depth = Math.max(depth, childChunk.depth+1);
        }
        const identifier = await ChunkingUtils.generateIdentifierForData(base64data);
        if(complete) {
			logger.debug('[MMKV-CM] stored complete: ' + identifier.substring(0, 10) + '... size: ' + size + ' depth: ' + depth);
			await this.completeChunks.set(identifier, JSON.stringify({base64data, depth, size}));
			return {identifier, base64data, complete, depth, size};
        }
		await this.incompleteChunks.set(identifier, base64data);
		logger.debug('[MMKV-CM] stored incomplete: ' + identifier.substring(0, 10) + '...');
		return {identifier, base64data, complete};
	}

	getChunkContents(identifier) {
		const completeChunkJson = this.completeChunks.getString(identifier);
		if(completeChunkJson) {
			const completeChunk = JSON.parse(completeChunkJson);
			logger.debug('[MMKV-CM] got local chunk (complete): ' + identifier.substring(0, 10) + '...');
			return({
				base64data: completeChunk.base64data,
				complete: true,
				depth: completeChunk.depth,
				size: completeChunk.size
			});
		} else {
			const incompleteChunk = this.incompleteChunks.getString(identifier);
			if(incompleteChunk) {
				logger.debug('[MMKV-CM] got local chunk (incomplete): ' + identifier.substring(0, 10) + '...');
				return({
					base64data: incompleteChunk,
					complete: false
				});
			}
		}
		const error = Error('Chunk not found');
		error.name = 'NOT_FOUND_ERROR';
		throw(error);
	}

}
