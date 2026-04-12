import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Book from '@/pages/Book';
import Caregivers from '@/pages/Caregivers';
import MyBookings from '@/pages/MyBookings';
import Notifications from '@/pages/Notifications';
import Plans from '@/pages/Plans';
import Profile from '@/pages/Profile';
import AdminBookings from '@/pages/AdminBookings';
import AdminUsers from '@/pages/AdminUsers';
import Onboarding from '@/pages/Onboarding';
import ChatList from '@/pages/ChatList';
import Chat from '@/pages/Chat';
import CaregiverDocuments from '@/pages/CaregiverDocuments';
import AdminDocuments from '@/pages/AdminDocuments';
import IndependenceReport from '@/pages/IndependenceReport';
import CaregiverOnboarding from '@/pages/CaregiverOnboarding';
import CaregiverEarnings from '@/pages/CaregiverEarnings';
import AdminCaregiverApproval from '@/pages/AdminCaregiverApproval';
import AdminCaregiverMonitoring from '@/pages/AdminCaregiverMonitoring';
import Billing from '@/pages/Billing';
import CaregiverProfile from '@/pages/CaregiverProfile';
import CaregiverSession from '@/pages/CaregiverSession';
import CaregiverSchedule from '@/pages/CaregiverSchedule';
import AdminPayrollDashboard from '@/pages/AdminPayrollDashboard';
import AdminAnalyticsDashboard from '@/pages/AdminAnalyticsDashboard';
import CaregiverCheckIn from '@/pages/CaregiverCheckIn';
import DailyLifePlayback from '@/pages/DailyLifePlayback';
import FamilySharing from '@/pages/FamilySharing';
import AdminFamilyGroups from '@/pages/AdminFamilyGroups';
import AdminFamilyGroupDetail from '@/pages/AdminFamilyGroupDetail';
import FamilyEmergency from '@/pages/FamilyEmergency';
import FamilyTasks from '@/pages/FamilyTasks';
import FamilyLocation from '@/pages/FamilyLocation';
import FamilyShifts from '@/pages/FamilyShifts';
import CaregiverShifts from '@/pages/CaregiverShifts';
import CarePacks from '@/pages/CarePacks';
import MyCarePack from '@/pages/MyCarePack';
import BookMultiple from '@/pages/BookMultiple';

const DarkModeSync = () => {
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
    const listener = (e) => document.documentElement.classList.toggle('dark', e.matches);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
    return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
  }, []);
  return null;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-3xl bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading Elderlyx…</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/Book" element={<Book />} />
        <Route path="/Caregivers" element={<Caregivers />} />
        <Route path="/MyBookings" element={<MyBookings />} />
        <Route path="/Notifications" element={<Notifications />} />
        <Route path="/Plans" element={<Plans />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/AdminBookings" element={<AdminBookings />} />
        <Route path="/AdminUsers" element={<AdminUsers />} />
        <Route path="/Onboarding" element={<Onboarding />} />
        <Route path="/ChatList" element={<ChatList />} />
        <Route path="/Chat" element={<Chat />} />
        <Route path="/CaregiverDocuments" element={<CaregiverDocuments />} />
        <Route path="/AdminDocuments" element={<AdminDocuments />} />
        <Route path="/IndependenceReport" element={<IndependenceReport />} />
        <Route path="/CaregiverOnboarding" element={<CaregiverOnboarding />} />
        <Route path="/CaregiverEarnings" element={<CaregiverEarnings />} />
        <Route path="/AdminCaregiverApproval" element={<AdminCaregiverApproval />} />
        <Route path="/AdminCaregiverMonitoring" element={<AdminCaregiverMonitoring />} />
        <Route path="/Billing" element={<Billing />} />
        <Route path="/CaregiverProfile" element={<CaregiverProfile />} />
        <Route path="/CaregiverSession" element={<CaregiverSession />} />
        <Route path="/CaregiverSchedule" element={<CaregiverSchedule />} />
        <Route path="/AdminPayrollDashboard" element={<AdminPayrollDashboard />} />
        <Route path="/AdminAnalyticsDashboard" element={<AdminAnalyticsDashboard />} />
        <Route path="/CaregiverCheckIn" element={<CaregiverCheckIn />} />
        <Route path="/DailyLifePlayback" element={<DailyLifePlayback />} />
        <Route path="/FamilySharing" element={<FamilySharing />} />
        <Route path="/AdminFamilyGroups" element={<AdminFamilyGroups />} />
        <Route path="/AdminFamilyGroupDetail" element={<AdminFamilyGroupDetail />} />
        <Route path="/FamilyEmergency" element={<FamilyEmergency />} />
        <Route path="/FamilyTasks" element={<FamilyTasks />} />
        <Route path="/FamilyLocation" element={<FamilyLocation />} />
        <Route path="/FamilyShifts" element={<FamilyShifts />} />
        <Route path="/CaregiverShifts" element={<CaregiverShifts />} />
        <Route path="/CarePacks" element={<CarePacks />} />
        <Route path="/MyCarePack" element={<MyCarePack />} />
        <Route path="/BookMultiple" element={<BookMultiple />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <>
      <DarkModeSync />
      <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
    </>
  );
}

export default App;