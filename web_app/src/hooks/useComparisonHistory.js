import { useLocalStorage } from '@mantine/hooks';
import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';

/**
 * Custom hook to manage comparison history using local storage
 * 
 * Provides functions to add, retrieve, and manage comparison history
 * that persists between browser sessions
 * 
 * @returns {Object} Comparison history functions and data
 */
export function useComparisonHistory() {
  // Initialize local storage with empty arrays or existing data
  const [recentComparisons, setRecentComparisons] = useLocalStorage({
    key: 'cursed-diff-history',
    defaultValue: []
  });

  const [starredComparisons, setStarredComparisons] = useLocalStorage({
    key: 'cursed-diff-starred',
    defaultValue: []
  });

  // Use refs to track if the component is mounted to prevent updates during render
  const isMounted = useRef(false);
  
  // Set isMounted to true after initial render
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Add a new comparison to history
   * 
   * @param {Object} comparison - Comparison data to store
   * @param {string} comparison.sourceFile - Source file path
   * @param {string} comparison.targetFile - Target file path
   * @param {Object} comparison.stats - Comparison statistics
   */
  const addComparison = (comparison) => {
    if (!isMounted.current) return;
    
    // Create a new comparison entry with ID and timestamp
    const newComparison = {
      id: comparison.id || Date.now().toString(), // Use provided ID or timestamp
      sourceFile: comparison.sourceFile,
      targetFile: comparison.targetFile,
      stats: comparison.stats || { added: 0, removed: 0, unchanged: 0 },
      date: new Date().toISOString(),
    };

    // Add to the beginning of the array and limit to 20 items
    setRecentComparisons(prev => {
      // Filter out any duplicates with the same files
      const filtered = prev.filter(
        c => !(c.sourceFile === newComparison.sourceFile && 
               c.targetFile === newComparison.targetFile)
      );
      return [newComparison, ...filtered].slice(0, 20);
    });

    // Show notification
    notifications.show({
      title: 'Comparison Saved',
      message: `Comparison of ${getFileName(newComparison.sourceFile)} and ${getFileName(newComparison.targetFile)} has been saved`,
      color: 'blue',
    });
  };

  /**
   * Delete a comparison from history
   * 
   * @param {string} id - ID of the comparison to delete
   */
  const deleteComparison = (id) => {
    if (!isMounted.current) return;
    
    // Find the comparison before deleting for notification
    const comparison = recentComparisons.find(c => c.id === id) || 
                      starredComparisons.find(c => c.id === id);
    
    setRecentComparisons(prev => prev.filter(c => c.id !== id));
    setStarredComparisons(prev => prev.filter(c => c.id !== id));

    if (comparison) {
      notifications.show({
        title: 'Comparison Removed',
        message: `Comparison of ${getFileName(comparison.sourceFile)} and ${getFileName(comparison.targetFile)} has been removed`,
        color: 'red',
      });
    }
  };

  /**
   * Toggle the starred status of a comparison
   * 
   * @param {Object} comparison - The comparison to star/unstar
   */
  const toggleStarred = (comparison) => {
    if (!isMounted.current) return;
    
    const isCurrentlyStarred = starredComparisons.some(c => c.id === comparison.id);
    
    if (isCurrentlyStarred) {
      // Remove from starred
      setStarredComparisons(prev => prev.filter(c => c.id !== comparison.id));
      
      notifications.show({
        title: 'Removed from Starred',
        message: `Comparison of ${getFileName(comparison.sourceFile)} and ${getFileName(comparison.targetFile)} has been unstarred`,
        color: 'yellow',
      });
    } else {
      // Add to starred
      setStarredComparisons(prev => [comparison, ...prev]);
      
      notifications.show({
        title: 'Added to Starred',
        message: `Comparison of ${getFileName(comparison.sourceFile)} and ${getFileName(comparison.targetFile)} has been starred`,
        color: 'green',
      });
    }
  };

  /**
   * Helper to get filename from path
   * 
   * @param {string} path - File path
   * @returns {string} Filename
   */
  const getFileName = (path) => {
    if (!path) return 'unknown file';
    return path.split('/').pop();
  };

  /**
   * Format a date for display
   * 
   * @param {string} dateString - ISO date string to format
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return 'Unknown date';
    }
  };

  // Format the dates for display
  const formattedRecentComparisons = recentComparisons.map(c => ({
    ...c,
    formattedDate: formatDate(c.date)
  }));

  return {
    recentComparisons: formattedRecentComparisons,
    starredComparisons,
    addComparison,
    deleteComparison,
    toggleStarred,
    isStarred: (id) => starredComparisons.some(c => c.id === id)
  };
} 