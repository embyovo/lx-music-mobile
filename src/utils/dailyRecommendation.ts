// Local calendar date avoids assigning late-night recommendations to the previous UTC day.
export const markDailyRecommendations = <T extends LX.Music.MusicInfo>(songs: T[], date = new Date()): T[] => {
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return songs.map(song => song.source === 'wy' ? { ...song, meta: { ...song.meta, dailyRecommendationDate: day } } : song)
}

// Store provenance on songs, but render only one footer per recommendation date.
// Recompute after sorting/deletion so the footer follows the last remaining song of that day.
export const getDailyRecommendationEndIndexes = (songs: LX.Music.MusicInfo[]) => {
  const lastByDate = new Map<string, number>()
  songs.forEach((song, index) => {
    const day = song.meta.dailyRecommendationDate
    if (song.source === 'wy' && day) lastByDate.set(day, index)
  })
  return new Set(lastByDate.values())
}
