import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from './layouts/AppShell';
import { HomePage } from './pages/HomePage';
import { RecipeListPage } from './pages/RecipeListPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipeEditPage } from './pages/RecipeEditPage';
import { OrderPage } from './pages/OrderPage';
import { HistoryPage } from './pages/HistoryPage';
import { MenuPreviewPage } from './pages/MenuPreviewPage';
import { MenuDetailPage } from './pages/MenuDetailPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoadingPage } from './pages/LoadingPage';

const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.24, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageMotion}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/recipes" element={<RecipeListPage />} />
          <Route path="/recipes/new" element={<RecipeEditPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/recipes/:id/edit" element={<RecipeEditPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/menus/preview" element={<MenuPreviewPage />} />
          <Route path="/menus/:id" element={<MenuDetailPage />} />
          <Route path="/menus/:id/ingredients" element={<IngredientsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ai/loading" element={<LoadingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppShell>
      <AnimatedRoutes />
    </AppShell>
  );
}
