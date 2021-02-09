import RankedClient from './client';

const client = new RankedClient(require('./config.json'), {
	allowedMentions: {
		parse: []
	},
	partials: ['MESSAGE', 'REACTION'],
	presence: {
		activity: {
			name: 'Ranked Among Us'
		}
	},
	ws: {
		intents: [
			'GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES', 'GUILD_MEMBERS', 'GUILD_MESSAGE_REACTIONS'
		]
	}
});

client.on('error', console.error);

client.connect().then(() => {
	console.log(`Connected as ${client.user!.tag}!`);
}, error => {
	console.error('Failed to connect:', error);
});