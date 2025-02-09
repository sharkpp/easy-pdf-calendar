import { PersistStorage, StorageValue } from 'zustand/middleware';
import superjson from 'superjson';

// https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md#how-can-i-use-a-custom-storage-engine

export const createSuperJSONStorage = 
  <T>(getStorage: () => Storage): PersistStorage<T> => {
    const storage = getStorage();
    return {
      getItem: (name: string) => {
        const str = storage.getItem(name);
        if (!str) { return null; }
        return superjson.parse(str);
      },
      setItem: (name: string, value: StorageValue<T>): void => {
        storage.setItem(name, superjson.stringify(value))
      },
      removeItem: (name: string) => storage.removeItem(name),
    };
  };
