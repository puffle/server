interface IActionMessage
{
	action: string;
	args: Record<string, unknown>;
}

interface ILoginAuth
{
	username: string;
	password: string;
	method: 'password' | 'token';
}

interface IGameAuth
{
	username: string;
	key: string;
	createToken?: boolean;
	token?: string;
}
