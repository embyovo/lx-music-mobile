import { memo, useEffect, useRef } from 'react'
import { Animated, View, Platform, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { type ListInfoItem } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import Image from '@/components/common/Image'

const gap = scaleSizeW(15)
const CARD_COLORS = ['#F8DCE8', '#FBE1D6', '#DDE7FA', '#D9F0EA', '#E9E0F6', '#F6E9D1'] as const
export default memo(({ item, index, width, showSource, onPress }: {
  item: ListInfoItem
  index: number
  showSource: boolean
  width: number
  onPress: (item: ListInfoItem, index: number) => void
}) => {
  const theme = useTheme()
  const itemWidth = width - gap
  const imageWidth = itemWidth - 16
  const entrance = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 360,
      delay: Math.min(index % 8, 4) * 45,
      useNativeDriver: true,
    }).start()
  }, [entrance, index])
  const handlePress = () => {
    onPress(item, index)
  }
  return (
    item.source
      ? (
          <Animated.View style={{ ...styles.listItem, width: itemWidth, backgroundColor: CARD_COLORS[index % CARD_COLORS.length], opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
            <View style={{ ...styles.listItemImg, backgroundColor: theme['c-content-background'] }}>
              <TouchableOpacity activeOpacity={0.5} onPress={handlePress}>
                <Image url={item.img} nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`} style={{ width: imageWidth, height: imageWidth, borderRadius: 12 }} />
                { showSource ? <Text style={styles.sourceLabel} size={9} color="#fff" >{item.source}</Text> : null }
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.5} onPress={handlePress}>
              <Text style={styles.listItemTitle} numberOfLines={ 2 }>{item.name}</Text>
            </TouchableOpacity>
            {/* <Text>{JSON.stringify(item)}</Text> */}
          </Animated.View>
        )
      : <View style={{ ...styles.listItem, width: itemWidth }} />
  )
})

const styles = createStyle({
  listItem: {
    // width: 90,
    margin: 8,
    padding: 8,
    borderRadius: 16,
  },
  listItemImg: {
    // backgroundColor: '#eee',
    borderRadius: 12,
    marginBottom: 5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  sourceLabel: {
    paddingLeft: 4,
    paddingBottom: 2,
    paddingRight: 4,
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  listItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    // overflow: 'hidden',
    marginBottom: 5,
  },
})
