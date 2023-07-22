export const constants = Object.freeze({
	PROJECT_NAME: 'Puffle',

	limits: Object.freeze({
		MAX_X: 1520,
		MAX_Y: 960,
		MAX_FRAME: 26,
		MAX_COINS: 9999999,
		MAX_USERS: 300, // fallback in case the loaded config world's maxUser is undefined
		MAX_MUSIC: 999,

		sql: Object.freeze({
			MAX_UNSIGNED_TINYINT: 255,
			MAX_UNSIGNED_SMALLINT: 65535,
			MAX_UNSIGNED_INTEGER: 4294967295,
		}),
	}),

	FIRST_MODERATOR_RANK: 1,
	COMMANDS_PREFIX: '!',
	JOINEDUSERS_ROOM: 'joinedUsers',
});
