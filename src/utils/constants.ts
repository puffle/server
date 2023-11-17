export const constants = {
	PROJECT_NAME: 'Puffle',

	limits: {
		MIN_X: -1520,
		MIN_Y: -960,
		MAX_X: 1520,
		MAX_Y: 960,
		MAX_FRAME: 26,
		MAX_COINS: 9999999,
		MAX_USERS: 300, // fallback in case the loaded config world's maxUser is undefined
		MAX_MUSIC: 999,

		sql: {
			MAX_UNSIGNED_TINYINT: 255,
			MAX_UNSIGNED_SMALLINT: 65535,
			MAX_UNSIGNED_INTEGER: 4294967295,
		},
	},

	FIRST_MODERATOR_RANK: 1,
	COMMANDS_PREFIX: '!',
	JOINEDUSERS_ROOM: 'joinedUsers',

	ITEM_SLOTS: [
		'color',
		'head',
		'face',
		'neck',
		'body',
		'hand',
		'feet',
		'flag',
		'photo',
		'award',
	],

	STARTER_DECK_ID: 821,
	SENSEI_ROOM_ID: 951,
	RINK_ROOM_ID: 802,
	SLED_ROOM_ID: 999,
} as const;
