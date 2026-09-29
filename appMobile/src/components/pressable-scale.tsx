import { useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import Animated, {
  cubicBezier,
  useReducedMotion,
  type CSSTransitionProperties,
} from 'react-native-reanimated';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: ComponentProps<typeof Animated.View>['style'];
  children?: ReactNode;
};

export function PressableScale({ style, children, onPressIn, onPressOut, ...rest }: Props) {
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      pressRetentionOffset={16}
      {...rest}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
    >
      <Animated.View
        style={[
          styles.base,
          style,
          pressed && (reducedMotion ? styles.pressedReduced : styles.pressed),
          PRESS_TRANSITION,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { transform: [{ scale: 1 }], opacity: 1 },
  pressed: { transform: [{ scale: 0.97 }] },
  pressedReduced: { opacity: 0.85 },
});

const PRESS_TRANSITION: CSSTransitionProperties = {
  transitionProperty: ['transform', 'opacity', 'backgroundColor'],
  transitionDuration: ['120ms', '120ms', '150ms'],
  transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
};
