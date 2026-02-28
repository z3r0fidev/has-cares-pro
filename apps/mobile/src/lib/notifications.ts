import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleBookingConfirmation(
  providerName: string,
  appointmentDate: string,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Appointment Request Sent',
        body: `Your appointment with ${providerName} on ${new Date(appointmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} has been submitted.`,
        sound: true,
      },
      trigger: null, // fire immediately as a local banner
    });
  } catch {
    // Notification permission may be denied — silently skip
  }
}
