import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { supabase } from '@/lib/supabase'; // Adjust path if needed
import { SmartImage } from '@/components/SmartImage'; // Import SmartImage
import { Seed } from '@/types/database'; // Adjust path if needed
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme';
import {
  PlusCircle,
  Search,
  XCircle,
  ChevronRight,
  Edit3,
  Tally4,
  Trash2,
  Archive,
  DollarSign,
  Truck,
  Leaf,
  Flower2,
  Wheat,
  Carrot,
  Apple,
  Cherry,
  Nut,
  Grape,
  Bean,
  MoreHorizontal,
} from 'lucide-react-native';

import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '@/lib/auth'; // Assuming you have an auth context

// --- 1. Define Mock Seed Data ---
// Ensure this mock data structure matches your Seed
const mockSeedsData: Seed[] = [
  {
    id: '1',
    seed_name: 'Brandywine Tomato',
    type: 'Heirloom Tomato',
    quantity: 50,
    supplier_id: 'supplier-mock-1',
    planting_season: 'Early Spring',
    harvest_season: 'Late Summer',
    seed_images: [
      {
        type: 'url',
        url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop',
      },
    ],
    description: 'Large, pink beefsteak tomatoes with rich, intense flavor.',
    user_id: 'mock-user',
    quantity_unit: 'seeds',
    date_purchased: new Date(), // Added property
    suppliers: {
      id: 'supplier-mock-1',
      supplier_name: 'Baker Creek Seeds',
      supplier_image: '',
      webaddress: 'rareseeds.com',
      email: 'support@rareseeds.com',
      phone: '(417) 924-8917',
      address: 'Mansfield, MO 65704',
      notes: '',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      user_id: 'mock-user',
    },
    deleted_at: null,
  },
  {
    id: '2',
    seed_name: 'Sugar Snap Peas',
    type: 'Pea',
    quantity: 100,
    supplier_id: 'supplier-mock-2',
    planting_season: 'Early Spring',
    harvest_season: 'Early Summer',
    seed_images: [
      {
        type: 'url',
        url: 'https://images.unsplash.com/photo-1587049693270-c7560da11218?w=800&auto=format&fit=crop',
      },
    ],
    description: 'Sweet, crisp peas perfect for fresh eating or cooking.',
    user_id: 'mock-user',
    quantity_unit: 'seeds',
    date_purchased: new Date(), // Added property
    suppliers: {
      id: 'supplier-mock-2',
      supplier_name: "Johnny's Selected Seeds",
      supplier_image: '',
      webaddress: 'johnnyseeds.com',
      email: 'support@johnnyseeds.com',
      phone: '(877) 564-6697',
      address: 'Winslow, ME 04901',
      notes: '',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      user_id: 'mock-user',
    },
    deleted_at: null,
  },
];

export default function InventoryScreen() {
  const { session } = useAuth(); // Get user session
  const { colors } = useTheme(); // Get theme colors
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedSeedId, setHighlightedSeedId] = useState<string | null>(
    null
  );
  const [deletingSeedId, setDeletingSeedId] = useState<string | null>(null);
  const router = useRouter();
  const flatListRef = useRef<FlatList<Seed>>(null);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const isMounted = useRef(true);
  const lastPressTimestamps = useRef<Record<string, number>>({});

  // --- 2. Modify Data Loading Logic ---
  const loadSeeds = useCallback(
    async (isRefresh = false) => {
      if (!session?.user) {
        setLoading(false);
        setRefreshing(false);
        setSeeds(mockSeedsData.filter((seed) => !seed.deleted_at)); // Exclude deleted
        return;
      }

      if (!isRefresh && !searchTerm) setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('seeds')
          .select('*, suppliers(*)')
          .eq('user_id', session.user.id)
          .is('deleted_at', null) // Exclude soft-deleted seeds
          .order('seed_name', { ascending: true });

        if (searchTerm) {
          // Supabase/PostgREST does not support nested filters like suppliers(supplier_name.ilike...) in .or()
          // Only search on columns in the seeds table
          query = query.or(
            `seed_name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
          );
        }

        const { data: seedData, error: seedError } = await query;

        if (seedError) throw seedError;

        if (seedData) {
          if (seedData.length > 0) {
            setSeeds(seedData);
          } else {
            if (!searchTerm) {
              setSeeds(mockSeedsData.filter((seed) => !seed.deleted_at));
            } else {
              setSeeds([]);
            }
          }
        } else {
          if (!searchTerm) {
            setSeeds(mockSeedsData.filter((seed) => !seed.deleted_at));
          } else {
            setSeeds([]);
          }
        }
      } catch (e: any) {
        console.error('Error loading seeds:', e);
        setError(
          e.message || 'An unexpected error occurred while fetching seeds.'
        );
        if (!searchTerm) {
          setSeeds(mockSeedsData.filter((seed) => !seed.deleted_at));
        } else {
          setSeeds([]);
        }
      } finally {
        if (!isRefresh) setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [session, searchTerm] // Removed supabase from dependencies
  );

  // Initial load and re-load on focus
  useFocusEffect(
    useCallback(() => {
      loadSeeds();
    }, [loadSeeds]) // Include loadSeeds dependency to ensure fresh data on focus
  );

  // Handle highlighted seed scrolling separately
  useEffect(() => {
    if (highlightedSeedId && seeds.length > 0) {
      const index = seeds.findIndex((s) => s.id === highlightedSeedId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ animated: true, index });
      }
    }
  }, [highlightedSeedId, seeds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedSeedId) {
      const clearHighlight = setTimeout(() => {
        setHighlightedSeedId(null);
      }, 3000);
      
      return () => clearTimeout(clearHighlight);
    }
  }, [highlightedSeedId]);

  // Handle search term changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadSeeds();
    }, 300); // Debounce search
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchTerm(''); // Optionally clear search on pull-to-refresh
    loadSeeds(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddSeed = () => {
    router.push('/add-seed');
  };

  const handleEdit = (seed: Seed) => {
    closeAllSwipeables();
    setHighlightedSeedId(seed.id); // Set for potential highlight on return
    
    // Pass the full seed as JSON for editing
    router.push({
      pathname: '/add-seed',
      params: { seed: JSON.stringify(seed), returnTo: '/(tabs)/' },
    });
  };

  const confirmDelete = (seedId: string) => {
    closeAllSwipeables();
    if (Platform.OS === 'web') {
      // Use window.confirm for web
      if (
        window.confirm(
          'Are you sure you want to delete this seed? This action cannot be undone.'
        )
      ) {
        handleDelete(seedId);
      }
    } else {
      Alert.alert(
        'Delete Seed',
        'Are you sure you want to delete this seed? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDelete(seedId),
          },
        ]
      );
    }
  };

  const handleDelete = async (seedId: string) => {
    setDeletingSeedId(seedId);
    try {
      const deletedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('seeds')
        .update({ deleted_at: deletedAt })
        .eq('id', seedId);
      if (updateError) throw updateError;
      if (isMounted.current) {
        setSeeds((prev) => prev.filter((seed) => seed.id !== seedId));
        Alert.alert('Success', 'Seed deleted successfully.');
      }
    } catch (e: any) {
      console.error('Error deleting seed:', e);
      if (isMounted.current) {
        Alert.alert(
          'Error',
          e.message || 'Failed to delete seed. Please try again.'
        );
      }
    } finally {
      if (isMounted.current) setDeletingSeedId(null);
    }
  };

  const closeAllSwipeables = () => {
    // Only close swipeables on mobile platforms
    if (Platform.OS !== 'web') {
      Object.values(swipeableRefs.current).forEach((ref) => ref?.close());
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    item: Seed
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-150, 0],
      outputRange: [0, 150],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View
        style={{ flexDirection: 'row', transform: [{ translateX: trans }] }}
      >
        <Pressable
          style={[styles.rightAction, { backgroundColor: '#FFC107' }]}
          onPress={() => handleEdit(item)}
          disabled={deletingSeedId === item.id}
        >
          <Edit3 size={24} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[
            styles.rightAction,
            {
              backgroundColor: '#F44336',
              opacity: deletingSeedId === item.id ? 0.6 : 1,
            },
          ]}
          onPress={() => {
            if (deletingSeedId === item.id) return; // Prevent double tap
            confirmDelete(item.id);
          }}
        >
          <View pointerEvents="box-none">
            {deletingSeedId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Trash2 size={24} color="#fff" />
            )}
          </View>
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const getSeedTypeIcon = (type: string): React.ReactNode => {
    // ... (your existing getSeedTypeIcon function)
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('vegetable'))
      return <Carrot size={16} color="#4CAF50" />;
    if (normalizedType.includes('fruit'))
      return <Apple size={16} color="#FF9800" />;
    if (normalizedType.includes('flower'))
      return <Flower2 size={16} color="#E91E63" />;
    if (normalizedType.includes('herb'))
      return <Leaf size={16} color="#8BC34A" />;
    if (normalizedType.includes('grain'))
      return <Wheat size={16} color="#FFEB3B" />;
    if (normalizedType.includes('cherry'))
      return <Cherry size={16} color="#FF5722" />;
    // if (normalizedType.includes('pepper'))
    //   return <Droplets size={20} color="#FF5722" />;
    // if (normalizedType.includes('cucumber'))
    //   return <Wind size={20} color="#4CAF50" />;
    // if (normalizedType.includes('squash'))
    //   return <GanttChartSquare size={20} color="#FF9800" />;
    // if (normalizedType.includes('melon'))
    //   return <Globe size={20} color="#FF9800" />;
    // if (normalizedType.includes('berry'))
    //   return <Grape size={20} color="#FF4081" />;
    // if (normalizedType.includes('nut'))
    //   return <Nut size={20} color="#795548" />;
    // if (normalizedType.includes('pea'))
    //   return <Bean size={20} color="#795548" />;
    // return <Sprout size={20} color="#795548" />;
  };

  // Helper to handle double press on a seed item
  const handleSeedDoublePress = useCallback((seed: Seed) => {
    // Navigate to calendar with params to open add event modal and pre-fill seed name
    router.push({
      pathname: '/calendar',
      params: {
        openAddEvent: 'true',
        seedName: seed.seed_name,
        seedId: seed.id,
      },
    });
  }, [router]);

  const renderSeedItem = useCallback(({ item: seed }: { item: Seed }) => {
    const isHighlighted = seed.id === highlightedSeedId;
    const highlightStyle = isHighlighted ? { backgroundColor: '#e6ffed' } : {};

    // Determine the image URI with better error handling
    function getSeedImageUri(seed: Seed): string {
      // Helper function to construct proper Supabase URL
      const constructSupabaseUrl = (path: string): string => {
        const supabaseUrl = 'https://fodtwysfcqltykejkffn.supabase.co';
        const bucketName = 'seed-images';
        
        // If it's already a full URL, return as-is
        if (path.startsWith('http')) {
          return path;
        }
        
        // If it starts with /storage, prepend the domain
        if (path.startsWith('/storage')) {
          return `${supabaseUrl}${path}`;
        }
        
        // If it's just a path, construct the full URL
        return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
      };
      
      if (seed.seed_images) {
        if (Array.isArray(seed.seed_images) && seed.seed_images.length > 0) {
          const firstImage = seed.seed_images[0];
          if (firstImage && typeof firstImage === 'object' && firstImage.url && typeof firstImage.url === 'string') {
            return constructSupabaseUrl(firstImage.url);
          }
        } else if (typeof seed.seed_images === 'string' && seed.seed_images.trim()) {
          // Handle case where seed_images is a string URL
          return constructSupabaseUrl(seed.seed_images);
        }
      }
      
      // Return a varied garden-themed placeholder based on seed type
      const type = (seed.type || '').toLowerCase();
      if (type.includes('tomato')) {
        return 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      } else if (type.includes('pea')) {
        return 'https://images.unsplash.com/photo-1587049693270-c7560da11218?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      } else if (type.includes('herb')) {
        return 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      } else if (type.includes('flower')) {
        return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      } else {
        // Default garden/seeds image
        return 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      }
    }

    const imageUri = getSeedImageUri(seed);

    // Double press handler using lastPressTimestamps ref in parent
    const handlePress = () => {
      const now = Date.now();
      const lastPress = lastPressTimestamps.current[seed.id] || 0;
      if (now - lastPress < 350) {
        handleSeedDoublePress(seed);
      }
      lastPressTimestamps.current[seed.id] = now;
    };

    // Main content component that will be conditionally wrapped
    const seedItemContent = (
      <Pressable
        style={[styles.seedItem, highlightStyle]}
        onPress={handlePress}
      >
        <View style={styles.imageContainer}>
          <SmartImage
            uri={imageUri}
            style={styles.seedImage}
            resizeMode="cover"
            fallbackUri="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&crop=center&auto=format&q=60"
          />
        </View>
        <View style={styles.seedContent}>
          <View style={styles.seedHeader}>
            <Text style={styles.seedName}>{seed.seed_name}</Text>
            <View
              style={[
                styles.seedTypeContainer,
                { flexDirection: 'row', alignItems: 'center', gap: 6 },
              ]}
            >
              {getSeedTypeIcon(seed.type)}
              <Text style={styles.seedType}>{seed.type}</Text>
            </View>
          </View>
          <Text style={styles.seedDescription}>{seed.description}</Text>
          <View style={styles.seedDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                <Tally4 style={styles.iconsView} /> Quantity:
              </Text>
              <Text style={styles.detailValue}>
                {seed.quantity} {seed.quantity_unit}
              </Text>
            </View>
            {/* Accessing seed.suppliers safely */}
            {seed.suppliers && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  <Truck style={styles.iconsView} /> Supplier:
                </Text>
                <Text style={styles.detailValue}>
                  {seed.suppliers.supplier_name}
                </Text>
              </View>
            )}
            {/*Fallback for when suppliers is not loaded as an object or is null */}
            {!seed.suppliers && seed.supplier_id && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  <Truck style={styles.iconsView} />
                  Supplier ID:
                </Text>
                <Text style={styles.detailValue}>
                  (Details not loaded) {seed.supplier_id}
                </Text>
              </View>
            )}
            <View style={styles.seasonContainer}>
              <View style={[styles.seasonTag, styles.plantTag]}>
                <Text style={styles.seasonText}>
                  Plant: {seed.planting_season}
                </Text>
              </View>
              <View style={[styles.seasonTag, styles.harvestTag]}>
                <Text style={styles.seasonText}>
                  Harvest: {seed.harvest_season}
                </Text>
              </View>
            </View>
          </View>
          {/* Show action buttons on web, hint about double-click */}
          {Platform.OS === 'web' && (
            <View style={styles.webActionButtons}>
              <Text style={styles.webHint}>Double-click for calendar • Buttons below for edit/delete</Text>
              <View style={styles.webButtonRow}>
                <Pressable
                  style={[styles.webActionButton, styles.editButton]}
                  onPress={() => handleEdit(seed)}
                >
                  <Edit3 size={16} color="#fff" />
                  <Text style={styles.webButtonText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.webActionButton, styles.deleteButton]}
                  onPress={() => confirmDelete(seed.id)}
                  disabled={deletingSeedId === seed.id}
                >
                  {deletingSeedId === seed.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Trash2 size={16} color="#fff" />
                  )}
                  <Text style={styles.webButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
        {/* Show chevron only on mobile (where swipe is available) */}
        {Platform.OS !== 'web' && (
          <ChevronRight size={24} color="#ccc" style={styles.chevronIcon} />
        )}
      </Pressable>
    );

    // Conditionally wrap with Swipeable only on mobile platforms
    if (Platform.OS === 'web') {
      return seedItemContent;
    }

    return (
      <Swipeable
        ref={(ref) => {
          swipeableRefs.current[seed.id] = ref;
        }}
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, seed)
        }
        onSwipeableWillOpen={() => {
          // Close other swipeables when one opens
          Object.entries(swipeableRefs.current).forEach(([key, ref]) => {
            if (key !== seed.id && ref) {
              ref.close();
            }
          });
        }}
      >
        {seedItemContent}
      </Swipeable>
    );
  }, [highlightedSeedId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && seeds.length === 0 && !searchTerm) {
    // Show full screen loader only on very first load when no seeds (mock or real) are set yet
    // and not during a search.
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2d7a3a" />
        <Text style={styles.loadingText}>Loading your garden...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={[styles.title, { color: colors.primaryText }]}>My Seed Inventory</Text>
        <View style={styles.headerButtons}>
          <Pressable onPress={handleAddSeed} style={styles.addButton}>
            <PlusCircle size={32} color={colors.primaryText} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.inputText }]}
          placeholder="Search seeds, type, supplier..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={colors.textSecondary}
        />
        {searchTerm ? (
          <Pressable onPress={() => setSearchTerm('')}>
            <XCircle size={20} color={colors.textSecondary} style={styles.clearSearchIcon} />
          </Pressable>
        ) : null}
      </View>

      {error &&
        !loading && ( // Show error only if not loading
          <View style={styles.centered}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <Pressable onPress={() => loadSeeds()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}

      {!loading &&
        seeds.length === 0 &&
        !error && ( // Message for no seeds (could be no search results or truly empty)
          <View style={styles.centered}>
            <Archive size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchTerm
                ? 'No seeds match your search.'
                : 'Your garden is empty! Add some seeds to get started.'}
            </Text>
            {!searchTerm && (
              <Pressable
                onPress={handleAddSeed}
                style={styles.addFirstSeedButton}
              >
                <Text style={styles.addFirstSeedButtonText}>
                  Add First Seed
                </Text>
              </Pressable>
            )}
          </View>
        )}

      {seeds.length > 0 && (
        <FlatList
          ref={flatListRef}
          data={seeds}
          renderItem={renderSeedItem}
          keyExtractor={(item) => item.id.toString()} // Ensure ID is a string
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2d7a3a']}
              tintColor={'#2d7a3a'}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  iconButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconsView: {
    alignItems: 'center',
    borderWidth: 5,
    backgroundColor: '#d0e2e8',
    borderColor: '#4db6ac',
    borderRadius: 50,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e4053',
    marginRight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    // elevation: 2,
    padding: 5,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  clearSearchIcon: {
    marginLeft: 10,
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },

  seedItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Align items vertically
  },
  seedImage: {
    width: '100%',
    height: 200,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  seedContent: {
    padding: 16,
  },
  seedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a472a',
    flex: 1,
  },

  seedTypeContainer: {
    backgroundColor: '#e0f7fa',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seedType: {
    fontSize: 14,
    color: '#2d7a3a',
    fontWeight: '600',
  },
  seedDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 22,
  },
  seedDetails: {
    backgroundColor: '#f8faf8',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a472a',
    fontWeight: '600',
  },
  seasonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  seasonTag: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  plantTag: {
    backgroundColor: '#c8e6c9',
  },
  harvestTag: {
    backgroundColor: '#ffecb3',
  },
  seasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a472a',
  },
  chevronIcon: {
    marginLeft: 'auto', // Pushes chevron to the far right
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#2d7a3a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  addFirstSeedButton: {
    backgroundColor: '#2d7a3a',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  addFirstSeedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 75,
    height: '90%',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  // Web-specific action button styles
  webActionButtons: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f8faf8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  webHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  webButtonRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  webActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#FFC107',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  webButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
