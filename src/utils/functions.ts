export function pick<T extends Record<string, unknown>>(object: T, ...keys: Array<keyof T>): Partial<T>
{
	return keys.reduce((obj, key) =>
	{
		if (object && key in object) obj[key] = object[key];
		return obj;
	}, {} as Partial<T>);
}
