import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Export user's tea collection to JSON file
 */
export const exportCollectionToJSON = async (collection, profile) => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    user: profile ? {
      username: profile.username,
      displayName: profile.display_name,
    } : null,
    stats: {
      totalTeas: collection.length,
      triedCount: collection.filter(item => item.status === 'tried').length,
      wantToTryCount: collection.filter(item => item.status === 'want_to_try').length,
    },
    collection: collection.map(item => ({
      teaId: item.tea_id,
      teaName: item.tea?.name,
      brandName: item.tea?.brandName,
      teaType: item.tea?.teaType,
      status: item.status,
      userRating: item.user_rating,
      notes: item.notes,
      addedAt: item.added_at,
      triedAt: item.tried_at,
    })),
  };
  
  const fileName = `resteeped-collection-${new Date().toISOString().split('T')[0]}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  
  try {
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Tea Collection',
      });
      return { success: true };
    } else {
      return { success: false, error: 'Sharing not available on this device' };
    }
  } catch (error) {
    console.error('Error exporting collection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export user's tea collection to CSV file
 */
export const exportCollectionToCSV = async (collection) => {
  const headers = ['Tea Name', 'Brand', 'Type', 'Status', 'My Rating', 'Notes', 'Added Date', 'Tried Date'];
  
  const rows = collection.map(item => [
    item.tea?.name || '',
    item.tea?.brandName || '',
    item.tea?.teaType || '',
    item.status || '',
    item.user_rating || '',
    (item.notes || '').replace(/"/g, '""'), // Escape quotes
    item.added_at ? new Date(item.added_at).toLocaleDateString() : '',
    item.tried_at ? new Date(item.tried_at).toLocaleDateString() : '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  const fileName = `resteeped-collection-${new Date().toISOString().split('T')[0]}.csv`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  
  try {
    await FileSystem.writeAsStringAsync(filePath, csvContent);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Tea Collection',
      });
      return { success: true };
    } else {
      return { success: false, error: 'Sharing not available on this device' };
    }
  } catch (error) {
    console.error('Error exporting collection:', error);
    return { success: false, error: error.message };
  }
};
