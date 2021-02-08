import { MessageEmbed } from 'discord.js';
import RankedClient from '../client';
import Command from '../struct/Command';
import Game from '../struct/Game';
import Util, { GuildMessage } from '../util';
import { AmongUsMaps, CHARACTER_PNGS, MAP_ICONS, MAP_LAYOUTS } from '../util/Constants';

export default class StartCommand extends Command {
	public constructor(client: RankedClient) {
		super(client, {
			description: 'Start the current game',
			permissions: (_, channel) => {
				const game = this.client.queueManager.gameIn(channel);
				if (!game) return null;
				return { game };
			}
		});
	}

	public async run(message: GuildMessage, args: string[], { game }: { game: Game }): Promise<unknown> {
		if (game.inProgress) return message.channel.send('This game is already in progress.');

		if (game.players.length !== 10) return message.channel.send('There aren\'t enough players here to start.');

		if (!args[0]) return message.channel.send('Please specify which map you\'re playing.');
		
		let map: AmongUsMaps;

		/* eslint-disable indent */
		switch(args.join(' ').toLowerCase()) {
			case 'skeld':
			case 'the skeld':
				map = AmongUsMaps.Skeld;
				break;
			case 'mira':
			case 'mirahq':
			case 'mira hq':
				map = AmongUsMaps.MiraHQ;
				break;
			case 'polus':
				map = AmongUsMaps.Polus;
				break;
			// case 'airship':
			// case 'the airship':
			// 	map = AmongUsMaps.Airship;
			// 	break;
			default:
				return message.channel.send('That is not a valid map.');
		}
		/* eslint-enable indent */

		await this.client.database.createNewGame(game, map);

		const { voiceChannel } = game;
		await Util.bulkUpdateOverwrites(voiceChannel, [{
			id: message.guild.id,
			options: { CONNECT: false }
		}, ...game.players.map(({ id }) => ({
			id, options: { CONNECT: true }
		}))]);

		await message.channel.send(`Game ID: ${game.databaseID}`, new MessageEmbed()
			.setAuthor(`New match started on ${AmongUsMaps[map]}.`, MAP_ICONS[map])
			.setColor('RED')
			.setDescription(['Players:', ...game.players.map((user, index) => `${index + 1}: ${user.tag}`)])
			.setThumbnail(CHARACTER_PNGS[Math.floor(Math.random() * CHARACTER_PNGS.length)])
			.setImage(MAP_LAYOUTS[map])
		);
	}
}