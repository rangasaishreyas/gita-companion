import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

export function TopBar({ title, back, actions }: { title?: ReactNode; back?: string | true; actions?: ReactNode }) {
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={'topbar' + (scrolled ? ' scrolled' : '')}>
      {back && (
        <button className="iconbtn" aria-label="Back" onClick={() => (back === true ? nav(-1) : nav(back))}>
          <Icon name="back" />
        </button>
      )}
      <div className="title" style={back ? undefined : { paddingLeft: 10 }}>{title}</div>
      {actions}
    </header>
  );
}
