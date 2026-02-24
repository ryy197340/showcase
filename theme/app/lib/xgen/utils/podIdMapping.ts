/**
 * Utility functions for managing pod ID to xgen ID mapping in localStorage
 */

export const POD_STORAGE_KEY = 'pod-id-mapping';
export const POD_STORAGE_CHANGE_EVENT = 'pod-storage-change';

export interface PodIdMapping {
  [podId: string]: string;
}

/**
 * Helper function to dispatch custom storage change event
 */
function dispatchStorageChangeEvent(
  newValue: string | null,
  oldValue: string | null,
) {
  const event = new CustomEvent(POD_STORAGE_CHANGE_EVENT, {
    detail: {
      key: POD_STORAGE_KEY,
      newValue,
      oldValue,
      storageArea: 'localStorage',
    },
  });
  window.dispatchEvent(event);
}

/**
 * Set a single pod ID mapping
 */
export function setPodIdMapping(podId: string, xgenId: string): void {
  try {
    const existing = getAllPodIdMappings();
    const oldValue = JSON.stringify(existing);
    const updated = {...existing, [podId]: xgenId};
    const newValue = JSON.stringify(updated);

    localStorage.setItem(POD_STORAGE_KEY, newValue);

    dispatchStorageChangeEvent(newValue, oldValue);
  } catch (error) {
    console.error('Failed to set pod ID mapping:', error);
  }
}

/**
 * Get a single pod ID mapping
 */
export function getPodIdMapping(podId: string): string | null {
  try {
    const mappings = getAllPodIdMappings();
    return mappings[podId] || null;
  } catch (error) {
    console.error('Failed to get pod ID mapping:', error);
    return null;
  }
}

/**
 * Get all pod ID mappings
 */
export function getAllPodIdMappings(): PodIdMapping {
  try {
    const stored = localStorage.getItem(POD_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to get pod ID mappings:', error);
    return {};
  }
}

/**
 * Remove a single pod ID mapping
 */
export function removePodIdMapping(podId: string): void {
  try {
    const existing = getAllPodIdMappings();
    const oldValue = JSON.stringify(existing);
    const {[podId]: removed, ...updated} = existing;
    const newValue = JSON.stringify(updated);

    localStorage.setItem(POD_STORAGE_KEY, newValue);

    dispatchStorageChangeEvent(newValue, oldValue);
  } catch (error) {
    console.error('Failed to remove pod ID mapping:', error);
  }
}

/**
 * Clear all pod ID mappings
 */
export function clearAllPodIdMappings(): void {
  try {
    const oldValue = localStorage.getItem(POD_STORAGE_KEY);
    localStorage.removeItem(POD_STORAGE_KEY);

    dispatchStorageChangeEvent(null, oldValue);
  } catch (error) {
    console.error('Failed to clear pod ID mappings:', error);
  }
}

/**
 * Set multiple pod ID mappings at once
 */
export function setMultiplePodIdMappings(mappings: PodIdMapping): void {
  try {
    const existing = getAllPodIdMappings();
    const oldValue = JSON.stringify(existing);
    const updated = {...existing, ...mappings};
    const newValue = JSON.stringify(updated);

    localStorage.setItem(POD_STORAGE_KEY, newValue);

    dispatchStorageChangeEvent(newValue, oldValue);
  } catch (error) {
    console.error('Failed to set multiple pod ID mappings:', error);
  }
}
