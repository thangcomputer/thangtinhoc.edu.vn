import { Toaster } from 'react-hot-toast';

const baseStyle = {
  minWidth: '300px',
  maxWidth: '380px',
  padding: '14px 18px',
  borderRadius: '14px',
  fontSize: '0.9rem',
  fontWeight: '500',
  lineHeight: '1.5',
  fontFamily: "'Inter', sans-serif",
  boxShadow: '0 12px 40px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.06)',
  background: '#ffffff',
  color: '#0f172a',
};

export default function AppToaster({ position = 'top-right' }) {
  return (
    <Toaster
      position={position}
      containerClassName="app-toaster-container"
      containerStyle={{
        zIndex: 999999,
        top: 'max(16px, env(safe-area-inset-top))',
        right: 'max(16px, env(safe-area-inset-right))',
      }}
      gutter={12}
      toastOptions={{
        className: 'app-toast',
        duration: 4000,
        style: baseStyle,
        success: {
          className: 'app-toast app-toast--success',
          style: {
            ...baseStyle,
            borderLeft: '4px solid #10b981',
          },
          iconTheme: { primary: '#10b981', secondary: '#ffffff' },
        },
        error: {
          className: 'app-toast app-toast--error',
          style: {
            ...baseStyle,
            borderLeft: '4px solid #ef4444',
          },
          iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
        },
        loading: {
          className: 'app-toast',
          style: baseStyle,
        },
        blank: {
          className: 'app-toast',
          style: baseStyle,
        },
      }}
    />
  );
}
