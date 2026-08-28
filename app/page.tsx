'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { 
  Search, LogIn, LogOut, Users, Send, X, Film, Star, 
  MessageCircle, Bookmark, Clock, Heart, Trash2, Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// HOOK LOCAL STORAGE
function useLocalStorage(key: string, initialValue: any) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: any) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch {}
  }

  return [storedValue, setValue]
}

// COMPONENT CHAT
function GlobalChat({ session }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const chatEndRef = useRef(null)

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMessages(msgs)
      setLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })
    return () => unsubscribe()
  }, [])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || !session) return
    try {
      await addDoc(collection(db, 'messages'), {
        text: input,
        userId: session.user.id,
        userName: session.user.name || 'Anonymous',
        userPhoto: session.user.image || '',
        timestamp: serverTimestamp(),
      })
      setInput('')
    } catch (error) {
      console.error('Gagal kirim chat:', error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-800/95 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
      <div className="p-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-gray-700">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-purple-400" /> Chat Global
          <span className="text-xs text-gray-400 ml-auto">{messages.length} pesan</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[300px]">
        {loading ? (
          <div className="text-center text-gray-400 text-sm">Loading chat...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm">Belum ada pesan. Mulai chat!</div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2 ${msg.userId === session?.user?.id ? 'flex-row-reverse' : ''}`}
            >
              {msg.userPhoto && (
                <img src={msg.userPhoto} alt={msg.userName} className="w-8 h-8 rounded-full border-2 border-purple-500" />
              )}
              <div className={`max-w-[80%] ${msg.userId === session?.user?.id ? 'bg-purple-600' : 'bg-gray-700'} rounded-lg p-2`}>
                <span className="text-xs font-semibold text-purple-300">{msg.userName}</span>
                <p className="text-sm break-words">{msg.text}</p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-2 bg-gray-900 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={session ? 'Ketik pesan...' : 'Login dulu ya!'}
          disabled={!session}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!session || !input.trim()}
          className="px-3 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

// COMPONENT VIDEO PLAYER
function VideoPlayer({ anime, onClose, onAddWatchlist, isInWatchlist }) {
  const [source, setSource] = useState('gogoanime')

  const getStreamUrl = () => {
    const title = anime.title.toLowerCase().replace(/ /g, '-')
    if (source === 'gogoanime') {
      return `https://gogoanime.gg/category/${title}`
    }
    return `https://zoro.to/search?keyword=${anime.title}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl bg-gray-900 rounded-xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 text-white bg-red-600 rounded-full p-2 hover:bg-red-700 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSource('gogoanime')}
            className={`px-3 py-1 rounded-lg text-sm transition ${source === 'gogoanime' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Gogoanime
          </button>
          <button
            onClick={() => setSource('zoro')}
            className={`px-3 py-1 rounded-lg text-sm transition ${source === 'zoro' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Zoro
          </button>
          
          <button
            onClick={onAddWatchlist}
            className={`px-3 py-1 rounded-lg text-sm transition ml-auto ${
              isInWatchlist ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isInWatchlist ? <Check className="w-4 h-4 inline" /> : <Bookmark className="w-4 h-4 inline" />}
            {isInWatchlist ? ' Tersimpan' : ' Watchlist'}
          </button>
        </div>

        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <iframe
            src={getStreamUrl()}
            className="w-full h-full"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>

        <h2 className="text-xl font-bold mt-4">{anime.title}</h2>
        <p className="text-gray-400 text-sm line-clamp-3">{anime.synopsis}</p>
        <div className="flex flex-wrap gap-4 mt-2 text-sm">
          <span>⭐ {anime.score || 'N/A'}</span>
          <span>📺 {anime.episodes || '?'} episode</span>
          <span>📅 {anime.year || 'N/A'}</span>
          <span>🎭 {anime.genres?.map(g => g.name).join(', ') || 'N/A'}</span>
        </div>
      </div>
    </motion.div>
  )
}

// MAIN PAGE
export default function HomePage() {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [animeList, setAnimeList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('browse')

  const [watchlist, setWatchlist] = useLocalStorage('anime_watchlist', [])
  const [history, setHistory] = useLocalStorage('anime_history', [])
  const [favorites, setFavorites] = useLocalStorage('anime_favorites', [])

  useEffect(() => {
    fetchAnime('popular')
  }, [])

  const fetchAnime = async (query) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=24`)
      if (!res.ok) throw new Error('Gagal fetch data')
      const data = await res.json()
      setAnimeList(data.data || [])
    } catch (err) {
      setError('Gagal memuat anime. Coba lagi nanti.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      fetchAnime(search)
    }
  }

  const handleLogin = () => signIn('google', { callbackUrl: window.location.href })

  const addToWatchlist = (anime) => {
    if (!watchlist.find(a => a.mal_id === anime.mal_id)) {
      setWatchlist([...watchlist, anime])
    } else {
      setWatchlist(watchlist.filter(a => a.mal_id !== anime.mal_id))
    }
  }

  const isInWatchlist = (anime) => watchlist.some(a => a.mal_id === anime.mal_id)

  const addToHistory = (anime) => {
    const newHistory = [
      { ...anime, watchedAt: new Date().toISOString() },
      ...history.filter(a => a.mal_id !== anime.mal_id)
    ]
    setHistory(newHistory.slice(0, 50))
  }

  const clearHistory = () => {
    if (confirm('Hapus semua riwayat?')) {
      setHistory([])
    }
  }

  const toggleFavorite = (anime) => {
    if (favorites.find(a => a.mal_id === anime.mal_id)) {
      setFavorites(favorites.filter(a => a.mal_id !== anime.mal_id))
    } else {
      setFavorites([...favorites, anime])
    }
  }

  const isFavorite = (anime) => favorites.some(a => a.mal_id === anime.mal_id)

  const handleSelectAnime = (anime) => {
    setSelectedAnime(anime)
    addToHistory(anime)
  }

  const renderAnimeGrid = (animes, title = '') => {
    if (animes.length === 0) {
      return (
        <div className="text-center py-16 text-gray-400">
          <Film className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>{title ? `Tidak ada ${title.toLowerCase()}` : 'Tidak ada anime ditemukan'}</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {animes.map((anime, index) => (
          <motion.div
            key={anime.mal_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="cursor-pointer group relative"
          >
            <div 
              className="relative overflow-hidden rounded-xl bg-gray-800 hover:scale-105 transition-transform duration-300 shadow-lg"
              onClick={() => handleSelectAnime(anime)}
            >
              <img
                src={anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x400?text=No+Image'}
                alt={anime.title}
                className="w-full h-64 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div>
                  <p className="text-xs font-semibold line-clamp-2">{anime.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span>{anime.score || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-black/60 text-xs px-2 py-1 rounded-full">
                🎬 {anime.episodes || '?'}
              </div>
              {isFavorite(anime) && (
                <div className="absolute top-2 left-2 bg-red-600/80 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-current" /> Favorite
                </div>
              )}
              {isInWatchlist(anime) && (
                <div className="absolute bottom-2 left-2 bg-blue-600/80 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Bookmark className="w-3 h-3" /> Watchlist
                </div>
              )}
            </div>
            <p className="mt-1 text-xs font-medium truncate">{anime.title}</p>
            <div className="flex gap-1 mt-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(anime) }}
                className={`text-xs p-1 rounded ${isFavorite(anime) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
              >
                <Heart className={`w-3 h-3 ${isFavorite(anime) ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); addToWatchlist(anime) }}
                className={`text-xs p-1 rounded ${isInWatchlist(anime) ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
              >
                <Bookmark className={`w-3 h-3 ${isInWatchlist(anime) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  const currentData = {
    browse: { animes: animeList, title: 'Anime' },
    watchlist: { animes: watchlist, title: 'Watchlist' },
    history: { animes: history, title: 'Riwayat' },
    favorites: { animes: favorites, title: 'Favorit' }
  }[activeTab]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <nav className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 z-40">
        <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
            <Film className="w-6 h-6 text-purple-400" /> AnimeVerse
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            {session ? (
              <>
                <span className="text-sm text-gray-300 hidden sm:inline">
                  👋 {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 rounded-lg hover:bg-purple-700 transition text-sm"
              >
                <LogIn className="w-4 h-4" /> Login Google
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-20 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${activeTab === 'browse' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Search className="w-4 h-4 inline mr-1" /> Browse
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${activeTab === 'watchlist' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Bookmark className="w-4 h-4 inline mr-1" /> Watchlist ({watchlist.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${activeTab === 'favorites' ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Heart className="w-4 h-4 inline mr-1" /> Favorit ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${activeTab === 'history' ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Clock className="w-4 h-4 inline mr-1" /> History ({history.length})
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex flex-1 md:w-64">
              <input
                type="text"
                placeholder="Cari anime..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 rounded-l-lg bg-gray-800/80 border border-gray-700 focus:outline-none focus:border-purple-500 text-sm"
              />
              <button type="submit" className="px-4 py-2 bg-purple-600 rounded-r-lg hover:bg-purple-700 transition">
                <Search className="w-5 h-5" />
              </button>
            </form>

            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-3 py-2 bg-pink-600 rounded-lg hover:bg-pink-700 transition text-sm whitespace-nowrap"
            >
              <Users className="w-4 h-4" />
              {showChat ? 'Tutup' : 'Chat'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-600 text-red-400 p-3 rounded-lg mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {activeTab === 'history' && history.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/50 hover:bg-red-600 rounded-lg text-sm transition"
            >
              <Trash2 className="w-4 h-4" /> Hapus History
            </button>
          </div>
        )}

        {loading && activeTab === 'browse' && (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs text-purple-400">Loading</div>
            </div>
          </div>
        )}

        {(!loading || activeTab !== 'browse') && renderAnimeGrid(currentData.animes, currentData.title)}
      </div>

      {showChat && (
        <div className="fixed bottom-4 right-4 w-80 h-96 z-50 shadow-2xl">
          <GlobalChat session={session} />
        </div>
      )}

      <AnimatePresence>
        {selectedAnime && (
          <VideoPlayer 
            anime={selectedAnime} 
            onClose={() => setSelectedAnime(null)}
            onAddWatchlist={() => addToWatchlist(selectedAnime)}
            isInWatchlist={isInWatchlist(selectedAnime)}
          />
        )}
      </AnimatePresence>
    </div>
  )
    }
