export interface ThemeTokens {
  dark: boolean;
  bg: string; surface: string; surface2: string; line: string;
  text: string; muted: string; accent: string; accentText: string;
  ok: string; revisit: string; danger: string;
  hlSaffron: string; hlGreen: string; hlBlue: string; hlRose: string;
}
export interface ThemeDef { id: string; name: string; tokens: ThemeTokens }

const lightStatus = { ok: '#3f7d4e', revisit: '#8f6206', danger: '#b3261e' };
const lightHl = { hlSaffron: '#ffd9a8', hlGreen: '#cdeccf', hlBlue: '#cfe2fb', hlRose: '#f8d0dc' };
const darkStatus = { ok: '#7cc28d', revisit: '#e8b84a', danger: '#ff8a80' };

export const presets: ThemeDef[] = [
  { id: 'saffron', name: 'Saffron Dawn', tokens: { dark: false, bg: '#faf6ee', surface: '#ffffff', surface2: '#f3ece0', line: '#e6dccb', text: '#2b2420', muted: '#75685c', accent: '#b4561c', accentText: '#ffffff', ...lightStatus, ...lightHl } },
  { id: 'sepia', name: 'Sepia Manuscript', tokens: { dark: false, bg: '#f1e7d0', surface: '#f8f0dc', surface2: '#e9dcbf', line: '#d9c8a6', text: '#3b2f22', muted: '#6b5843', accent: '#9a4a12', accentText: '#ffffff', ...lightStatus, hlSaffron: '#f7cf8f', hlGreen: '#cfe3b5', hlBlue: '#c9dbe8', hlRose: '#f1c4c4' } },
  { id: 'lotus', name: 'Lotus', tokens: { dark: false, bg: '#fbf4f6', surface: '#ffffff', surface2: '#f4e6eb', line: '#ecd6de', text: '#2d1f26', muted: '#7b6070', accent: '#a3365f', accentText: '#ffffff', ...lightStatus, hlSaffron: '#ffe1b3', hlGreen: '#d3efd0', hlBlue: '#d6e4fb', hlRose: '#f8cfe0' } },
  { id: 'forest', name: 'Forest Ashram', tokens: { dark: false, bg: '#f3f6ef', surface: '#fcfdfa', surface2: '#e5ecdd', line: '#d4dfc9', text: '#1f2a1e', muted: '#5f6e5b', accent: '#2f6b3d', accentText: '#ffffff', ok: '#2f7d5e', revisit: '#8f6206', danger: '#b3261e', hlSaffron: '#fbe0a6', hlGreen: '#cfe8c4', hlBlue: '#d2e3ee', hlRose: '#f3d3d3' } },
  { id: 'ganga', name: 'Ganga', tokens: { dark: false, bg: '#f1f6f8', surface: '#ffffff', surface2: '#e1ecf1', line: '#cfdfe7', text: '#14252e', muted: '#557080', accent: '#1f6f8b', accentText: '#ffffff', ok: '#2f7d5e', revisit: '#8f6206', danger: '#b3261e', ...lightHl } },
  { id: 'sandalwood', name: 'Sandalwood', tokens: { dark: false, bg: '#f6efe6', surface: '#fffaf3', surface2: '#ece0cf', line: '#ddcdb6', text: '#33261a', muted: '#7c6650', accent: '#8a5a2b', accentText: '#ffffff', ...lightStatus, hlSaffron: '#f9d79c', hlGreen: '#d6e7c2', hlBlue: '#d3dfee', hlRose: '#f2cdc6' } },
  { id: 'night', name: 'Night Lamp', tokens: { dark: true, bg: '#15120f', surface: '#201b17', surface2: '#2a241e', line: '#3a322a', text: '#ece4d8', muted: '#a8998a', accent: '#f0975a', accentText: '#1b1208', ...darkStatus, hlSaffron: '#6b4718', hlGreen: '#2c5434', hlBlue: '#23415f', hlRose: '#5e2a3a' } },
  { id: 'indigo', name: 'Midnight Indigo', tokens: { dark: true, bg: '#10132a', surface: '#191d3a', surface2: '#232848', line: '#2f355a', text: '#e8e9f5', muted: '#9ea3c4', accent: '#e6b84f', accentText: '#1a1405', ok: '#7cc28d', revisit: '#f0a35a', danger: '#ff8a80', hlSaffron: '#5c4a1a', hlGreen: '#234d38', hlBlue: '#2a3b6e', hlRose: '#5a2846' } },
  { id: 'peacock', name: 'Peacock', tokens: { dark: true, bg: '#0c1a1c', surface: '#132629', surface2: '#1b3236', line: '#264247', text: '#e3f1ee', muted: '#93b2ad', accent: '#3fc39a', accentText: '#062018', ...darkStatus, hlSaffron: '#5e4a1c', hlGreen: '#1f5a45', hlBlue: '#1f4664', hlRose: '#5a2a40' } },
  { id: 'ember', name: 'Temple Ember', tokens: { dark: true, bg: '#141110', surface: '#1d1917', surface2: '#27211e', line: '#372e29', text: '#f1e6dc', muted: '#ab9a8c', accent: '#ffb347', accentText: '#1d1204', ...darkStatus, hlSaffron: '#6b4a14', hlGreen: '#2d5233', hlBlue: '#28405c', hlRose: '#5c2b33' } },
  { id: 'contrast', name: 'High Contrast', tokens: { dark: true, bg: '#000000', surface: '#0d0d0d', surface2: '#1a1a1a', line: '#5a5a5a', text: '#ffffff', muted: '#d0d0d0', accent: '#ffd400', accentText: '#000000', ok: '#5dff8a', revisit: '#ffb000', danger: '#ff6b6b', hlSaffron: '#7a5a00', hlGreen: '#145c2a', hlBlue: '#1e3f7a', hlRose: '#6e1f45' } },
];

export const tokenGroups: Array<{ label: string; keys: Array<{ k: keyof Omit<ThemeTokens, 'dark'>; label: string }> }> = [
  { label: 'Background', keys: [{ k: 'bg', label: 'Page' }, { k: 'surface', label: 'Cards' }, { k: 'surface2', label: 'Subtle fill' }, { k: 'line', label: 'Borders' }] },
  { label: 'Text', keys: [{ k: 'text', label: 'Main text' }, { k: 'muted', label: 'Secondary text' }] },
  { label: 'Accent', keys: [{ k: 'accent', label: 'Accent' }, { k: 'accentText', label: 'Text on accent' }] },
  { label: 'Status', keys: [{ k: 'ok', label: 'Read' }, { k: 'revisit', label: 'Revisit' }, { k: 'danger', label: 'Delete' }] },
  { label: 'Highlights', keys: [{ k: 'hlSaffron', label: 'Saffron' }, { k: 'hlGreen', label: 'Green' }, { k: 'hlBlue', label: 'Blue' }, { k: 'hlRose', label: 'Rose' }] },
];

const vars: Record<keyof Omit<ThemeTokens, 'dark'>, string> = {
  bg: '--bg', surface: '--surface', surface2: '--surface-2', line: '--line', text: '--text', muted: '--muted',
  accent: '--accent', accentText: '--accent-text', ok: '--ok', revisit: '--revisit', danger: '--danger',
  hlSaffron: '--hl-saffron', hlGreen: '--hl-green', hlBlue: '--hl-blue', hlRose: '--hl-rose',
};

/** While the theme editor previews unsaved colours, the saved theme isn't re-applied over it. */
export const themePreview = { active: false };

export function applyTheme(t: ThemeTokens) {
  const s = document.documentElement.style;
  for (const [k, v] of Object.entries(vars)) s.setProperty(v, t[k as keyof typeof vars]);
  s.setProperty('--on-status', t.dark ? t.bg : '#ffffff');
  s.setProperty('--accent-soft', `color-mix(in srgb, ${t.accent} ${t.dark ? 22 : 16}%, ${t.bg})`);
  s.setProperty('--shadow', t.dark ? '0 1px 2px rgba(0,0,0,.4)' : '0 1px 2px rgba(60,40,20,.06), 0 4px 16px rgba(60,40,20,.06)');
  s.colorScheme = t.dark ? 'dark' : 'light';
  document.documentElement.dataset.theme = t.dark ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.bg);
}

const legacy: Record<string, string> = { light: 'saffron', dark: 'night' };
export function resolveTheme(id: string, custom: ThemeDef[], systemLight: string, systemDark: string, prefersDark: boolean): ThemeDef {
  const find = (x: string) => custom.find((c) => c.id === x) ?? presets.find((p) => p.id === (legacy[x] ?? x));
  if (id === 'system') return find(prefersDark ? systemDark : systemLight) ?? presets[prefersDark ? 6 : 0];
  return find(id) ?? presets[0];
}

// ---- WCAG contrast ----
function lum(hex: string) {
  const n = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
export const bestOn = (bg: string) => (contrast('#000000', bg) >= contrast('#ffffff', bg) ? '#111111' : '#ffffff');
