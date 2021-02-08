/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */

// require imports used so they can be referenced cleanly in eval
import util = require('util');
import djs = require('discord.js');
import mysql = require('mysql');
import fetch = require('node-fetch');
import { SQLValues } from '../client/DatabaseManager';
import Command from '../struct/Command';
import RankedClient from '../client';
import { GuildMessage } from '../util';

const Util: typeof import('../util').default = require('../util').default;

export default class EvalCommand extends Command {
	public constructor(client: RankedClient) {
		super(client, {
			description: 'Evaluate an expression.',
			permissions: member => member.id === '381694604187009025'
		});
	}

	public async run(message: GuildMessage, args: string[]): Promise<void> {
		const reverse = (string: string) => string.split('').reverse().join('');
		const finish = async (result: unknown) => {
			const inspected = (typeof result === 'string' ? result : util.inspect(result)).replace(
				new RegExp(`${this.client.token}|${reverse(this.client.token!)}`, 'gi'),
				'[TOKEN]'
			);
			if (inspected.length > 1250) {
				const json = await fetch.default('https://paste.nomsy.net/documents', {
					body: inspected,
					headers: {
						'Content-Type': 'application/json'
					}, method: 'POST'
				}).then(response => response.json());
				if (!json.key) {
					return message.channel.send('Output too long for hastebin.');
				}
				return message.channel.send(`https://paste.nomsy.net/${json.key}`);
			}
			return message.channel.send(inspected, { code: 'js' });
		};
		let code = args.join(' ');
		const matches = code.match(/```(?:(?<lang>\S+)\n)?\s?(?<code>[^]+?)\s?```/)?.groups;
		if (matches) {
			const result = await this.resolveCode(message, matches.code || code, {
				finish, lang: matches.lang
			});
			if (typeof result === 'boolean') return;
			code = result;
		}
		try {
			let result = await this._eval(code, message, args);
			if (Array.isArray(result) && result.every(element => typeof element?.then === 'function')) {
				result = await Promise.all(result);
			}
			await finish(result);
		} catch (error) {
			await finish(error.stack || error);
		}
	}

	private _eval(code: string, message: GuildMessage, args: string[]): unknown {
		return eval(code);
	}

	private async resolveCode(message: GuildMessage, code: string, {
		lang,
		finish
	}: { lang?: string; finish: (res: unknown) => Promise<unknown> }) {
		if (!lang) return code;
		lang = lang.toLowerCase();
		if (lang === 'sql') {
			try {
				const replaced = code.replace(/{([^}]+)}/gi, (str, match: string) => {
					const props = match.split('.');
					return mysql.escape(Util.getProp({
						client: this.client, message, this: this
					}, props));
				});
				const results = await this.client.database.query<SQLValues>(replaced);
				await finish(results);
			} catch (error) {
				await finish(error.stack || error);
			}
			return true;
		}
		return code;
	}
}