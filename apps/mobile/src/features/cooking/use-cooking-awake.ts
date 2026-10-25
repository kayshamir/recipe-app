import { useKeepAwake } from 'expo-keep-awake';
/** Mount only inside the focused cooking screen; cleanup restores sleep on exit. */
export function useCookingAwake() {
  useKeepAwake('recipe-cooking');
}
