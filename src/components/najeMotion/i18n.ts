import { useI18n } from '../../i18n';

/** Motion Studio strings live in the `motion.` overlay. */
export function useMotionI18n() {
  const api = useI18n();
  const opt = (group: string, id: string) => api.t(`motion.opt.${group}.${id}`);
  return { ...api, opt };
}
