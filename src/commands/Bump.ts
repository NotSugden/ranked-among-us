import RankedClient from '../client';
import Command from '../struct/Command';
import Game from '../struct/Game';
import { GuildMessage } from '../util';

export default class BumpCommand extends Command {
	public constructor(client: RankedClient) {
		super(client, {
			description: 'Bump the current game',
			permissions: (_, channel) => {
				const game = this.client.queueManager.gameIn(channel);
				if (!game) return null;
				return { game };
			}
		});
	}

	public async run(message: GuildMessage, args: string[], { game }: { game: Game }): Promise<unknown> {
		const channel = game.voiceChannel;
		if (channel.full) return message.channel.send('This game is already full.');
		const { queueManager } = this.client;
		await queueManager.fillGame(game);
		return message.channel.send('Bumped!');
	}
}