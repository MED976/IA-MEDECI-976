import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import LandingPage from './LandingPage';
import T from './translations';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function freshnessInfo(dateStr, labels) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 15) return { label: labels.justOut,    color: '#FF5000', bg: '#FFF0EB', bar: 100 };
  if (mins < 30) return { label: labels.veryFresh,  color: '#FF7A00', bg: '#FFF5EC', bar: 80  };
  if (mins < 60) return { label: labels.fresh,      color: '#1A8917', bg: '#E8F5E9', bar: 60  };
  if (mins < 90) return { label: labels.stillWarm,  color: '#5F9EA0', bg: '#E8F4F4', bar: 35  };
  return              { label: labels.fading,       color: '#ADADAD', bg: '#F5F5F5', bar: 15  };
}

const FRESHNESS_LIMIT_MS = 2 * 60 * 60 * 1000;

const PRODUCTS_BY_TYPE = {
  bakery:     ['Baguette','Croissant','Pain au chocolat','Brioche','Ficelle','Pain de campagne','Fougasse','Chausson aux pommes'],
  pizzeria:   ['Pizza Margherita','Pizza 4 formaggi','Pizza Pepperoni','Pizza Reine','Calzone','Focaccia','Pizza du jour'],
  pastry:     ['Éclair','Tarte','Mille-feuille','Paris-Brest','Macaron','Kouign-amann','Saint-Honoré'],
  restaurant: ['Plat du jour','Pain maison','Quiche','Lasagne','Gratin','Tourte'],
  cafe:       ['Muffin','Scone','Banana bread','Cookie','Brownie','Croissant'],
  other:      [],
};

const C = {
  bg: '#F6F6F6', card: '#FFFFFF', black: '#000000',
  primary: '#FF5000', text: '#000000', muted: '#757575',
  faint: '#BBBBBB', border: '#EEEEEE', light: '#FFF0EB',
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]                    = useState(() => localStorage.getItem('hn_lang') || 'fr');
  const [view, setView]                    = useState(() => localStorage.getItem('hn_seen') ? 'app' : 'landing');
  const [tab, setTab]                      = useState('explore');
  const [venues, setVenues]                = useState([]);
  const [items, setItems]                  = useState([]);
  const [myVenue, setMyVenue]              = useState(() => JSON.parse(localStorage.getItem('hn_mine') || 'null'));
  const [favorites, setFavorites]          = useState(() => JSON.parse(localStorage.getItem('hn_favs') || '[]'));
  const [userLoc, setUserLoc]              = useState(null);
  const [locError, setLocError]            = useState('');
  const [venueName, setVenueName]          = useState('');
  const [venueType, setVenueType]          = useState('bakery');
  const [product, setProduct]              = useState(PRODUCTS_BY_TYPE.bakery[0]);
  const [customProduct, setCustomProduct]  = useState('');
  const [quantity, setQuantity]            = useState('plenty');
  const [filterType, setFilterType]        = useState('all');
  const [loading, setLoading]              = useState(true);
  const [saving, setSaving]                = useState(false);
  const [justDone, setJustDone]            = useState(false);
  const [venueScreen, setVenueScreen]      = useState('dashboard');
  const [now, setNow]                      = useState(Date.now());

  const t = T[lang].app;

  useEffect(() => { localStorage.setItem('hn_lang', lang); }, [lang]);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);
  useEffect(() => { localStorage.setItem('hn_favs', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('hn_mine', JSON.stringify(myVenue)); }, [myVenue]);
  useEffect(() => { setProduct(PRODUCTS_BY_TYPE[venueType]?.[0] || ''); setCustomProduct(''); }, [venueType]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - FRESHNESS_LIMIT_MS).toISOString();
    const [{ data: v }, { data: i }] = await Promise.all([
      supabase.from('venues').select('*'),
      supabase.from('items').select('*').gte('at', cutoff).order('at', { ascending: false }),
    ]);
    if (v) setVenues(v);
    if (i) setItems(i);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const ch = supabase.channel('hn-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' },  p => setItems(prev => [p.new, ...prev]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' },  p => setItems(prev => prev.filter(i => i.id !== p.old.id)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'venues' }, p => setVenues(prev => [...prev, p.new]))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [loadData]);

  useEffect(() => { // eslint-disable-line
    const cutoff = Date.now() - FRESHNESS_LIMIT_MS;
    setItems(prev => prev.filter(i => new Date(i.at).getTime() > cutoff));
  }, [now]);

  const getLocation = useCallback((cb) => {
    if (!navigator.geolocation) { setLocError(t.locError); return; }
    navigator.geolocation.getCurrentPosition(
      p => { const l = { lat: p.coords.latitude, lng: p.coords.longitude }; setUserLoc(l); setLocError(''); if (cb) cb(l); },
      () => setLocError(t.locError)
    );
  }, [t.locError]);

  useEffect(() => { if (tab === 'explore' || tab === 'favorites') getLocation(); }, [tab, getLocation]);

  const registerVenue = async (loc) => {
    setSaving(true);
    const bt = t.businessTypes.find(b => b.id === venueType);
    const v = { id: Date.now().toString(), name: venueName.trim(), type: venueType, icon: bt.icon, lat: loc.lat, lng: loc.lng };
    const { error } = await supabase.from('venues').insert(v);
    if (!error) { setMyVenue(v); setVenueName(''); setVenueScreen('dashboard'); }
    setSaving(false);
  };

  const announce = async () => {
    const name = customProduct.trim() || product;
    if (!name) return;
    setSaving(true);
    await supabase.from('items').insert({ id: Date.now().toString(), venue_id: myVenue.id, product: name, quantity, at: new Date().toISOString() });
    setCustomProduct('');
    setJustDone(true);
    setTimeout(() => setJustDone(false), 4000);
    setSaving(false);
  };

  const removeItem   = (id) => supabase.from('items').delete().eq('id', id);
  const toggleFav    = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  // ── Enriched venues ───────────────────────────────────────────────────────
  const enriched = venues
    .map(v => ({
      ...v,
      distance: userLoc ? getDistance(userLoc.lat, userLoc.lng, v.lat, v.lng) : null,
      hotItems: items.filter(i => i.venue_id === v.id),
      bt: t.businessTypes.find(b => b.id === v.type),
    }))
    .filter(v => v.hotItems.length > 0)
    .filter(v => tab === 'favorites' ? favorites.includes(v.id) : true)
    .filter(v => filterType === 'all' || v.type === filterType)
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));

  const activeTypes = [...new Set(venues.filter(v => items.some(i => i.venue_id === v.id)).map(v => v.type))];

  const goToApp = useCallback((targetTab = 'explore') => {
    localStorage.setItem('hn_seen', '1');
    setTab(targetTab);
    setView('app');
  }, []);

  // ── Language toggle style ─────────────────────────────────────────────────
  const langBtnStyle = (active) => ({
    padding: '3px 9px', borderRadius: 7, fontFamily: 'inherit', cursor: 'pointer',
    fontSize: 11, fontWeight: 700, border: 'none',
    background: active ? 'white' : 'transparent',
    color: active ? C.black : 'rgba(255,255,255,0.5)',
  });

  // ── Layout ────────────────────────────────────────────────────────────────
  if (view === 'landing') {
    return <LandingPage onExplore={() => goToApp('explore')} onRegister={() => goToApp('venue')} lang={lang} setLang={setLang} />;
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* ══ EXPLORE / FAVORITES ══ */}
        {(tab === 'explore' || tab === 'favorites') && (
          <>
            <div style={{ background: C.black, padding: '52px 20px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {tab === 'favorites' ? t.savedSpots : t.nearYou}
                  </div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
                    {tab === 'favorites' ? t.myFavorites : t.appName}
                  </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Language toggle */}
                  <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '4px 3px', display: 'flex', gap: 2 }}>
                    <button onClick={() => setLang('fr')} style={langBtnStyle(lang === 'fr')}>FR</button>
                    <button onClick={() => setLang('en')} style={langBtnStyle(lang === 'en')}>EN</button>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1DB954', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                      {loading ? '…' : items.length} {t.live}
                    </span>
                  </div>
                </div>
              </div>

              {tab === 'explore' && (
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>{t.searchPlaceholder}</span>
                </div>
              )}
            </div>

            {/* Category chips */}
            {tab === 'explore' && activeTypes.length > 0 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 16px', scrollbarWidth: 'none' }}>
                {[{ id: 'all', icon: '⚡', label: lang === 'fr' ? 'Tout' : 'All' }, ...t.businessTypes.filter(b => activeTypes.includes(b.id))].map(bt => (
                  <button key={bt.id} onClick={() => setFilterType(bt.id)} style={{
                    padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 700,
                    fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    border: 'none',
                    background: filterType === bt.id ? C.black : C.card,
                    color: filterType === bt.id ? 'white' : C.text,
                    boxShadow: filterType === bt.id ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                    {bt.icon} {bt.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ padding: '0 16px' }}>
              {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 14 }}>{t.loading}</div>}
              {locError && (
                <div style={{ background: '#FDECEA', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <p style={{ color: '#C0392B', margin: '0 0 10px', fontSize: 14 }}>{locError}</p>
                  <button onClick={() => { setLocError(''); getLocation(); }} style={btnStyle(C.primary)}>{t.locErrorRetry}</button>
                </div>
              )}
              {!loading && enriched.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>{tab === 'favorites' ? '❤️' : '🍞'}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                    {tab === 'favorites' ? t.noFavorites : t.nothingFresh}
                  </div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
                    {tab === 'favorites' ? t.noFavoritesSub : t.nothingFreshSub}
                  </div>
                </div>
              )}

              {enriched.map(v => {
                const isFaved = favorites.includes(v.id);
                const topItem = v.hotItems[0];
                const f = freshnessInfo(topItem.at, t.freshnessLabels);
                const q = t.quantities.find(q => q.id === topItem.quantity);
                const mins = Math.floor((Date.now() - new Date(topItem.at)) / 60000);
                return (
                  <div key={v.id} style={{ background: C.card, borderRadius: 20, marginBottom: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ background: gradientByType(v.type), height: 140, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 64, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>{v.icon}</span>
                      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: 100, padding: '4px 12px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{f.label}</span>
                      </div>
                      <button onClick={() => toggleFav(v.id)} style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isFaved ? '❤️' : '🤍'}
                      </button>
                      {v.distance !== null && (
                        <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: 100, padding: '4px 10px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>
                            {v.distance < 1 ? `${Math.round(v.distance * 1000)}m` : `${v.distance.toFixed(1)}km`}
                          </span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)' }}>
                        <div style={{ height: '100%', width: `${f.bar}%`, background: 'white', borderRadius: '0 2px 0 0' }} />
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 2 }}>{v.name}</div>
                          <div style={{ fontSize: 13, color: C.muted }}>{v.bt?.label} · {t.timeAgo(mins)}</div>
                        </div>
                        {v.hotItems.length > 1 && (
                          <div style={{ background: C.black, color: 'white', borderRadius: 100, padding: '3px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 8, marginTop: 2 }}>
                            {t.itemsMore(v.hotItems.length - 1)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {v.hotItems.map(it => {
                          const iq = t.quantities.find(q => q.id === it.quantity);
                          return (
                            <div key={it.id} style={{ background: C.bg, borderRadius: 100, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{it.product}</span>
                              {iq && <span style={{ fontSize: 11 }}>{iq.emoji}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══ MY VENUE ══ */}
        {tab === 'venue' && (
          <>
            <div style={{ background: C.black, padding: '52px 20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {myVenue ? myVenue.icon + ' ' + myVenue.name : t.setupLabel}
                  </div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0 }}>
                    {myVenue ? t.dashboardTitle : t.registerTitle}
                  </h1>
                </div>
                {/* Language toggle in venue tab */}
                <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '4px 3px', display: 'flex', gap: 2, marginTop: 4 }}>
                  <button onClick={() => setLang('fr')} style={langBtnStyle(lang === 'fr')}>FR</button>
                  <button onClick={() => setLang('en')} style={langBtnStyle(lang === 'en')}>EN</button>
                </div>
              </div>
            </div>

            <div style={{ padding: 16 }}>
              {(!myVenue || venueScreen === 'register') && (
                <div style={{ background: C.card, borderRadius: 20, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 14, color: C.muted, margin: '0 0 18px' }}>{t.registerSub}</p>
                  <label style={labelStyle}>{t.venueTypeLabel}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                    {t.businessTypes.map(bt => (
                      <button key={bt.id} onClick={() => setVenueType(bt.id)} style={{
                        padding: '8px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                        fontFamily: 'inherit', cursor: 'pointer',
                        border: `2px solid ${venueType === bt.id ? C.primary : C.border}`,
                        background: venueType === bt.id ? C.light : 'white',
                        color: venueType === bt.id ? C.primary : C.muted,
                      }}>
                        {bt.icon} {bt.label}
                      </button>
                    ))}
                  </div>
                  <label style={labelStyle}>{t.venueNameLabel}</label>
                  <input value={venueName} onChange={e => setVenueName(e.target.value)}
                    placeholder={t.venueNamePlaceholder} style={inputStyle} />
                  {locError && <p style={{ color: '#C0392B', fontSize: 13, margin: '-6px 0 12px' }}>{locError}</p>}
                  <button disabled={saving} onClick={() => { if (!venueName.trim()) return; getLocation(loc => registerVenue(loc)); }}
                    style={btnStyle(C.primary)}>
                    {saving ? t.registering : t.registerBtn}
                  </button>
                </div>
              )}

              {myVenue && venueScreen === 'dashboard' && (() => {
                const myItems = items.filter(i => i.venue_id === myVenue.id);
                const productList = PRODUCTS_BY_TYPE[myVenue.type] || [];
                return (
                  <>
                    <div style={{ background: C.card, borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔥</div>
                        <div style={{ fontSize: 17, fontWeight: 800 }}>{t.announceTitle}</div>
                      </div>

                      <label style={labelStyle}>{t.productLabel}</label>
                      {productList.length > 0 && (
                        <select value={product} onChange={e => { setProduct(e.target.value); setCustomProduct(''); }} style={inputStyle}>
                          {productList.map(p => <option key={p}>{p}</option>)}
                        </select>
                      )}
                      <input value={customProduct} onChange={e => setCustomProduct(e.target.value)}
                        placeholder={productList.length > 0 ? t.customPlaceholder : t.customPlaceholderOnly}
                        style={inputStyle} />

                      <label style={labelStyle}>{t.quantityLabel}</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
                        {t.quantities.map(q => (
                          <button key={q.id} onClick={() => setQuantity(q.id)} style={{
                            padding: '12px 6px', borderRadius: 14, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'center',
                            border: `2px solid ${quantity === q.id ? q.color : C.border}`,
                            background: quantity === q.id ? q.bg : 'white',
                          }}>
                            <div style={{ fontSize: 22, marginBottom: 4 }}>{q.emoji}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: quantity === q.id ? q.color : C.muted }}>{q.label}</div>
                            <div style={{ fontSize: 10, color: C.faint }}>{q.sub}</div>
                          </button>
                        ))}
                      </div>

                      {justDone
                        ? <div style={{ background: '#E8F5E9', borderRadius: 12, padding: 14, textAlign: 'center', color: '#1A8917', fontWeight: 700, fontSize: 14 }}>{t.liveSuccess}</div>
                        : <button disabled={saving} onClick={announce} style={btnStyle(C.primary)}>{saving ? t.announcing : t.announceBtn}</button>
                      }
                    </div>

                    <div style={{ background: C.card, borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: myItems.length ? 16 : 0 }}>
                        <div style={{ fontSize: 17, fontWeight: 800 }}>{t.liveNow}</div>
                        <span style={{ background: C.black, color: 'white', borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{myItems.length}</span>
                      </div>
                      {myItems.length === 0
                        ? <p style={{ fontSize: 14, color: C.muted, margin: '8px 0 0' }}>{t.nothingLive}</p>
                        : myItems.map((it, idx) => {
                            const f = freshnessInfo(it.at, t.freshnessLabels);
                            const q = t.quantities.find(q => q.id === it.quantity);
                            return (
                              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: idx > 0 ? 12 : 0, marginTop: idx > 0 ? 12 : 0, borderTop: idx > 0 ? `1px solid ${C.border}` : 'none' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700 }}>{it.product}</span>
                                    {q && <span style={{ fontSize: 13 }}>{q.emoji}</span>}
                                  </div>
                                  <div style={{ fontSize: 12, color: C.muted }}>
                                    <span style={{ color: f.color, fontWeight: 600 }}>{f.label}</span> · {t.timeAgo(Math.floor((Date.now() - new Date(it.at)) / 60000))}
                                  </div>
                                  <div style={{ height: 3, background: C.border, borderRadius: 10, overflow: 'hidden', marginTop: 6 }}>
                                    <div style={{ height: '100%', width: `${f.bar}%`, background: f.color, borderRadius: 10 }} />
                                  </div>
                                </div>
                                <button onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', color: C.faint, fontSize: 22, cursor: 'pointer', padding: '0 0 0 12px' }}>×</button>
                              </div>
                            );
                          })
                      }
                    </div>

                    <button onClick={() => { setMyVenue(null); localStorage.removeItem('hn_mine'); setVenueScreen('register'); }}
                      style={btnStyle('transparent', true)}>{t.switchVenue}</button>
                  </>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.black, display: 'flex', borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 100 }}>
        {[
          { id: 'explore',   icon: '🔥', label: t.navDiscover  },
          { id: 'favorites', icon: '❤️', label: t.navFavorites },
          { id: 'venue',     icon: '🏪', label: t.navVenue     },
        ].map(nav => (
          <button key={nav.id} onClick={() => setTab(nav.id)} style={{
            flex: 1, padding: '12px 8px 16px', background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 22 }}>{nav.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: tab === nav.id ? 'white' : 'rgba(255,255,255,0.35)', fontFamily: 'inherit' }}>
              {nav.label}
            </span>
            {tab === nav.id && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.primary, marginTop: -2 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function gradientByType(type) {
  const g = {
    bakery:     'linear-gradient(135deg,#FF8C42,#FF5000)',
    pizzeria:   'linear-gradient(135deg,#FF6B6B,#C0392B)',
    pastry:     'linear-gradient(135deg,#F8BBD0,#E91E63)',
    restaurant: 'linear-gradient(135deg,#81C784,#2E7D32)',
    cafe:       'linear-gradient(135deg,#BCAAA4,#4E342E)',
    other:      'linear-gradient(135deg,#B0BEC5,#546E7A)',
  };
  return g[type] || g.other;
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#757575',
  textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8,
};

const inputStyle = {
  width: '100%', padding: '13px 14px', borderRadius: 12,
  border: '2px solid #EEEEEE', fontSize: 15, fontFamily: 'inherit',
  fontWeight: 500, color: '#000', background: 'white',
  boxSizing: 'border-box', marginBottom: 14, appearance: 'none',
};

function btnStyle(bg, ghost = false) {
  return {
    display: 'block', width: '100%', padding: '15px 20px', borderRadius: 14,
    border: ghost ? '2px solid #EEEEEE' : 'none',
    background: ghost ? 'transparent' : 'linear-gradient(135deg,#FF5000,#FF8C42)',
    color: ghost ? '#757575' : 'white',
    fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
    marginBottom: 8,
  };
}
