import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Bell, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// Keep this only if you are still temporarily using Base44:
import { base44 } from '@/api/base44Client';

type UserType = {
  full_name?: string;
  caregiver_available?: boolean;
};

type NotificationType = {
  id?: string | number;
};

type Props = {
  user?: UserType;
  notifications?: NotificationType[];
};

export default function CaregiverHomeHeader({
  user,
  notifications = [],
}: Props) {
  const qc = useQueryClient();

  const toggleAvailable = useMutation({
    mutationFn: async () => {
      return base44.auth.updateMe({
        caregiver_available: !user?.caregiver_available,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries();
      Alert.alert('Success', 'Availability updated');
    },
    onError: () => {
      Alert.alert('Error', 'Could not update availability');
    },
  });

  const isAvailable = !!user?.caregiver_available;
  const firstName = user?.full_name?.split(' ')[0] || 'Welcome';

  return (
    <View style={styles.wrapper}>
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.textBlock}>
            <Text style={styles.subtitle}>Caregiver Dashboard</Text>

            <Text style={styles.title}>
              {firstName} <Text style={styles.star}>✦</Text>
            </Text>

            <Text style={styles.caption}>
              Making a difference, one visit at a time
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/(caregiver)/notifications')}
            style={styles.notificationButton}
          >
            <Bell size={20} color="#ffffff" />

            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => toggleAvailable.mutate()}
          style={[
            styles.availabilityButton,
            isAvailable ? styles.availableButton : styles.unavailableButton,
          ]}
        >
          {isAvailable ? (
            <ToggleRight size={20} color="#86efac" />
          ) : (
            <ToggleLeft size={20} color="#9ca3af" />
          )}

          <Text
            style={[
              styles.availabilityText,
              isAvailable ? styles.availableText : styles.unavailableText,
            ]}
          >
            {isAvailable ? '● Available for jobs' : '○ Unavailable'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: '#065f46',
    position: 'relative',
  },
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(110,231,183,0.08)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 96,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  subtitle: {
    color: 'rgba(167,243,208,0.8)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 2,
  },
  star: {
    color: '#86efac',
  },
  caption: {
    color: 'rgba(167,243,208,0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    position: 'relative',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  availabilityButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  availableButton: {
    backgroundColor: 'rgba(52,211,153,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.35)',
  },
  unavailableButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '700',
  },
  availableText: {
    color: '#bbf7d0',
  },
  unavailableText: {
    color: 'rgba(255,255,255,0.5)',
  },
});
