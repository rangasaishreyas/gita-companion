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

function useTheme() {
  const { theme, fontScale } = useSettings();
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const t = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = t;
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#15120f' : t === 'sepia' ? '#f1e7d0' : '#faf6ee');
    };
    apply(); mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => { document.documentElement.style.setProperty('--scale', String(fontScale)); }, [fontScale]);
}

export default function App() {
  useTheme();
  return (
    <HashRouter>
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
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <TabBar />
      <ToastHost />
    </HashRouter>
  );
}
