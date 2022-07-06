import {
    LocalHost,
    VolatileResourcesManager,
    WebClientTransceiver,
    generatePrivateKey,
    NVD,
    logger
} from 'fieldfare';

export {
    setEnvironmentUUID,
    setupEnvironment
} from 'fieldfare'

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
