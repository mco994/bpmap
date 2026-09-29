import { Easing, ReduceMotion } from 'react-native-reanimated';

export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export const OPEN_TIMING = { duration: 250, easing: EASE_OUT, reduceMotion: ReduceMotion.System };
export const CLOSE_TIMING = { duration: 200, easing: EASE_OUT, reduceMotion: ReduceMotion.System };

export const DISMISS_SPRING = {
  duration: 300,
  dampingRatio: 1,
  overshootClamping: true,
  reduceMotion: ReduceMotion.System,
};
export const SNAP_BACK_SPRING = { duration: 300, dampingRatio: 0.8, reduceMotion: ReduceMotion.System };

export function project(velocity: number, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
