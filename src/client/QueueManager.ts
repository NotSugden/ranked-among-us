import { Snowflake, TextChannel, User, VoiceChannel } from 'discord.js';
import RankedClient from '.';
import Game from '../struct/Game';
import Util, { Constants } from '../util';

export default class QueueManager {
	private _ongoingGames?: (Game | null)[];

	private readonly client!: RankedClient;
	private _queue: Snowflake[] = [];

	public constructor(client: RankedClient) {
		Object.defineProperty(this, 'client', { value: client });
	}

	public get ongoingGames(): (Game | null)[] {
		if (this._ongoingGames) return this._ongoingGames;
		this._ongoingGames = [];
		const voiceChannels = this.client.rankedCategory.children.filter(
			channel => Constants.RANKED_CHANNEL_REGEX.test(channel.name)
		);
		for (let i = 0;i < voiceChannels.size;i++) this._ongoingGames.push(null);
		return this._ongoingGames;
	}

	public get canCreateGame(): boolean {
		if (this._queue.length < 2) return false;
		const { guild } = this.client.queueChannel;
		return this._queue.every(userID => {
			const member = guild.members.cache.get(userID);
			return member && member.nickname && !Constants.AFK_NAME_REGEX.test(member.nickname);
		});
	}

	public async end(game: Game, impostorWin: boolean, impostors: Snowflake[]): Promise<void> {
		const crewmates = game.players.map(user => user.id);
		for (const id of impostors) crewmates.splice(crewmates.indexOf(id), 1);
		await this.client.database.updateGame(game.databaseID!, {
			crewmates: JSON.stringify(crewmates),
			end_time: new Date(),
			impostor_win: impostorWin ? 1 : 0,
			impostors: JSON.stringify(impostors)
		});
		game.databaseID = null;
	}

	public async delete(game: Game): Promise<void> {
		const index = this.ongoingGames.indexOf(game);
		if (index !== -1) this.ongoingGames[index] = null;
		const { voiceChannel } = game;
		if (voiceChannel.members.size > 0) {
			await this.disband(game);
		}
		const overwrites = voiceChannel.permissionOverwrites.filter(
			overwrite => overwrite.type === 'role'
		).values();
		await Util.bulkUpdateOverwrites(voiceChannel, [...overwrites, {
			id: voiceChannel.guild.id,
			options: { CONNECT: true }
		}]);
	}

	public async disband(game: Game): Promise<void> {
		await Util.promiseAll(
			game.voiceChannel.members.values(),
			member => member.voice.setChannel(null)
		);
	}

	public async fillGame(game?: Game): Promise<void> {
		if (this._queue.length === 0) return;
		const channel = (game ?? this.ongoingGames.find(game => game !== null))?.voiceChannel;
		if (!channel || channel.full) return;
		await Util.promiseAll(
			Util.membersFrom(this._queue.splice(0, 10 - channel.members.size), channel.guild),
			member => member.voice.setChannel(channel)
		);
	}
	
	public async createNewGame(players?: string[]): Promise<Game | null> {
		const newGameID = this.ongoingGames.findIndex(game => game === null);

		if (newGameID === -1) return null;

		if (!players) players = this._queue.splice(0, 10);
		const game = new Game(
			this.client, newGameID + 1,
			players.map(id => this.client.users.cache.get(id)!)
		);
		this.ongoingGames[newGameID] = game;
		await game.textChannel.send('New match started.');
		const channel = game.voiceChannel;
		await Util.promiseAll(
			Util.membersFrom(players, channel.guild),
			member => member.voice.setChannel(channel)
		);
		return game;
	}

	public atPosition(index: number): User | null {
		return this.client.users.cache.get(this._queue[index]) ?? null;
	}

	public add(user: User): number {
		this.remove(user);
		const newLength = this._queue.push(user.id);
		if (this.canCreateGame) {
			this.createNewGame().catch(error => this.client.emit('error', error));
		}
		return newLength;
	}

	public remove(user: User): number {
		const index = this._queue.indexOf(user.id);
		if (index !== -1) {
			this._queue.splice(index, 1);
		}
		return index;
	}

	public has(user: User): boolean {
		return this._queue.includes(user.id);
	}

	public moveTo(user: User, position: number): boolean {
		const index = this._queue.indexOf(user.id);
		if (index !== -1) {
			this._queue.splice(index, 1);
			this._queue.splice(position, 0, user.id);
			return true;
		}
		return false;
	}

	public gameIn({ id }: TextChannel | VoiceChannel): Game | null {
		return this.ongoingGames.find(game => {
			if (!game) return false;
			return game.textChannel.id === id || game.voiceChannel.id === id;
		}) ?? null;
	}
}