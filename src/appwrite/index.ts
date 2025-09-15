import { Client, Account, Databases, Storage } from 'appwrite';
import config from './config.json';
import { useLoadingStore } from '@/stores/loading';

const appw = new Client();

appw
    .setEndpoint('https://appwrite.tsada.edu.rs/v1')
    .setProject('659ea7f886cf55d4528a');

const account = new Account(appw);
const databases = new Databases(appw);
const storage = new Storage(appw);

interface AppwriteConfig {
    website_db: string;
    website_images: string;
    gallery: string;
    gallery_images: string;
    [key: string]: string;
}

interface UserSession {
    $id: string;
    name: string;
    email: string;
    status: boolean;
    roles?: string[];
}

class AppwriteService {
    private client: Client;
    private account: Account;
    private databases: Databases;
    private storage: Storage;
    public config: AppwriteConfig;

    constructor() {
        this.client = appw;
        this.account = account;
        this.databases = databases;
        this.storage = storage;
        this.config = config as AppwriteConfig;
    }

    async checkAuth(): Promise<UserSession | null> {
        const loading = useLoadingStore();

        try {
            const user = await this.account.get();

            if (user) {
                loading.setUserLoggedin(true);
                return {
                    $id: user.$id,
                    name: user.name,
                    email: user.email,
                    status: true
                };
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            loading.setUserLoggedin(false);
        }

        return null;
    }

    async login(email: string, password: string): Promise<UserSession> {
        const session = await this.account.createEmailPasswordSession(email, password);
        const user = await this.account.get();

        return {
            $id: user.$id,
            name: user.name,
            email: user.email,
            status: true
        };
    }

    async logout(): Promise<void> {
        await this.account.deleteSession('current');
        const loading = useLoadingStore();
        loading.setUserLoggedin(false);
    }

    getClient(): Client {
        return this.client;
    }

    getAccount(): Account {
        return this.account;
    }

    getDatabases(): Databases {
        return this.databases;
    }

    getStorage(): Storage {
        return this.storage;
    }
}

const appwriteService = new AppwriteService();

function randomIntFromInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export {
    appw,
    config,
    account as user,
    databases,
    storage,
    appwriteService,
    randomIntFromInterval
};

export type { AppwriteConfig, UserSession };