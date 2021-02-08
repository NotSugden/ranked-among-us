import RankedClient from '../client';
import Command from '../struct/Command';
import { GuildMessage } from '../util';

export default class PingCommand extends Command {
	public constructor(client: RankedClient) {
		super(client, {
			description: 'Pong!'
		});
	}

	public async run(message: GuildMessage): Promise<unknown> {
		const msg = await message.channel.send('Pinging...');
		return msg.edit('Pong');
	}
}