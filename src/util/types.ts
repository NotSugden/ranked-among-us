import { Guild, GuildMember, Message, TextChannel } from 'discord.js';
import RankedClient from '../client';

export interface GuildMessage extends Message {
	channel: TextChannel;
	client: RankedClient;
	guild: Guild;
	member: GuildMember;
}

export type NullableObject<T extends Record<string, unknown>> = T | {
	[K in keyof T]: null
}