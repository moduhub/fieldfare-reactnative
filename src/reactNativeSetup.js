import {
  LocalHost,
  ResourcesManager,
  Environment,
  VolatileResourcesManager,
  WebClientTransceiver,
  generatePrivateKey,
  NVD,
  logger
} from 'fieldfare';

import { LevelUpNVData } from './LevelUpNVData';
import { LevelUpResourcesManager } from './LevelUpResourcesManager';

export async function setupLocalHost(){

  logger.info(">> System initHost - React Native ===================");

  LevelUpNVData.init();

  VolatileResourcesManager.init();
  LevelUpResourcesManager.init();

  var privateKeyData = await NVD.load('privateKey');

	if(privateKeyData === undefined
	|| privateKeyData === null) {
		privateKeyData = await generatePrivateKey();
	}

	await LocalHost.init(privateKeyData);

  LocalHost.assignWebportTransceiver('ws', new WebClientTransceiver);

  logger.debug('LocalHost ID: ' + LocalHost.getID());
}


export async function bootChannels(list){

  for(const webport of list) {
		try {
			var wsChannel = await webClientTransceiver.newChannel(webport.address, webport.port);
			LocalHost.bootChannel(wsChannel);
		} catch (error) {
			logger.error("Cannot reach " + webport.address + " at port " + webport.port + ' cause: ' + error);
		}
	}
}

export async function setupEnvironmentUUID(uuid){
  console.log('[reactNativeSetup.setupEnvironmentUUID] NVD.save(envUUID, ' + uuid + ')');
  await NVD.save('envUUID', uuid);
}

export async function setupEnvironment() {

	const env = new Environment();

  const envUUID = await NVD.load('envUUID');

	await env.init(envUUID);

	LocalHost.addEnvironment(env);

	logger.debug("Iterating env webports");

  const webports = env.elements.get('webports');

  for await (const resource of webports) {
		const webport = await ResourcesManager.getResourceObject(resource);
		logger.debug("webport: " + JSON.stringify(webport));

		switch (webport.protocol) {

			case 'ws': {

				try {

					logger.debug('Accessing ws port at ' + webport.address + ':' + webport.port);

					var wsChannel = await webClientTransceiver.newChannel(webport.address, webport.port);

					LocalHost.bootChannel(wsChannel);

				} catch (error) {
					logger.error("Websocket setup failed: " + error);
				}

			} break;

			default: {
				console.log("unsuported webport protocol: " + webport.protocol);
			}
		}
	}

  return env;
}
