export const constants = {
	PROJECT_NAME: 'Puffle',

	limits: {
		MAX_X_NEGATIVE: -1520,
		MAX_Y_NEGATIVE: -960,
		MAX_X: 1520,
		MAX_Y: 960,
		MAX_FRAME: 26,
		MAX_COINS: 9999999,
		MAX_USERS: 300, // fallback in case the loaded config world's maxUser is undefined
		MAX_MUSIC: 999,

		MIN_USERNAME_LEN: 4,
		MAX_USERNAME_LEN: 12,
		MIN_PASSWORD_LEN: 3,
		MAX_PASSWORD_LEN: 128,

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

	HIDDEN_PENGUIN_SPEED: 5000,
	HIDDEN_PENGUIN_ALPHA: 0.5,
} as const;
