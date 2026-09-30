import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import SignupPage from './pages/Auth/SignupPage.jsx';
import WorkspacePage from './pages/Workspace/WorkspacePage.jsx';

// ─── Router Definition ──────────────────────────────────────
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <WorkspacePage />,
      },
    ],
  },
  {
    // Catch-all → redirect to home
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

// ─── App Component ───────────────────────────────────────────
function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <RouterProvider router={router} />;
}

export default App;
