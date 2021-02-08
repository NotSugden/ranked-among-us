import { GuildMember, TextChannel } from 'discord.js';
import RankedClient from '../client';
import Util, { GuildMessage } from '../util';

export default abstract class Command {
	public readonly client!: RankedClient;
	public description!: string;
	public permissions!: NonNullable<CommandOptions['permissions']> | null;
	public usage!: string;
	
	public constructor(client: RankedClient, options: CommandOptions) {
		Object.defineProperty(this, 'client', { value: client });
		Util.specificAssign(this, options, ['description', 'permissions', 'usage']);
		if (!this.permissions) this.permissions = null;
		if (!this.usage) this.usage = '';
	}

	public abstract run(message: GuildMessage, args: string[], extras?: Record<string, unknown>): Promise<unknown>;

	public get name(): string {
		// 'Command' = 7 characters long
		return this.constructor.name.slice(0, -7).toLowerCase();
	}
}

export interface CommandOptions {
	description: string;
	permissions?: (member: GuildMember, channel: TextChannel) => (boolean | string | null | Record<string, unknown>);
	usage?: string;
}