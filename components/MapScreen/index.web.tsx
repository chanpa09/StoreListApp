import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, TextInput, Linking, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useStoreContext, Store } from '@/context/StoreContext';

const { width, height } = Dimensions.get('window');

const TICKET_TYPES = [
  { id: 'ALL', label: '전체' },
  { id: 'AB', label: 'A/B권' },
  { id: 'B', label: 'B권' }
];

const RADIUS_OPTIONS = [
  { value: 0, label: '반경 전체' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 2000, label: '2km' }
];

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export default function MapScreen() {
  const { stores, favorites, toggleFavorite, isLoading, favoritesLoaded } = useStoreContext();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [selectedTicket, setSelectedTicket] = useState('ALL');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedRadius, setSelectedRadius] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleViewMode = () => {
    setViewMode(v => v === 'map' ? 'list' : 'map');
  };

  const genres = useMemo(() => {
    const uniqueGenres = new Set(stores.map((s) => s.genre));
    return ['ALL', ...Array.from(uniqueGenres)];
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.map(store => ({...store})).filter((store) => {
      const matchTicket = selectedTicket === 'ALL' || store.type === selectedTicket;
      const matchGenre = selectedGenre === 'ALL' || store.genre === selectedGenre;
      const matchSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          store.fullAddress.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchRadius = true;
      if (location) {
        const dist = getDistance(location.coords.latitude, location.coords.longitude, store.coords.lat, store.coords.lon);
        store.distance = dist;
        if (selectedRadius > 0) {
          matchRadius = dist <= selectedRadius;
        }
      } else {
        store.distance = Infinity;
      }

      return matchTicket && matchGenre && matchSearch && matchRadius;
    }).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }, [stores, selectedTicket, selectedGenre, searchQuery, selectedRadius, location]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('위치 정보 접근 권한이 거부되었습니다.');
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      } catch (e) {
        setErrorMsg('현재 위치를 가져올 수 없습니다.');
      }
    })();
  }, []);

  const openNavigation = (lat: number, lon: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    Linking.openURL(url);
  };

  const renderStoreItem = ({ item }: { item: Store }) => {
    const isFav = favorites.includes(item.name);
    return (
      <View style={styles.storeCard} key={item.name + item.fullAddress}>
        <View style={styles.storeCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName}>{item.name}</Text>
            {item.distance && item.distance !== Infinity && (
              <Text style={styles.distanceText}>📍 {Math.round(item.distance)}m</Text>
            )}
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => toggleFavorite(item.name)}
              style={[styles.favButton, !favoritesLoaded && { opacity: 0.4 }]}
              disabled={!favoritesLoaded}
            >
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? "#FF3B30" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => openNavigation(item.coords.lat, item.coords.lon, item.name)}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.navButtonText}>길찾기</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.storeDetail}><Text style={styles.label}>장르:</Text> {item.genre} ({item.subGenre})</Text>
        <Text style={styles.storeDetail}><Text style={styles.label}>사용 가능:</Text> {item.tickets} 티켓</Text>
        <Text style={styles.storeDetail}><Text style={styles.label}>주소:</Text> {item.fullAddress}</Text>
        {item.phone ? <Text style={styles.storeDetail}><Text style={styles.label}>전화번호:</Text> {item.phone}</Text> : null}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="map-outline" size={60} color="#ccc" />
        <Text style={{ marginTop: 20, color: '#888', fontWeight: 'bold' }}>데이터 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {viewMode === 'map' ? (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={80} color="#ccc" />
          <Text style={styles.placeholderText}>웹 버전에서는 지도가 아직 준비 중입니다.</Text>
          <Text style={styles.placeholderSubText}>리스트 뷰를 이용해 주세요.</Text>
          <TouchableOpacity style={styles.viewSwitchButton} onPress={() => setViewMode('list')}>
            <Text style={styles.viewSwitchButtonText}>리스트 뷰로 이동</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listViewContainer}>
          <FlatList
            data={filteredStores}
            keyExtractor={item => item.name + item.fullAddress}
            renderItem={renderStoreItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <View style={styles.topContainer}>
        <View style={styles.headerControls}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="매장명 또는 주소 검색"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity style={styles.viewToggleButton} onPress={toggleViewMode}>
            <Ionicons name={viewMode === 'map' ? 'list' : 'map'} size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radiusScroll}>
            {RADIUS_OPTIONS.map(opt => (
              <TouchableOpacity 
                key={opt.value} 
                style={[styles.radiusButton, selectedRadius === opt.value && styles.activeFilter]}
                onPress={() => setSelectedRadius(opt.value)}
              >
                <Text style={[styles.filterText, selectedRadius === opt.value && styles.activeFilterText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.filterRow}>
            {TICKET_TYPES.map(ticket => (
              <TouchableOpacity 
                key={ticket.id} 
                style={[styles.filterButton, selectedTicket === ticket.id && styles.activeFilter]}
                onPress={() => setSelectedTicket(ticket.id)}
              >
                <Text style={[styles.filterText, selectedTicket === ticket.id && styles.activeFilterText]}>
                  {ticket.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
            {genres.map((genre) => (
              <TouchableOpacity 
                key={genre} 
                style={[styles.genreButton, selectedGenre === genre && styles.activeFilter]}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text style={[styles.filterText, selectedGenre === genre && styles.activeFilterText]}>
                  {genre === 'ALL' ? '전체 장르' : genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listViewContainer: { flex: 1, paddingTop: 200 },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
  placeholderText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginTop: 20 },
  placeholderSubText: { fontSize: 14, color: '#888', marginTop: 8 },
  viewSwitchButton: { marginTop: 20, backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  viewSwitchButtonText: { color: '#fff', fontWeight: 'bold' },

  topContainer: { position: 'absolute', top: 20, left: 10, right: 10, zIndex: 10 },
  
  headerControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 15, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#333', outlineStyle: 'none' } as any,
  viewToggleButton: {
    backgroundColor: '#007AFF', padding: 10, borderRadius: 10, marginLeft: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
    justifyContent: 'center', alignItems: 'center'
  },

  filterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 10, padding: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  radiusScroll: { flexDirection: 'row', marginBottom: 10 },
  radiusButton: { paddingVertical: 6, paddingHorizontal: 15, marginRight: 8, backgroundColor: '#e0e0e0', borderRadius: 20 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  filterButton: { flex: 1, paddingVertical: 8, marginHorizontal: 3, backgroundColor: '#f0f0f0', borderRadius: 20, alignItems: 'center' },
  genreScroll: { flexDirection: 'row' },
  genreButton: { paddingVertical: 6, paddingHorizontal: 15, marginRight: 8, backgroundColor: '#f0f0f0', borderRadius: 20, alignItems: 'center' },
  activeFilter: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 12, color: '#333', fontWeight: '600' },
  activeFilterText: { color: '#fff' },
  
  storeCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  storeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#222', flex: 1, marginRight: 10 },
  distanceText: { fontSize: 13, color: '#007AFF', marginTop: 4, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  favButton: { marginRight: 15 },
  navButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  navButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  storeDetail: { fontSize: 14, marginBottom: 6, color: '#444' },
  label: { fontWeight: 'bold', color: '#666' },
});
