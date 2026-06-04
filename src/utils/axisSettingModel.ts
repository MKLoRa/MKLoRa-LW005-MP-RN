export type AxisSettingState = {
  wakeupThreshold: string;
  wakeupDuration: string;
  motionThreshold: string;
  motionDuration: string;
};

export const SAVE_VALIDATION_MSG_AXIS =
  'Opps！Save failed. Please check the input characters and try again.';

export function validateAxisSetting(state: AxisSettingState): boolean {
  const wt = parseInt(state.wakeupThreshold, 10);
  const wd = parseInt(state.wakeupDuration, 10);
  const mt = parseInt(state.motionThreshold, 10);
  const md = parseInt(state.motionDuration, 10);
  if (
    !state.wakeupThreshold ||
    Number.isNaN(wt) ||
    wt < 1 ||
    wt > 20
  ) {
    return false;
  }
  if (
    !state.wakeupDuration ||
    Number.isNaN(wd) ||
    wd < 1 ||
    wd > 10
  ) {
    return false;
  }
  if (
    !state.motionThreshold ||
    Number.isNaN(mt) ||
    mt < 10 ||
    mt > 250
  ) {
    return false;
  }
  if (
    !state.motionDuration ||
    Number.isNaN(md) ||
    md < 1 ||
    md > 50
  ) {
    return false;
  }
  return true;
}
