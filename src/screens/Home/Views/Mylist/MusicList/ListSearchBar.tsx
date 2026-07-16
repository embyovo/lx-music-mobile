import { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Animated, View, TouchableOpacity } from 'react-native'

import Text from '@/components/common/Text'
import Input, { type InputType } from '@/components/common/Input'

import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'

interface SearchInputProps {
  onSearch: (keywork: string) => void
}
type SearchInputType = InputType

const SearchInput = forwardRef<SearchInputType, SearchInputProps>(({ onSearch }, ref) => {
  const [text, setText] = useState('')
  const theme = useTheme()

  const handleChangeText = (text: string) => {
    setText(text)
    onSearch(text.trim())
  }

  return (
    <View style={{ ...styles.searchField, backgroundColor: theme['c-000'], borderColor: theme['c-border-background'] }}>
      <Icon name="search-2" size={18} color={theme['c-400']} />
      <Input
        onChangeText={handleChangeText}
        placeholder="搜索我收藏的歌曲"
        value={text}
        style={styles.input}
        clearBtn
        ref={ref}
      />
    </View>
  )
})


export interface ListSearchBarProps {
  onSearch: (keywork: string) => void
  onExitSearch: () => void
}
export interface ListSearchBarType {
  show: () => void
  hide: () => void
}

export default forwardRef<ListSearchBarType, ListSearchBarProps>(({ onSearch, onExitSearch }, ref) => {
  const t = useI18n()
  // const isGetDetailFailedRef = useRef(false)
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const animFade = useRef(new Animated.Value(0)).current
  const animTranslateY = useRef(new Animated.Value(0)).current
  const searchInputRef = useRef<SearchInputType>(null)

  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    show() {
      handleShow()
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
    },
    hide() {
      handleHide()
    },
  }))


  const handleShow = useCallback(() => {
    // console.log('show List')
    setVisible(true)
    setAnimatPlayed(false)
    requestAnimationFrame(() => {
      animTranslateY.setValue(-10)

      Animated.parallel([
        Animated.timing(animFade, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(animTranslateY, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimatPlayed(true)
      })
    })
  }, [animFade, animTranslateY])

  const handleHide = useCallback(() => {
    setAnimatPlayed(false)
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(animTranslateY, {
        toValue: -10,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(finished => {
      if (!finished) return
      setVisible(false)
      setAnimatPlayed(true)
    })
  }, [animFade, animTranslateY])


  const animaStyle = useMemo(() => ({
    ...styles.container,
    backgroundColor: theme['c-main-background'],
    opacity: animFade, // Bind opacity to animated value
    transform: [
      { translateY: animTranslateY },
    ],
  }), [animFade, animTranslateY, theme])

  const component = useMemo(() => {
    return (
      <Animated.View style={animaStyle}>
        <View style={styles.content}>
          <SearchInput ref={searchInputRef} onSearch={onSearch} />
        </View>
        <TouchableOpacity onPress={onExitSearch} style={styles.btn}>
          <Text size={14} color={theme['c-primary']} style={styles.cancelText}>{t('list_select_cancel')}</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }, [animaStyle, onSearch, onExitSearch, theme, t])

  return !visible && animatePlayed ? null : component
})

const styles = createStyle({
  container: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    flex: 1,
    height: 42,
  },
  searchField: {
    flex: 1,
    height: 42,
    borderRadius: 22,
    borderWidth: 0.5,
    paddingLeft: 14,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: 42,
    paddingLeft: 9,
  },
  btn: {
    height: 42,
    paddingLeft: 14,
    paddingRight: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: '600',
  },
})
