import { User } from 'discord.js';
import * as mysql from 'mysql';
import Game from '../struct/Game';
import Util, { NullableObject } from '../util';
import { AmongUsMaps } from '../util/Constants';

export enum QueryTypes {
	INSERT = 'INSERT',
	SELECT = 'SELECT',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE'
}

const SQL_SEARCH_REGEX = /:(\w+)/g;
// eslint-disable-next-line @typescript-eslint/ban-types
const hasOwnProperty = (obj: object, prop: string) => Object.prototype.hasOwnProperty.call(obj, prop);

export default class DatabaseManager {
	public readonly options!: DatabaseOptions;

	private _keepAliveTimeout: NodeJS.Timeout = setInterval(() => {
		if (!this.connection) return;
		this.connection.query('SELECT 1', error => {
			if (error) console.error(error);
		});
	}, 60e3);
	private connection: mysql.Connection | null = null;
	public constructor(options: DatabaseOptions) {
		Object.defineProperty(this, 'options', { value: options });
	}

	public static formatInsert(table: string, data: SQLValues): string {
		const keys = Object.keys(data);
		return `INSERT INTO ${table}(${keys.join(', ')}) VALUES(${keys.map(
			key => mysql.escape(data[key])
		).join(', ')})`;
	}

	public static format(sql: string, values: SQLValues<SQLValues>): string {
		return sql.replace(SQL_SEARCH_REGEX, (text, key) => {
			if (hasOwnProperty(values, key) && values[key] !== undefined) {
				return mysql.escape(values[key]);
			}
			return text;
		});
	}

	public query(sql: QueryTypes.INSERT, table: string, values: SQLValues): Promise<mysql.OkPacket>;
	public query<T = mysql.OkPacket>(
		sql: string,
		values: SQLValues<SQLValues>,
		skipFormat?: boolean
	): Promise<T extends mysql.OkPacket ? mysql.OkPacket : T[]>
	public query<T = mysql.OkPacket>(
		sql: string,
		...values: SQLDataType<Record<string, SQLDataType>>[]
	): Promise<T extends mysql.OkPacket ? mysql.OkPacket : T[]>;
	public query<T = mysql.OkPacket>(sql: string, ...params: unknown[]): Promise<mysql.OkPacket | T | T[]> {
		if (
			(params.length === 1 || (params.length === 2 && params[1] !== true)) &&
			typeof params[0] == 'object' && params[0] !== null
		) {
			sql = DatabaseManager.format(sql, <SQLValues<SQLValues>> params[0]);
			params = [];
		} else if (sql === QueryTypes.INSERT) {
			sql = DatabaseManager.formatInsert(<string> params[0], <SQLValues> params[1]);
			params = [];
		}
		return new Promise<T[] | mysql.OkPacket>((resolve, reject) =>
			this.connection!.query(sql, params, (error, rows) => {
				if (error) reject(error);
				else resolve(rows);
			})
		);
	}

	public close(): Promise<void> {
		if (!this.connection) return Promise.resolve();
		return new Promise((resolve, reject) => this.connection!.end(error => {
			if (error) reject(error);
			else {
				this.connection = null;
				resolve();
			}
		}));
	}

	public async fetchStats(user: User): Promise<GameStatistics> {
		type PartialGame = Pick<DatabaseGame, 'impostor_win'>;
		const crewGames = await this.query<PartialGame>(
			// JSON_CONTAINS function is finicky
			`SELECT impostor_win FROM games WHERE JSON_CONTAINS(crewmates, '"${user.id}"')`
		);
		const impostorGames = await this.query<PartialGame>(
			// JSON_CONTAINS function is finicky
			`SELECT impostor_win FROM games WHERE JSON_CONTAINS(impostors, '"${user.id}"')`
		);
		
		const stats: GameStatistics = {
			crewGames: crewGames.length,
			crewLosses: 0,
			crewWins: 0,
			impostorGames: impostorGames.length,
			impostorLosses: 0,
			impostorWins: 0,
			totalGames: crewGames.length + impostorGames.length
		};
		for (const game of crewGames) {
			if (game.impostor_win) stats.impostorWins++;
			else stats.impostorLosses++;
		}
		for (const game of impostorGames) {
			if (game.impostor_win) stats.impostorWins++;
			else stats.impostorLosses++;
		}
		return stats;
	}

	public connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			const connection = this.connection = mysql.createConnection(this.options);
			connection.connect(error => {
				if (error) reject(error);
				else resolve();
			});
		});
	}

	public async createNewGame(game: Game, map: AmongUsMaps): Promise<Game> {
		await this.query(QueryTypes.INSERT, 'games', {
			id: game.databaseID = Util.generateGameID(), map
		});
		return game;
	}

	public async updateGame(gameID: string, data: Partial<KeyValue<DatabaseGame>>): Promise<void> {
		await this.query('UPDATE games SET :data WHERE id = :gameID', { data: <SQLValues> data, gameID });
	}

	public async fetchGame(gameID: string): Promise<DatabaseGame | null> {
		const [data] = await this.query<DatabaseGame>('SELECT * FROM games WHERE id = :gameID', { gameID });
		return data ?? null;
	}
}

/**
 * Fancy type hack.
 */
type KeyValue<T> = {
	[K in keyof T]: T[K]
}

export type DatabaseGame = {
	id: string;
	map: AmongUsMaps;
	start_time: Date;
} & NullableObject<{
	/**
	 * JSON stringified array (length 2), Discord user IDs of the impostors
	 */
	impostors: string;
	/**
	 * JSON stringified array (length 8), Discord user IDs of the crewmates
	 */
	crewmates: string;
	end_time: Date;
	impostor_win: 0 | 1
}>

export interface DatabaseOptions {
	host: string;
	user: string;
	password: string;
	database: string;
}

export interface GameStatistics {
	totalGames: number;
	impostorGames: number;
	impostorWins: number;
	impostorLosses: number;
	crewGames: number;
	crewWins: number;
	crewLosses: number;
}

export type SQLDataType<E = never> = number | Date | string | null | E;

export interface SQLValues<E = never> {
	[key: string]: SQLDataType | E;
}