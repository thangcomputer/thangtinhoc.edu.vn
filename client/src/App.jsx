import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useAuthStore from './store/authStore';
import api from './lib/api';
import { useSecurityProtection } from './lib/useSecurityProtection';
import { useIdleLogout } from './lib/useIdleLogout';
import AppToaster from './components/AppToaster';

// Layout & Components (always loaded — small, critical)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PromotionPopup from './components/PromotionPopup';
import ChatWidget from './components/ChatWidget';
import CookieConsent from './components/CookieConsent';
import ScrollToTop from './components/ScrollToTop';
import PageLoader from './components/PageLoader';

// Pages — lazy loaded to reduce initial bundle & unused JS
const Home          = lazy(() => import('./pages/Home'));
const About         = lazy(() => import('./pages/About'));
const Courses       = lazy(() => import('./pages/Courses'));
const CourseDetail  = lazy(() => import('./pages/CourseDetail'));
const CoursePlayer  = lazy(() => import('./pages/CoursePlayer'));
const MyCourses     = lazy(() => import('./pages/MyCourses'));
const Blog          = lazy(() => import('./pages/Blog'));
const BlogDetail    = lazy(() => import('./pages/BlogDetail'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const PaymentSuccess= lazy(() => import('./pages/PaymentSuccess'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const ForgotPassword= lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile       = lazy(() => import('./pages/Profile'));
const NotFound      = lazy(() => import('./pages/NotFound'));
const Recruitment   = lazy(() => import('./pages/Recruitment'));
const Contact       = lazy(() => import('./pages/Contact'));
const MyActivity    = lazy(() => import('./pages/MyActivity'));

// Minimal fallback for Suspense — no layout shift
function PageFallback() {
  return <div style={{ minHeight: '60vh' }} aria-hidden />;
}

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// Layout with Navbar + Footer — uses Outlet for child routes
function LayoutWrapper() {
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    api.get('/settings').then(res => {
      const data = res.data.data;
      setSettings(data);
      if (data?.google_analytics_id && !document.getElementById('ga-script')) {
        const script = document.createElement('script');
        script.id = 'ga-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${data.google_analytics_id}`;
        document.head.appendChild(script);
        const inline = document.createElement('script');
        inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${data.google_analytics_id}');`;
        document.head.appendChild(inline);
      }
      if (data?.site_name) document.title = data.site_name + ' - Trung Tâm Đào Tạo Tin Học';
      if (data?.site_description) {
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
        meta.content = data.site_description;
      }
    }).catch(() => { /* silently fall back to defaults */ })
      .finally(() => setTimeout(() => setSettingsLoading(false), 600));
  }, []);

  useEffect(() => {
    if (settings?.google_analytics_id && window.gtag) {
      window.gtag('config', settings.google_analytics_id, { page_path: location.pathname + location.search });
    }
  }, [location, settings]);

  if (settingsLoading) {
    return <PageLoader mode={settings?.loading_mode || 'spinner'} siteName={settings?.site_name || 'Tin học 24h'} logo={settings?.site_logo} />;
  }

  return (
    <>
      <ScrollToTop />
      <AppToaster />
      <Navbar settings={settings} />
      <main style={{ flex: 1, paddingTop: '100px', minHeight: 'calc(100vh - 300px)' }}>
        <Outlet context={{ settings }} />
      </main>
      <PromotionPopup enabled={settings?.promo_enabled} content={settings?.promo_text} />
      <ChatWidget settings={settings} />
      <CookieConsent />
      <Footer settings={settings} />
    </>
  );
}

// Home needs settings from context
function HomeWrapper() {
  const { settings } = useOutletContext();
  return <Home settings={settings} />;
}

const S = ({ children }) => <Suspense fallback={<PageFallback />}>{children}</Suspense>;

const router = createBrowserRouter([
  // Auth routes — no layout
  { path: '/login',          element: <><AppToaster /><S><Login /></S></> },
  { path: '/register',       element: <><AppToaster /><S><Register /></S></> },
  { path: '/forgot-password',element: <><AppToaster /><S><ForgotPassword /></S></> },
  { path: '/reset-password', element: <><AppToaster /><S><ResetPassword /></S></> },
  { path: '/learn/:slug',    element: <><AppToaster /><PrivateRoute><S><CoursePlayer /></S></PrivateRoute></> },
  { path: '/learn/:slug/:lessonId', element: <><AppToaster /><PrivateRoute><S><CoursePlayer /></S></PrivateRoute></> },

  // Main layout — all routes share Navbar+Footer via LayoutWrapper
  {
    path: '/',
    element: <LayoutWrapper />,
    children: [
      { index: true,              element: <S><HomeWrapper /></S> },
      { path: 'gioi-thieu',       element: <S><About /></S> },
      { path: 'courses',          element: <S><Courses /></S> },
      { path: 'courses/:slug',    element: <S><CourseDetail /></S> },
      { path: 'blog',             element: <S><Blog /></S> },
      { path: 'blog/:slug',       element: <S><BlogDetail /></S> },
      { path: 'tuyen-dung',       element: <S><Recruitment /></S> },
      { path: 'lien-he',          element: <S><Contact /></S> },
      { path: 'my-courses',       element: <PrivateRoute><S><MyCourses /></S></PrivateRoute> },
      { path: 'my-activity',      element: <PrivateRoute><S><MyActivity /></S></PrivateRoute> },
      { path: 'profile',          element: <PrivateRoute><S><Profile /></S></PrivateRoute> },
      { path: 'checkout',         element: <PrivateRoute><S><Checkout /></S></PrivateRoute> },
      { path: 'payment/success',  element: <PrivateRoute><S><PaymentSuccess /></S></PrivateRoute> },
      { path: 'ghi-danh',         element: <Navigate to="/?enroll=true" replace /> },
      { path: '*',                element: <S><NotFound /></S> },
    ],
  },
  { path: '*', element: <><AppToaster /><S><NotFound /></S></> },
]);

function App() {
  useSecurityProtection();
  useIdleLogout();
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}

export default App;
