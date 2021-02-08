import { VoiceState as _VoiceState } from 'discord.js';
import RankedClient from '..';
import { Constants } from '../../util';

export default async (oldState: VoiceState, newState: VoiceState): Promise<void>  => {
	if (oldState.channelID === newState.channelID) return;
	const { client } = oldState;
	const queueChannelID = client.queueChannel.id;

	const user = client.users.cache.get(newState.id)!;

	if (oldState.channelID === queueChannelID || newState.channelID === queueChannelID) {
		const joined = oldState.channelID !== queueChannelID;
		client.queueManager[joined ? 'add' : 'remove'](user);
	}
	let game = client.queueManager.ongoingGames.find(_game => {
		if (!_game) return false;
		const { id } = _game.voiceChannel;
		return id === newState.channelID || id === oldState.channelID;
	});
	if (!game) {
		if (newState.channel && Constants.RANKED_CHANNEL_REGEX.test(newState.channel.name)) {
			try {
				const newGame = await client.queueManager.createNewGame([newState.id]);
				if (newGame === null) return;
				game = newGame;
			} catch (error) {
				return void client.emit('error', error);
			}
		} else return;
	}
	const joined = oldState.channelID !== game.voiceChannel.id;
	await game.textChannel.createOverwrite(user, {
		VIEW_CHANNEL: joined
	}, `User ${joined ? 'joined' : 'left'} match ${game.id}`);
	const playerIndex = game.players.indexOf(user);
	if (joined) {
		if (playerIndex !== -1) return;
		game.players.push(user);
	} else {
		if (playerIndex === -1) return;
		game.players.splice(playerIndex, 1);
		if (game.players.length === 0) {
			client.queueManager.delete(game);
		}
	}
};

interface VoiceState extends _VoiceState {
	client: RankedClient;
}