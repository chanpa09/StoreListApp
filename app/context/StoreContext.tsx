import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import rawStoresData from '../../assets/stores.json';

// Type definitions
export interface Store {
  name: string;
  tickets: string;
  type: string;
  genre: string;
  subGenre: string;
  locationAddress: string;
  fullAddress: string;
  phone: string;
  district: string;
  coords: { lat: number; lon: number; title: string };
  distance?: number;
}

interface StoreContextType {
  stores: Store[];
  favorites: string[];
  toggleFavorite: (storeName: string) => Promise<void>;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType>({
  stores: [],
  favorites: [],
  toggleFavorite: async () => {},
  isLoading: true,
});

export const useStoreContext = () => useContext(StoreContext);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Valid stores only (caching/offline ready as it's from local asset)
  const stores = React.useMemo(() => {
    return rawStoresData.filter((store: any) => store.coords && store.coords.lat && store.coords.lon) as Store[];
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavs = await AsyncStorage.getItem('favorites');
        if (storedFavs) {
          setFavorites(JSON.parse(storedFavs));
        }
      } catch (error) {
        console.error("Failed to load favorites", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const toggleFavorite = async (storeName: string) => {
    let newFavs;
    if (favorites.includes(storeName)) {
      newFavs = favorites.filter(f => f !== storeName);
    } else {
      newFavs = [...favorites, storeName];
    }
    setFavorites(newFavs);
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavs));
    } catch (error) {
      console.error("Failed to save favorites", error);
    }
  };

  return (
    <StoreContext.Provider value={{ stores, favorites, toggleFavorite, isLoading }}>
      {children}
    </StoreContext.Provider>
  );
};
