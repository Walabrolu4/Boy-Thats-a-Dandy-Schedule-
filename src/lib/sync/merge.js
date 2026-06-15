/**
 * mergeState implements a Last-Write-Wins (LWW) conflict resolution algorithm.
 * It merges a local state object with a cloud state object.
 * 
 * Fields like `checked` and `tasks` are expected to be maps of { value, updatedAt } CRDTs.
 * 
 * @param {Object} local - The local state object
 * @param {Object} cloud - The cloud state object
 * @returns {Object} A new merged state object
 */
export function mergeState(local, cloud) {
  if (!local) return cloud;
  if (!cloud) return local;

  const merged = {
    ...local,
    ...cloud,
    checked: mergeCRDTMap(local.checked || {}, cloud.checked || {}),
    tasks: mergeCRDTMap(local.tasks || {}, cloud.tasks || {}),
    review: {
      ...(local.review || {}),
      ...(cloud.review || {})
    }
  };

  // For review questions, if there's no timestamp, we prefer local just as a fallback
  // If we want LWW for review questions, we'd need them to be CRDTs too.
  // For now, we'll blindly overwrite with cloud if it exists, but prefer local if cloud is empty
  for (const q of ['q1', 'q2', 'q3']) {
    merged.review[q] = cloud.review?.[q] || local.review?.[q] || '';
  }

  // Preserve the schedule snapshot from either side (prefer cloud if it exists, or local)
  if (local.scheduleSnapshot || cloud.scheduleSnapshot) {
    merged.scheduleSnapshot = cloud.scheduleSnapshot || local.scheduleSnapshot;
  }

  return merged;
}

/**
 * Merges two maps containing CRDT objects of the format { value, updatedAt }
 * @param {Object} localMap 
 * @param {Object} cloudMap 
 * @returns {Object}
 */
function mergeCRDTMap(localMap, cloudMap) {
  const merged = {};
  
  // Get all unique keys
  const keys = new Set([...Object.keys(localMap), ...Object.keys(cloudMap)]);

  for (const key of keys) {
    const localItem = localMap[key];
    const cloudItem = cloudMap[key];

    if (!localItem) {
      merged[key] = { ...cloudItem };
    } else if (!cloudItem) {
      merged[key] = { ...localItem };
    } else {
      // Both exist, use LWW based on updatedAt
      // Fallback to 0 if updatedAt is somehow missing
      const localTime = localItem.updatedAt || 0;
      const cloudTime = cloudItem.updatedAt || 0;

      if (cloudTime > localTime) {
        merged[key] = { ...cloudItem };
      } else {
        merged[key] = { ...localItem };
      }
    }
  }

  return merged;
}
