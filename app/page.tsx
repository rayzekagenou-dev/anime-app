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
  Plus, UserPlus, UserMinus, Ban, Unlock, Link, Users as UsersIcon,
  Crown as CrownIcon, Shield as ShieldIcon, Flag, Sliders,
  BarChart3, Medal, Star as StarIcon, TrendingUp as TrendingUpIcon,
  Diamond, AlertCircle, CheckCircle, XCircle, Circle, Gauge,
  List, Grid, Filter, Layers, Tv, CalendarDays, Database,
  Gift as GiftIcon, Coins as CoinsIcon, Wallet, CreditCard,
  Send as SendIcon, Download, Upload, RefreshCw as RefreshIcon,
  Clock as ClockIcon, Timer, Hourglass, Palette, Brush, Sparkles as SparklesIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

const OWNER_EMAIL = 'rayzekagenou@gmail.com'
const LEVEL_TIERS = [
  { name: 'Stone', minLevel: 0, maxLevel: 49, emoji: '🪨', color: 'text-gray-400' },
  { name: 'Bronze', minLevel: 50, maxLevel: 99, emoji: '🥉', color: 'text-orange-400' },
  { name: 'Silver', minLevel: 100, maxLevel: 399, emoji: '🥈', color: 'text-gray-300' },
  { name: 'Gold', minLevel: 400, maxLevel: 1499, emoji: '🥇', color: 'text-yellow-400' },
  { name: 'Emerald', minLevel: 1500, maxLevel: 5499, emoji: '💎', color: 'text-green-400' },
  { name: 'Sapphire', minLevel: 5500, maxLevel: 9999, emoji: '🔷', color: 'text-blue-400' },
  { name: 'Amethyst', minLevel: 10000, maxLevel: 24999, emoji: '🟣', color: 'text-purple-400' },
  { name: 'Ruby Star', minLevel: 25000, maxLevel: 74999, emoji: '⭐', color: 'text-red-400' },
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
  let title = '🌱 Ryze Newbie'
  if (level >= 75000) title = '🌌 Celestial Ryze'
  else if (level >= 25000) title = '⭐ Ruby Star Ryze'
  else if (level >= 10000) title = '🟣 Amethyst Ryze'
  else if (level >= 5500) title = '🔷 Sapphire Ryze'
  else if (level >= 1500) title = '💎 Emerald Ryze'
  else if (level >= 400) title = '🥇 Gold Ryze'
  else if (level >= 100) title = '🥈 Silver Ryze'
  else if (level >= 50) title = '🥉 Bronze Ryze'
  return { level, title, xp: totalXp + xpInLevel, xpInLevel, xpNeededForNext: xpForNextLevel, progress, currentTier, tierProgress }
}

const ANIME_DATA = {
  weekly: [
    { title: 'One Piece', eps: 1175, score: 8.7, views: '118.6K', rank: 1 },
    { title: 'Bleach', eps: 365, score: 7.7, views: '59.1K', rank: 2 },
    { title: 'Black Clover', eps: 170, score: 8.0, views: '52.7K', rank: 3 },
  ],
  complete: [
    { title: 'Synduality: Noir Part 2', eps: 12, score: 7.1, views: 796 },
    { title: 'World Trigger', eps: 73, score: 8.1, views: 1700 },
    { title: 'Dragon Ball Z', eps: 291, score: 8.3, views: 2700 },
    { title: 'Dragon Ball Super', eps: 131, score: 7.5, views: 2000 },
    { title: 'Dead Mount Death Play Part 2', eps: 12, score: 7.4, views: 10600 },
    { title: 'Honzuki no Gekokujou Season 3', eps: 20, score: 8.4, views: 10400 },
  ],
  donghua: [
    { title: 'Dongda Gao Wu Xueyuan', eps: 8, score: 7.2, views: '11.6K' },
    { title: 'Soul Land 2: The Peerless Tang Clan', eps: 162, score: 8.0, views: '164.3K' },
    { title: 'Crowned in a Hundred Days', eps: 20, score: 6.6, views: '4.8K' },
    { title: 'Against The Sky Supreme', eps: 530, score: 7.2, views: '39.8K' },
    { title: 'Perfect World', eps: 284, score: 5.9, views: '435.6K' },
    { title: 'Coiling Dragon', eps: 20, score: 5.9, views: '39.4K' },
  ],
  movies: [
    { title: 'Koukaku Kidoutai Arise: Ghost in the Shell', views: 499, type: 'Movie' },
    { title: 'Tensei Shitara Slime Datta Ken Movie', views: 1700, type: 'Movie' },
    { title: 'Kimi to, Nami Noretara', views: 0, type: 'Movie' },
  ],
}

function GlobalChat({ session, blockedUsers, onGivePremium }) {
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
    if (blockedUsers.includes(session.user.id)) {
      alert('⛔ Kamu diblockir oleh Owner!')
      return
    }
    const giveMatch = input.match(/^\/give\s+(\S+)\s+(\d+)$/i)
    if (giveMatch) {
      const targetEmail = giveMatch[1]
      const days = parseInt(giveMatch[2])
      if (onGivePremium) {
        onGivePremium(targetEmail, days)
        setInput('')
        return
      }
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
          <MessageCircle className="w-4 h-4 text-orange-400" /> Global Chat
          <span className="text-xs text-gray-400 ml-auto">{messages.length} pesan</span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">💡 /give email hari</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] max-h-[300px]">
        {loading ? (
          <div className="text-center text-gray-400 text-sm">Loading chat...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm">Belum ada pesan. Mulai chat!</div>
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
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={session ? 'Ketik /give ...' : 'Login dulu ya!'} disabled={!session} className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50" />
        <button type="submit" disabled={!session || !input.trim()} className="px-3 py-2 bg-orange-600 rounded-lg hover:bg-orange-700 transition disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

function VideoPlayer({ anime, onClose, onAddWatchlist, isInWatchlist }) {
  const [source, setSource] = useState('gogoanime')
  const getStreamUrl = () => {
    const title = anime.title.toLowerCase().replace(/ /g, '-')
    if (source === 'gogoanime') return `https://gogoanime.gg/category/${title}`
    return `https://zoro.to/search?keyword=${anime.title}`
  }
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-gray-900 rounded-xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 text-white bg-red-600 rounded-full p-2 hover:bg-red-700 transition z-10"><X className="w-5 h-5" /></button>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setSource('gogoanime')} className={`px-3 py-1 rounded-lg text-sm transition ${source === 'gogoanime' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Gogoanime</button>
          <button onClick={() => setSource('zoro')} className={`px-3 py-1 rounded-lg text-sm transition ${source === 'zoro' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Zoro</button>
          <button onClick={onAddWatchlist} className={`px-3 py-1 rounded-lg text-sm transition ml-auto ${isInWatchlist ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isInWatchlist ? <Check className="w-4 h-4 inline" /> : <Bookmark className="w-4 h-4 inline" />}
            {isInWatchlist ? ' Tersimpan' : ' Watchlist'}
          </button>
        </div>
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <iframe src={getStreamUrl()} className="w-full h-full" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups" />
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

function RyzePetPage() {
  const [pets, setPets] = useLocalStorage('ryze_pets', [
    { id: 1, name: 'Naga Emas', rarity: 'Legendary', emoji: '🐉', level: 5, xp: 120 },
    { id: 2, name: 'Phoenix', rarity: 'Epic', emoji: '🔥', level: 3, xp: 45 },
    { id: 3, name: 'Serigala Putih', rarity: 'Rare', emoji: '🐺', level: 2, xp: 20 },
  ])
  const [selectedPet, setSelectedPet] = useState(pets[0] || null)
  const rarityColors = { 'Common': 'text-gray-400', 'Rare': 'text-blue-400', 'Epic': 'text-purple-400', 'Legendary': 'text-yellow-400' }
  const feedPet = (petId) => {
    setPets(pets.map(p => { if (p.id === petId) return { ...p, xp: p.xp + 10, level: Math.floor(p.xp / 50) + 1 }; return p }))
  }
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-700/30">
        <div className="flex items-center gap-3"><PawPrint className="w-8 h-8 text-orange-400" /><div><h2 className="text-2xl font-bold">RyzePet</h2><p className="text-sm text-gray-400">Koleksi dan rawat peliharaanmu!</p></div></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {pets.map((pet) => (
          <motion.div key={pet.id} whileHover={{ scale: 1.05 }} className={`bg-gray-800 rounded-xl p-4 text-center cursor-pointer border-2 transition ${selectedPet?.id === pet.id ? 'border-orange-500' : 'border-gray-700 hover:border-gray-600'}`} onClick={() => setSelectedPet(pet)}>
            <div className="text-4xl mb-1">{pet.emoji}</div><p className="font-semibold text-sm">{pet.name}</p><p className={`text-xs ${rarityColors[pet.rarity] || 'text-gray-400'}`}>{pet.rarity}</p><p className="text-xs text-gray-500">Lv.{pet.level}</p>
          </motion.div>
        ))}
        <div className="bg-gray-800 rounded-xl p-4 text-center border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-orange-500 transition">
          <div><Package className="w-8 h-8 mx-auto text-gray-500" /><p className="text-xs text-gray-500 mt-1">Adopsi Pet</p></div>
        </div>
      </div>
      {selectedPet && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{selectedPet.emoji}</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{selectedPet.name}</h3>
              <p className={`text-sm ${rarityColors[selectedPet.rarity] || 'text-gray-400'}`}>{selectedPet.rarity}</p>
              <div className="flex items-center gap-4 mt-2 text-sm"><span className="text-gray-400">Level {selectedPet.level}</span><span className="text-gray-400">|</span><span className="text-gray-400">{selectedPet.xp} XP</span></div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2"><div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all" style={{ width: `${(selectedPet.xp % 50) / 50 * 100}%` }} /></div>
            </div>
            <button onClick={() => feedPet(selectedPet.id)} className="px-4 py-2 bg-orange-600 rounded-xl text-sm hover:bg-orange-700 transition">🍖 Beri Makan</button>
          </div>
        </div>
      )}
    </div>
  )
}

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
  const rarityColors = { 'Common': 'text-gray-400', 'Rare': 'text-blue-400', 'Epic': 'text-purple-400', 'Legendary': 'text-yellow-400' }
  const performGacha = (count) => {
    const cost = count * 50
    if (crystals < cost) { alert('Crystal tidak cukup!'); return }
    setIsSpinning(true); setCrystals(crystals - cost); const results = []
    for (let i = 0; i < count; i++) {
      const rand = Math.random() * 100; let rarity
      if (rand < 5) rarity = 'Legendary'
      else if (rand < 20) rarity = 'Epic'
      else if (rand < 50) rarity = 'Rare'
      else rarity = 'Common'
      const pool = wallpaperList.filter(w => w.rarity === rarity)
      const selected = pool[Math.floor(Math.random() * pool.length)]
      results.push(selected)
      if (!wallpapers.find(w => w.id === selected.id)) setWallpapers(prev => [...prev, selected])
    }
    setTimeout(() => { setResult(results); setIsSpinning(false) }, 1500)
  }
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Image className="w-8 h-8 text-purple-400" /><div><h2 className="text-2xl font-bold">Gacha Wallpaper</h2><p className="text-sm text-gray-400">Spin untuk dapatkan wallpaper eksklusif!</p></div></div>
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-xl"><Gem className="w-4 h-4 text-purple-400" /><span className="font-semibold">{crystals}</span></div>
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
                <div className="text-4xl">{item.image}</div><p className="font-semibold text-sm mt-1">{item.name}</p><p className={`text-xs font-bold ${rarityColors[item.rarity]}`}>{item.rarity}</p>
                {wallpapers.find(w => w.id === item.id) && <p className="text-xs text-green-400">✅ Dikoleksi</p>}
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
              const owned = wallpapers.find(w => w.id === wp.id)
              return <div key={wp.id} className={`p-2 rounded-lg text-center border ${owned ? 'border-green-500 bg-green-500/10' : 'border-gray-700 opacity-50'}`}><div className="text-2xl">{wp.image}</div><p className="text-xs truncate">{owned ? wp.name : '???'}</p></div>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PremiumPage({ userEmail, onPurchase }) {
  const [hasPremium, setHasPremium] = useLocalStorage('ryze_premium_' + userEmail, false)
  const [premiumYears, setPremiumYears] = useLocalStorage('ryze_premium_years_' + userEmail, 0)
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
  const handlePurchase = (pkg) => {
    setHasPremium(true)
    setPremiumYears(999999)
    if (onPurchase) onPurchase(pkg.crystal)
    alert(`✅ Premium aktif selamanya!\n🎁 Bonus RyzeCrystal: ${pkg.crystal.toLocaleString()}`)
  }
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-700/50 text-center">
        <Crown className="w-16 h-16 mx-auto text-yellow-400 mb-2" />
        <h2 className="text-2xl font-bold text-yellow-400">RyzeGames Premium</h2>
        <p className="text-gray-400 text-sm">Dapatkan akses tanpa batas dan bonus RyzeCrystal!</p>
        {hasPremium && (
          <div className="mt-3 inline-flex items-center gap-2 bg-green-600/20 px-4 py-2 rounded-full text-sm text-green-400">
            <Shield className="w-4 h-4" /> Aktif ({premiumYears} tahun)
          </div>
        )}
        {hasPremium && premiumYears >= 999999 && (
          <div className="mt-2 text-xs text-yellow-400 font-bold">♾️ PREMIUM SELAMANYA (999999 TAHUN)</div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {packages.map((pkg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500 transition">
            <h3 className="font-semibold text-lg">{pkg.years ? `${pkg.years} Tahun` : `${pkg.months} Bulan`}</h3>
            <p className="text-sm text-gray-400">{pkg.days} hari premium</p>
            <p className="text-sm text-yellow-400">🎁 Bonus: {pkg.crystal.toLocaleString()} RyzeCrystal</p>
            <p className="text-xl font-bold text-orange-400 mt-2">{pkg.price}</p>
            <button onClick={() => handlePurchase(pkg)} className="w-full mt-2 py-2 bg-orange-600 rounded-lg hover:bg-orange-700 transition text-sm font-semibold">Pilih Paket</button>
          </motion.div>
        ))}
      </div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-2">📜 RIWAYAT ORDER</h3>
        <div className="text-sm text-gray-400 p-2 bg-gray-700/30 rounded-lg">
          PREM-20260822073257-A0764B <span className="text-red-400 ml-2">[CANCELED]</span>
        </div>
      </div>
    </div>
  )
}

function GiveawayPage({ levelInfo, onGiveaway, userEmail, onAddXp }) {
  const [duration, setDuration] = useState('7h')
  const [winners, setWinners] = useState(10)
  const [message, setMessage] = useState('')
  const [giveawayCount, setGiveawayCount] = useState(1)
  const durations = ['1h', '3h', '7h', '30h']
  const winnerOptions = [5, 10, 20, 30, 50]
  const baseCost = { '1h': 15, '3h': 45, '7h': 105, '30h': 450 }
  const totalDays = baseCost[duration] * winners * giveawayCount
  const totalXp = totalDays * 100
  const handleGiveaway = () => {
    if (onGiveaway) {
      onGiveaway(duration, winners, message, giveawayCount, totalDays, totalXp)
      if (onAddXp) onAddXp(totalXp)
      alert(`🎉 Giveaway ${duration} dengan ${winners} pemenang dibuat!\n📊 Total: ${totalDays} hari\n✨ +${totalXp.toLocaleString()} XP`)
    }
  }
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-700/50">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Gift className="w-6 h-6 text-purple-400" /> Buat Giveaway</h2>
        <p className="text-sm text-gray-400">Bagikan hadiah dan dapatkan XP! 🎯 XP = total hari × 100</p>
      </div>
      <div className="flex gap-2">
        {[1, 3, 5, 10].map((n) => (
          <button key={n} onClick={() => setGiveawayCount(n)} className={`px-4 py-2 rounded-xl text-sm transition ${giveawayCount === n ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{n}x</button>
        ))}
      </div>
      <div><h3 className="font-semibold mb-2">Durasi per hadiah</h3><div className="flex gap-2">{durations.map((d) => <button key={d} onClick={() => setDuration(d)} className={`px-4 py-2 rounded-xl text-sm transition ${duration === d ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{d}</button>)}</div></div>
      <div><h3 className="font-semibold mb-2">Jumlah penerima</h3><div className="flex flex-wrap gap-2">{winnerOptions.map((w) => <button key={w} onClick={() => setWinners(w)} className={`px-4 py-2 rounded-xl text-sm transition ${winners === w ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{w} orang</button>)}</div></div>
      <div><h3 className="font-semibold mb-2">Isi pesan</h3><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tulis pesan untuk penonton..." className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-purple-500 text-sm min-h-[80px]" /></div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold mb-2">📊 RINGKASAN</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Penerima</span><span>{duration} × {winners} orang × {giveawayCount}x</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Total Hari</span><span>{totalDays} hari</span></div>
          <div className="flex justify-between text-yellow-400 font-bold border-t border-gray-600 pt-1"><span>✨ Bonus XP</span><span>+{totalXp.toLocaleString()} XP</span></div>
          <div className="flex justify-between text-green-400"><span>🎯 Level saat ini</span><span>Lv. {levelInfo.level} ({levelInfo.title})</span></div>
          <div className="flex justify-between text-blue-400"><span>📈 XP setelah giveaway</span><span>{(levelInfo.xp + totalXp).toLocaleString()} XP</span></div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={handleGiveaway} className="flex-1 py-3 bg-purple-600 rounded-xl font-semibold hover:bg-purple-700 transition">🎁 Buat Giveaway</button>
        <button className="px-6 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition">Batal</button>
      </div>
    </div>
  )
}

function LeaderboardPage({ leaderboard }) {
  const [tab, setTab] = useState('all')
  const [sortBy, setSortBy] = useState('giveaway')
  const durations = ['all', '1h', '3h', '7h', '30h']
  const durationLabels = {
    'all': '🏆 Semua',
    '1h': '⏱️ 1 Jam',
    '3h': '⏱️ 3 Jam',
    '7h': '⏱️ 7 Jam',
    '30h': '⏱️ 30 Jam'
  }
  const filtered = tab === 'all' ? leaderboard : leaderboard.filter(u => u.topDuration === tab)
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'giveaway') return (b.totalGiveaway || 0) - (a.totalGiveaway || 0)
    if (sortBy === 'xp') return (b.xp || 0) - (a.xp || 0)
    return (b.level || 1) - (a.level || 1)
  })
  const getMedal = (rank) => {
    if (rank === 0) return '🥇'
    if (rank === 1) return '🥈'
    if (rank === 2) return '🥉'
    return `#${rank + 1}`
  }
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-2xl p-6 border border-yellow-700/50">
        <div className="flex items-center gap-3"><BarChart3 className="w-8 h-8 text-yellow-400" /><div><h2 className="text-2xl font-bold">🏆 Leaderboard</h2><p className="text-sm text-gray-400">Top 200 berdasarkan durasi giveaway!</p></div></div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {durations.map((d) => (
          <button key={d} onClick={() => setTab(d)} className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition ${tab === d ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{durationLabels[d]}</button>
        ))}
      </div>
      <div className="flex gap-2 bg-gray-800 rounded-xl p-2 border border-gray-700">
        <button onClick={() => setSortBy('giveaway')} className={`flex-1 py-2 rounded-lg text-sm transition ${sortBy === 'giveaway' ? 'bg-yellow-600 text-white' : 'hover:bg-gray-700'}`}>🏆 Giveaway</button>
        <button onClick={() => setSortBy('xp')} className={`flex-1 py-2 rounded-lg text-sm transition ${sortBy === 'xp' ? 'bg-yellow-600 text-white' : 'hover:bg-gray-700'}`}>⚡ XP</button>
        <button onClick={() => setSortBy('level')} className={`flex-1 py-2 rounded-lg text-sm transition ${sortBy === 'level' ? 'bg-yellow-600 text-white' : 'hover:bg-gray-700'}`}>📊 Level</button>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {sorted.slice(0, 200).map((user, index) => (
          <motion.div key={user.email + tab} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }} className={`flex items-center gap-3 p-3 rounded-xl transition ${index === 0 ? 'bg-yellow-600/20 border border-yellow-500/50' : index === 1 ? 'bg-gray-400/20 border border-gray-400/50' : index === 2 ? 'bg-orange-600/20 border border-orange-500/50' : 'bg-gray-800 hover:bg-gray-700'}`}>
            <div className="w-10 text-center font-bold text-sm">{getMedal(index)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{user.name || user.email}</p>
                {user.isOwner && <Verified className="w-4 h-4 text-red-500" />}
                {user.isTester && !user.isOwner && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                {user.topDuration && <span className="text-xs bg-purple-500/20 px-2 py-0.5 rounded-full text-purple-300">{user.topDuration}</span>}
              </div>
              <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                <span>🎁 {(user.totalGiveaway || 0).toLocaleString()} giveaway</span>
                <span>⭐ Level {user.level || 1}</span>
                <span>⚡ {(user.xp || 0).toLocaleString()} XP</span>
                {user.totalDays && <span>📅 {(user.totalDays || 0).toLocaleString()} hari</span>}
              </div>
            </div>
            {index < 3 && <div className="text-2xl">{index === 0 ? '👑' : index === 1 ? '⭐' : '🌟'}</div>}
          </motion.div>
        ))}
        {sorted.length === 0 && <div className="text-center py-8 text-gray-400"><p>Belum ada data leaderboard untuk durasi ini.</p></div>}
      </div>
    </div>
  )
}

function ProfilPage({ session, history, watchlist, favorites, levelInfo, userRole, crystals }) {
  const [activeProfileTab, setActiveProfileTab] = useState('stats')
  const stats = [
    { label: 'Level', value: levelInfo.level, icon: Trophy },
    { label: 'XP', value: levelInfo.xp, icon: Zap },
    { label: 'Riwayat', value: history.length, icon: Clock },
    { label: 'Watchlist', value: watchlist.length, icon: Bookmark },
    { label: 'Crystal', value: crystals || 0, icon: Gem },
  ]
  const isOwner = userRole === 'owner'
  const isTester = userRole === 'tester'
  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-700/30">
        <div className="flex items-center gap-4">
          <div className="relative"><img src={session?.user?.image || 'https://via.placeholder.com/80'} alt={session?.user?.name} className="w-20 h-20 rounded-full border-4 border-orange-500" /><div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-gray-900"></div></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold">{session?.user?.name || 'User'}</h2>{isOwner && <div className="flex items-center gap-1 bg-red-600/20 px-2 py-0.5 rounded-full"><Verified className="w-4 h-4 text-red-500" /><span className="text-xs text-red-400 font-semibold">Owner</span></div>}{isTester && !isOwner && <div className="flex items-center gap-1 bg-blue-600/20 px-2 py-0.5 rounded-full"><BadgeCheck className="w-4 h-4 text-blue-400" /><span className="text-xs text-blue-400 font-semibold">Tester</span></div>}</div>
            <p className="text-sm text-orange-400">{levelInfo.title}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400"><Trophy className="w-4 h-4 text-yellow-400" /><span>Level {levelInfo.level}</span><span className="text-gray-600">•</span><span>{levelInfo.xp} XP</span><span className="text-gray-600">•</span><Gem className="w-4 h-4 text-purple-400" /><span>{crystals || 0} Crystal</span></div>
          </div>
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"><Settings className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="mt-4"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>{levelInfo.xpInLevel} XP</span><span>{levelInfo.xpNeededForNext} XP</span></div><div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden"><div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${levelInfo.progress}%` }} /></div><p className="text-xs text-gray-500 mt-1">{levelInfo.progress < 100 ? `Sisa ${levelInfo.xpNeededForNext - levelInfo.xpInLevel} XP ke level berikutnya` : 'Max Level!'}</p></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{stats.map((stat, i) => { const Icon = stat.icon; return <div key={i} className="bg-gray-800 rounded-xl p-4 text-center"><Icon className="w-5 h-5 mx-auto text-orange-400 mb-1" /><p className="text-xl font-bold">{stat.value}</p><p className="text-xs text-gray-400">{stat.label}</p></div> })}</div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><h4 className="font-semibold mb-3">📊 Level Progress</h4><div className="space-y-2">{LEVEL_TIERS.map((tier, i) => { const isUnlocked = levelInfo.level >= tier.minLevel; const isCurrent = levelInfo.level >= tier.minLevel && levelInfo.level <= tier.maxLevel; return <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent ? 'bg-orange-500/20 border border-orange-500' : isUnlocked ? 'bg-green-500/10' : 'bg-gray-700/30'}`}><span className="text-2xl">{tier.emoji}</span><div className="flex-1"><div className="flex items-center gap-2"><p className={`text-sm font-semibold ${isUnlocked ? tier.color : 'text-gray-500'}`}>{tier.name}</p>{isUnlocked && <CheckCircle className="w-4 h-4 text-green-400" />}{isCurrent && <span className="text-xs text-orange-400">● Aktif</span>}</div><p className="text-xs text-gray-500">Level {tier.minLevel} - {tier.maxLevel === Infinity ? '+' : tier.maxLevel}</p></div>{isCurrent && <div className="text-xs text-orange-400">{Math.round(levelInfo.tierProgress)}%</div>}</div> })}</div></div>
      <div className="flex gap-2 border-b border-gray-700 pb-2">{['Stats', 'Koleksi', 'Aktivitas'].map((tab) => <button key={tab} onClick={() => setActiveProfileTab(tab.toLowerCase())} className={`px-4 py-2 rounded-xl text-sm transition ${activeProfileTab === tab.toLowerCase() ? 'bg-orange-600' : 'hover:bg-gray-800'}`}>{tab}</button>)}</div>
      {activeProfileTab === 'stats' && <div className="space-y-4"><div className="bg-gray-800 rounded-xl p-4"><h4 className="font-semibold mb-2">🏆 Pencapaian</h4><div className="flex flex-wrap gap-4"><div className="flex items-center gap-2"><Award className="w-6 h-6 text-yellow-400" /><span className="text-sm">{levelInfo.title}</span></div><div className="flex items-center gap-2"><Bookmark className="w-6 h-6 text-blue-400" /><span className="text-sm">{watchlist.length} Watchlist</span></div><div className="flex items-center gap-2"><Heart className="w-6 h-6 text-red-400" /><span className="text-sm">{favorites.length} Favorit</span></div></div></div></div>}
      {activeProfileTab === 'koleksi' && <div className="space-y-4"><div className="bg-gray-800 rounded-xl p-4"><h4 className="font-semibold mb-2">📚 Watchlist ({watchlist.length})</h4>{watchlist.length > 0 ? <div className="grid grid-cols-3 gap-2">{watchlist.slice(0, 6).map((anime) => <img key={anime.mal_id} src={anime.images?.jpg?.image_url} alt={anime.title} className="w-full h-20 object-cover rounded-lg" />)}</div> : <p className="text-gray-400 text-sm">Belum ada anime di watchlist</p>}</div><div className="bg-gray-800 rounded-xl p-4"><h4 className="font-semibold mb-2">❤️ Favorit ({favorites.length})</h4>{favorites.length > 0 ? <div className="grid grid-cols-3 gap-2">{favorites.slice(0, 6).map((anime) => <img key={anime.mal_id} src={anime.images?.jpg?.image_url} alt={anime.title} className="w-full h-20 object-cover rounded-lg" />)}</div> : <p className="text-gray-400 text-sm">Belum ada anime favorit</p>}</div></div>}
      {activeProfileTab === 'aktivitas' && <div className="space-y-3">{history.length > 0 ? history.slice(0, 10).map((anime, i) => <div key={i} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3"><img src={anime.images?.jpg?.image_url} alt={anime.title} className="w-12 h-16 object-cover rounded-lg" /><div className="flex-1"><p className="text-sm font-semibold">{anime.title}</p><p className="text-xs text-gray-400">Episode {anime.episodes || '?'}</p><p className="text-xs text-gray-500">{new Date(anime.watchedAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div></div>) : <p className="text-center text-gray-400 py-8">Belum ada aktivitas</p>}</div>}
    </div>
  )
}

function OwnerPanel({ session, onGivePremium }) {
  const [testers, setTesters] = useLocalStorage('ryze_testers', ['tester1@gmail.com', 'tester2@gmail.com'])
  const [blockedUsers, setBlockedUsers] = useLocalStorage('ryze_blocked', [])
  const [newTesterEmail, setNewTesterEmail] = useState('')
  const [blockUserId, setBlockUserId] = useState('')
  const [premiumGiveEmail, setPremiumGiveEmail] = useState('')
  const [premiumDays, setPremiumDays] = useState(30)
  const [friendEmail, setFriendEmail] = useState('')
  const [clanName, setClanName] = useState('')
  const [clans, setClans] = useLocalStorage('ryze_clans', [{ id: 1, name: 'Ryze Elite', members: ['rayzekagenou@gmail.com'], leader: 'rayzekagenou@gmail.com' }])
  const [friends, setFriends] = useLocalStorage('ryze_friends', ['tester1@gmail.com'])
  const addTester = () => { if (newTesterEmail && !testers.includes(newTesterEmail)) { setTesters([...testers, newTesterEmail]); setNewTesterEmail('') } }
  const removeTester = (email) => { setTesters(testers.filter(t => t !== email)) }
  const blockUser = () => { if (blockUserId && !blockedUsers.includes(blockUserId)) { setBlockedUsers([...blockedUsers, blockUserId]); setBlockUserId('') } }
  const unblockUser = (id) => { setBlockedUsers(blockedUsers.filter(b => b !== id)) }
  const givePremium = () => { if (premiumGiveEmail && onGivePremium) { onGivePremium(premiumGiveEmail, premiumDays); setPremiumGiveEmail('') } }
  const addFriend = () => { if (friendEmail && !friends.includes(friendEmail)) { setFriends([...friends, friendEmail]); setFriendEmail('') } }
  const removeFriend = (email) => { setFriends(friends.filter(f => f !== email)) }
  const createClan = () => { if (clanName) { setClans([...clans, { id: Date.now(), name: clanName, members: [OWNER_EMAIL], leader: OWNER_EMAIL }]); setClanName('') } }
  const joinClan = (clanId) => { setClans(clans.map(c => c.id === clanId ? { ...c, members: [...c.members, session?.user?.email] } : c)) }
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-2xl p-6 border border-red-700/50">
        <div className="flex items-center gap-3"><Sliders className="w-8 h-8 text-red-400" /><div><h2 className="text-2xl font-bold text-red-400">⚙️ Owner Panel</h2><p className="text-sm text-gray-400">Kelola tester, blokir user, beri premium, dan lebih banyak lagi!</p></div></div>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><h3 className="font-semibold mb-3 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-400" /> Kelola Tester</h3><div className="flex gap-2 mb-3"><input type="email" value={newTesterEmail} onChange={(e) => setNewTesterEmail(e.target.value)} placeholder="Email tester..." className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /><button onClick={addTester} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm">Tambah</button></div><div className="flex flex-wrap gap-2">{testers.map((t) => <div key={t} className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm"><span>{t}</span><button onClick={() => removeTester(t)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button></div>)}</div></div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><h3 className="font-semibold mb-3 flex items-center gap-2"><Ban className="w-5 h-5 text-red-400" /> Blokir User</h3><div className="flex gap-2 mb-3"><input type="text" value={blockUserId} onChange={(e) => setBlockUserId(e.target.value)} placeholder="User ID..." className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" /><button onClick={blockUser} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm">Blokir</button></div><div className="flex flex-wrap gap-2">{blockedUsers.map((b) => <div key={b} className="flex items-center gap-2 bg-red-900/30 px-3 py-1 rounded-full text-sm"><span>{b}</span><button onClick={() => unblockUser(b)} className="text-green-400 hover:text-green-300"><Unlock className="w-4 h-4" /></button></div>)}</div></div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><h3 className="font-semibold mb-3 flex items-center gap-2"><Gift className="w-5 h-5 text-yellow-400" /> Give Premium ke Teman</h3><div className="flex gap-2 mb-2"><input type="email" value={premiumGiveEmail} onChange={(e) => setPremiumGiveEmail(e.target.value)} placeholder="Email teman..." className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" /></div><div className="flex gap-2"><input type="number" value={premiumDays} onChange={(e) => setPremiumDays(parseInt(e.target.value) || 30)} placeholder="Hari..." className="w-24 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" /><button onClick={givePremium} className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 transition text-sm">Berikan</button></div></div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-green-400" /> Pertemanan</h3><div className="flex gap-2 mb-3"><input type="email" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} placeholder="Email teman..." className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /><button onClick={addFriend} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition text-sm">Tambah</button></div><div className="flex flex-wrap gap-2">{friends.map((f) => <div key={f} className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm"><span>{f}</span><button onClick={() => removeFriend(f)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button></div>)}</div></div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><h3 className="font-semibold mb-3 flex items-center gap-2"><Flag className="w-5 h-5 text-purple-400" /> Clan Management</h3><div className="flex gap-2 mb-3"><input type="text" value={clanName} onChange={(e) => setClanName(e.target.value)} placeholder="Nama Clan..." className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /><button onClick={createClan} className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition text-sm">Buat Clan</button></div><div className="space-y-2">{clans.map((c) => <div key={c.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg"><div><p className="font-semibold">{c.name}</p><p className="text-xs text-gray-400">Leader: {c.leader} • {c.members.length} member</p></div><button onClick={() => joinClan(c.id)} className="px-3 py-1 bg-purple-600 rounded-lg hover:bg-purple-700 transition text-xs">Gabung</button></div>)}</div></div>
    </div>
  )
}

function SettingsPage() {
  const [settings, setSettings] = useState({ autoPlay: true, brightness: true, skipIntro: true, introDuration: 85, quality: '720p', notifications: true })
  const toggleSetting = (key) => { setSettings(prev => ({ ...prev, [key]: !prev[key] })) }
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⚙️ Pengaturan</h2>
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><h3 className="font-semibold mb-3">Pemutaran</h3><div className="space-y-3">{['autoPlay', 'brightness', 'skipIntro'].map((key) => <div key={key} className="flex items-center justify-between"><span className="text-sm">{key === 'autoPlay' ? 'Auto play episode berikutnya' : key === 'brightness' ? 'Kontrol brightness & volume' : 'Skip intro'}</span><button onClick={() => toggleSetting(key)} className={`w-12 h-6 rounded-full transition ${settings[key] ? 'bg-orange-500' : 'bg-gray-600'}`}><div className={`w-5 h-5 bg-white rounded-full transition ${settings[key] ? 'translate-x-6' : ''}`} /></button></div>)}<div className="flex items-center justify-between"><span className="text-sm">Durasi intro default</span><input type="number" value={settings.introDuration} onChange={(e) => setSettings({ ...settings, introDuration: parseInt(e.target.value) || 85 })} className="w-20 px-3 py-1 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div></div></div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><h3 className="font-semibold mb-3">Notifikasi</h3><div className="flex items-center justify-between"><span className="text-sm">Topic anime-update</span><button onClick={() => toggleSetting('notifications')} className={`w-12 h-6 rounded-full transition ${settings.notifications ? 'bg-orange-500' : 'bg-gray-600'}`}><div className={`w-5 h-5 bg-white rounded-full transition ${settings.notifications ? 'translate-x-6' : ''}`} /></button></div></div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700"><h3 className="font-semibold mb-3">Aplikasi</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-400">Kualitas default</span><select value={settings.quality} onChange={(e) => setSettings({ ...settings, quality: e.target.value })} className="bg-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"><option value="1080p">1080p</option><option value="720p">720p</option><option value="480p">480p</option></select></div><div className="flex justify-between"><span className="text-gray-400">Versi aplikasi</span><span>RyzeGames v2.0.0</span></div><div className="flex justify-between"><span className="text-gray-400">Developer</span><span className="text-orange-400">noreasone</span></div></div></div>
        <button className="w-full py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition text-sm">Logout</button>
      </div>
    </div>
  )
}

function AnimeSection({ title, data, icon: Icon, viewAll }) {
  if (!data || data.length === 0) return null
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center"><h3 className="font-semibold flex items-center gap-2"><Icon className="w-4 h-4 text-orange-400" /> {title}</h3>{viewAll && <button className="text-xs text-orange-400">Selengkapnya →</button>}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {data.map((item, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-3 hover:bg-gray-700 transition cursor-pointer">
            <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
              {item.eps && <span>📺 {item.eps} Eps</span>}
              {item.score && <span>⭐ {item.score}</span>}
              {item.views && <span>👁️ {item.views}</span>}
              {item.rank && <span className="text-yellow-400">#{item.rank}</span>}
              {item.type && <span className="text-blue-400">{item.type}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [animeList, setAnimeList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  const [leaderboard, setLeaderboard] = useLocalStorage('ryze_leaderboard', [])
  const [crystals, setCrystals] = useLocalStorage('ryze_crystals_' + (session?.user?.email || ''), 0)
  const [watchlist, setWatchlist] = useLocalStorage('ryze_watchlist_' + (session?.user?.email || ''), [])
  const [history, setHistory] = useLocalStorage('ryze_history_' + (session?.user?.email || ''), [])
  const [favorites, setFavorites] = useLocalStorage('ryze_favorites_' + (session?.user?.email || ''), [])
  const [blockedUsers] = useLocalStorage('ryze_blocked', [])

  const userEmail = session?.user?.email || ''
  const isOwner = userEmail === OWNER_EMAIL
  const userRole = isOwner ? 'owner' : 'user'

  let xp = history.length * 25 + watchlist.length * 10 + favorites.length * 15
  if (isOwner) xp = 9999999
  const levelInfo = getLevelInfo(xp)

  const addCrystals = (amount) => { setCrystals((crystals || 0) + amount) }

  const givePremium = (targetEmail, days) => {
    if (!isOwner) { alert('Hanya Owner yang bisa give premium!'); return }
    alert(`✅ Premium ${days} hari diberikan ke ${targetEmail}!`)
  }

  const handleGiveaway = (duration, winners, message, count, totalDays, totalXp) => {
    if (!isOwner) { alert('Hanya Owner yang bisa buat giveaway!'); return }
    const existing = leaderboard.find(u => u.email === userEmail)
    const updatedLeaderboard = [...leaderboard]
    if (existing) {
      const idx = updatedLeaderboard.indexOf(existing)
      updatedLeaderboard[idx] = { ...existing, totalGiveaway: (existing.totalGiveaway || 0) + (winners * count), totalDays: (existing.totalDays || 0) + totalDays, xp: (existing.xp || 0) + totalXp, level: getLevelInfo((existing.xp || 0) + totalXp).level, topDuration: duration }
    } else {
      updatedLeaderboard.push({ email: userEmail, name: session?.user?.name || userEmail, totalGiveaway: winners * count, totalDays, xp: totalXp, level: getLevelInfo(totalXp).level, topDuration: duration, isOwner, isTester: false })
    }
    setLeaderboard(updatedLeaderboard)
    const currentXp = parseInt(localStorage.getItem('ryze_xp_' + userEmail) || '0')
    const newXp = currentXp + totalXp
    localStorage.setItem('ryze_xp_' + userEmail, String(newXp))
    alert(`🎉 Giveaway ${duration} dengan ${winners} pemenang dibuat!\n📊 Total: ${totalDays} hari\n✨ +${totalXp.toLocaleString()} XP\n📈 Level naik ke ${getLevelInfo(newXp).level}`)
  }

  useEffect(() => {
    if (session) {
      const existing = leaderboard.find(u => u.email === userEmail)
      if (!existing) {
        setLeaderboard([...leaderboard, { email: userEmail, name: session.user.name || userEmail, totalGiveaway: 0, totalDays: 0, xp, level: levelInfo.level, topDuration: 'all', isOwner, isTester: false }])
      }
    }
  }, [session])

  useEffect(() => { fetchAnime('popular') }, [])
  const fetchAnime = async (query) => { setLoading(true); setError(''); try { const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=24`); if (!res.ok) throw new Error('Gagal fetch data'); const data = await res.json(); setAnimeList(data.data || []) } catch (err) { setError('Gagal memuat anime. Coba lagi nanti.') } finally { setLoading(false) } }
  const handleSearch = (e) => { e.preventDefault(); if (search.trim()) fetchAnime(search) }
  const handleLogin = () => signIn('google', { callbackUrl: window.location.href })
  const addToWatchlist = (anime) => { if (!watchlist.find(a => a.mal_id === anime.mal_id)) { setWatchlist([...watchlist, { ...anime, userId: userEmail }]) } else { setWatchlist(watchlist.filter(a => a.mal_id !== anime.mal_id)) } }
  const isInWatchlist = (anime) => watchlist.some(a => a.mal_id === anime.mal_id)
  const addToHistory = (anime) => { const newHistory = [{ ...anime, watchedAt: new Date().toISOString(), userId: userEmail }, ...history.filter(a => a.mal_id !== anime.mal_id)]; setHistory(newHistory.slice(0, 50)) }
  const clearHistory = () => { if (confirm('Hapus semua riwayat?')) setHistory([]) }
  const toggleFavorite = (anime) => { if (favorites.find(a => a.mal_id === anime.mal_id)) { setFavorites(favorites.filter(a => a.mal_id !== anime.mal_id)) } else { setFavorites([...favorites, { ...anime, userId: userEmail }]) } }
  const isFavorite = (anime) => favorites.some(a => a.mal_id === anime.mal_id)
  const handleSelectAnime = (anime) => { setSelectedAnime(anime); addToHistory(anime) }

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'anime', icon: Tv, label: 'Anime' },
    { id: 'leaderboard', icon: BarChart3, label: 'Leaderboard' },
    { id: 'premium', icon: Crown, label: 'Premium' },
    { id: 'giveaway', icon: Gift, label: 'Giveaway' },
    { id: 'ryzepet', icon: PawPrint, label: 'RyzePet' },
    { id: 'gacha', icon: Image, label: 'Gacha' },
    { id: 'profil', icon: User, label: 'Profil' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    ...(isOwner ? [{ id: 'owner', icon: Sliders, label: 'Owner Panel' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pb-20">
      <nav className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2"><h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2"><Zap className="w-5 h-5 text-orange-400" /> RyzeGames</h1>{isOwner && <div className="flex items-center gap-1 bg-red-600/20 px-2 py-0.5 rounded-full"><Verified className="w-4 h-4 text-red-500" /><span className="text-xs text-red-400 font-semibold">Owner</span></div>}</div>
          <div className="flex items-center gap-2">{session ? <><button onClick={() => setShowChat(!showChat)} className="p-2 bg-orange-600 rounded-full hover:bg-orange-700 transition relative"><Users className="w-4 h-4" />{showChat && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>}</button><button onClick={() => signOut()} className="text-sm px-3 py-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition">Logout</button></> : <button onClick={handleLogin} className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 rounded-lg hover:bg-orange-700 transition text-sm"><LogIn className="w-4 h-4" /> Login</button>}</div>
        </div>
      </nav>

      {showChat && <div className="fixed bottom-20 right-4 w-80 h-96 z-50 shadow-2xl"><GlobalChat session={session} blockedUsers={blockedUsers} onGivePremium={givePremium} /></div>}

      <div className="container mx-auto px-4 pt-20">
        <div className="flex gap-1 overflow-x-auto pb-4 mb-4 border-b border-gray-800 scrollbar-hide">
          {navItems.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition ${activeTab === item.id ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Icon className="w-4 h-4" />{item.label}</button> })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            
            {activeTab === 'home' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold">🔥 Trending Anime</h2><p className="text-sm text-gray-400">Update terbaru hari ini</p></div></div>
                <form onSubmit={handleSearch} className="flex"><input type="text" placeholder="Cari anime favoritmu..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-3 rounded-l-xl bg-gray-800/80 border border-gray-700 focus:outline-none focus:border-orange-500 text-sm" /><button type="submit" className="px-4 py-3 bg-orange-600 rounded-r-xl hover:bg-orange-700 transition"><Search className="w-5 h-5" /></button></form>
                <AnimeSection title="Weekly Anime" data={ANIME_DATA.weekly} icon={CalendarDays} viewAll />
                <AnimeSection title="Complete Anime" data={ANIME_DATA.complete} icon={CheckCircle} viewAll />
                <AnimeSection title="Donghua Update" data={ANIME_DATA.donghua} icon={Zap} viewAll />
                <AnimeSection title="Movie Update" data={ANIME_DATA.movies} icon={Film} viewAll />
              </div>
            )}

            {activeTab === 'anime' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Tv className="w-6 h-6 text-orange-400" /> Semua Anime</h2>
                <form onSubmit={handleSearch} className="flex"><input type="text" placeholder="Cari anime..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-3 rounded-l-xl bg-gray-800/80 border border-gray-700 focus:outline-none focus:border-orange-500 text-sm" /><button type="submit" className="px-4 py-3 bg-orange-600 rounded-r-xl hover:bg-orange-700 transition"><Search className="w-5 h-5" /></button></form>
                {loading ? <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div></div> : error ? <div className="text-center text-red-400 py-8">{error}</div> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{animeList.map((anime) => <motion.div key={anime.mal_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="cursor-pointer group" onClick={() => handleSelectAnime(anime)}><div className="relative overflow-hidden rounded-xl bg-gray-800 hover:scale-105 transition-transform"><img src={anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x400'} alt={anime.title} className="w-full h-56 object-cover" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3"><p className="text-xs font-semibold line-clamp-2">{anime.title}</p></div><div className="absolute top-2 right-2 bg-black/60 text-xs px-2 py-1 rounded-full">🎬 {anime.episodes || '?'}</div>{isInWatchlist(anime) && <div className="absolute bottom-2 left-2 bg-blue-600/80 text-xs px-2 py-1 rounded-full flex items-center gap-1"><Bookmark className="w-3 h-3" /> Subscribe</div>}</div><p className="mt-1 text-xs font-medium truncate">{anime.title}</p><div className="flex items-center gap-2 text-xs text-gray-400"><Star className="w-3 h-3 text-yellow-400" /><span>{anime.score || 'N/A'}</span></div></motion.div>)}</div>}
              </div>
            )}

            {activeTab === 'leaderboard' && <LeaderboardPage leaderboard={leaderboard} />}
            {activeTab === 'premium' && <PremiumPage userEmail={userEmail} onPurchase={addCrystals} />}
            {activeTab === 'giveaway' && <GiveawayPage levelInfo={levelInfo} onGiveaway={handleGiveaway} userEmail={userEmail} onAddXp={(xp) => { localStorage.setItem('ryze_xp_' + userEmail, String(parseInt(localStorage.getItem('ryze_xp_' + userEmail) || '0') + xp)); window.location.reload() }} />}
            {activeTab === 'ryzepet' && <RyzePetPage />}
            {activeTab === 'gacha' && <GachaWallpaperPage />}
            {activeTab === 'profil' && (session ? <ProfilPage session={session} history={history} watchlist={watchlist} favorites={favorites} levelInfo={levelInfo} userRole={userRole} crystals={crystals} /> : <div className="text-center py-16"><User className="w-16 h-16 mx-auto text-gray-600 mb-4" /><p className="text-gray-400">Login dulu untuk lihat profil</p><button onClick={handleLogin} className="mt-4 px-6 py-2 bg-orange-600 rounded-xl hover:bg-orange-700 transition">Login dengan Google</button></div>)}
            {activeTab === 'settings' && <SettingsPage />}
            {activeTab === 'owner' && <OwnerPanel session={session} onGivePremium={givePremium} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>{selectedAnime && <VideoPlayer anime={selectedAnime} onClose={() => setSelectedAnime(null)} onAddWatchlist={() => addToWatchlist(selectedAnime)} isInWatchlist={isInWatchlist(selectedAnime)} />}</AnimatePresence>
    </div>
  )
}
    </pre>

    <div class="footer">
        ✅ Kode lengkap <code>page.tsx</code> — RyzeGames Full Fitur <br>
        📋 Klik tombol <strong>COPY SEMUA</strong> di pojok kanan atas, lalu tempel ke <code>page.tsx</code> di GitHub.
    </div>

    <script>
        function copyAll() {
            const code = document.getElementById('codeBlock').innerText;
            navigator.clipboard.writeText(code).then(() => {
                alert('✅ Semua kode berhasil di-copy! Sekarang paste ke page.tsx di GitHub.');
            }).catch(() => {
                alert('❌ Gagal copy. Silakan select manual semua teks dan copy.');
            });
        }
    </script>
</body>
</html>
