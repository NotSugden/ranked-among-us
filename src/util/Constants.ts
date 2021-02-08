export const AFK_NAME_REGEX = (() => {
	const patten = '(\\[|\\()afk(\\]\\))';
	return new RegExp(`^${patten}|${patten}$`);
})();

export const RANKED_CHANNEL_REGEX = /^Ranked \d$/;

export const AGREE_EMOJI = '807688492271796234';
export const DISAGREE_EMOJI = '807688555329486858';

export enum AmongUsMaps {
	Skeld,
	MiraHQ,
	Polus,
	Airship
}

/**
 * Credit https://www.reddit.com/r/AmongUs/comments/iut5y2/couldnt_find_many_pngs_of_the_among_us_characters/
 */
export const CHARACTER_PNGS = Object.freeze(<const> [
	'https://cdn.discordapp.com/attachments/807717300403699735/807717323846582322/an871k4o1sn51.png', // red
	'https://cdn.discordapp.com/attachments/807717300403699735/807717346755215372/iio3xm4o1sn51.png', // orange
	'https://cdn.discordapp.com/attachments/807717300403699735/807717433657524294/xprpkp063sn51.png', // yellow
	'https://cdn.discordapp.com/attachments/807717300403699735/807717457904140298/76glbq4o1sn51.png', // lime
	'https://cdn.discordapp.com/attachments/807717300403699735/807717481812590632/vf3ojm4o1sn51.png', // green
	'https://cdn.discordapp.com/attachments/807717300403699735/807717508421255248/0j244l4o1sn51.png', // cyan
	'https://cdn.discordapp.com/attachments/807717300403699735/807717533087694848/ph2jho4o1sn51.png', // blue
	'https://cdn.discordapp.com/attachments/807717300403699735/807717560162058270/9kvk25sh2sn51.png', // purple
	'https://cdn.discordapp.com/attachments/807717300403699735/807717584287825970/ppawzo4o1sn51.png', // pink
	'https://cdn.discordapp.com/attachments/807717300403699735/807717644874022962/f7f4fmpi2sn51.png', // brown
	'https://cdn.discordapp.com/attachments/807717300403699735/807717666923085894/xyqo6hx42sn51.png', // white
	'https://cdn.discordapp.com/attachments/807717300403699735/807717879809572954/4eof2l4o1sn51.png'  // black
]);

export const MAP_ICONS = Object.freeze(<const> [
	'https://cdn.discordapp.com/attachments/807717300403699735/807720199011827752/7786344492601180161.png', // skeld
	'https://cdn.discordapp.com/attachments/807717300403699735/807720203257380935/7876890975141888401.png', // mira
	'https://cdn.discordapp.com/attachments/807717300403699735/807720264623849543/7851239200375439361.png'  // polus
]);

export const MAP_LAYOUTS = Object.freeze(<const> [
	'https://cdn.discordapp.com/attachments/807717300403699735/807745695071207424/Skeld.png', // skeld
	'https://cdn.discordapp.com/attachments/807717300403699735/807745966965784656/Mira.png',  // mira
	'https://cdn.discordapp.com/attachments/807717300403699735/807746076115337266/Polus.png'  // polus
]);