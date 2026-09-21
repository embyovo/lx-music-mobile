import { View } from 'react-native'
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg'

export type DecoVariant = 'sky' | 'sunrise' | 'rain' | 'hearts' | 'notes' | 'sparkles' | 'planet' | 'night' | 'bubbles' | 'kite' | 'bird' | 'balloon' | 'rainbow' | 'rocket' | 'flower' | 'disc'

// 音符（福至八分音符：符头 + 符干 + 符尾）
const NoteGlyph = ({ x, y, s = 1, o = 0.5, r = -12 }: { x: number, y: number, s?: number, o?: number, r?: number }) => (
  <G transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <Ellipse cx={0} cy={0} rx={4.6} ry={3.4} fill={`rgba(255, 255, 255, ${o})`} />
    <Rect x={3.2} y={-15} width={1.9} height={15} fill={`rgba(255, 255, 255, ${o})`} />
    <Path d="M 5.1 -15 C 10 -14.2, 11.5 -9.5, 8 -6.5" stroke={`rgba(255, 255, 255, ${o})`} strokeWidth={2} fill="none" />
  </G>
)

// 爱心
const HeartGlyph = ({ x, y, s = 1, o = 0.5, r = 0 }: { x: number, y: number, s?: number, o?: number, r?: number }) => (
  <Path
    d="M 0 3.2 C 0 0.5, -3.2 -1.8, -5.4 0.4 C -7.4 2.4, -4.4 5.6, 0 9 C 4.4 5.6, 7.4 2.4, 5.4 0.4 C 3.2 -1.8, 0 0.5, 0 3.2 Z"
    fill={`rgba(255, 255, 255, ${o})`}
    transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
  />
)

// 四角星芒
const SparkleGlyph = ({ x, y, s = 1, o = 0.55 }: { x: number, y: number, s?: number, o?: number }) => (
  <Path
    d="M 0 -7 L 1.8 -1.8 L 7 0 L 1.8 1.8 L 0 7 L -1.8 1.8 L -7 0 L -1.8 -1.8 Z"
    fill={`rgba(255, 255, 255, ${o})`}
    transform={`translate(${x} ${y}) scale(${s})`}
  />
)

// 太阳 + 云朵（浅蓝 / 明快色系）
const SkyArt = () => (
  <>
    <Circle cx={28} cy={26} r={20} fill="rgba(255, 202, 67, 0.30)" />
    <Circle cx={28} cy={26} r={13} fill="rgba(255, 213, 79, 0.75)" />
    <Circle cx={28} cy={26} r={8} fill="#FFE082" />
    <Circle cx={25} cy={23} r={2.2} fill="rgba(255, 255, 255, 0.8)" />
    {[[28, 4], [28, 48], [6, 26], [50, 26], [12, 10], [44, 10], [12, 42], [44, 42]].map(([x, y], i) => (
      <Circle key={`ray-${i}`} cx={x} cy={y} r={2.2} fill="rgba(255, 202, 67, 0.75)" />
    ))}
    <Ellipse cx={52} cy={64} rx={17} ry={8} fill="rgba(255, 255, 255, 0.42)" />
    <Ellipse cx={62} cy={57} rx={11} ry={10} fill="rgba(255, 255, 255, 0.42)" />
    <Ellipse cx={72} cy={64} rx={12} ry={7} fill="rgba(255, 255, 255, 0.42)" />
    <Ellipse cx={28} cy={94} rx={12} ry={6} fill="rgba(255, 255, 255, 0.34)" />
    <Ellipse cx={35} cy={89} rx={8} ry={7} fill="rgba(255, 255, 255, 0.34)" />
    <Ellipse cx={42} cy={94} rx={9} ry={5} fill="rgba(255, 255, 255, 0.34)" />
  </>
)

// 橙色大太阳（暖杏色系）
const SunriseArt = () => (
  <>
    <Circle cx={45} cy={34} r={24} fill="rgba(255, 145, 77, 0.25)" />
    <Circle cx={45} cy={34} r={16} fill="rgba(255, 158, 86, 0.8)" />
    <Circle cx={45} cy={34} r={9.5} fill="#FFD180" />
    <Circle cx={41.5} cy={30.5} r={2.4} fill="rgba(255, 255, 255, 0.85)" />
    {[[45, 0], [45, 68], [11, 34], [79, 34], [22, 11], [68, 11], [22, 57], [68, 57]].map(([x, y], i) => (
      <Circle key={`ray-${i}`} cx={x} cy={y} r={2.6} fill="rgba(255, 158, 86, 0.7)" />
    ))}
    <Ellipse cx={26} cy={94} rx={12} ry={6} fill="rgba(255, 255, 255, 0.30)" />
    <Ellipse cx={33} cy={89} rx={8} ry={7} fill="rgba(255, 255, 255, 0.30)" />
    <Ellipse cx={40} cy={94} rx={9} ry={5} fill="rgba(255, 255, 255, 0.30)" />
  </>
)

// 云朵 + 雨滴（薄荷绿色系）
const RainArt = () => (
  <>
    <Ellipse cx={38} cy={28} rx={16} ry={8} fill="rgba(255, 255, 255, 0.40)" />
    <Ellipse cx={48} cy={22} rx={10} ry={9} fill="rgba(255, 255, 255, 0.40)" />
    <Ellipse cx={57} cy={29} rx={11} ry={7} fill="rgba(255, 255, 255, 0.40)" />
    {[[28, 52, 2.6], [46, 58, 2.2], [36, 72, 2.6], [54, 80, 2.2], [30, 92, 2.4]].map(([x, y, r], i) => (
      <Circle key={`drop-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.5)" />
    ))}
  </>
)

// 漂浮爱心（珊瑚粉色系）
const HeartsArt = () => (
  <>
    <HeartGlyph x={30} y={26} s={1.4} o={0.55} r={-10} />
    <HeartGlyph x={58} y={44} s={1} o={0.45} r={12} />
    <HeartGlyph x={40} y={66} s={0.8} o={0.5} r={-10} />
    <HeartGlyph x={64} y={88} s={1.1} o={0.4} r={18} />
    <HeartGlyph x={18} y={94} s={0.7} o={0.45} r={-14} />
    {[[70, 20], [16, 56], [52, 106]].map(([x, y], i) => (
      <Circle key={`hd-${i}`} cx={x} cy={y} r={1.6} fill="rgba(255, 255, 255, 0.4)" />
    ))}
  </>
)

// 音符（粉紫色系）
const NotesArt = () => (
  <>
    <NoteGlyph x={34} y={42} s={1.3} o={0.55} r={-12} />
    <NoteGlyph x={58} y={30} s={0.9} o={0.45} r={10} />
    <NoteGlyph x={24} y={78} s={1} o={0.5} r={6} />
    <NoteGlyph x={66} y={88} s={0.7} o={0.4} r={-15} />
    {[[74, 52], [18, 52], [48, 104]].map(([x, y], i) => (
      <Circle key={`nd-${i}`} cx={x} cy={y} r={1.6} fill="rgba(255, 255, 255, 0.4)" />
    ))}
  </>
)

// 星芒闪光（橘粉色系）
const SparklesArt = () => (
  <>
    <SparkleGlyph x={30} y={24} s={1.4} o={0.55} />
    <SparkleGlyph x={58} y={40} s={1} o={0.45} />
    <SparkleGlyph x={42} y={62} s={0.8} o={0.5} />
    <SparkleGlyph x={68} y={78} s={1.2} o={0.45} />
    <SparkleGlyph x={24} y={88} s={0.9} o={0.5} />
    <SparkleGlyph x={78} y={20} s={0.7} o={0.4} />
    {[[16, 44], [52, 22], [80, 58], [36, 106]].map(([x, y], i) => (
      <Circle key={`sd-${i}`} cx={x} cy={y} r={1.5} fill="rgba(255, 255, 255, 0.4)" />
    ))}
  </>
)

// 星球土星环（深紫 / Your Radio）
const PlanetArt = ({ bg }: { bg: string }) => (
  <>
    <Circle cx={40} cy={36} r={20} fill="rgba(255, 255, 255, 0.08)" />
    <Circle cx={40} cy={36} r={11} fill="rgba(255, 255, 255, 0.45)" />
    <Circle cx={36.5} cy={32} r={2.6} fill="rgba(255, 255, 255, 0.5)" />
    <Ellipse cx={40} cy={36} rx={20} ry={7} stroke="rgba(255, 255, 255, 0.55)" strokeWidth={2.4} fill="none" transform="rotate(-18 40 36)" />
    {/* 小卫星 */}
    <Circle cx={66} cy={22} r={4} fill="rgba(255, 236, 179, 0.75)" />
    <Circle cx={64.8} cy={20.8} r={1.2} fill={bg} />
    {[[66, 60, 1.8], [24, 64, 1.5], [62, 90, 2.2], [30, 96, 1.3], [80, 74, 1.4]].map(([x, y, r], i) => (
      <Circle key={`ps-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.45)" />
    ))}
  </>
)

// 月亮 + 星星（淡紫色系）
const NightArt = ({ bg }: { bg: string }) => (
  <>
    <Circle cx={28} cy={26} r={21} fill="rgba(255, 255, 255, 0.10)" />
    <Circle cx={28} cy={26} r={13} fill="rgba(255, 236, 179, 0.85)" />
    <Circle cx={33.5} cy={21} r={11} fill={bg} />
    {[[56, 52, 2.2], [74, 44, 1.6], [44, 74, 1.8], [66, 82, 2.4], [86, 66, 1.4], [52, 98, 1.5], [80, 100, 1.3], [30, 104, 1.2]].map(([x, y, r], i) => (
      <Circle key={`star-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.5)" />
    ))}
    <Circle cx={46} cy={56} r={3.4} fill="rgba(255, 255, 255, 0.28)" />
    <Circle cx={46} cy={56} r={1.6} fill="rgba(255, 255, 255, 0.5)" />
  </>
)

// 漂浮泡泡（青碧色系）
const BubblesArt = () => (
  <>
    {[[16, 18, 9, 0.16], [44, 32, 6.5, 0.26], [26, 54, 13, 0.13], [60, 76, 8.5, 0.22], [18, 92, 5.5, 0.3], [70, 102, 4, 0.24], [80, 16, 5, 0.2]].map(([x, y, r, o], i) => (
      <Circle key={`b-${i}`} cx={x} cy={y} r={r} fill={`rgba(255, 255, 255, ${o})`} />
    ))}
    {[[40.5, 29.5, 1.8], [57, 73, 2.2], [16, 89.5, 1.5]].map(([x, y, r], i) => (
      <Circle key={`h-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.55)" />
    ))}
  </>
)

// 风筝：菱形风筝 + 蜿蜒尾带
const KiteArt = ({ bg }: { bg: string }) => (
  <>
    <G transform="translate(34 30) rotate(14)">
      <Path d="M 0 -13 L 9 0 L 0 13 L -9 0 Z" fill="rgba(255, 255, 255, 0.5)" />
      <Path d="M 0 -13 L 0 13 M -9 0 L 9 0" stroke="rgba(255, 255, 255, 0.65)" strokeWidth={1.6} fill="none" />
      <Path d="M 0 -4 L 4.5 0 L 0 4 L -4.5 0 Z" fill={bg} />
    </G>
    <Path d="M 38 44 C 34 52, 45 58, 40 66 C 36 73, 47 79, 42 88" stroke="rgba(255, 255, 255, 0.45)" strokeWidth={1.8} fill="none" />
    {[[39, 54, 2], [41.5, 68, 2], [44, 82, 2.2]].map(([x, y, r], i) => (
      <Circle key={`kb-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.5)" />
    ))}
    {[[74, 22, 1.6], [16, 68, 1.4], [66, 96, 1.8]].map(([x, y, r], i) => (
      <Circle key={`kd-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.4)" />
    ))}
  </>
)

// 飞鸟：几只 V 形飞鸟
const BirdArt = () => (
  <>
    {[
      { x: 36, y: 30, s: 1.4, o: 0.55 },
      { x: 60, y: 52, s: 1, o: 0.45 },
      { x: 28, y: 72, s: 0.8, o: 0.5 },
      { x: 58, y: 92, s: 1.1, o: 0.4 },
    ].map(({ x, y, s, o }, i) => (
      <Path
        key={`bird-${i}`}
        d={`M ${-9 * s} 0 Q ${-4.5 * s} ${-6 * s} 0 0 Q ${4.5 * s} ${-6 * s} ${9 * s} 0`}
        stroke={`rgba(255, 255, 255, ${o})`}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
        transform={`translate(${x} ${y})`}
      />
    ))}
    {[[14, 46, 1.5], [76, 34, 1.7], [46, 106, 1.4]].map(([x, y, r], i) => (
      <Circle key={`bd-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.4)" />
    ))}
  </>
)

// 气球：主气球 + 小气球 + 飘线
const BalloonArt = () => (
  <>
    <Ellipse cx={34} cy={32} rx={11} ry={13.5} fill="rgba(255, 255, 255, 0.5)" />
    <Path d="M 31 46 L 37 46 L 34 50 Z" fill="rgba(255, 255, 255, 0.5)" />
    <Path d="M 34 50 C 30 60, 40 68, 35 78 C 31 86, 40 92, 36 100" stroke="rgba(255, 255, 255, 0.45)" strokeWidth={1.6} fill="none" />
    <Circle cx={26.5} cy={27} r={3} fill="rgba(255, 255, 255, 0.6)" />
    <Ellipse cx={64} cy={74} rx={6.5} ry={8} fill="rgba(255, 255, 255, 0.35)" />
    <Path d="M 62 82 L 66 82 L 64 84.5 Z" fill="rgba(255, 255, 255, 0.35)" />
    <Path d="M 64 84.5 C 61 92, 67 96, 64 102" stroke="rgba(255, 255, 255, 0.35)" strokeWidth={1.3} fill="none" />
    {[[74, 26, 1.6], [18, 66, 1.5]].map(([x, y, r], i) => (
      <Circle key={`bld-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.4)" />
    ))}
  </>
)

// 彩虹：三道弧 + 两端云朵
const RainbowArt = ({ bg }: { bg: string }) => (
  <>
    <Path d="M 16 70 A 26 26 0 0 1 68 70" stroke="rgba(255, 255, 255, 0.40)" strokeWidth={5} fill="none" />
    <Path d="M 22 70 A 20 20 0 0 1 62 70" stroke="rgba(255, 255, 255, 0.32)" strokeWidth={5} fill="none" />
    <Path d="M 28 70 A 14 14 0 0 1 56 70" stroke="rgba(255, 255, 255, 0.24)" strokeWidth={5} fill="none" />
    <Ellipse cx={16} cy={72} rx={9} ry={5.5} fill="rgba(255, 255, 255, 0.42)" />
    <Ellipse cx={23} cy={67} rx={6} ry={5} fill="rgba(255, 255, 255, 0.42)" />
    <Ellipse cx={68} cy={72} rx={9} ry={5.5} fill="rgba(255, 255, 255, 0.42)" />
    <Ellipse cx={61} cy={67} rx={6} ry={5} fill="rgba(255, 255, 255, 0.42)" />
    {[[38, 32, 2], [56, 22, 1.5], [24, 98, 1.6]].map(([x, y, r], i) => (
      <Circle key={`rd-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.45)" />
    ))}
    <Circle cx={82} cy={44} r={2.4} fill="rgba(255, 202, 67, 0.75)" />
  </>
)

// 小火箭：机身 + 舷窗 + 尾焰
const RocketArt = ({ bg }: { bg: string }) => (
  <>
    <G transform="translate(36 34) rotate(12)">
      <Ellipse cx={0} cy={0} rx={8.5} ry={15} fill="rgba(255, 255, 255, 0.55)" />
      <Circle cx={0} cy={-2.5} r={3.4} fill={bg} />
      <Path d="M -8 8 L -13 17 L -6 13 Z" fill="rgba(255, 255, 255, 0.4)" />
      <Path d="M 8 8 L 13 17 L 6 13 Z" fill="rgba(255, 255, 255, 0.4)" />
      <Path d="M -3.5 14.5 L 3.5 14.5 L 0 22 Z" fill="rgba(255, 209, 128, 0.85)" />
    </G>
    {[[70, 26, 2], [20, 62, 1.6], [62, 82, 2.2], [26, 96, 1.4], [78, 60, 1.5]].map(([x, y, r], i) => (
      <Circle key={`rs-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.45)" />
    ))}
    <SparkleGlyph x={70} y={94} s={0.8} o={0.5} />
  </>
)

// 小花：五瓣花 + 双叶
const FlowerArt = ({ bg }: { bg: string }) => (
  <>
    <G transform="translate(34 32)">
      {[[0, -7.5], [7.1, -2.3], [4.4, 6.1], [-4.4, 6.1], [-7.1, -2.3]].map(([x, y], i) => (
        <Circle key={`fp-${i}`} cx={x} cy={y} r={5.2} fill="rgba(255, 255, 255, 0.55)" />
      ))}
      <Circle cx={0} cy={0} r={4.2} fill="rgba(255, 224, 130, 0.9)" />
    </G>
    <Path d="M 36 46 C 34 58, 34 70, 36 82" stroke="rgba(255, 255, 255, 0.45)" strokeWidth={1.8} fill="none" />
    <Ellipse cx={30} cy={66} rx={6} ry={3.2} fill="rgba(255, 255, 255, 0.42)" transform="rotate(-28 30 66)" />
    <Ellipse cx={42} cy={74} rx={6} ry={3.2} fill="rgba(255, 255, 255, 0.42)" transform="rotate(28 42 74)" />
    <G transform="translate(64 80) scale(0.62)">
      {[[0, -7.5], [7.1, -2.3], [4.4, 6.1], [-4.4, 6.1], [-7.1, -2.3]].map(([x, y], i) => (
        <Circle key={`fp2-${i}`} cx={x} cy={y} r={5.2} fill="rgba(255, 255, 255, 0.4)" />
      ))}
      <Circle cx={0} cy={0} r={4.2} fill="rgba(255, 224, 130, 0.7)" />
    </G>
    {[[74, 24, 1.6], [18, 84, 1.4]].map(([x, y, r], i) => (
      <Circle key={`fld-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.4)" />
    ))}
  </>
)

// 黑胶唱片：同心唱纹 + 中心标
const DiscArt = ({ bg }: { bg: string }) => (
  <>
    <Circle cx={36} cy={34} r={17} fill="rgba(255, 255, 255, 0.45)" />
    <Circle cx={36} cy={34} r={12.5} stroke="rgba(255, 255, 255, 0.35)" strokeWidth={1.4} fill="none" />
    <Circle cx={36} cy={34} r={8.5} stroke="rgba(255, 255, 255, 0.3)" strokeWidth={1.2} fill="none" />
    <Circle cx={36} cy={34} r={4.6} fill="rgba(255, 224, 130, 0.9)" />
    <Circle cx={36} cy={34} r={1.4} fill={bg} />
    <Path d="M 60 62 C 56 72, 66 78, 61 88" stroke="rgba(255, 255, 255, 0.45)" strokeWidth={1.8} fill="none" />
    <NoteGlyph x={58} y={60} s={0.85} o={0.5} r={-14} />
    <NoteGlyph x={26} y={84} s={0.7} o={0.45} r={8} />
    {[[74, 30, 1.6], [16, 58, 1.4], [70, 100, 1.7]].map(([x, y, r], i) => (
      <Circle key={`dd-${i}`} cx={x} cy={y} r={r} fill="rgba(255, 255, 255, 0.4)" />
    ))}
  </>
)

const ARTS: Record<DecoVariant, (bg: string) => JSX.Element> = {
  sky: () => <SkyArt />,
  sunrise: () => <SunriseArt />,
  rain: () => <RainArt />,
  hearts: () => <HeartsArt />,
  notes: () => <NotesArt />,
  sparkles: () => <SparklesArt />,
  planet: bg => <PlanetArt bg={bg} />,
  night: bg => <NightArt bg={bg} />,
  bubbles: () => <BubblesArt />,
  kite: bg => <KiteArt bg={bg} />,
  bird: () => <BirdArt />,
  balloon: () => <BalloonArt />,
  rainbow: bg => <RainbowArt bg={bg} />,
  rocket: bg => <RocketArt bg={bg} />,
  flower: bg => <FlowerArt bg={bg} />,
  disc: bg => <DiscArt bg={bg} />,
}

// 卡片背景装饰：每种卡片配色对应一种专属装饰主题
const CardDeco = ({ variant, color, style }: { variant: DecoVariant, color: string, style: object }) => (
  <View pointerEvents="none" style={style}>
    <Svg width={86} height={105} viewBox="0 0 90 110">
      {(ARTS[variant] ?? ARTS.sky)(color)}
    </Svg>
  </View>
)

export default CardDeco
