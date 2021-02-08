import { Message, Permissions } from 'discord.js';
import Util, { GuildMessage } from '../../util';

export default async (message: Message | GuildMessage): Promise<unknown> => {
	if (!Util.isGuildMessage(message)) return;
	else if (!message.content.startsWith('*') || message.content.length <= 3) return;

	const [commandName, ...args] = message.content.slice(1).split(/ +/g);

	const command = message.client.commands.get(commandName.toLowerCase());
	if (!command) return;

	const clientPermissions = message.channel.permissionsFor(message.client.user!);
	if (!clientPermissions || !clientPermissions.has(Permissions.FLAGS.SEND_MESSAGES)) return;

	const permissions = Util.hasPermission(message, command);

	if (permissions === null) return;
	else if (permissions === false) {
		return message.channel.send('You do not have the proper permissions for this command.');
	} else if (typeof permissions === 'string') {
		return message.channel.send(permissions);
	}

	try {
		await command.run(message, args, typeof permissions === 'object' ? permissions : undefined);
	} catch (error) {
		message.client.emit('error', error);
		if (error) {
			await message.channel.send([
				'An unknown error occoured while running this command',
				'```js',
				error.stack || error.message || error,
				'```'
			]);
		}
	}
};