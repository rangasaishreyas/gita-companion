const P: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  book: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H11v17H5.5A1.5 1.5 0 0 0 4 21.5zM20 4.5A1.5 1.5 0 0 0 18.5 3H13v17h5.5a1.5 1.5 0 0 1 1.5 1.5z',
  journal: 'M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6zM6 3v18M9.5 8h6M9.5 12h6',
  library: 'M5 4h3v16H5zM10 4h3v16h-3zM15.2 4.6l2.9-.8 4 15.4-2.9.8z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  bookmark: 'M6 3h12v18l-6-4.5L6 21z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4z',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  text: 'M4 7V5h11v2M9.5 5v14M7 19h5M14 12v-1.5h7V12M17.5 10.5V19M16 19h3',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  note: 'M5 4h14v11l-5 5H5zM14 20v-5h5',
  refresh: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  close: 'M6 6l12 12M18 6 6 18',
  highlight: 'M14.5 4.5l5 5L10 19H5v-5zM3 21h18',
  story: 'M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5zM12 6v14',
  down: 'M6 9l6 6 6-6',
  up: 'M6 15l6-6 6 6',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  more: 'M4.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0zM10.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0zM16.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0z',
  flame: 'M12 3s5 4.5 5 9.5a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 1-5.5 1-8z',
};

export function Icon({ name, fill }: { name: keyof typeof P | string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={P[name]} />
    </svg>
  );
}
