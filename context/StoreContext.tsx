import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import rawStoresData from '../assets/stores.json';

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
  favoritesLoaded: boolean;
}

const StoreContext = createContext<StoreContextType>({
  stores: [],
  favorites: [],
  toggleFavorite: async () => {},
  isLoading: false,
  favoritesLoaded: false,
});

export const useStoreContext = () => useContext(StoreContext);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const favoritesRef = useRef<string[]>([]);
  
  // Valid stores only (caching/offline ready as it's from local asset)
  const stores = React.useMemo(() => {
    return rawStoresData.filter((store: any) => store.coords && store.coords.lat && store.coords.lon) as Store[];
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavs = Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.localStorage.getItem('favorites')
          : await AsyncStorage.getItem('favorites');
        if (storedFavs) {
          const parsedFavorites = JSON.parse(storedFavs);
          favoritesRef.current = parsedFavorites;
          setFavorites(parsedFavorites);
        }
      } catch (error) {
        console.error("Failed to load favorites", error);
      } finally {
        setFavoritesLoaded(true);
        setIsLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const toggleFavorite = async (storeName: string) => {
    if (!favoritesLoaded) {
      return;
    }

    const currentFavorites = favoritesRef.current;
    let newFavs;
    if (currentFavorites.includes(storeName)) {
      newFavs = currentFavorites.filter(f => f !== storeName);
    } else {
      newFavs = [...currentFavorites, storeName];
    }
    favoritesRef.current = newFavs;
    setFavorites(newFavs);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem('favorites', JSON.stringify(newFavs));
      } else {
        await AsyncStorage.setItem('favorites', JSON.stringify(newFavs));
      }
    } catch (error) {
      console.error("Failed to save favorites", error);
    }
  };

  return (
    <StoreContext.Provider value={{ stores, favorites, toggleFavorite, isLoading, favoritesLoaded }}>
      {children}
    </StoreContext.Provider>
  );
};
