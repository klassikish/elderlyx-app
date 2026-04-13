import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import CaregiverJournalForm from '@/components/CaregiverJournalForm';
import CaregiverExpenseForm from '@/components/CaregiverExpenseForm';

type Booking = {
  id: string | number;
  service_type?: string;
  senior_name?: string;
};

type Props = {
  bookings?: Booking[];
};

export default function CompletedBookings({ bookings = [] }: Props) {
  const [journalBookingId, setJournalBookingId] = useState<string | number | null>(null);
  const [expenseBookingId, setExpenseBookingId] = useState<string | number | null>(null);

  if (bookings.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <CheckCircle2 size={16} color="#22c55e" />
        <Text style={styles.heading}>Recent Completed</Text>
      </View>

      <View style={styles.list}>
        {bookings.slice(0, 3).map((b) => (
          <View key={String(b.id)} style={styles.card}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.serviceType}>{b.service_type || 'Service'}</Text>
                <Text style={styles.seniorName}>{b.senior_name || 'Unknown senior'}</Text>
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => {
                    setJournalBookingId(journalBookingId === b.id ? null : b.id);
                    setExpenseBookingId(null);
                  }}
                  style={styles.journalButton}
                >
                  <Text style={styles.journalButtonText}>📓 Journal</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setExpenseBookingId(expenseBookingId === b.id ? null : b.id);
                    setJournalBookingId(null);
                  }}
                  style={styles.expenseButton}
                >
                  <Text style={styles.expenseButtonText}>🧾 Expense</Text>
                </Pressable>
              </View>
            </View>

            {journalBookingId === b.id && (
              <View style={styles.formWrap}>
                <CaregiverJournalForm
                  booking={b}
                  onDone={() => setJournalBookingId(null)}
                />
              </View>
            )}

            {expenseBookingId === b.id && (
              <View style={styles.formWrap}>
                <CaregiverExpenseForm
                  booking={b}
                  onDone={() => setExpenseBookingId(null)}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heading: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  list: {
    gap: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceType: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111827',
    textTransform: 'capitalize',
  },
  seniorName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  journalButton: {
    backgroundColor: 'rgba(15,118,110,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  journalButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f766e',
  },
  expenseButton: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  expenseButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  formWrap: {
    marginTop: 12,
  },
});
