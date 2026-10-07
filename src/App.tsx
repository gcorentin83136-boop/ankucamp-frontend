import { Routes, Route, Navigate } from 'react-router-dom'
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
import DangerZone from './pages/Settings/DangerZone'

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

import ProtectedRoute from './components/ProtectedRoute'

import Profile from './pages/Profile'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import Follows from './pages/Follows'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Wishlist from './pages/Wishlist'
import Events from './pages/Events'
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

function App() {
  return (
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

      <Route
        path="/kyc"
        element={
          <ProtectedRoute requiresPro>
            <Kyc />
          </ProtectedRoute>
        }
      />
      <Route
        path="/become-pro"
        element={
          <ProtectedRoute>
            <BecomePro />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SettingsHub />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="security" element={<SecuritySettings />} />
        <Route path="sessions" element={<SessionsSettings />} />
        <Route path="privacy" element={<PrivacySettings />} />
        <Route path="notifications" element={<NotificationsSettings />} />
        <Route path="danger" element={<DangerZone />} />
      </Route>

      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/follows" element={<ProtectedRoute><Follows /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

      <Route path="/events" element={<Events />} />

      <Route path="/shops" element={<ShopsList />} />
      <Route path="/shops/:id" element={<ShopDetail />} />
      <Route path="/products/:id" element={<ProductDetail />} />

      <Route
        path="/dashboard/shop"
        element={
          <ProtectedRoute requiresPro>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
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

      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
