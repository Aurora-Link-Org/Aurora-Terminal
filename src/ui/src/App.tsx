import { AppProvider } from "./context/AppContext";
import { I18nProvider } from "./context/I18nContext";
import { MainLayout } from "./components/layout/MainLayout";

export default function App() {
  return (
    <AppProvider>
      <I18nProvider>
        <MainLayout />
      </I18nProvider>
    </AppProvider>
  );
}
