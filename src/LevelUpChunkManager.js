import { ChunkManager, ChunkingUtils } from '@fieldfare/core'

import asyncstorageDown from 'asyncstorage-down'
import levelup from 'levelup'
import AsyncStorage from '@react-native-async-storage/async-storage'


export class LevelUpChunkManager extends ChunkManager
{
	constructor()
	{
		super()
		this.db = new levelup('./chunk', 
		{
			db: location => asyncstorageDown(location, { AsyncStorage })
		})
	}
	
	
	static init()
	{
		const newInstance = new LevelUpChunkManager
		ChunkManager.addInstance(newInstance)
	}


	async storeChunkContents(contents)
	{
		const identifier = await ChunkingUtils.generateIdentifierForData(contents)
		await this.db.put(identifier, contents)
		return identifier
	}


	getChunkContents(identifier)
	{
		// logger.debug('info', 'LevelUpChunkManager fetching res: ' + identifier)
		return new Promise((resolve, reject) => {
			this.db.get(identifier, (error, contents) => {
				if (error) {
					var newError = Error('Chunk fetch failed: ' + {cause: error})
					//logger.debug(error)
					if (error.name === 'NotFoundError') {
						newError.name = 'NOT_FOUND_ERROR'
					}
					reject(newError)
				} else {
					// logger.debug('Id: ' + identifier + ' contents: ' + contents)
					resolve(contents)
				}
			})
		})

	}


}
