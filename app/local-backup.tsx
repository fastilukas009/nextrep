'use client';
import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportLocalData, parseBackup, restoreLocalData } from './local-data';
import type { AppData } from './model';

export function LocalBackup({ restored }: { restored: (data: AppData) => void }) {
  const [pending, setPending] = useState<{ text: string; name: string; count: number } | null>(null);
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  function download() {
    setError('');
    try {
      const url = URL.createObjectURL(new Blob([exportLocalData()], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `fastrep-varmuuskopio-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMessage('Varmuuskopion lataus käynnistetty. Säilytä tiedosto omassa tallessa.');
    } catch (e) { setError((e as Error).message); }
  }
  return <section className="backup-panel"><h3>Omat tiedot talteen</h3><p className="muted">Kirjaukset tallentuvat vain tähän selaimeen. Selaintietojen tyhjentäminen poistaa ne. Lataa varmuuskopio säännöllisesti tai siirtääksesi kirjaukset toiselle laitteelle. Videot eivät sisälly varmuuskopioon.</p>
    <div className="button-row"><button type="button" className="secondary" onClick={download}><Download size={17}/>Lataa varmuuskopio</button><label className="secondary file-button"><Upload size={17}/>Valitse varmuuskopio<input type="file" accept="application/json,.json" disabled={busy} onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; setError(''); setMessage(''); setPending(null);
      if (!file) return;
      try { if (file.size > 8 * 1024 * 1024) throw Error('Valitse alle 8 Mt varmuuskopio.'); const text = await file.text(), data = parseBackup(text); setPending({ text, name: data.profile.name, count: data.entries.length }); }
      catch (e) { setError((e as Error).message); }
    }}/></label></div>
    {pending && <div className="backup-confirm"><p><strong>{pending.name}</strong> · {pending.count} kirjausta. Palautus korvaa tämän selaimen nykyisen profiilin, päiväkirjan ja palkinnot. Lataa nykyisistä tiedoista varmuuskopio ensin.</p><div className="button-row"><button type="button" className="primary" disabled={busy} onClick={async () => {
      setBusy(true); setError('');
      try { const data = await restoreLocalData(pending.text); restored(data); setPending(null); setMessage('Varmuuskopio palautettu.'); }
      catch (e) { setError((e as Error).message); } finally { setBusy(false); }
    }}>Korvaa tiedot ja palauta</button><button type="button" className="secondary" disabled={busy} onClick={() => setPending(null)}>Peru</button></div></div>}
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
  </section>;
}
