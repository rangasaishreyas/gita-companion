import { useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { ToastHost } from './components/Toast';
import { Home } from './screens/Home';
import { ChapterList, ChapterScreen } from './screens/Read';
import { VerseScreen } from './screens/Verse';
import { JournalList, JournalEditor } from './screens/Journal';
import { Library } from './screens/Library';
import { ProgressScreen } from './screens/Progress';
import { SettingsScreen } from './screens/Settings';
import { useSettings } from './db/repo';
import { applyTheme, resolveTheme, themePreview } from './styles/themes';
import { ThemeSettings } from './screens/ThemeSettings';
import { CollabScreen } from './screens/Collab';
import { CollabProvider } from './collab/CollabProvider';
import { PresenceBar } from './collab/PresenceBar';
import { CursorLayer } from './collab/CursorLayer';

function useTheme() {
  const { theme, fontScale, customThemes, systemLight, systemDark } = useSettings();
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { if (!themePreview.active) applyTheme(resolveTheme(theme, customThemes, systemLight, systemDark, mq.matches).tokens); };
    apply(); mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme, customThemes, systemLight, systemDark]);
  useEffect(() => { document.documentElement.style.setProperty('--scale', String(fontScale)); }, [fontScale]);
}

export default function App() {
  useTheme();
  return (
    <HashRouter>
      <CollabProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/read" element={<ChapterList />} />
          <Route path="/read/:c" element={<ChapterScreen />} />
          <Route path="/read/:c/:v" element={<VerseScreen />} />
          <Route path="/journal" element={<JournalList />} />
          <Route path="/journal/:id" element={<JournalEditor />} />
          <Route path="/library" element={<Library />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/settings/theme" element={<ThemeSettings />} />
          <Route path="/collab" element={<CollabScreen />} />
          <Route path="/collab/:code" element={<CollabScreen />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <PresenceBar />
      <CursorLayer />
      <TabBar />
      <ToastHost />
      </CollabProvider>
    </HashRouter>
  );
}
