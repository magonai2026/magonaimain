import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';

// Import Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Import Pages
import Home from './pages/landing/Home/Home';
import About from './pages/landing/About';
import Research from './pages/landing/Research';
import Contact from './pages/landing/Contact';
import Login from './pages/auth/Login';
import VerifyOTP from './pages/auth/VerifyOTP';
import SignupOTP from './pages/auth/SignupOTP';
import Dashboard from './pages/dashboard/Dashboard';
import CliConfirmPage from './pages/dashboard/CliConfirmPage';
import WorkspaceJoinPage from './pages/dashboard/WorkspaceJoinPage';

// --- Legal Pages ---
import Terms from './pages/landing/Terms';
import Privacy from './pages/landing/Privacy';
import Refund from './pages/landing/Refund';
import Delivery from './pages/landing/Delivery';
import Pricing from './pages/landing/Pricing';
import Guide from './pages/landing/Guide';
import PatchScanPage from './pages/dashboard/Scan/PatchScanPage';

// --- NEW IMPORTS: Footer-linked Pages ---
import IncidentResponse from './pages/landing/Home/IncidentResponse';
import ResponsibleDisclosure from './pages/landing/Home/ResponsibleDisclosure';
import Careers from './pages/landing/Home/Careers';
import SOC from './pages/landing/Home/Soc';
import CISO from './pages/landing/Home/Ciso';

// Layout wrapper for pages that need Navbar and Footer
const MainLayout = () => (
  <>
    <Navbar />
    <Outlet />
    <Footer />
  </>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>

        {/* Pages WITH Navbar and Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/research" element={<Research />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/contact" element={<Contact />} />

          {/* --- Legal Pages --- */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* --- NEW ROUTES: Footer-linked Pages --- */}
          <Route path="/incident-response" element={<IncidentResponse />} />
          <Route path="/responsible-disclosure" element={<ResponsibleDisclosure />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/soc" element={<SOC />} />
          <Route path="/ciso" element={<CISO />} />
        </Route>

        {/* Auth pages — no Navbar/Footer */}
        <Route path="/login"      element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/signup"     element={<SignupOTP />} />

        {/* CLI confirm — standalone page, no Navbar/Footer.
            Opened automatically by `niyantri login` when user is already
            logged in. CliConfirmPage reads ?cli_token from the URL and shows
            an Allow / Cancel screen before issuing any API key. */}
        <Route path="/cli-confirm" element={<CliConfirmPage />} />

        {/* Patch scan — MUST be defined BEFORE Dashboard routes so React Router
            matches it first. Opening /patch-scan in a new tab previously fell
            through to the Dashboard catch-all, which redirected to /dashboard. */}
        <Route path="/patch-scan" element={<PatchScanPage />} />

        {/* Dashboard — no Navbar/Footer */}
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/overview"     element={<Dashboard />} />
        <Route path="/new-session"  element={<Dashboard />} />
        <Route path="/scan/:scanId" element={<Dashboard />} />
        <Route path="/profile"      element={<Dashboard />} />
        <Route path="/credits"      element={<Dashboard />} />
        <Route path="/settings"     element={<Dashboard />} />
        <Route path="/history"      element={<Dashboard />} />
        <Route path="/integrations" element={<Dashboard />} />
        <Route path="/cli-keys"     element={<Dashboard />} />  {/* ← CLI Keys page inside dashboard */}
        <Route path="/dast"         element={<Dashboard />} />
        <Route path="/dast/result/:scanId" element={<Dashboard />} />
        <Route path="/team"         element={<Dashboard />} />
        <Route path="/audit-logs"   element={<Dashboard />} />
        <Route path="/graph"        element={<Dashboard />} />
        <Route path="/dependencies" element={<Dashboard />} />
        <Route path="/multi-repo"   element={<Dashboard />} />
        <Route path="/graph/:groupScanId" element={<Dashboard />} />
        <Route path="/session/:sessionId" element={<Dashboard />} />

        {/* Workspace invitation acceptance — standalone page */}
        <Route path="/join" element={<WorkspaceJoinPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
};

export default App;