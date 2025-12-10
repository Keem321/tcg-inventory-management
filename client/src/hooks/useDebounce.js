/**
 * Custom hook for debouncing values
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default 300ms)
 * @param {number} minLength - Minimum length before debouncing (default 2)
 * @returns {any} The debounced value
 */
import { useState, useEffect } from "react";

export function useDebounce(value, delay = 300, minLength = 2) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		// If value is empty or meets minimum length, debounce it
		if (value.length === 0 || value.length >= minLength) {
			const timer = setTimeout(() => {
				setDebouncedValue(value);
			}, delay);

			return () => clearTimeout(timer);
		}
		// If below minimum length, don't update debounced value
	}, [value, delay, minLength]);

	return debouncedValue;
}
