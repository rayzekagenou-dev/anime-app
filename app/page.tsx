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
  Image, RefreshCw, Dice6, ShoppingBag, BadgeCheck, Verified,
  Plus, UserPlus, UserMinus, Ban, Unlock, Flag, Sliders,
  BarChart3, Medal, Tv, CalendarDays, HeartHandshake, Timer as TimerIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================
// FIREBASE CONFIG
// ============================================
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

// ============================================
// CONSTANTS
// ============================================
const OWNER_EMAIL = 'rayzekagenou@gmail.com'
const TESTER_EMAILS = ['tester1@gmail.com', 'tester2@gmail.com', 'tester3@gmail.com']
const SPAM_LIMIT = 5
const BLOCK_DURATION_MINUTES = 25

// ============================================
// HOOK: useLocalStorage
// ============================================
function useLocalStorage(key: string, initialValue: any) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
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

// ============================================
// LEVEL SYSTEM
// ============================================
const LEVEL_TIERS = [
  { name: 'Batu', minLevel: 0, maxLevel: 49, emoji: '🪨', color: 'text-gray-400' },
  { name: 'Perunggu', minLevel: 50, maxLevel: 99, emoji: '🥉', color: 'text-orange-400' },
  { name: 'Perak', minLevel: 100, maxLevel: 399, emoji: '🥈', color: 'text-gray-300' },
  { name: 'Emas', minLevel: 400, maxLevel: 1499, emoji: '🥇', color: 'text-yellow-400' },
  { name: 'Berlian', minLevel: 1500, maxLevel: 5499, emoji: '💎', color: 'text-green-400' },
  { name: 'Safir', minLevel: 5500, maxLevel: 9999, emoji: '🔷', color: 'text-blue-400' },
  { name: 'Ametis', minLevel: 10000, maxLevel: 24999, emoji: '🟣', color: 'text-purple-400' },
  { name: 'Bintang Ruby', minLevel: 25000, maxLevel: 74999, emoji: '⭐', color: 'text-red-400' },
  { name: 'Celestial', minLevel: 75000, maxLevel: Infinity, emoji: '🌌', color: 'text-cyan-400' },
]

function getLevelInfo(xp: number) {
  let level = 1, xpNeeded = 100, totalXp = 0, xpForNextLevel = 100
  while (xp >= xpNeeded) {
    xp -= xpNeeded
    level++
    if (level <= 10) xpNeeded = 100
    else if (level <= 100) xpNeeded = 500
    else if (level <= 1000) xpNeeded = 1000
    else if (level <= 10000) xpNeeded = 5000
    else xpNeeded = 10000
  }
  const xpInLevel = xp
  xpForNextLevel = xpNeeded
  const progress = Math.min((xpInLevel / xpForNextLevel) * 100, 100)
  let currentTier = LEVEL_TIERS[0]
  let tierProgress = 0
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (level >= LEVEL_TIERS[i].minLevel && level <= LEVEL_TIERS[i].maxLevel) {
      currentTier = LEVEL_TIERS[i]
      if (i + 1 < LEVEL_TIERS.length) {
        tierProgress = ((level - currentTier.minLevel) / (currentTier.maxLevel - currentTier.minLevel)) * 100
      } else { tierProgress = 100 }
      break
    }
  }
  let title = '🌱 Pemula'
  if (level >= 75000) title = '🌌 Dewa Celestial'
  else if (level >= 25000) title = '⭐ Bintang Ruby'
  else if (level >= 10000) title = '🟣 Ametis'
  else if (level >= 5500) title = '🔷 Safir'
  else if (level >= 1500) title = '💎 Berlian'
  else if (level >= 400) title = '🥇 Emas'
  else if (level >= 100) title = '🥈 Perak'
  else if (level >= 50) title = '🥉 Perunggu'
  return { level, title, xp: totalXp + xpInLevel, xpInLevel, xpNeededForNext: xpForNextLevel, progress, currentTier, tierProgress }
}

// ============================================
// HOOK: useBlockedStatus
// ============================================
function useBlockedStatus(userId: string | undefined) {
  const [isBlocked, setIsBlocked] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [spamCount, setSpamCount] = useLocalStorage(`spam_${userId}`, 0)
  const [blockExpiry, setBlockExpiry] = useLocalStorage(`block_expiry_${userId}`, null)

  useEffect(() => {
    if (!userId) return
    checkBlockStatus()
    const interval = setInterval(checkBlockStatus, 1000)
    return () => clearInterval(interval)
  }, [userId])

  const checkBlockStatus = () => {
    if (!blockExpiry) {
      setIsBlocked(false)
      setRemainingSeconds(0)
      return
    }
    const expiry = new Date(blockExpiry)
    const now = new Date()
    if (now >= expiry) {
      setIsBlocked(false)
      setBlockExpiry(null)
      setSpamCount(0)
      setRemainingSeconds(0)
      return
    }
    setIsBlocked(true)
    const seconds = Math.floor((expiry.getTime() - now.getTime()) / 1000)
    setRemainingSeconds(seconds)
  }

  const addSpam = () => {
    if (!userId) return
    const newCount = spamCount + 1
    setSpamCount(newCount)
    if (newCount >= SPAM_LIMIT) {
      const expiry = new Date()
      expiry.setMinutes(expiry.getMinutes() + BLOCK_DURATION_MINUTES)
      setBlockExpiry(expiry.toISOString())
      setSpamCount(0)
      setIsBlocked(true)
      alert(`⚠️ Kamu diblokir selama ${BLOCK_DURATION_MINUTES} menit karena spam!`)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return { isBlocked, remainingSeconds, formatTime, addSpam }
}

// ============================================
// COMPONENT: AnimeCard
// ============================================
function AnimeCard({ anime, onClick }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }} 
      className="cursor-pointer group"
      onClick={() => onClick(anime)}
    >
      <div className="relative overflow-hidden rounded-xl bg-gray-800 hover:shadow-xl transition-shadow">
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
      </div>
      <p className="mt-1 text-xs font-medium truncate">{anime.title}</p>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Star className="w-3 h-3 text-yellow-400" />
        <span>{anime.score || 'N/A'}</span>
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENT: JadwalTayang
// ============================================
function JadwalTayang() {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1
  const [selectedDay, setSelectedDay] = useState(todayIndex)

  const schedule = [
    { title: 'Neko to Ryuu', episode: 9, rating: '⭐ 32.6K · ★ 7.6', image: '🐱' },
    { title: 'Black Torch', episode: 8, rating: '⭐ 83.1K · ★ 7.0', image: '🔥' },
    { title: 'Iwamoto-senpai no Suisen', episode: 8, rating: '⭐ 9.5K · ★ 6.2', image: '📚' },
    { title: 'Tenmaku no Jaadugar', episode: 9, rating: '⭐ 43.6K · ★ 7.7', image: '✨' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition ${
              i === selectedDay ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {schedule.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gray-800 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-700 transition cursor-pointer"
          >
            <div className="text-4xl">{item.image}</div>
            <div className="flex-1">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-gray-400">Episode {item.episode} • Menunggu Update</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Star className="w-3 h-3 text-yellow-400" />
                <span>{item.rating}</span>
              </div>
            </div>
            <Bell className="w-5 h-5 text-gray-500" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// COMPONENT: VideoPlayer
// ============================================
function VideoPlayer({ anime, onClose }: any) {
  const [source, setSource] = useState('gogoanime')

  const getStreamUrl = () => {
    const title = anime.title?.toLowerCase().replace(/ /g, '-') || ''
    if (source === 'gogoanime') return `https://gogoanime.gg/category/${title}`
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
        <button onClick={onClose} className="absolute -top-3 -right-3 text-white bg-red-600 rounded-full p-2 hover:bg-red-700 transition z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setSource('gogoanime')} className={`px-3 py-1 rounded-lg text-sm transition ${source === 'gogoanime' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            Gogoanime
          </button>
          <button onClick={() => setSource('zoro')} className={`px-3 py-1 rounded-lg text-sm transition ${source === 'zoro' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            Zoro
          </button>
        </div>
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <iframe src={getStreamUrl()} className="w-full h-full" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups" />
        </div>
        <h2 className="text-xl font-bold mt-4">{anime.title}</h2>
        <p className="text-gray-400 text-sm line-clamp-3">{anime.synopsis || 'Sinopsis tidak tersedia.'}</p>
        <div className="flex flex-wrap gap-4 mt-2 text-sm">
          <span>⭐ {anime.score || 'N/A'}</span>
          <span>📺 {anime.episodes || '?'} episode</span>
          <span>📅 {anime.year || 'N/A'}</span>
          <span>🎭 {anime.genres?.map((g: any) => g.name).join(', ') || 'N/A'}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENT: GlobalChat
// ============================================
function GlobalChat({ session, isBlocked, blockedUsers }: any) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !session) return
    if (isBlocked || blockedUsers?.includes(session.user.id)) {
      alert('⛔ Kamu diblokir!')
      return
    }
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
          <MessageCircle className="w-4 h-4 text-orange-400" /> Diskusi Publik
          <span className="text-xs text-gray-400 ml-auto">{messages.length} pesan</span>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[300px]">
        {loading ? (
          <div className="text-center text-gray-400 text-sm">Memuat chat...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm">Belum ada pesan. Mulai diskusi!</div>
        ) : (
          messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-2 ${msg.userId === session?.user?.id ? 'flex-row-reverse' : ''}`}>
              {msg.userPhoto && <img src={msg.userPhoto} alt={msg.userName} className="w-8 h-8 rounded-full border-2 border-orange-500" />}
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
          placeholder={isBlocked ? '⛔ Diblokir!' : session ? 'Ketik pesan...' : 'Login dulu ya!'} 
          disabled={!session || isBlocked} 
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50" 
        />
        <button type="submit" disabled={!session || !input.trim() || isBlocked} className="px-3 py-2 bg-orange-600 rounded-lg hover:bg-orange-700 transition disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

// ============================================
// COMPONENT: PremiumPage
// ============================================
function PremiumPage({ userEmail, onPurchase, isPremium, isOwner }: any) {
  const packages = [
    { months: 1, days: 30, price: 'Rp 7.000', crystal: 1200 },
    { months: 3, days: 90, price: 'Rp 23.000', crystal: 3600 },
    { months: 6, days: 180, price: 'Rp 44.000', crystal: 7200 },
    { months: 12, days: 366, price: 'Rp 88.000', crystal: 14400 },
    { years: 5, days: 1850, price: 'Rp 399.000', crystal: 80000 },
    { years: 10, days: 3650, price: 'Rp 749.000', crystal: 190000 },
    { years: 20, days: 7250, price: 'Rp 1.449.000', crystal: 420000 },
    { years: 30, days: 10850, price: 'Rp 2.099.000', crystal: 680000 },
  ]

  const handlePurchase = (pkg: any) => {
    if (onPurchase) {
      onPurchase(pkg.crystal)
      localStorage.setItem(`premium_${userEmail}`, 'true')
      localStorage.setItem(`premium_expiry_${userEmail}`, new Date(Date.now() + pkg.days * 24 * 60 * 60 * 1000).toISOString())
    }
    alert(`✅ Premium ${pkg.days} hari aktif!\n🎁 Bonus Crystal: ${pkg.crystal.toLocaleString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-2xl p-6 border border-yellow-700/50 text-center">
        <Crown className="w-16 h-16 mx-auto text-yellow-400 mb-2" />
        <h2 className="text-2xl font-bold text-yellow-400">RyzeGames Premium</h2>
        <p className="text-gray-400 text-sm">Akses tanpa batas dan bonus Crystal!</p>
        {(isPremium || isOwner) && (
          <div className="mt-3 inline-flex items-center gap-2 bg-green-600/20 px-4 py-2 rounded-full text-sm text-green-400">
            <Shield className="w-4 h-4" /> Premium Aktif
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {packages.map((pkg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-yellow-500 transition">
            <h3 className="font-semibold text-lg">{pkg.years ? `${pkg.years} Tahun` : `${pkg.months} Bulan`}</h3>
            <p className="text-sm text-gray-400">{pkg.days} hari premium</p>
            <p className="text-sm text-yellow-400">🎁 Bonus: {pkg.crystal.toLocaleString()} Crystal</p>
            <p className="text-xl font-bold text-yellow-400 mt-2">{pkg.price}</p>
            <button onClick={() => handlePurchase(pkg)} className="w-full mt-2 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 transition text-sm font-semibold">
              Pilih Paket
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// COMPONENT: RyzePetPage
// ============================================
function RyzePetPage() {
  const [pets, setPets] = useLocalStorage('ryze_pets', [
    { id: 1, name: 'Naga Emas', rarity: 'Legendary', emoji: '🐉', level: 5, xp: 120 },
    { id: 2, name: 'Phoenix', rarity: 'Epic', emoji: '🔥', level: 3, xp: 45 },
    { id: 3, name: 'Serigala Putih', rarity: 'Rare', emoji: '🐺', level: 2, xp: 20 },
  ])
  const [selectedPet, setSelectedPet] = useState(pets[0] || null)
  const rarityColors: any = { 'Umum': 'text-gray-400', 'Langka': 'text-blue-400', 'Epic': 'text-purple-400', 'Legendaris': 'text-yellow-400' }

  const feedPet = (petId: number) => {
    setPets(pets.map((p: any) => {
      if (p.id === petId) {
        const newXp = p.xp + 10
        return { ...p, xp: newXp, level: Math.floor(newXp / 50) + 1 }
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
        {pets.map((pet: any) => (
          <motion.div key={pet.id} whileHover={{ scale: 1.05 }} className={`bg-gray-800 rounded-xl p-4 text-center cursor-pointer border-2 transition ${selectedPet?.id === pet.id ? 'border-orange-500' : 'border-gray-700 hover:border-gray-600'}`} onClick={() => setSelectedPet(pet)}>
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
                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all" style={{ width: `${(selectedPet.xp % 50) / 50 * 100}%` }} />
              </div>
            </div>
            <button onClick={() => feedPet(selectedPet.id)} className="px-4 py-2 bg-orange-600 rounded-xl text-sm hover:bg-orange-700 transition">
              🍖 Beri Makan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENT: GachaWallpaperPage
// ============================================
function GachaWallpaperPage() {
  const [crystals, setCrystals] = useLocalStorage('ryze_crystals', 500)
  const [wallpapers, setWallpapers] = useLocalStorage('ryze_wallpapers', [])
  const [result, setResult] = useState<any[] | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [gachaCount, setGachaCount] = useState(1)

  const wallpaperList = [
    { id: 1, name: 'Naga Ryze', rarity: 'Legendaris', image: '🐉', color: 'from-yellow-400 to-orange-500' },
    { id: 2, name: 'Api Phoenix', rarity: 'Epic', image: '🔥', color: 'from-red-400 to-pink-500' },
    { id: 3, name: 'Ksatria Galaksi', rarity: 'Epic', image: '⚔️', color: 'from-purple-400 to-blue-500' },
    { id: 4, name: 'Rubah Kristal', rarity: 'Langka', image: '🦊', color: 'from-cyan-400 to-blue-500' },
    { id: 5, name: 'Logo Ryze', rarity: 'Langka', image: '⚡', color: 'from-orange-400 to-yellow-500' },
    { id: 6, name: 'Serigala Bulan', rarity: 'Langka', image: '🌙', color: 'from-gray-400 to-blue-300' },
    { id: 7, name: 'Samurai Neon', rarity: 'Umum', image: '🗡️', color: 'from-pink-400 to-purple-500' },
    { id: 8, name: 'Sakura', rarity: 'Umum', image: '🌸', color: 'from-pink-300 to-red-300' },
  ]

  const rarityColors: any = { 'Umum': 'text-gray-400', 'Langka': 'text-blue-400', 'Epic': 'text-purple-400', 'Legendaris': 'text-yellow-400' }

  const performGacha = (count: number) => {
    const cost = count * 50
    if (crystals < cost) { alert('Crystal tidak cukup!'); return }
    setIsSpinning(true)
    setCrystals(crystals - cost)
    const results: any[] = []
    for (let i = 0; i < count; i++) {
      const rand = Math.random() * 100
      let rarity
      if (rand < 5) rarity = 'Legendaris'
      else if (rand < 20) rarity = 'Epic'
      else if (rand < 50) rarity = 'Langka'
      else rarity = 'Umum'
      const pool = wallpaperList.filter(w => w.rarity === rarity)
      const selected = pool[Math.floor(Math.random() * pool.length)]
      results.push(selected)
      if (!wallpapers.find((w: any) => w.id === selected.id)) {
        setWallpapers((prev: any) => [...prev, selected])
      }
    }
    setTimeout(() => { setResult(results); setIsSpinning(false) }, 1500)
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
          <button onClick={() => setGachaCount(1)} className={`px-4 py-2 rounded-xl text-sm transition ${gachaCount === 1 ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>1x (50💎)</button>
          <button onClick={() => setGachaCount(10)} className={`px-4 py-2 rounded-xl text-sm transition ${gachaCount === 10 ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>10x (500💎)</button>
        </div>
        <button onClick={() => performGacha(gachaCount)} disabled={isSpinning} className={`w-full py-4 rounded-xl font-semibold text-lg transition ${isSpinning ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'}`}>
          {isSpinning ? <RefreshCw className="w-6 h-6 mx-auto animate-spin" /> : `🎰 Spin ${gachaCount}x`}
        </button>
      </div>
      {result && (
        <div className="bg-gray-800 rounded-xl p-6 border border-green-500/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Dice6 className="w-5 h-5 text-green-400" /> Hasil Spin</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {result.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className={`bg-gradient-to-br ${item.color} p-4 rounded-xl text-center`}>
                <div className="text-4xl">{item.image}</div>
                <p className="font-semibold text-sm mt-1">{item.name}</p>
                <p className={`text-xs font-bold ${rarityColors[item.rarity]}`}>{item.rarity}</p>
                {wallpapers.find((w: any) => w.id === item.id) && <p className="text-xs text-green-400">✅ Dikoleksi</p>}
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {wallpapers.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-green-400" /> Koleksi ({wallpapers.length}/{wallpaperList.length})</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {wallpaperList.map((wp) => {
              const owned = wallpapers.find((w: any) => w.id === wp.id)
              return (
                <div key={wp.id} className={`p-2 rounded-lg text-center border ${owned ? 'border-green-500 bg-green-500/10' : 'border-gray-700 opacity-50'}`}>
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

// ============================================
// COMPONENT: ProfilPage
// ============================================
function ProfilPage({ session, history, watchlist, favorites, levelInfo, crystals, isPremium, isTester, isOwner }: any) {
  const [activeTab, setActiveTab] = useState('stats')

  const stats = [
    { label: 'Level', value: levelInfo.level, icon: Trophy },
    { label: 'XP', value: levelInfo.xp.toLocaleString(), icon: Zap },
    { label: 'Riwayat', value: history.length, icon: Clock },
    { label: 'Watchlist', value: watchlist.length, icon: Bookmark },
    { label: 'Crystal', value: crystals || 0, icon: Gem },
  ]

  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-700/30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={session?.user?.image || 'https://via.placeholder.com/80'} alt={session?.user?.name} className="w-20 h-20 rounded-full border-4 border-orange-500" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-gray-900" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">{session?.user?.name || 'User'}</h2>
              {isOwner && <Verified className="w-5 h-5 text-red-500" />}
              {(isPremium || isOwner) && <BadgeCheck className="w-5 h-5 text-blue-400" />}
              {isTester && !isOwner && <Shield className="w-5 h-5 text-green-400" />}
            </div>
            <p className="text-sm text-orange-400">{levelInfo.title}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Level {levelInfo.level}</span>
              <span className="text-gray-600">•</span>
              <span>{levelInfo.xp} XP</span>
              <span className="text-gray-600">•</span>
              <Gem className="w-4 h-4 text-purple-400" />
              <span>{crystals || 0} Crystal</span>
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
            <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`px-4 py-2 rounded-xl text-sm transition ${activeTab === tab.toLowerCase() ? 'bg-orange-600' : 'hover:bg-gray-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
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
      )}

      {activeTab === 'koleksi' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="font-semibold mb-2">📚 Watchlist ({watchlist.length})</h4>
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {watchlist.slice(0, 6).map((anime: any) => (
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
                {favorites.slice(0, 6).map((anime: any) => (
                  <img key={anime.mal_id} src={anime.images?.jpg?.image_url} alt={anime.title} className="w-full h-20 object-cover rounded-lg" />
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Belum ada anime favorit</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'aktivitas' && (
        <div className="space-y-3">
          {history.length > 0 ? (
            history.slice(0, 10).map((anime: any, i: number) => (
              <div key={i} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                <img src={anime.images?.jpg?.image_url} alt={anime.title} className="w-12 h-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{anime.title}</p>
                  <p className="text-xs text-gray-400">Episode {anime.episodes || '?'}</p>
                  <p className="text-xs text-gray-500">{new Date(anime.watchedAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
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

// ============================================
// COMPONENT: OwnerPanel
// ============================================
function OwnerPanel({ 
  testers, setTesters, 
  blockedUsers, setBlockedUsers, 
  premiumUsers, setPremiumUsers,
  onGivePremium 
}: any) {
  const [newTesterEmail, setNewTesterEmail] = useState('')
  const [newPremiumEmail, setNewPremiumEmail] = useState('')
  const [blockUserId, setBlockUserId] = useState('')
  const [premiumGiveEmail, setPremiumGiveEmail] = useState('')
  const [premiumDays, setPremiumDays] = useState(30)

  const addTester = () => {
    if (newTesterEmail && !testers.includes(newTesterEmail)) {
      setTesters([...testers, newTesterEmail])
      setNewTesterEmail('')
    }
  }

  const removeTester = (email: string) => {
    setTesters(testers.filter((t: string) => t !== email))
  }

  const addPremium = () => {
    if (newPremiumEmail && !premiumUsers.includes(newPremiumEmail)) {
      setPremiumUsers([...premiumUsers, newPremiumEmail])
      setNewPremiumEmail('')
    }
  }

  const removePremium = (email: string) => {
    setPremiumUsers(premiumUsers.filter((p: string) => p !== email))
  }

  const blockUser = () => {
    if (blockUserId && !blockedUsers.includes(blockUserId)) {
      setBlockedUsers([...blockedUsers, blockUserId])
      setBlockUserId('')
    }
  }

  const unblockUser = (id: string) => {
    setBlockedUsers(blockedUsers.filter((b: string) => b !== id))
  }

  const givePremium = () => {
    if (premiumGiveEmail && onGivePremium) {
      onGivePremium(premiumGiveEmail, premiumDays)
      setPremiumGiveEmail('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-2xl p-6 border border-red-700/50">
        <div className="flex items-center gap-3">
          <Sliders className="w-8 h-8 text-red-400" />
          <div>
            <h2 className="text-2xl font-bold text-red-400">⚙️ Panel Owner</h2>
            <p className="text-sm text-gray-400">Kelola tester, premium, blokir user, dan lainnya!</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-green-400" /> Kelola Tester (🟢 Hijau)
        </h3>
        <div className="flex gap-2 mb-3">
          <input type="email" value={newTesterEmail} onChange={(e) => setNewTesterEmail(e.target.value)} placeholder="Email tester..." className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button onClick={addTester} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition text-sm">Tambah</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {testers.map((t: string) => (
            <div key={t} className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm">
              <Shield className="w-4 h-4 text-green-400" />
              <span>{t}</span>
              <button onClick={() => removeTester(t)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Crown className="w-5 h-5 text-blue-400" /> Kelola Premium (🔵 Biru)
        </h3>
        <div className="flex gap-2 mb-3">
          <input type="email" value={newPremiumEmail} onChange={(e) => setNewPremiumEmail(e.target.value)} placeholder="Email premium..." className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={addPremium} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm">Tambah</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {premiumUsers.map((p: string) => (
            <div key={p} className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm">
              <BadgeCheck className="w-4 h-4 text-blue-400" />
              <span>{p}</span>
              <button onClick={() => removePremium(p)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-400" /> Blokir User
        </h3>
        <div className="flex gap-2 mb-3">
          <input type="text" value={blockUserId} onChange={(e) => setBlockUserId(e.target.value)} placeholder="User ID..." className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          <button onClick={blockUser} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm">Blokir</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {blockedUsers.map((b: string) => (
            <div key={b} className="flex items-center gap-2 bg-red-900/30 px-3 py-1 rounded-full text-sm">
              <span className="text-red-400">{b}</span>
              <button onClick={() => unblockUser(b)} className="text-green-400 hover:text-green-300"><Unlock className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-yellow-400" /> Beri Premium ke User
        </h3>
        <div className="flex gap-2 mb-2">
          <input type="email" value={premiumGiveEmail} onChange={(e) => setPremiumGiveEmail(e.target.value)} placeholder="Email user..." className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>
        <div className="flex gap-2">
          <input type="number" value={premiumDays} onChange={(e) => setPremiumDays(parseInt(e.target.value) || 30)} placeholder="Hari..." className="w-24 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          <button onClick={givePremium} className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 transition text-sm">Berikan</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// COMPONENT: SettingsPage
// ============================================
function SettingsPage({ session, signOut }: any) {
  const [settings, setSettings] = useLocalStorage('ryze_settings', {
    autoPlay: true,
    brightness: true,
    skipIntro: true,
    introDuration: 85,
    quality: '720p',
    notifications: true
  })

  const toggleSetting = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⚙️ Pengaturan</h2>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><User className="w-5 h-5 text-orange-400" /> Profil</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Nama profil</span>
            <span className="text-sm text-gray-400">{session?.user?.name || 'User'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Email</span>
            <span className="text-sm text-gray-400">{session?.user?.email || '-'}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-3">🎬 Pemutaran</h3>
        <div className="space-y-3">
          {['autoPlay', 'brightness', 'skipIntro'].map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">
                {key === 'autoPlay' ? 'Putar otomatis episode berikutnya' : 
                 key === 'brightness' ? 'Kontrol kecerahan & volume' : 
                 'Lewati intro'}
              </span>
              <button onClick={() => toggleSetting(key)} className={`w-12 h-6 rounded-full transition ${settings[key] ? 'bg-orange-500' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition ${settings[key] ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <span className="text-sm">Durasi intro default</span>
            <input type="number" value={settings.introDuration} onChange={(e) => setSettings({ ...settings, introDuration: parseInt(e.target.value) || 85 })} className="w-20 px-3 py-1 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-3">🔔 Notifikasi</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm">Notifikasi update anime</span>
          <button onClick={() => toggleSetting('notifications')} className={`w-12 h-6 rounded-full transition ${settings.notifications ? 'bg-orange-500' : 'bg-gray-600'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition ${settings.notifications ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-3">📱 Aplikasi</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Kualitas default</span>
            <select value={settings.quality} onChange={(e) => setSettings({ ...settings, quality: e.target.value })} className="bg-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Versi aplikasi</span>
            <span>RyzeGames v2.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Pengembang</span>
            <span className="text-orange-400">noreasone</span>
          </div>
        </div>
      </div>

      <button onClick={() => signOut()} className="w-full py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition text-sm">
        Keluar
      </button>
    </div>
  )
}

// ============================================
// MAIN COMPONENT: HomePage
// ============================================
export default function HomePage() {
  const { data: session, status } = useSession()
  const [search, setSearch] = useState('')
  const [animeList, setAnimeList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnime, setSelectedAnime] = useState<any>(null)
  const [showChat, setShowChat] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  const [isTesterLogin, setIsTesterLogin] = useState(false)

  // Local storage
  const [crystals, setCrystals] = useLocalStorage('ryze_crystals_' + (session?.user?.email || ''), 0)
  const [watchlist, setWatchlist] = useLocalStorage('ryze_watchlist_' + (session?.user?.email || ''), [])
  const [history, setHistory] = useLocalStorage('ryze_history_' + (session?.user?.email || ''), [])
  const [favorites, setFavorites] = useLocalStorage('ryze_favorites_' + (session?.user?.email || ''), [])
  
  // Admin data
  const [testers, setTesters] = useLocalStorage('ryze_testers', ['tester1@gmail.com', 'tester2@gmail.com', 'tester3@gmail.com'])
  const [premiumUsers, setPremiumUsers] = useLocalStorage('ryze_premium_users', ['premium1@gmail.com'])
  const [blockedUsers, setBlockedUsers] = useLocalStorage('ryze_blocked', [])

  const userEmail = session?.user?.email || ''
  const isOwner = userEmail === OWNER_EMAIL
  const isTester = testers.includes(userEmail) || isTesterLogin
  const isPremium = premiumUsers.includes(userEmail) || localStorage.getItem(`premium_${userEmail}`) === 'true'

  // Block system
  const { isBlocked, remainingSeconds, formatTime, addSpam } = useBlockedStatus(session?.user?.id)

  // XP & Level
  let xp = history.length * 25 + watchlist.length * 10 + favorites.length * 15
  if (isOwner) xp = 999999999
  const levelInfo = getLevelInfo(xp)

  // Crystal
  const displayCrystals = isOwner ? 99999999 : crystals

  // Functions
  const addCrystals = (amount: number) => {
    if (isOwner) {
      setCrystals(99999999)
      return
    }
    setCrystals((crystals || 0) + amount)
  }

  const givePremium = (targetEmail: string, days: number) => {
    if (!isOwner) { alert('Hanya Owner yang bisa give premium!'); return }
    setPremiumUsers([...premiumUsers, targetEmail])
    localStorage.setItem(`premium_${targetEmail}`, 'true')
    alert(`✅ Premium ${days} hari diberikan ke ${targetEmail}!`)
  }

  const fetchAnime = async (query: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=50`)
      if (!res.ok) throw new Error('Gagal fetch data')
      const data = await res.json()
      setAnimeList(data.data || [])
    } catch (err) {
      setError('Gagal memuat anime. Coba lagi nanti.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnime('popular')
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) fetchAnime(search)
  }

  const handleLogin = () => signIn('google', { callbackUrl: window.location.href })
  const handleLogout = () => signOut()

  const handleTesterLogin = () => {
    setIsTesterLogin(true)
    // Simulasi session tester
    const testerSession = {
      user: {
        id: 'tester_' + Date.now(),
        name: 'Tester',
        email: 'tester@ryzegames.com',
        image: 'https://via.placeholder.com/80'
      }
    }
    // Simpan ke localStorage agar bisa dipake
    localStorage.setItem('tester_session', JSON.stringify(testerSession))
    window.location.reload()
  }

  // Cek tester session
  useEffect(() => {
    const testerData = localStorage.getItem('tester_session')
    if (testerData && !session) {
      setIsTesterLogin(true)
    }
  }, [session])

  const addToWatchlist = (anime: any) => {
    if (!watchlist.find((a: any) => a.mal_id === anime.mal_id)) {
      setWatchlist([...watchlist, { ...anime, userId: userEmail }])
    } else {
      setWatchlist(watchlist.filter((a: any) => a.mal_id !== anime.mal_id))
    }
  }

  const isInWatchlist = (anime: any) => watchlist.some((a: any) => a.mal_id === anime.mal_id)

  const addToHistory = (anime: any) => {
    const newHistory = [{ ...anime, watchedAt: new Date().toISOString(), userId: userEmail }, ...history.filter((a: any) => a.mal_id !== anime.mal_id)]
    setHistory(newHistory.slice(0, 50))
  }

  const toggleFavorite = (anime: any) => {
    if (favorites.find((a: any) => a.mal_id === anime.mal_id)) {
      setFavorites(favorites.filter((a: any) => a.mal_id !== anime.mal_id))
    } else {
      setFavorites([...favorites, { ...anime, userId: userEmail }])
    }
  }

  const isFavorite = (anime: any) => favorites.some((a: any) => a.mal_id === anime.mal_id)

  const handleSelectAnime = (anime: any) => {
    setSelectedAnime(anime)
    addToHistory(anime)
  }

  const navItems = [
    { id: 'home', icon: Home, label: 'Beranda' },
    { id: 'jadwal', icon: Calendar, label: 'Jadwal' },
    { id: 'anime', icon: Tv, label: 'Anime' },
    { id: 'premium', icon: Crown, label: 'Premium' },
    { id: 'ryzepet', icon: PawPrint, label: 'RyzePet' },
    { id: 'gacha', icon: Image, label: 'Gacha' },
    { id: 'profil', icon: User, label: 'Profil' },
    { id: 'settings', icon: Settings, label: 'Pengaturan' },
    ...(isOwner ? [{ id: 'owner', icon: Sliders, label: 'Panel Owner' }] : []),
  ]

  // ============ LOGIN PAGE ============
  if (!session && !isTesterLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              RyzeGames
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Platform anime, donghua & movie untuk komunitas Indonesia.</p>
            <p className="text-gray-500 text-xs mt-1">v1.4.5 · build 43</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition flex items-center justify-center gap-3 border border-gray-600"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Lanjut dengan Google
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-xs text-gray-500">atau</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <button
              onClick={handleTesterLogin}
              className="w-full py-3 bg-orange-600/20 hover:bg-orange-600/30 rounded-xl text-orange-400 font-semibold transition flex items-center justify-center gap-2 border border-orange-600/30"
            >
              <Shield className="w-5 h-5" /> Masuk sebagai Tester
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Dengan masuk, kamu menyetujui ketentuan layanan RyzeGames.
              Aplikasi ini tidak mengunggah atau mendistribusikan konten media.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ============ MAIN APP ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pb-20">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" /> RyzeGames
            </h1>
            {isTester && !isOwner && <Shield className="w-5 h-5 text-green-400" />}
            {(isPremium || isOwner) && <BadgeCheck className="w-5 h-5 text-blue-400" />}
            {isOwner && <Verified className="w-5 h-5 text-red-500" />}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full text-sm">
              <Gem className="w-4 h-4 text-purple-400" />
              <span className="font-semibold">{isOwner ? '♾️' : displayCrystals.toLocaleString()}</span>
            </div>
            {isBlocked && (
              <div className="flex items-center gap-1 bg-red-600/20 px-2 py-1 rounded-full text-xs text-red-400">
                <TimerIcon className="w-3 h-3" /> {formatTime(remainingSeconds)}
              </div>
            )}
            <button onClick={() => setShowChat(!showChat)} className="p-2 bg-orange-600 rounded-full hover:bg-orange-700 transition relative">
              <Users className="w-4 h-4" />
              {showChat && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />}
            </button>
            <button onClick={handleLogout} className="text-sm px-3 py-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition">
              Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* Global Chat */}
      {showChat && (
        <div className="fixed bottom-20 right-4 w-80 h-96 z-50 shadow-2xl">
          <GlobalChat session={session} isBlocked={isBlocked} blockedUsers={blockedUsers} />
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-20">
        {/* Navigation Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-4 mb-4 border-b border-gray-800 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition ${activeTab === item.id ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            
            {/* HOME */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">🔥 Trending Anime</h2>
                    <p className="text-sm text-gray-400">Update terbaru hari ini</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gem className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold">{isOwner ? '♾️' : displayCrystals.toLocaleString()}</span>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="flex">
                  <input type="text" placeholder="Cari anime favoritmu..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-3 rounded-l-xl bg-gray-800/80 border border-gray-700 focus:outline-none focus:border-orange-500 text-sm" />
                  <button type="submit" className="px-4 py-3 bg-orange-600 rounded-r-xl hover:bg-orange-700 transition">
                    <Search className="w-5 h-5" />
                  </button>
                </form>

                {/* Anime Grid */}
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
                  </div>
                ) : error ? (
                  <div className="text-center text-red-400 py-8">{error}</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {animeList.slice(0, 20).map((anime) => (
                      <AnimeCard key={anime.mal_id} anime={anime} onClick={handleSelectAnime} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* JADWAL */}
            {activeTab === 'jadwal' && <JadwalTayang />}

            {/* ANIME */}
            {activeTab === 'anime' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Tv className="w-6 h-6 text-orange-400" /> Semua Anime</h2>
                <form onSubmit={handleSearch} className="flex">
                  <input type="text" placeholder="Cari anime..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-3 rounded-l-xl bg-gray-800/80 border border-gray-700 focus:outline-none focus:border-orange-500 text-sm" />
                  <button type="submit" className="px-4 py-3 bg-orange-600 rounded-r-xl hover:bg-orange-700 transition">
                    <Search className="w-5 h-5" />
                  </button>
                </form>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
                  </div>
                ) : error ? (
                  <div className="text-center text-red-400 py-8">{error}</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {animeList.map((anime) => (
                      <AnimeCard key={anime.mal_id} anime={anime} onClick={handleSelectAnime} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PREMIUM */}
            {activeTab === 'premium' && (
              <PremiumPage 
                userEmail={userEmail} 
                onPurchase={addCrystals} 
                isPremium={isPremium}
                isOwner={isOwner}
              />
            )}

            {/* RYZEPET */}
            {activeTab === 'ryzepet' && <RyzePetPage />}

            {/* GACHA */}
            {activeTab === 'gacha' && <GachaWallpaperPage />}

            {/* PROFIL */}
            {activeTab === 'profil' && (
              <ProfilPage 
                session={session || { user: { name: 'Tester', email: 'tester@ryzegames.com', image: 'https://via.placeholder.com/80' } }} 
                history={history} 
                watchlist={watchlist} 
                favorites={favorites} 
                levelInfo={levelInfo} 
                crystals={displayCrystals}
                isPremium={isPremium}
                isTester={isTester}
                isOwner={isOwner}
              />
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsPage session={session} signOut={handleLogout} />
            )}

            {/* OWNER PANEL */}
            {activeTab === 'owner' && isOwner && (
              <OwnerPanel 
                testers={testers}
                setTesters={setTesters}
                blockedUsers={blockedUsers}
                setBlockedUsers={setBlockedUsers}
                premiumUsers={premiumUsers}
                setPremiumUsers={setPremiumUsers}
                onGivePremium={givePremium}
              />
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Video Player */}
      <AnimatePresence>
        {selectedAnime && (
          <VideoPlayer anime={selectedAnime} onClose={() => setSelectedAnime(null)} />
        )}
      </AnimatePresence>
    </div>
  )
                                                             }
