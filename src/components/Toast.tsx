import { useEffect, useState } from 'react';

let push: (msg: string) => void = () => {};
export const toast = (msg: string) => push(msg);

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: number;
    push = (m) => { setMsg(m); clearTimeout(t); t = window.setTimeout(() => setMsg(null), 2000); };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}
