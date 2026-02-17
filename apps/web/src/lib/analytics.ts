export enum EventType {
  PROFILE_VIEW = 'profile_view',
  DIRECTION_CLICK = 'direction_click',
  WEBSITE_CLICK = 'website_url_click',
  TELEHEALTH_CLICK = 'telehealth_url_click'
}

export const trackEvent = async (providerId: string, type: EventType) => {
  try {
    const hostname = window.location.hostname;
    const API_URL = `http://${hostname}:3001`;
    
    await fetch(`${API_URL}/analytics/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, type }),
    });
  } catch (error) {
    console.error("Failed to track event", error);
  }
};
