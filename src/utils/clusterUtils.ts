export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('vademecum_device_id');
  if (!deviceId) {
    deviceId = 'node-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('vademecum_device_id', deviceId);
  }
  return deviceId;
};
