import RankedClient from '../client';
import Command from '../struct/Command';
import Game from '../struct/Game';
import Util, { GuildMessage } from '../util';

export default class VoidCommand extends Command {
	public constructor(client: RankedClient) {
		super(client, {
			description: 'Void the current game',
			permissions: (_, channel) => {
				const game = this.client.queueManager.gameIn(channel);
				if (!game) return null;
				return { game };
			}
		});
	}

	public async run(message: GuildMessage, args: string[], { game }: { game: Game }): Promise<unknown> {
		const agreement = await Util.getAgreement(
			'Void this game? the lobby will be disbanded and everyone will be disconnected from voice.',
			message.channel,
			{ totalNeeded: Math.floor(message.member.voice.channel!.members.size / 2) }
		);
		if (agreement === null) {
			return message.channel.send('Decision timed out.');
		} else if (agreement) {
			await this.client.queueManager.delete(game);
			return message.channel.send('Previous lobby disbanded.');
		} else {
			return message.channel.send('Lobby not disbanded.');
		}
	}
}