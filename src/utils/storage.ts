import localForage from "localforage";

/**
 * Migrates data from localStorage to localForage for better performance and storage capacity.
 * If data exists in localForage, uses that and removes the localStorage fallback.
 * Otherwise, falls back to localStorage and parses the stored string value.
 * 
 * @param key - The storage key to migrate
 * @param defaultValue - Default value if neither storage contains the key
 * @param setter - React setter function to update state
 * @param parseLocalStorage - Optional custom parser for localStorage value (defaults to JSON.parse)
 */
export async function migrateStorageValue<T>(
  key: string,
  defaultValue: T,
  setter: (value: T) => void,
  parseLocalStorage?: (value: string | null) => T
) {
  // Early return for SSR
  if (typeof window === 'undefined') {
    setter(defaultValue);
    return;
  }

  try {
    // First check localForage
    const forageValue = await localForage.getItem(key);
    if (forageValue !== null) {
      setter(forageValue as T);
      // Clean up old localStorage value
      localStorage.removeItem(key);
      return;
    }

    // Fall back to localStorage
    const localValue = localStorage.getItem(key);
    if (localValue !== null) {
      let parsedValue: T;
      if (parseLocalStorage) {
        parsedValue = parseLocalStorage(localValue);
      } else {
        // Default parsing for common types
        if (typeof defaultValue === 'boolean') {
          parsedValue = (localValue.includes('false') ? false : true) as T;
        } else if (typeof defaultValue === 'number') {
          parsedValue = parseFloat(localValue) as T;
        } else {
          parsedValue = JSON.parse(localValue) as T;
        }
      }
      
      // Persist migrated value to localForage and remove legacy localStorage
      setter(parsedValue);
      await localForage.setItem(key, parsedValue);
      localStorage.removeItem(key);
    } else {
      setter(defaultValue);
    }
  } catch (error) {
    console.warn(`Failed to migrate storage value for key "${key}":`, error);
    setter(defaultValue);
  }
}

/**
 * Persists a value to localForage for better performance and storage capacity.
 * 
 * @param key - The storage key
 * @param value - The value to store
 */
export async function persistToStorage<T>(key: string, value: T) {
  try {
    await localForage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to persist value for key "${key}":`, error);
  }
}