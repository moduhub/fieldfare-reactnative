import { NVD } from '@fieldfare/core'

import levelup from 'levelup'
import asyncstorageDown from 'asyncstorage-down'
import AsyncStorage from '@react-native-async-storage/async-storage'


export class LevelUpNVD
{
	constructor()
	{
		this.db = new levelup('./nvd', 
		{
			db: location => asyncstorageDown(location, { AsyncStorage })
		})
	}


	static init()
	{	
		NVD.singleton(new LevelUpNVD)
	}

	
	save(key, object)
	{
		console.log('levelupnvdata save', key, 'Object: ', object)

		return new Promise((resolve, reject) => {
			this.db.put(key, JSON.stringify(object), (err) => {
				if (err) {
					console.log('Error in levelupnvdata save, error: ' + err)
					reject(err)
				} else {
					resolve()
				}
			})
		})
	}


	load(key)
	{
		console.log('levelupnvdata load\nkey: ' + key)

		return new Promise((resolve) => {
			this.db.get(key, function (err, value) {
				if (err) {
					resolve(undefined)
				} else {
					// console.log('Gotten value: ', value)
					// console.log('Key: ' + key)
					const object = JSON.parse(value)
					// console.log('Parsed value: ' + JSON.stringify(object))
					resolve(object)
				}
			})
		})
	}

}
