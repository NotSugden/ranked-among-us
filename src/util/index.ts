import {
	Collection, Guild, GuildChannel,
	GuildMember, Message,
	OverwriteResolvable,
	PermissionOverwrites,
	PermissionOverwriteOption,
	Snowflake, TextChannel, User, OverwriteType,
	Permissions, MessageOptions
} from 'discord.js';
import Command from '../struct/Command';
import { GuildMessage } from './types';
import { Error } from '../Errors';
import * as Constants from './Constants';

export interface PromiseObject<T> extends Promise<T> {
	resolve: (value: T) => void;
	reject: (reason?: unknown) => void;
}

export interface JSONAble {
	toJSON(): object // eslint-disable-line @typescript-eslint/ban-types
}

export type UsersResolvable = (Snowflake | User)[] | Collection<Snowflake, User>;

export default class Util {

	public static async bulkUpdateOverwrites(
		channel: GuildChannel,
		newOverwrites: (PermissionOverwrites | { id: string; options: PermissionOverwriteOption })[],
		reason?: string
	): Promise<void> {
		const overwrites: Collection<Snowflake, OverwriteResolvable> = channel.permissionOverwrites.clone();
		for (const overwriteOptions of newOverwrites) {
			const { id } = overwriteOptions;
			let allow: Permissions, deny: Permissions, type: OverwriteType | undefined;
			if ('options' in overwriteOptions) {
				const overwrite = overwrites.get(id);
				// @ts-expect-error https://github.com/discordjs/discord.js/pull/5302
				({ allow, deny } = PermissionOverwrites.resolveOverwriteOptions(overwriteOptions.options, overwrite));
				type = overwrite?.type;
			} else {
				// @ts-expect-error doesn't require it to be readonly
				({ allow, deny, type } = overwriteOptions);
			}
			overwrites.set(id, { allow, deny, id, type });
		}
		await channel.overwritePermissions(overwrites, reason);
	}

	public static generateGameID(): string {
		const characters = 'abcdefghijlmnopqrstuvwxyz';
		let code = '';
		for(let i = 0;i < 8;i++) {
			const char = characters[Math.floor(Math.random() * characters.length)];
			code += Math.random() > 0.5 ? char.toUpperCase() : char;
		}
		return code;
	}

	public static async getAgreement(msg: string | MessageOptions, channel: TextChannel, options: {
		totalNeeded?: number;
		timeout?: number;
	} = {}): Promise<boolean | null> {
		// @ts-expect-error The things we have to do to satisfy TS
		const message = await channel.send(msg);
		await message.react(Constants.AGREE_EMOJI);
		await message.react(Constants.DISAGREE_EMOJI);
		
		return new Promise(resolve => {
			const collector = message.createReactionCollector(
				({ emoji }) => emoji.id === Constants.AGREE_EMOJI || emoji.id === Constants.DISAGREE_EMOJI, {
					time: options.timeout ? options.timeout * 1000 : 3e4
				}
			).on('collect', reaction => {
				if ((reaction.count! - 1) >= (options.totalNeeded ?? 5)) {
					collector.stop('AGREEMENT_MADE');
					resolve(reaction.emoji.id === Constants.AGREE_EMOJI);
				}
			}).once('end', (_, reason) => {
				if (reason !== 'AGREEMENT_MADE') resolve(null);
			});
		});
	}

	public static safeSerialize(prop: JSONAble): Record<string, unknown> {
		return <Record<string, unknown>> <unknown> prop.toJSON();
	}

	public static getProp(
		object: JSONAble | Record<string, unknown>, path: string[], omit = [
			'token', 'password'
		]
	): string | Record<string, unknown> | number | bigint | symbol {
		const obj = typeof object.toJSON === 'function'
			? Util.safeSerialize(<JSONAble> object)
			: <Record<string, unknown>>object;

		if (typeof obj[path[0]] !== 'object' && path.length > 1) {
			throw new Error('PROPERTY_DOESNT_EXIST', ['Given Object'], path[0]);
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let current: any = obj[path[0]];
		for (let i = 1; i < path.length; i++) {
			const prop = path[i];
			const descriptor = Object.getOwnPropertyDescriptor(current, prop);
			const isLast = i === (path.length - 1);
			const type = typeof current[prop];
			if (
				current[prop] === null || !descriptor || !descriptor.enumerable || omit.includes(prop) ||
				(type !== 'object' && !isLast) || (type === 'undefined' && isLast)
			) {
				throw new Error(
					'PROPERTY_DOESNT_EXIST',
					path.slice(0, i), prop
				);
			}
			current = current[prop];
		}
		return current;
	}

	static promiseAll<T, R>(iterable: Iterable<T>, callback: (value: T) => Promise<R>): Promise<R[]> {
		const promises = [];
		for (const item of iterable) {
			promises.push(callback(item));
		}
		return Promise.all(promises);
	}

	static *membersFrom(users: UsersResolvable, guild: Guild): Generator<GuildMember, void> {
		for (const user of users.values()) {
			yield guild.members.cache.get(user.toString())!;
		}
	}

	static specificAssign<Target, Source>(
		target: Target,
		source: Source,
		props: (keyof Source)[]
	): Target {
		const descriptors = <Record<keyof Source, PropertyDescriptor>> {};
		for (const prop of props) {
			const descriptor = Object.getOwnPropertyDescriptor(source, prop);
			if (descriptor) {
				descriptors[prop] = descriptor;
			}
		}
		Object.defineProperties(target, descriptors);
		return target;
	}

	static hasPermission(message: GuildMessage, command: Command, booleanOnly: true): boolean;
	static hasPermission(message: GuildMessage, command: Command, booleanOnly?: false): string | boolean | null;
	static hasPermission(
		{ member, channel }: GuildMessage,
		command: Command,
		booleanOnly = false
	): string | boolean | null | Record<string, unknown> {
		if (!command.permissions) return true;
		const result = command.permissions(member, channel);
		if (result === false) return false;
		else if (booleanOnly) return true;
		else return result;
	}

	static isGuildMessage(message: Message): message is GuildMessage {
		return message.member !== null;
	}

	static createPromise<T>(): PromiseObject<T> {
		type Func = (value: T) => void;
		let resolve: Func, reject: (reason?: unknown) => void;
		const promise = <PromiseObject<T>> new Promise((_resolve, _reject) => {
			resolve = _resolve;
			reject = _reject;
		});
		promise.resolve = (value: T) => resolve(value);
		promise.reject = (reason?: unknown) => reject(reason);
		return promise;
	}
}

export * from './types';
export { Constants };