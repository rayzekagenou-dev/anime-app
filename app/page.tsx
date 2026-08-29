'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { 
  Search, LogIn, LogOut, Users, Send, X, Film, Star, 
  MessageCircle, Bookmark, Clock, Heart, Trash2, Check,
  Home, Calendar, Bell, User, ChevronRight, Eye, Award, 
  Settings, Trophy, Crown, Coins, Sparkles, Gift, Gem, 
  Shield, Zap, Flame, TrendingUp, Package, Menu, PawPrint,
  Image, RefreshCw, Dice6, ShoppingBag
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

// ============ LEVEL SYSTEM ============
const LEVEL_CONFIG = [
  { level: 1, xpNeeded: 100, title: 'Newbie Gamer' },
  { level: 2, xpNeeded: 250, title: 'Ryze Adventurer' },
  { level: 3, xpNeeded: 500, title: 'Elite Player' },
  { level: 4, xpNeeded: 800, title: 'Ryze Knight' },
  { level: 5, xpNeeded: 1200, title: 'Legendary Gamer' },
  { level: 6, xpNeeded: 1800, title: 'Ryze Master' },
  { level: 7, xpNeeded: 2500, title: 'Gaming God' },
  { level: 8, xpNeeded: 3500, title: 'Ryze Sensei' },
  { level: 9, xpNeeded: 5000, title: 'Ultimate Ryze' },
  { level: 10, xpNeeded: 7500, title: 'Ryze Legend' },
]

function getLevelInfo(xp: number) {
  let currentLevel = 1
  let xpForNextLevel = 100

  for (let i = 0; i < LEVEL_CONFIG.length; i++) {
    if (xp >= LEVEL_CONFIG[i].xpNeeded) {
      currentLevel = LEVEL_CONFIG[i].level
    }
  }

  const currentLevelData = LEVEL_CONFIG[currentLevel - 1]
  const nextLevelData = LEVEL_CONFIG[currentLevel]
  const xpInLevel = xp - (currentLevelData?.xpNeeded || 0)
  const xpNeededForNext = nextLevelData ? nextLevelData.xpNeeded - (currentLevelData?.xpNeeded || 0) : 100
  const progress = Math.min((xpInLevel / xpNeededForNext) * 100, 100)

  return {
    level: currentLevel,
    title: currentLevelData?.title || 'Ryze God',
    xp,
    xpInLevel,
    xpNeededForNext,
    progress,
  }
}

// ============ GLOBAL CHAT ============
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
      <div className="p-3 bg-gradient-to-r from-orange-900/50 to-red-900/50 border-b border-gray-700">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-orange-400" /> Global Chat
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
                <img src={msg.userPhoto} alt={msg.userName} className="w-8 h-8 rounded-full border-2 border-orange-500" />
              )}
              <div className={`max-w-[80%] ${msg.userId === session?.user?.id ? 'bg-orange-600' : 'bg-gray-700'} rounded-lg p-2`}>
                <span className="text-xs font-semibold text-orange-300">{msg.userName}</span>
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
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!session || !input.trim()}
          className="px-3 py-2 bg-orange-600 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

// ============ VIDEO PLAYER ============
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
            className={`px-3 py-1 rounded-lg text-sm transition ${source === 'gogoanime' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Gogoanime
          </button>
          <button
            onClick={() => setSource('zoro')}
            className={`px-3 py-1 rounded-lg text-sm transition ${source === 'zoro' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
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

// ============ RYZEPET ============
function RyzePetPage() {
  const [pets, setPets] = useLocalStorage('ryze_pets', [
    { id: 1, name: 'Naga Emas', rarity: 'Legendary', emoji: '🐉', level: 5, xp: 120 },
    { id: 2, name: 'Phoenix', rarity: 'Epic', emoji: '🔥', level: 3, xp: 45 },
    { id: 3, name: 'Serigala Putih', rarity: 'Rare', emoji: '🐺', level: 2, xp: 20 },
  ])

  const [selectedPet, setSelectedPet] = useState(pets[0] || null)

  const rarityColors = {
    'Common': 'text-gray-400',
    'Rare': 'text-blue-400',
    'Epic': 'text-purple-400',
    'Legendary': 'text-yellow-400',
  }

  const feedPet = (petId) => {
    setPets(pets.map(p => {
      if (p.id === petId) {
        return { ...p, xp: p.xp + 10, level: Math.floor(p.xp / 50) + 1 }
      }
      return p
    }))
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-700/30">
        <div className="flex items-center gap-3">
          <PawPrint className="w-8 h-8 text-orange-400" />
          <div>
            <h2 className="text-2xl font-bold">RyzePet</h2>
            <p className="text-sm text-gray-400">Koleksi dan rawat peliharaanmu!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {pets.map((pet) => (
          <motion.div
            key={pet.id}
            whileHover={{ scale: 1.05 }}
            className={`bg-gray-800 rounded-xl p-4 text-center cursor-pointer border-2 transition ${
              selectedPet?.id === pet.id ? 'border-orange-500' : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setSelectedPet(pet)}
          >
            <div className="text-4xl mb-1">{pet.emoji}</div>
            <p className="font-semibold text-sm">{pet.name}</p>
            <p className={`text-xs ${rarityColors[pet.rarity] || 'text-gray-400'}`}>{pet.rarity}</p>
            <p className="text-xs text-gray-500">Lv.{pet.level}</p>
          </motion.div>
        ))}
        <div className="bg-gray-800 rounded-xl p-4 text-center border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-orange-500 transition">
          <div>
            <Package className="w-8 h-8 mx-auto text-gray-500" />
            <p className="text-xs text-gray-500 mt-1">Adopsi Pet</p>
          </div>
        </div>
      </div>

      {selectedPet && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{selectedPet.emoji}</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{selectedPet.name}</h3>
              <p className={`text-sm ${rarityColors[selectedPet.rarity] || 'text-gray-400'}`}>{selectedPet.rarity}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-400">Level {selectedPet.level}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-400">{selectedPet.xp} XP</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${(selectedPet.xp % 50) / 50 * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => feedPet(selectedPet.id)}
              className="px-4 py-2 bg-orange-600 rounded-xl text-sm hover:bg-orange-700 transition"
            >
              🍖 Beri Makan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ GACHA WALLPAPER ============
function GachaWallpaperPage() {
  const [crystals, setCrystals] = useLocalStorage('ryze_crystals', 500)
  const [wallpapers, setWallpapers] = useLocalStorage('ryze_wallpapers', [])
  const [result, setResult] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [gachaCount, setGachaCount] = useState(1)

  const wallpaperList = [
    { id: 1, name: 'Ryze Dragon', rarity: 'Legendary', image: '🐉', color: 'from-yellow-400 to-orange-500' },
    { id: 2, name: 'Phoenix Flame', rarity: 'Epic', image: '🔥', color: 'from-red-400 to-pink-500' },
    { id: 3, name: 'Galaxy Knight', rarity: 'Epic', image: '⚔️', color: 'from-purple-400 to-blue-500' },
    { id: 4, name: 'Crystal Fox', rarity: 'Rare', image: '🦊', color: 'from-cyan-400 to-blue-500' },
    { id: 5, name: 'Ryze Logo', rarity: 'Rare', image: '⚡', color: 'from-orange-400 to-yellow-500' },
    { id: 6, name: 'Moonlight Wolf', rarity: 'Rare', image: '🌙', color: 'from-gray-400 to-blue-300' },
    { id: 7, name: 'Neon Samurai', rarity: 'Common', image: '🗡️', color: 'from-pink-400 to-purple-500' },
    { id: 8, name: 'Cherry Blossom', rarity: 'Common', image: '🌸', color: 'from-pink-300 to-red-300' },
  ]

  const rarityColors = {
    'Common': 'text-gray-400',
    'Rare': 'text-blue-400',
    'Epic': 'text-purple-400',
    'Legendary': 'text-yellow-400',
  }

  const performGacha = (count) => {
    const cost = count * 50
    if (crystals < cost) {
      alert('Crystal tidak cukup! Dapatkan crystal dari giveaway atau beli premium.')
      return
    }

    setIsSpinning(true)
    setCrystals(crystals - cost)
    const results = []

    for (let i = 0; i < count; i++) {
      const rand = Math.random() * 100
      let rarity
      if (rand < 5) rarity = 'Legendary'
      else if (rand < 20) rarity = 'Epic'
      else if (rand < 50) rarity = 'Rare'
      else rarity = 'Common'

      const pool = wallpaperList.filter(w => w.rarity === rarity)
      const selected = pool[Math.floor(Math.random() * pool.length)]
      results.push(selected)
      if (!wallpapers.find(w => w.id === selected.id)) {
        setWallpapers(prev => [...prev, selected])
      }
    }

    setTimeout(() => {
      setResult(results)
      setIsSpinning(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold">Gacha Wallpaper</h2>
              <p className="text-sm text-gray-400">Spin untuk dapatkan wallpaper eksklusif!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-xl">
            <Gem className="w-4 h-4 text-purple-400" />
            <span className="font-semibold">{crystals}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setGachaCount(1)}
            className={`px-4 py-2 rounded-xl text-sm transition ${gachaCount === 1 ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            1x (50💎)
          </button>
          <button
            onClick={() => setGachaCount(10)}
            className={`px-4 py-2 rounded-xl text-sm transition ${gachaCount === 10 ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            10x (500💎)
          </button>
        </div>
        <button
          onClick={() => performGacha(gachaCount)}
          disabled={isSpinning}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition ${
            isSpinning 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          }`}
        >
          {isSpinning ? <RefreshCw className="w-6 h-6 mx-auto animate-spin" /> : `🎰 Spin ${gachaCount}x`}
        </button>
      </div>

      {result && (
        <div className="bg-gray-800 rounded-xl p-6 border border-green-500/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Dice6 className="w-5 h-5 text-green-400" /> Hasil Spin
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {result.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br ${item.color} p-4 rounded-xl text-center`}
              >
                <div className="text-4xl">{item.image}</div>
                <p className="font-semibold text-sm mt-1">{item.name}</p>
                <p className={`text-xs font-bold ${rarityColors[item.rarity]}`}>{item.rarity}</p>
                {wallpapers.find(w => w.id === item.id) && (
                  <p className="text-xs text-green-400">✅ Dikoleksi</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {wallpapers.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-green-400" /> Koleksi ({wallpapers.length}/{wallpaperList.length})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {wallpaperList.map((wp) => {
              const owned = wallpapers.find(w => w.id === wp.id)
              return (
                <div
                  key={wp.id}
                  className={`p-2 rounded-lg text-center border ${
                    owned ? 'border-green-500 bg-green-500/10' : 'border-gray-700 opacity-50'
                  }`}
                >
                  <div className="text-2xl">{wp.image}</div>
                  <p className="text-xs truncate">{owned ? wp.name : '???'}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ PREMIUM PAGE ============
function PremiumPage() {
  const packages = [
    { months: 1, days: 30, price: 'Rp 7.000', bonus: '1.200', crystal: 1200 },
    { months: 3, days: 90, price: 'Rp 23.000', bonus: '3.600', crystal: 3600 },
    { months: 6, days: 180, price: 'Rp 44.000', bonus: '7.200', crystal: 7200 },
    { months: 12, days: 366, price: 'Rp 88.000', bonus: '14.400', crystal: 14400 },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-700/50 text-center">
        <Crown className="w-16 h-16 mx-auto text-yellow-400 mb-2" />
        <h2 className="text-2xl font-bold text-yellow-400">RyzeGames Premium</h2>
        <p className="text-gray-400 text-sm">Dapatkan akses tanpa batas dan bonus eksklusif!</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-green-600/20 px-4 py-2 rounded-full text-sm text-green-400">
          <Shield className="w-4 h-4" /> Aktif (15 hari)
        </div>
      </div>

      <div className="space-y-3">
        {packages.map((pkg) => (
          <motion.div
            key={pkg.months}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-4 flex items-center justify-between border border-gray-700 hover:border-orange-500 transition"
          >
            <div>
              <h3 className="font-semibold">{pkg.months} Bulan</h3>
              <p className="text-sm text-gray-400">{pkg.days} hari premium</p>
              <p className="text-xs text-yellow-400">+ Bonus Anicrystal: {pkg.bonus}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-orange-400">{pkg.price}</p>
              <button className="mt-1 text-xs px-4 py-1 bg-orange-600 rounded-full hover:bg-orange-700 transition">
                Pilih Paket
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ============ GIVEAWAY PAGE ============
function GiveawayPage({ levelInfo }) {
  const [duration, setDuration] = useState('7h')
  const [winners, setWinners] = useState(10)
  const [message, setMessage] = useState('')

  const durations = ['1h', '3h', '7h', '30h']
  const winnerOptions = [5, 10, 20, 30, 50]

  const totalCost = {
    '1h': 15,
    '3h': 45,
    '7h': 105,
    '30h': 450,
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-700/50">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="w-6 h-6 text-purple-400" /> Buat Giveaway
        </h2>
        <p className="text-sm text-gray-400">Bagikan hadiah ke sesama Ryze Gamer!</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Durasi per hadiah</h3>
        <div className="flex gap-2">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                duration === d ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Jumlah hadiah</h3>
        <div className="flex flex-wrap gap-2">
          {winnerOptions.map((w) => (
            <button
              key={w}
              onClick={() => setWinners(w)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                winners === w ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Isi pesan</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tulis pesan untuk penonton..."
          className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-purple-500 text-sm min-h-[80px]"
        />
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-2">📊 RINGKASAN</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Penerima</span>
            <span>{duration} × {winners} orang</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Biaya</span>
            <span>{totalCost[duration] * winners} hari</span>
          </div>
          <div className="flex justify-between text-yellow-400">
            <span>Bonus XP</span>
            <span>+{totalCost[duration] * winners * 100} XP</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-3 bg-purple-600 rounded-xl font-semibold hover:bg-purple-700 transition">
          🎁 Buat Giveaway
        </button>
        <button className="px-6 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">
          Batal
        </button>
      </div>
    </div>
  )
}

// ============ PROFIL PAGE ============
function ProfilPage({ session, history, watchlist, favorites, levelInfo }) {
  const [activeProfileTab, setActiveProfileTab] = useState('stats')

  const stats = [
    { label: 'Level', value: levelInfo.level, icon: Trophy },
    { label: 'XP', value: levelInfo.xp, icon: Zap },
    { label: 'Riwayat', value: history.length, icon: Clock },
    { label: 'Watchlist', value: watchlist.length, icon: Bookmark },
  ]

  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-700/30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={session?.user?.image || 'https://via.placeholder.com/80'}
              alt={session?.user?.name}
              className="w-20 h-20 rounded-full border-4 border-orange-500"
            />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-gray-900"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{session?.user?.name || 'User'}</h2>
            <p className="text-sm text-orange-400">{levelInfo.title}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Level {levelInfo.level}</span>
              <span className="text-gray-600">•</span>
              <span>{levelInfo.xp} XP</span>
            </div>
          </div>
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{levelInfo.xpInLevel} XP</span>
            <span>{levelInfo.xpNeededForNext} XP</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {levelInfo.progress < 100 
              ? `Sisa ${levelInfo.xpNeededForNext - levelInfo.xpInLevel} XP ke level berikutnya` 
              : 'Max Level!'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
              <Icon className="w-5 h-5 mx-auto text-orange-400 mb-1" />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {['Stats', 'Koleksi', 'Aktivitas'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveProfileTab(tab.toLowerCase())}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              activeProfileTab === tab.toLowerCase() ? 'bg-orange-600' : 'hover:bg-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeProfileTab === 'stats' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="font-semibold mb-2">🏆 Pencapaian</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-400" />
                <span className="text-sm">{levelInfo.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bookmark className="w-6 h-6 text-blue-400" />
                <span className="text-sm">{watchlist.length} Watchlist</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-400" />
                <span className="text-sm">{favorites.length} Favorit</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeProfileTab === 'koleksi' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="font-semibold mb-2">📚 Watchlist ({watchlist.length})</h4>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {watchlist.slice(0, 6).map((anime) => (
                  <img key={anime.mal_id} src={anime.images?.jpg?.image_url} alt={anime.title} className="w-full h-20 object-cover rounded-lg" />
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Belum ada anime di watchlist</p>
            )}
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="font-semibold mb-2">❤️ Favorit ({favorites.length})</h4>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {favorites.slice(0, 6).map((anime) => (
                  <img key={anime.mal_id} src={anime.images?.jpg?.image_url} alt={anime.title} className="w-full h-20 object-cover rounded-lg" />
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Belum ada anime favorit</p>
            )}
          </div>
        </div>
      )}

      {activeProfileTab === 'aktivitas' && (
        <div className="space-y-3">
          {history.length > 0 ? (
            history.slice(0, 10).map((anime, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                <img src={anime.images?.jpg?.image_url} alt={anime.title} className="w-12 h-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{anime.title}</p>
                  <p className="text-xs text-gray-400">Episode {anime.episodes || '?'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(anime.watchedAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-8">Belum ada aktivitas</p>
          )}
        </div>
      )}
    </div>
  )
}

// ============ SETTINGS PAGE ============
function SettingsPage() {
  const [settings, setSettings] = useState({
    autoPlay: true,
    brightness: true,
    skipIntro: true,
    introDuration: 85,
    quality: '720p',
    notifications: true,
  })

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⚙️ Pengaturan</h2>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="font-semibold mb-3">Pemutaran</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto play episode berikutnya</span>
              <button
                onClick={() => toggleSetting('autoPlay')}
                className={`w-12 h-6 rounded-full transition ${settings.autoPlay ? 'bg-orange-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition ${settings.autoPlay ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Kontrol brightness & volume</span>
              <button
                onClick={() => toggleSetting('brightness')}
                className={`w-12 h-6 rounded-full transition ${settings.brightness ? 'bg-orange-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition ${settings.brightness ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Skip intro</span>
              <button
                onClick={() => toggleSetting('skipIntro')}
                className={`w-12 h-6 rounded-full transition ${settings.skipIntro ? 'bg-orange-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition ${settings.skipIntro ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Durasi intro default</span>
              <input
                type="number"
                value={settings.introDuration}
                onChange={(e) => setSettings({ ...settings, introDuration: parseInt(e.target.value) || 85 })}
                className="w-20 px-3 py-1 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="font-semibold mb-3">Notifikasi</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm">Topic anime-update</span>
            <button
              onClick={() => toggleSetting('notifications')}
              className={`w-12 h-6 rounded-full transition ${settings.notifications ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition ${settings.notifications ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="font-semibold mb-3">Aplikasi</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Kualitas default</span>
              <select
                value={settings.quality}
                onChange={(e) => setSettings({ ...settings, quality: e.target.value })}
                className="bg-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
              </select>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Versi aplikasi</span>
              <span>RyzeGames v1.4.5 (43)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Developer</span>
              <span className="text-orange-400">noreasone</span>
            </div>
          </div>
        </div>

        <button className="w-full py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition text-sm">
          Logout
        </button>
      </div>
    </div>
  )
}

// ============ MAIN PAGE ============
export default function HomePage() {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [animeList, setAnimeList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('home')

  const [watchlist, setWatchlist] = useLocalStorage('ryze_watchlist', [])
  const [history, setHistory] = useLocalStorage('ryze_history', [])
  const [favorites, setFavorites] = useLocalStorage('ryze_favorites', [])

  const levelInfo = getLevelInfo(history.length * 25 + watchlist.length * 10 + favorites.length * 15)

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

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'premium', icon: Crown, label: 'Premium' },
    { id: 'giveaway', icon: Gift, label: 'Giveaway' },
    { id: 'ryzepet', icon: PawPrint, label: 'RyzePet' },
    { id: 'gacha', icon: Image, label: 'Gacha' },
    { id: 'profil', icon: User, label: 'Profil' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pb-20">
      <nav className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-400" /> RyzeGames
          </h1>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="p-2 bg-orange-600 rounded-full hover:bg-orange-700 transition relative"
                >
                  <Users className="w-4 h-4" />
                  {showChat && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>}
                </button>
                <button
                  onClick={() => signOut()}
                  className="text-sm px-3 py-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 rounded-lg hover:bg-orange-700 transition text-sm"
              >
                <LogIn className="w-4 h-4" /> Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {showChat && (
        <div className="fixed bottom-20 right-4 w-80 h-96 z-50 shadow-2xl">
          <GlobalChat session={session} />
        </div>
      )}

      <div className="container mx-auto px-4 pt-20">
        <div className="flex gap-1 overflow-x-auto pb-4 mb-4 border-b border-gray-800 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition ${
                  activeTab === item.id ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">🔥 Trending Anime</h2>
                    <p className="text-sm text-gray-400">Update terbaru hari ini</p>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    placeholder="Cari anime favoritmu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-l-xl bg-gray-800/80 border border-gray-700 focus:outline-none focus:border-orange-500 text-sm"
                  />
                  <button type="submit" className="px-4 py-3 bg-orange-600 rounded-r-xl hover:bg-orange-700 transition">
                    <Search className="w-5 h-5" />
                  </button>
                </form>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-400 py-8">{error}</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {animeList.slice(0, 12).map((anime) => (
                      <motion.div
                        key={anime.mal_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="cursor-pointer group"
                        onClick={() => handleSelectAnime(anime)}
                      >
                        <div className="relative overflow-hidden rounded-xl bg-gray-800 hover:scale-105 transition-transform">
                          <img
                            src={anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x400'}
                            alt={anime.title}
                            className="w-full h-56 object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <p className="text-xs font-semibold line-clamp-2">{anime.title}</p>
                          </div>
                          <div className="absolute top-2 right-2 bg-black/60 text-xs px-2 py-1 rounded-full">
                            🎬 {anime.episodes || '?'}
                          </div>
                          {isInWatchlist(anime) && (
                            <div className="absolute bottom-2 left-2 bg-blue-600/80 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Bookmark className="w-3 h-3" /> Subscribe
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-medium truncate">{anime.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span>{anime.score || 'N/A'}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'premium' && <PremiumPage />}
            {activeTab === 'giveaway' && <GiveawayPage levelInfo={levelInfo} />}
            {activeTab === 'ryzepet' && <RyzePetPage />}
            {activeTab === 'gacha' && <GachaWallpaperPage />}
            {activeTab === 'profil' && (
              session ? (
                <ProfilPage session={session} history={history} watchlist={watchlist} favorites={favorites} levelInfo={levelInfo} />
              ) : (
                <div className="text-center py-16">
                  <User className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">Login dulu untuk lihat profil</p>
                  <button onClick={handleLogin} className="mt-4 px-6 py-2 bg-orange-600 rounded-xl hover:bg-orange-700 transition">
                    Login dengan Google
                  </button>
                </div>
              )
            )}
            {activeTab === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </div>

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
