import { ChunkManager, ChunkingUtils } from '@fieldfare/core'

import asyncstorageDown from 'asyncstorage-down'
import levelup from 'levelup'
import AsyncStorage from '@react-native-async-storage/async-storage'

const asyncGet = (db, key) => {
	return new Promise((resolve, reject) => {
		db.get(key, (error, value) => {
			if (error) {
				reject(error);
			} else {
				resolve(value);
			}
		});
	});
};

export class LevelUpChunkManager extends ChunkManager {
	
	constructor() {
		super()
		this.completeChunks = levelup('./complete-chunks', 
		{
			db: location => asyncstorageDown(location, { AsyncStorage })
		})
        this.incompleteChunks = levelup('./incomplete-chunks', 
		{
			db: location => asyncstorageDown(location, { AsyncStorage })
		})
	}
	
	static init() {
		const newInstance = new LevelUpChunkManager
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
            let childChunk;
            try {
                childChunk = await asyncGet(this.completeChunks, childIdentifier);
            } catch(error) {
                complete = false;
                break;
            }
            size += childChunk.size;
            depth = Math.max(depth, childChunk.depth+1);
        }
        const identifier = await ChunkingUtils.generateIdentifierForData(base64data);
        if(complete) {
            await this.completeChunks.put(identifier, JSON.stringify({base64data, depth, size}));
			console.log('LevelUpChunkManager.storeChunkContents: Stored complete chunk', identifier);
        } else {
            await this.incompleteChunks.put(identifier, base64data);
			console.log('LevelUpChunkManager.storeChunkContents: Stored incomplete chunk', identifier);
            depth = undefined;
            size = undefined;
        }
        return {identifier, base64data, complete, depth, size};
	}

	getChunkContents(identifier) {
		return new Promise((resolve, reject) => {
            this.completeChunks.get(identifier, (complete_error, complete_chunk_data) => {
				if(complete_error) {
					console.log('LevelUpChunkManager.getChunkContents: COMPLETE ERROR ' + identifier, complete_error);
					if(complete_error.notFound) {
						this.incompleteChunks.get(identifier, (incomplete_error, incomplete_chunk_data) => {
							if(incomplete_error) {
								console.log('LevelUpChunkManager.getChunkContents: INCOMPLETE ERROR ', incomplete_error);
								if(incomplete_error.notFound) {
									//translate to a fieldfare expected error
									const newError = Error('Chunk not found');
									newError.name = 'NOT_FOUND_ERROR';
									reject(newError);
								} else {
									reject(incomplete_error);
								}
							} else {
								console.log('LevelUpChunkManager.getChunkContents: GOT INCOMPLETE ', incomplete_chunk_data);
								resolve({
									base64data: incomplete_chunk_data,
									complete:false
								});
							}
						});
					} else {
						reject(complete_error);
					}
				} else {
					const complete_chunk = JSON.parse(complete_chunk_data);
					console.log('LevelUpChunkManager.getChunkContents: GOT COMPLETE xxx ', complete_chunk);
					resolve({
                		base64data: complete_chunk.base64data,
                		complete: true,
                		depth: complete_chunk.depth,
                		size: complete_chunk.size
            		});
				}
			});
		});
	}

}
