import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/AuthContext'
import { io } from 'socket.io-client'
import { toast } from 'react-hot-toast'
import MessageToast from './components/chat/MessageToast'
import FloatingChatBubble from './components/chat/FloatingChatBubble'
import { CallProvider } from './context/CallContext'
import CallUI from './components/chat/CallUI'
import './index.css'

import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'
import ActivateAccount from './pages/Auth/ActivateAccount'
import OAuthCallback from './pages/Auth/OAuthCallback'
import Kyc from './pages/Auth/Kyc'
import BecomePro from './pages/Auth/BecomePro'

import CGU from './pages/Legal/CGU'
import Cookies from './pages/Legal/Cookies'
import Contact from './pages/Legal/Contact'

import SettingsLayout from './components/settings/SettingsLayout'
import SettingsHub from './pages/Settings/SettingsHub'
import AccountSettings from './pages/Settings/AccountSettings'
import SecuritySettings from './pages/Settings/SecuritySettings'
import SessionsSettings from './pages/Settings/SessionsSettings'
import PrivacySettings from './pages/Settings/PrivacySettings'
import NotificationsSettings from './pages/Settings/NotificationsSettings'
import BlockedUsers from './pages/Settings/BlockedUsers'
import DangerZone from './pages/Settings/DangerZone'
import PaymentSettings from './pages/Settings/PaymentSettings'

import AdminGuard from './components/admin/AdminGuard'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminKyc from './pages/Admin/Kyc'
import AdminModeration from './pages/Admin/Moderation'
import AdminRefunds from './pages/Admin/Refunds'
import AdminUsers from './pages/Admin/Users'
import AdminCategories from './pages/Admin/Categories'
import AdminPromo from './pages/Admin/Promo'
import AdminAudit from './pages/Admin/Audit'
import AdminBackup from './pages/Admin/Backup'
import BuyerLayout from './components/buyer/BuyerLayout'
import BuyerDashboard from './pages/Buyer/Dashboard'
import BuyerOrders from './pages/Buyer/Orders'
import BuyerWishlist from './pages/Buyer/Wishlist'
import BuyerReviews from './pages/Buyer/Reviews'
import BuyerEvents from './pages/Buyer/Events'
import BuyerArticles from './pages/Buyer/Articles'
import BuyerRefunds from './pages/Buyer/Refunds'
import BuyerFollows from './pages/Buyer/Follows'

import ProtectedRoute from './components/ProtectedRoute'

import Friends from './pages/Friends'
import UserProfile from './pages/UserProfile'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Search from './pages/Search'
import PaymentSuccess from './pages/Payment/Success'
import PaymentCancel from './pages/Payment/Cancel'
import Follows from './pages/Follows'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Wishlist from './pages/Wishlist'
import Events from './pages/Events'
import ArticlesFeed from './pages/ArticlesFeed'
import ShopsList from './pages/Shops/List'
import ShopDetail from './pages/Shops/Detail'
import ProductDetail from './pages/Products/Detail'

import SellerLayout from './components/seller/SellerLayout'
import SellerDashboard from './pages/Seller/Dashboard'
import SellerSettings from './pages/Seller/Settings'
import SellerProducts from './pages/Seller/Products'
import SellerOrders from './pages/Seller/Orders'
import SellerPromo from './pages/Seller/Promo'
import SellerEvents from './pages/Seller/Events'
import SellerArticles from './pages/Seller/Articles'
import SellerReviews from './pages/Seller/Reviews'
import SellerInvoices from './pages/Seller/Invoices'

function MyProfileRedirect() {
  const user = useAuthStore((s: any) => s.user)
  const isAuthenticated = useAuthStore((s: any) => s.isAuthenticated)
  if (!isAuthenticated || !user?.username) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={`/u/${user.username}`} replace />
}

function App() {
  const { user } = useAuthStore()

  // 🍃 WebSocket Global pour la bulle de notification
  useEffect(() => {
    const token = localStorage.getItem('anku_token')
    if (!token || !user) return

    console.log("🔌 TENTATIVE DE CONNEXION WEBSOCKET...")
    const socket = io('http://localhost:3001', {
      withCredentials: true,
      auth: { token },
    })

    socket.on('connect', () => {
      console.log("✅ SOCKET CONNECTÉ ! ID:", socket.id)
    })

    socket.on('connect_error', (err) => {
      console.log("❌ ERREUR SOCKET :", err.message)
    })

    socket.on('message:notification', (msg: any) => {
      console.log("🟢 ÉVÉNEMENT message:notification REÇU !", msg)
      
      if (window.location.pathname === '/messages' && window.location.search.includes(`c=${msg.conversation_id}`)) {
        return
      }

      // 🆕 Dispatche l'événement pour la bulle flottante
      window.dispatchEvent(new CustomEvent('anku:new-message', { detail: msg }))

      // Fallback : Si la bulle est désactivée, on utilise le toast classique
      const bubbleEnabled = localStorage.getItem('anku_chat_bubble_enabled') !== 'false'
      if (!bubbleEnabled) {
        toast.custom((t) => (
          <MessageToast
            senderName={`${msg.author?.first_name} ${msg.author?.last_name}`}
            senderAvatar={msg.author?.avatar_url}
            content={msg.content}
            onClick={() => {
              toast.dismiss(t.id)
              window.location.href = `/messages?c=${msg.conversation_id}`
            }}
          />
        ), { duration: 4000, position: 'top-right' })
      }

      window.dispatchEvent(new Event('refresh-notifications'))
      window.dispatchEvent(new Event('refresh-conversations'))
    })

    return () => {
      console.log("🔌 DÉCONNEXION WEBSOCKET")
      socket.disconnect()
    }
  }, [user?.id])

  return (
    <CallProvider>
    <FloatingChatBubble />
    <CallUI />
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/activate" element={<ActivateAccount />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      <Route path="/legal/cgu" element={<CGU />} />
      <Route path="/legal/cookies" element={<Cookies />} />
      <Route path="/contact" element={<Contact />} />

      <Route path="/kyc" element={<ProtectedRoute requiresPro><Kyc /></ProtectedRoute>} />
      <Route path="/become-pro" element={<ProtectedRoute><BecomePro /></ProtectedRoute>} />

      <Route path="/settings" element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>}>
        <Route index element={<SettingsHub />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="security" element={<SecuritySettings />} />
        <Route path="sessions" element={<SessionsSettings />} />
        <Route path="privacy" element={<PrivacySettings />} />
        <Route path="notifications" element={<NotificationsSettings />} />
        <Route path="blocked" element={<BlockedUsers />} />
        <Route path="payment" element={<PaymentSettings />} />
        <Route path="danger" element={<DangerZone />} />
      </Route>

      <Route path="/profile" element={<ProtectedRoute><MyProfileRedirect /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
      <Route path="/u/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/follows" element={<ProtectedRoute><Follows /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

      <Route path="/articles" element={<ArticlesFeed />} />`n      <Route path="/events" element={<Events />} />
      <Route path="/shops" element={<ShopsList />} />
      <Route path="/shops/:id" element={<ShopDetail />} />
      <Route path="/products/:id" element={<ProductDetail />} />

      <Route path="/dashboard/shop" element={<ProtectedRoute requiresPro><SellerLayout /></ProtectedRoute>}>
        <Route index element={<SellerDashboard />} />
        <Route path="settings" element={<SellerSettings />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="promo" element={<SellerPromo />} />
        <Route path="events" element={<SellerEvents />} />
        <Route path="articles" element={<SellerArticles />} />
        <Route path="reviews" element={<SellerReviews />} />
        <Route path="invoices" element={<SellerInvoices />} />
      </Route>

      <Route path="/dashboard/user" element={<ProtectedRoute><BuyerLayout /></ProtectedRoute>}>
        <Route index element={<BuyerDashboard />} />
        <Route path="orders" element={<BuyerOrders />} />
        <Route path="wishlist" element={<BuyerWishlist />} />
        <Route path="reviews" element={<BuyerReviews />} />
        <Route path="events" element={<BuyerEvents />} />
        <Route path="articles" element={<BuyerArticles />} />
        <Route path="refunds" element={<BuyerRefunds />} />
        <Route path="follows" element={<BuyerFollows />} />
      </Route>

      <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="kyc" element={<AdminKyc />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="refunds" element={<AdminRefunds />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="promo" element={<AdminPromo />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="backup" element={<AdminBackup />} />
      </Route>

      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />
      <Route path="/dashboard/stripe/return" element={<Navigate to="/settings/payment?stripe=return" replace />} />
      <Route path="/dashboard/stripe/refresh" element={<Navigate to="/settings/payment?stripe=refresh" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </CallProvider>
  )
}

export default App