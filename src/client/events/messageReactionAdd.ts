import { MessageReaction, User } from 'discord.js';

export default async ({ emoji, message }: MessageReaction, user: User): Promise<void> => {
	if (message.channel.id !== '808488798589157436' || emoji.name !== '🏆') return;

	const member = await message.guild!.members.fetch(user);

	await member.roles.add(message.guild!.roles.cache.find(
		role => role.name === 'Ranked'
	)!);
};