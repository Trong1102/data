// ============================================
// USER TRACKING WITHOUT LOGIN
// ============================================

// 1. Generate Browser Fingerprint
export const generateFingerprint = async () => {
  const components = [];

  // User Agent
  components.push(navigator.userAgent);

  // Screen Resolution
  components.push(`${window.screen.width}x${window.screen.height}`);
  components.push(`${window.screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware Concurrency (CPU cores)
  components.push(navigator.hardwareConcurrency || 'unknown');

  // Device Memory (GB)
  components.push(navigator.deviceMemory || 'unknown');

  // Canvas Fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 140, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 2);
    components.push(canvas.toDataURL());
  } catch (e) {
    components.push('canvas_error');
  }

  // WebGL Fingerprint
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
      components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
    }
  } catch (e) {
    components.push('webgl_error');
  }

  // Plugins
  const plugins = [];
  for (let i = 0; i < navigator.plugins.length; i++) {
    plugins.push(navigator.plugins[i].name);
  }
  components.push(plugins.join(','));

  // Fonts Detection (basic)
  const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia'];
  const availableFonts = [];
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  for (const font of fonts) {
    context.font = testSize + ' ' + font;
    if (context.measureText(testString).width > 0) {
      availableFonts.push(font);
    }
  }
  components.push(availableFonts.join(','));

  // Touch Support
  components.push('ontouchstart' in window ? 'touch' : 'no-touch');

  // Create hash from all components
  const fingerprint = await hashString(components.join('|||'));
  return fingerprint;
};

// 2. Hash function (simple)
const hashString = async (str) => {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// 3. Get or Create User ID
export const getUserId = async () => {
  // Priority 1: Check localStorage
  let userId = localStorage.getItem('shopvn_user_id');
  
  if (userId) {
    console.log('✅ Found existing user ID in localStorage:', userId);
    return userId;
  }

  // Priority 2: Check cookie
  userId = getCookie('shopvn_user_id');
  
  if (userId) {
    console.log('✅ Found existing user ID in cookie:', userId);
    // Save to localStorage for faster access
    localStorage.setItem('shopvn_user_id', userId);
    return userId;
  }

  // Priority 3: Generate new ID based on fingerprint
  const fingerprint = await generateFingerprint();
  const timestamp = Date.now();
  userId = `user_${fingerprint}_${timestamp}`;

  console.log('🆕 Generated new user ID:', userId);

  // Save to both localStorage and cookie
  localStorage.setItem('shopvn_user_id', userId);
  setCookie('shopvn_user_id', userId, 365); // 1 year

  return userId;
};

// 4. Cookie Helper Functions
const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// 5. Get User Device Info
export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  
  // Detect device type
  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone/i.test(ua)) {
    deviceType = 'Mobile';
  } else if (/iPad|Tablet/i.test(ua)) {
    deviceType = 'Tablet';
  }

  // Detect OS
  let os = 'Unknown';
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  else if (ua.indexOf('Mac') !== -1) os = 'MacOS';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux';
  else if (ua.indexOf('Android') !== -1) os = 'Android';
  else if (ua.indexOf('iOS') !== -1 || ua.indexOf('iPhone') !== -1) os = 'iOS';

  // Detect browser
  let browser = 'Unknown';
  if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
  else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (ua.indexOf('Edg') !== -1) browser = 'Edge';
  else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) browser = 'Opera';

  return {
    deviceType,
    os,
    browser,
    userAgent: ua,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform
  };
};

// 6. Track User Visit
export const trackUserVisit = async (db, addDoc, collection, serverTimestamp) => {
  try {
    const userId = await getUserId();
    const fingerprint = await generateFingerprint();
    const deviceInfo = getDeviceInfo();

    const visitData = {
      userId,
      fingerprint,
      ...deviceInfo,
      visitTime: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer || 'direct',
      createdAt: serverTimestamp()
    };

    // Save to Firestore
    await addDoc(collection(db, 'user_visits'), visitData);
    
    console.log('✅ User visit tracked:', visitData);
    return userId;
  } catch (error) {
    console.error('❌ Error tracking user visit:', error);
    return null;
  }
};

// 7. Get User Profile (aggregate data)
export const getUserProfile = (userId) => {
  // Get stored user data
  const profile = {
    userId,
    fingerprint: localStorage.getItem('shopvn_fingerprint'),
    firstVisit: localStorage.getItem('shopvn_first_visit'),
    totalVisits: parseInt(localStorage.getItem('shopvn_visit_count') || '0'),
    lastVisit: localStorage.getItem('shopvn_last_visit')
  };

  // Update visit count
  profile.totalVisits += 1;
  localStorage.setItem('shopvn_visit_count', profile.totalVisits.toString());
  
  // Set first visit if not exists
  if (!profile.firstVisit) {
    const now = new Date().toISOString();
    profile.firstVisit = now;
    localStorage.setItem('shopvn_first_visit', now);
  }

  // Update last visit
  const now = new Date().toISOString();
  profile.lastVisit = now;
  localStorage.setItem('shopvn_last_visit', now);

  return profile;
};

// 8. Check if returning user
export const isReturningUser = () => {
  const firstVisit = localStorage.getItem('shopvn_first_visit');
  return firstVisit !== null;
};

// 9. Get user segments
export const getUserSegment = () => {
  const visitCount = parseInt(localStorage.getItem('shopvn_visit_count') || '0');
  
  if (visitCount === 0 || visitCount === 1) {
    return 'new_user';
  } else if (visitCount >= 2 && visitCount <= 5) {
    return 'occasional_user';
  } else if (visitCount >= 6 && visitCount <= 20) {
    return 'regular_user';
  } else {
    return 'power_user';
  }
};