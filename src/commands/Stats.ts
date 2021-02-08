import RankedClient from '../client';
import Command from '../struct/Command';
import { GuildMessage } from '../util';

export default class StatsCommand extends Command {
	public constructor(client: RankedClient) {
		super(client, {
			description: 'Pong!'
		});
	}

	public async run(message: GuildMessage, [userID]: string[]): Promise<unknown> {
		const user = message.mentions.users.first() ?? this.client.users.cache.get(userID) ?? message.author;

		const stats = await this.client.database.fetchStats(user);

		const isAuthor = user.id === message.author.id;
		
		if (stats.totalGames === 0) return message.channel.send(
			`${isAuthor ? 'You' : user.username} ${isAuthor ? 'haven\'t' : 'hasn\'t'} played any games yet`
		);

		const stat = (name: string, value: number | string) => `**${name}**: ${value}`;

		return message.channel.send([
			`Stats for ${user.tag}`,
			stat('Total Games', stats.totalGames),
			stat('Impostor Games', stats.impostorGames),
			stat(
				'Impostor Win/Loss Ratio',
				`${stats.impostorWins / stats.impostorLosses} (${stats.impostorWins} - ${stats.impostorLosses})`
			),
			stat('Crewmate Games', stats.crewGames),
			stat(
				'Crewmate Win/Loss Ratio',
				`${stats.crewWins / stats.crewLosses} (${stats.crewWins} - ${stats.crewLosses})`
			)
		]);
	}
}