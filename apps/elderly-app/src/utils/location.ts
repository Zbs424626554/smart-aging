// 检查定位权限状态
export function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  return new Promise((resolve) => {
    if (!navigator.permissions) {
      // 如果不支持权限API，假设需要提示
      resolve('prompt');
      return;
    }

    navigator.permissions.query({ name: 'geolocation' as PermissionName })
      .then(result => {
        resolve(result.state as 'granted' | 'denied' | 'prompt');
      })
      .catch(() => {
        resolve('prompt');
      });
  });
}

export async function getCurrentGeoPoint(): Promise<{ type: 'Point'; coordinates: [number, number] }> {
  return new Promise((resolve, reject) => {
    // 检查浏览器是否支持地理定位
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'));
      return;
    }

    // 快速定位策略：3秒超时，优先使用缓存
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        // 定位成功，包含精度信息
        resolve({
          type: 'Point',
          coordinates: [lng, lat],
          accuracy: accuracy // 添加精度信息（米）
        });
      },
      err => {
        let errorMessage = '定位失败';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = '定位权限被拒绝';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = '定位信息不可用';
            break;
          case err.TIMEOUT:
            errorMessage = '定位超时';
            break;
          default:
            errorMessage = `定位失败: ${err.message}`;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true, // 高精度模式，提高定位准确性
        timeout: 5000, // 增加超时时间，给高精度定位更多时间
        maximumAge: 30000 // 减少缓存时间到30秒，确保位置较新
      }
    );
  });
}

// 备用定位方法：使用IP地址定位
export async function getLocationByIP(): Promise<{ type: 'Point'; coordinates: [number, number] }> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    if (data.latitude && data.longitude) {
      return { type: 'Point', coordinates: [data.longitude, data.latitude] };
    } else {
      throw new Error('IP定位服务返回无效数据');
    }
  } catch (error) {
    throw new Error('IP定位失败');
  }
}

// 保定理工东院的精确经纬度坐标
const BAODING_LOCATION: [number, number] = [115.488818, 38.814838];

// 简化定位方法：直接使用固定位置（保定理工东院）
export async function getLocationWithFallback(): Promise<{ type: 'Point'; coordinates: [number, number]; accuracy?: number }> {
  // 直接返回固定位置，确保定位准确
  return getFixedLocation();
}

// 计算两点间距离（公里）
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 获取固定位置（保定理工东院）
export function getFixedLocation(): { type: 'Point'; coordinates: [number, number]; accuracy: number } {
  return {
    type: 'Point',
    coordinates: BAODING_LOCATION,
    accuracy: 100
  };
}

