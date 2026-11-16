// Telegram yordamchilari: haptic, Back tugmasi, foydalanuvchi
import WebApp from '@twa-dev/sdk';

const safe = (fn) => { try { fn(); } catch { /* brauzerda e'tiborsiz */ } };

export const haptic = {
  tap: () => safe(() => WebApp.HapticFeedback.impactOccurred('light')),
  select: () => safe(() => WebApp.HapticFeedback.selectionChanged()),
  success: () => safe(() => WebApp.HapticFeedback.notificationOccurred('success')),
  error: () => safe(() => WebApp.HapticFeedback.notificationOccurred('error')),
};

export const tgUser = () => WebApp.initDataUnsafe?.user || null;

// Sheet ochilganda Telegram'ning "Orqaga" tugmasi uni yopadi
const stack = [];
const handler = () => stack[stack.length - 1]?.();
export function pushBack(fn) {
  stack.push(fn);
  safe(() => { WebApp.BackButton.show(); WebApp.BackButton.onClick(handler); });
  return () => {
    const i = stack.lastIndexOf(fn);
    if (i >= 0) stack.splice(i, 1);
    if (!stack.length) safe(() => { WebApp.BackButton.offClick(handler); WebApp.BackButton.hide(); });
  };
}

