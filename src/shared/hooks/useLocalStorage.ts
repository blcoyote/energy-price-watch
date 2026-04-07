import { useState } from "react";

function readFromStorage<T>(key: string, defaultValue: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return defaultValue;
		return JSON.parse(raw) as T;
	} catch {
		return defaultValue;
	}
}

export function useLocalStorage<T>(
	key: string,
	defaultValue: T,
): [T, (value: T) => void] {
	const [stored, setStored] = useState<T>(() =>
		readFromStorage(key, defaultValue),
	);

	function setValue(value: T) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			// storage unavailable (private browsing quota, etc.) — continue in-memory
		}
		setStored(value);
	}

	return [stored, setValue];
}
