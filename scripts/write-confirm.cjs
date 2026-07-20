const fs = require('fs');
const path = require('path');

const confirmModal = `import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  open,
  title = 'X\u00e1c nh\u1eadn',
  message,
  confirmLabel = 'X\u00e1c nh\u1eadn',
  cancelLabel = 'H\u1ee7y',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={\`confirm-icon \${danger ? 'danger' : ''}\`} aria-hidden>
          <AlertTriangle size={22} />
        </div>
        <h3 id="confirm-title">{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={\`btn \${danger ? 'btn-danger' : 'btn-primary'}\`} onClick={onConfirm} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
`;

const confirmProvider = `import { createContext, useCallback, useContext, useState } from 'react';
import ConfirmModal from './ConfirmModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const close = (result) => {
    if (state?.resolve) state.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        open={!!state}
        title={state?.title}
        message={state?.message}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        danger={state?.danger}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
`;

const root = path.join(__dirname, '..', 'admin', 'src', 'components');
fs.writeFileSync(path.join(root, 'ConfirmModal.jsx'), confirmModal, 'utf8');
fs.writeFileSync(path.join(root, 'ConfirmProvider.jsx'), confirmProvider, 'utf8');
console.log('ok');
