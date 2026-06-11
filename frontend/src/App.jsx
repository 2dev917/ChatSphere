import { useAuth } from "./context/AuthContext";
import AuthPage from "./components/AuthPage";
import MainApp from "./components/MainApp";

export default function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainApp /> : <AuthPage />;
}
