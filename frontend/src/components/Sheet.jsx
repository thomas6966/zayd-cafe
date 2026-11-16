// Admin panel uchun moslik qatlami: shartli render qilinadigan Sheet
import { Sheet as Base } from './ui.jsx';

export default function Sheet({ onClose, children }) {
  return <Base open onClose={onClose}><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div></Base>;
}
