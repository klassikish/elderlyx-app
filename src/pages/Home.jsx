import { useAuth } from '@/lib/AuthContext';
import FamilyHome from '@/components/home/FamilyHome';
import CaregiverHome from '@/components/home/CaregiverHome';
import AdminHome from '@/components/home/AdminHome';

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || 'family';
  if (role === 'caregiver') return <CaregiverHome />;
  if (role === 'admin') return <AdminHome />;
  return <FamilyHome />;
}