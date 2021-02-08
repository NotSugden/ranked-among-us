import { Client, Collection, Constants as DJSConstants, ClientOptions, WSEventType, Snowflake, VoiceChannel, CategoryChannel } from 'discord.js';
import DatabaseManager, { DatabaseOptions } from './DatabaseManager';
import Command from '../struct/Command';
import { promises as fs } from 'fs';
import * as path from 'path';
import QueueManager from './QueueManager';

const COMMANDS_FOLDER = path.join(__dirname, '..', 'commands');
const EVENTS_FOLDER = path.join(__dirname, 'events');

const readdir = async (dir: string | string[], callback: (file: string) => any) => {
	const files = await fs.readdir(typeof dir === 'string' ? dir : path.join(...dir));
	for (const file of files) {
		await callback(file);
	}
	return files;
}

export default class RankedClient extends Client {
	public commands = new Collection<string, Command>();
	public database: DatabaseManager;
	public token: string;
	public queueManager = new QueueManager(this);
	public rankedCategoryID: Snowflake;

	public constructor(config: ClientConfig, options: ClientOptions) {
		super(options);

		this.database = new DatabaseManager(config.database);

		this.token = config.token;
		this.rankedCategoryID = config.category_id;
	}

	public get queueChannel(): VoiceChannel {
		return <VoiceChannel> this.rankedCategory.children.find(
			channel => channel.name === 'Ranked Queue'
		);
	}

	public get rankedCategory(): CategoryChannel {
		return <CategoryChannel> this.channels.cache.get(this.rankedCategoryID);
	}

	public async connect(): Promise<void> {
		try {
			await this.database.connect();
			await readdir(COMMANDS_FOLDER, async file => {
				if (file.endsWith('.js')) {
					const command: Command = new (await import(path.join(COMMANDS_FOLDER, file))).default(this);
					this.commands.set(command.name, command);
				}
			});
			await readdir(EVENTS_FOLDER, async file => {
				if (file.endsWith('.js')) {
					const eventName = file.slice(0, -3);
					if (Object.values<string>(DJSConstants.Events).includes(eventName)) {
						const listener: (...args: unknown[]) => void = (await import(path.join(EVENTS_FOLDER, file))).default;
						
						this.on(eventName, listener);
					}
				}
			});
		} catch (error) {
			this.destroy();
			await this.database.close()
				.catch(error => this.emit('error', error));
			throw error;
		}
		return new Promise((resolve, reject) => {
			this.once('ready', resolve);
			this.login().catch(error => {
				this.off('ready', resolve);
				reject(error);
			});
		});
	}

	public destroy(): void {
		for (const event of this.eventNames()) {
			this.removeAllListeners(<string> event);
		}
		return super.destroy();
	}
}

export interface ClientConfig {
	category_id: Snowflake;
	database: DatabaseOptions;
	token: string;
}