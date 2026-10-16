import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { Colors, Paper, Radius } from '@/constants/theme';

const SHADOW = 'rgba(80, 60, 30, 0.16)';

/** A layer with a crisp paper shadow offset beneath it. */
function Layer({ d, fill }: { d: string; fill: string }) {
  return (
    <G>
      <Path d={d} fill={SHADOW} transform="translate(0, -4)" />
      <Path d={d} fill={fill} />
    </G>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${s})`}>
      <G transform="translate(0, 3)" opacity={0.35}>
        <Ellipse cx={0} cy={0} rx={22} ry={9} fill={Colors.skyDeep} />
      </G>
      <Ellipse cx={0} cy={0} rx={22} ry={9} fill={Colors.cloud} />
      <Circle cx={-6} cy={-6} r={9} fill={Colors.cloud} />
      <Circle cx={7} cy={-8} r={11} fill={Colors.cloud} />
    </G>
  );
}

/**
 * A cut-paper outdoor scene: sky, sun, clouds, hills, and sea in stacked
 * layers. Used as a header backdrop.
 */
export function PaperScene({ height = 160, clouds = true, children, style }: { height?: number; clouds?: boolean; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height, borderRadius: Radius.lg, overflow: 'hidden', boxShadow: Paper.raised, backgroundColor: Colors.sky }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute' }}>
        <Rect x={0} y={0} width={400} height={160} fill={Colors.sky} />
        <Circle cx={332} cy={46} r={30} fill={shadeSun()} />
        <Circle cx={330} cy={44} r={26} fill={Colors.sun} />
        {clouds && <Cloud x={70} y={40} s={1.1} />}
        {clouds && <Cloud x={250} y={28} s={0.8} />}
        <Layer d="M0 112 C 70 82, 140 88, 210 104 S 340 84, 400 96 L 400 160 L 0 160 Z" fill={Colors.palm} />
        <Layer d="M0 126 C 90 108, 170 120, 250 112 S 360 116, 400 110 L 400 160 L 0 160 Z" fill={Colors.sea} />
        <Layer d="M0 140 C 80 130, 150 146, 230 136 S 350 134, 400 140 L 400 160 L 0 160 Z" fill={Colors.seaDeep} />
        <Layer d="M0 152 C 120 146, 240 158, 400 150 L 400 160 L 0 160 Z" fill={Colors.sand} />
      </Svg>
      {children}
    </View>
  );
}

const shadeSun = () => 'rgba(246, 203, 99, 0.45)';
