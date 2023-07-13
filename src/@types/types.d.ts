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
