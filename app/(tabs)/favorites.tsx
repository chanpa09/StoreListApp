import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStoreContext, Store } from '../context/StoreContext';

export default function FavoritesScreen() {
  const { stores, favorites, toggleFavorite, isLoading } = useStoreContext();

  const favoriteStores = React.useMemo(() => {
    return stores.filter(store => favorites.includes(store.name));
  }, [stores, favorites]);

  const openNavigation = (lat: number, lon: number, name: string) => {
    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lon}`;
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    if (url) {
      Linking.openURL(url);
    }
  };

  const renderStoreItem = ({ item }: { item: Store }) => {
    return (
      <View style={styles.storeCard}>
        <View style={styles.storeCardHeader}>
          <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => toggleFavorite(item.name)} style={styles.favButton}>
              <Ionicons name="heart" size={24} color="#FF3B30" />
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 즐겨찾기</Text>
        <Text style={styles.headerSubtitle}>{favoriteStores.length}개의 매장</Text>
      </View>

      {favoriteStores.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="heart-outline" size={60} color="#ccc" style={{ marginBottom: 15 }} />
          <Text style={styles.emptyText}>아직 즐겨찾기한 매장이 없습니다.</Text>
          <Text style={styles.emptySubText}>지도에서 하트 버튼을 눌러 추가해 보세요.</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteStores}
          keyExtractor={(item) => item.name + item.fullAddress}
          renderItem={renderStoreItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#222' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  emptySubText: { fontSize: 14, color: '#888', marginTop: 8 },

  listContent: { padding: 15, paddingBottom: 30 },
  storeCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  storeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#222', flex: 1, marginRight: 10 },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  favButton: { marginRight: 12, padding: 4 },
  navButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  navButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 4 },
  storeDetail: { fontSize: 14, marginBottom: 6, color: '#444' },
  label: { fontWeight: 'bold', color: '#666' },
});
