/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get bounding box coordinates for a given center point and radius
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {object} Bounding box with north, south, east, west coordinates
 */
function getBoundingBox(lat, lng, radiusKm) {
  const R = 6371; // Earth's radius in kilometers
  const latRad = toRadians(lat);
  const lngRad = toRadians(lng);
  
  // Calculate angular distance
  const angularDistance = radiusKm / R;
  
  const minLat = lat - toDegrees(angularDistance);
  const maxLat = lat + toDegrees(angularDistance);
  
  const deltaLng = Math.asin(Math.sin(angularDistance) / Math.cos(latRad));
  const minLng = lng - toDegrees(deltaLng);
  const maxLng = lng + toDegrees(deltaLng);
  
  return {
    north: maxLat,
    south: minLat,
    east: maxLng,
    west: minLng
  };
}

/**
 * Convert radians to degrees
 * @param {number} radians 
 * @returns {number} Degrees
 */
function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Check if a point is within a circular area
 * @param {number} pointLat - Point latitude
 * @param {number} pointLng - Point longitude
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if point is within the area
 */
function isWithinRadius(pointLat, pointLng, centerLat, centerLng, radiusKm) {
  const distance = calculateDistance(pointLat, pointLng, centerLat, centerLng);
  return distance <= radiusKm;
}

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Start latitude
 * @param {number} lng1 - Start longitude
 * @param {number} lat2 - End latitude
 * @param {number} lng2 - End longitude
 * @returns {number} Bearing in degrees (0-360)
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  
  let bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Get human-readable direction from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} Direction (N, NE, E, SE, S, SW, W, NW)
 */
function getDirection(bearing) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${Math.round(distanceKm * 10) / 10}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Estimate travel time based on distance and mode of transport
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} mode - Transport mode ('walking', 'driving', 'cycling')
 * @returns {object} Estimated time in minutes and formatted string
 */
function estimateTravelTime(distanceKm, mode = 'driving') {
  const speeds = {
    walking: 5, // km/h
    cycling: 15, // km/h
    driving: 30 // km/h (city average with traffic)
  };
  
  const speed = speeds[mode] || speeds.driving;
  const timeHours = distanceKm / speed;
  const timeMinutes = Math.round(timeHours * 60);
  
  let formatted;
  if (timeMinutes < 60) {
    formatted = `${timeMinutes} min`;
  } else {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    formatted = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  return {
    minutes: timeMinutes,
    formatted,
    mode
  };
}

/**
 * Find the closest point from a list of points
 * @param {number} lat - Reference latitude
 * @param {number} lng - Reference longitude
 * @param {Array} points - Array of points with lat, lng properties
 * @returns {object} Closest point with distance
 */
function findClosestPoint(lat, lng, points) {
  if (!points || points.length === 0) return null;
  
  let closest = null;
  let minDistance = Infinity;
  
  points.forEach(point => {
    const distance = calculateDistance(lat, lng, point.lat, point.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closest = { ...point, distance };
    }
  });
  
  return closest;
}

/**
 * Sort points by distance from a reference point
 * @param {number} lat - Reference latitude
 * @param {number} lng - Reference longitude
 * @param {Array} points - Array of points with lat, lng properties
 * @returns {Array} Sorted array of points with distance added
 */
function sortByDistance(lat, lng, points) {
  return points
    .map(point => ({
      ...point,
      distance: calculateDistance(lat, lng, point.lat, point.lng)
    }))
    .sort((a, b) => a.distance - b.distance);
}

module.exports = {
  calculateDistance,
  getBoundingBox,
  isWithinRadius,
  calculateBearing,
  getDirection,
  formatDistance,
  estimateTravelTime,
  findClosestPoint,
  sortByDistance,
  toRadians,
  toDegrees
};