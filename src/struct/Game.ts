import { TextChannel, User, VoiceChannel } from 'discord.js';
import RankedClient from '../client';

export default class Game {
	public databaseID: string | null = null;

	private readonly client!: RankedClient;

	public constructor(
		client: RankedClient,
		public id: number,
		public players: User[]
	) {
		Object.defineProperties(this, {
			client: { value: client }
		});
	}

	public get inProgress(): boolean {
		return typeof this.databaseID === 'string';
	}

	public get textChannel(): TextChannel {
		return <TextChannel> this.client.rankedCategory.children.find(
			channel => channel.name === `ranked-${this.id}-text`
		);
	}

	public get voiceChannel(): VoiceChannel {
		return <VoiceChannel> this.client.rankedCategory.children.find(
			channel => channel.name === `Ranked ${this.id}`
		);
	}
}