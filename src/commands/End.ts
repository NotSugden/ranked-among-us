import RankedClient from '../client';
import Command from '../struct/Command';
import Game from '../struct/Game';
import Util, { GuildMessage } from '../util';

const USE_CORRECT_FORMAT =
	'Please use the correct format, `*end [win | loss] @impostor1 @impostor2`, ' +
	'with the first argument meaning an impostor win or impostor loss.';

export default class EndCommand extends Command {
	public constructor(client: RankedClient) {
		super(client, {
			description: 'End the current game',
			permissions: (_, channel) => {
				const game = this.client.queueManager.gameIn(channel);
				if (!game) return null;
				return { game };
			}
		});
	}

	public async run(message: GuildMessage, args: string[], { game }: { game: Game }): Promise<unknown> {
		if (!game.inProgress) return message.channel.send('This game isn\'t in progress.');

		if (args.length < 3) return message.channel.send(USE_CORRECT_FORMAT);

		const impostorWin = args[0] === 'win';

		const impostors = message.mentions.users.keyArray();
		if (impostors.length !== 2) return message.channel.send(USE_CORRECT_FORMAT);

		const agreement = await Util.getAgreement({
			allowedMentions: { users: impostors },
			content:
				`Game ended. Does everyone agree that this was an **impostor ${impostorWin ? 'Win' : 'Loss'}**, with ${
					impostors.map(id => `<@${id}>`).join(' and ')
				} as the impostors?`
		}, message.channel,
		{ totalNeeded: Math.floor(message.member.voice.channel!.members.size / 2) }
		);
		if (agreement === null) {
			return message.channel.send('Decision timed out.');
		} else if (agreement) {
			await this.client.queueManager.end(game, impostorWin, impostors);
			return message.channel.send('Lobby ended.');
		} else {
			return message.channel.send('Lobby not ended, game settings weren\'t agreed.');
		}
	}
}