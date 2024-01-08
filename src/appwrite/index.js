import { Client } from 'appwrite';
import config from './config.json';
const appw = new Client();
appw
    .setEndpoint('https://appwrite.kasoft.co.uk/v1')
    .setProject('653bb473ee7f6a6074e7');
export {appw,config};