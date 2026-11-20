import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

const tabs = [
  { to: '/', icon: 'home', label: 'Today', end: true },
  { to: '/read', icon: 'book', label: 'Read' },
  { to: '/journal', icon: 'journal', label: 'Journal' },
  { to: '/library', icon: 'library', label: 'Library' },
  { to: '/progress', icon: 'chart', label: 'Progress' },
];

export function TabBar() {
  return (
    <div className="tabbar">
      <nav>
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={t.icon} />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
