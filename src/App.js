import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h${mins % 60 > 0 ? (mins % 60) + 'm' : ''} ago`;
}

function freshnessInfo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 15)  return { label: 'Just out!',   color: '#FF5000', bg: '#FFF0EB', bar: 100 };
  if (mins < 30)  return { label: 'Very fresh',  color: '#FF7A00', bg: '#FFF5EC', bar: 80  };
  if (mins < 60)  return { label: 'Fresh',       color: '#34A853', bg: '#E8F5E9', bar: 60  };
  if (mins < 90)  return { label: 'Still warm',  color: '#5F9EA0', bg: '#E8F4F4', bar: 35  };
  return               { label: 'Getting old',  color: '#ADADAD', bg: '#F5F5F5', bar: 15  };
}

const FRESHNESS_LIMIT_MS = 2 * 60 * 60 * 1000;

// ── Data ──────────────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: 'bakery',     icon: '🥖', label: 'Bakery'      },
  { id: 'pizzeria',   icon: '🍕', label: 'Pizzeria'    },
  { id: 'pastry',     icon: '🥐', label: 'Pastry'      },
  { id: 'restaurant', icon: '🍽️', label: 'Restaurant'  },
  { id: 'cafe',       icon: '☕', label: 'Café'         },
  { id: 'other',      icon: '🏪', label: 'Other'       },
];

const PRODUCTS_BY_TYPE = {
  bakery:     ['Baguette','Croissant','Pain au chocolat','Brioche','Ficelle','Pain de campagne','Fougasse','Chausson aux pommes','Pain aux noix'],
  pizzeria:   ['Pizza Margherita','Pizza 4 formaggi','Pizza Pepperoni','Pizza Reine','Pizza Végétarienne','Calzone','Focaccia','Pizza du jour'],
  pastry:     ['Éclair','Tarte','Mille-feuille','Paris-Brest','Opéra','Macaron','Kouign-amann','Saint-Honoré'],
  restaurant: ['Plat du jour','Pain maison','Tarte salée','Quiche','Lasagne','Gratin','Tourte'],
  cafe:       ['Muffin','Scone','Banana bread','Cookie','Brownie','Croissant'],
  other:      [],
};

const QUANTITIES = [
  { id: 'plenty', emoji: '🔥', label: 'Plenty',    sub: 'Large batch', color: '#FF5000', bg: '#FFF0EB' },
  { id: 'some',   emoji: '✨', label: 'A few',      sub: 'Limited',     color: '#FF9500', bg: '#FFF8EC' },
  { id: 'last',   emoji: '⚡', label: 'Last ones!', sub: 'Hurry up',    color: '#C0392B', bg: '#FDECEA' },
];

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#F2F1EE',
  card:    '#FFFFFF',
  primary: '#FF5000',
  dark:    '#1C1C1E',
  text:    '#1C1C1E',
  muted:   '#8E8E93',
  faint:   '#C7C7CC',
  border:  '#EFEFEF',
  light:   '#FFF0EB',
};

const T = {
  h2:    { fontSize: 20, fontWeight: 700, color: C.text, margin: 0, letterSpacing: '-0.3px' },
  h3:    { fontSize: 16, fontWeight: 700, color: C.text, margin: 0 },
  small: { fontSize: 12, fontWeight: 500, color: C.muted },
  label: { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 8 },
};

const shadow = { sm: '0 1px 4px rgba(0,0,0,0.06)', md: '0 4px 16px rgba(0,0,0,0.08)' };

// ── Mini-components ───────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: C.card, borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: shadow.sm, ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, disabled, ghost }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: 'block', width: '100%', padding: '15px 20px', borderRadius: 14,
    border: ghost ? `2px solid ${C.primary}` : 'none',
    background: ghost ? 'transparent' : 'linear-gradient(135deg, #FF5000, #FF8C42)',
    color: ghost ? C.primary : 'white',
    fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
    marginBottom: 8, letterSpacing: '-0.1px',
  }}>
    {children}
  </button>
);

const Input = ({ value, onChange, placeholder, style }) => (
  <input value={value} onChange={onChange} placeholder={placeholder} style={{
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: `2px solid ${C.border}`, fontSize: 15, fontFamily: 'inherit',
    fontWeight: 500, color: C.text, background: 'white',
    boxSizing: 'border-box', marginBottom: 14, ...style,
  }} />
);

const Select = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange} style={{
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: `2px solid ${C.border}`, fontSize: 15, fontFamily: 'inherit',
    fontWeight: 500, color: C.text, background: 'white',
    boxSizing: 'border-box', marginBottom: 14, appearance: 'none',
  }}>
    {children}
  </select>
);

const Tag = ({ children }) => (
  <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: C.light, color: C.primary, marginRight: 4, marginBottom: 4 }}>
    {children}
  </span>
);

const FreshBar = ({ dateStr }) => {
  const { bar, color } = freshnessInfo(dateStr);
  return (
    <div style={{ height: 3, background: C.border, borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ height: '100%', width: `${bar}%`, background: color, borderRadius: 10 }} />
    </div>
  );
};

const LiveDot = () => (
  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34A853', display: 'inline-block', boxShadow: '0 0 0 2px rgba(52,168,83,0.25)', flexShrink: 0 }} />
);

const BackHeader = ({ title, sub, onBack }) => (
  <div style={{ background: C.dark, padding: '20px 20px 24px', position: 'relative' }}>
    <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer', padding: 0, position: 'absolute', left: 20, top: 22 }}>←</button>
    <div style={{ textAlign: 'center' }}>
      <div style={{ ...T.h2, color: 'white' }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
);

const APP = { fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg };

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]               = useState('home');
  const [venues, setVenues]               = useState([]);
  const [items, setItems]                 = useState([]);
  const [myVenue, setMyVenue]             = useState(() => JSON.parse(localStorage.getItem('hn_mine') || 'null'));
  const [favorites, setFavorites]         = useState(() => JSON.parse(localStorage.getItem('hn_favs') || '[]'));
  const [userLoc, setUserLoc]             = useState(null);
  const [locError, setLocError]           = useState('');
  const [venueName, setVenueName]         = useState('');
  const [venueType, setVenueType]         = useState('bakery');
  const [product, setProduct]             = useState(PRODUCTS_BY_TYPE.bakery[0]);
  const [customProduct, setCustomProduct] = useState('');
  const [quantity, setQuantity]           = useState('plenty');
  const [filterType, setFilterType]       = useState('all');
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [justDone, setJustDone]           = useState(false);
  const [now, setNow]                     = useState(Date.now());

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
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

  const getLocation = (cb) => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      p => { const l = { lat: p.coords.latitude, lng: p.coords.longitude }; setUserLoc(l); setLocError(''); if (cb) cb(l); },
      () => setLocError('Could not get your location. Please allow location access.')
    );
  };

  const registerVenue = async (loc) => {
    setSaving(true);
    const bt = BUSINESS_TYPES.find(b => b.id === venueType);
    const v = { id: Date.now().toString(), name: venueName.trim(), type: venueType, icon: bt.icon, lat: loc.lat, lng: loc.lng };
    const { error } = await supabase.from('venues').insert(v);
    if (!error) { setMyVenue(v); setVenueName(''); setScreen('dashboard'); }
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

  const removeItem = (id) => supabase.from('items').delete().eq('id', id);
  const toggleFav  = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <div style={APP}>
      <div style={{ background: C.dark, padding: '52px 24px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 14, filter: 'drop-shadow(0 4px 16px rgba(255,80,0,0.45))' }}>🔥</div>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-1px' }}>HotNow</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '10px 0 0', fontWeight: 500 }}>
          Fresh from the oven · right now · near you
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22, background: 'rgba(255,255,255,0.07)', borderRadius: 100, padding: '8px 18px' }}>
          <LiveDot />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
            {loading ? 'Loading…' : `${items.length} fresh item${items.length !== 1 ? 's' : ''} live`}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <p style={{ ...T.small, textAlign: 'center', marginBottom: 16 }}>WHO ARE YOU?</p>
        {[
          { icon: '🏪', title: 'I run a venue',  sub: 'Bakery, pizzeria, café… announce your fresh batches', action: () => myVenue ? setScreen('dashboard') : setScreen('register') },
          { icon: '🧭', title: "I'm hungry",      sub: 'Find fresh food near me, right now',                  action: () => { setScreen('explore'); getLocation(); } },
          ...(favorites.length > 0 ? [{ icon: '❤️', title: 'My favorites', sub: `${favorites.length} saved spot${favorites.length > 1 ? 's' : ''}`, action: () => { setScreen('favorites'); getLocation(); } }] : []),
        ].map((m, i) => (
          <div key={i} onClick={m.action} style={{ background: C.card, borderRadius: 20, padding: '18px 20px', marginBottom: 10, boxShadow: shadow.sm, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...T.h3, marginBottom: 3 }}>{m.title}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{m.sub}</div>
            </div>
            <div style={{ color: C.faint, fontSize: 22, fontWeight: 300 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── REGISTER ────────────────────────────────────────────────────────────────
  if (screen === 'register') return (
    <div style={APP}>
      <BackHeader title="Register venue" sub="One-time setup" onBack={() => setScreen('home')} />
      <div style={{ padding: 16 }}>
        <Card>
          <label style={T.label}>Type of venue</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {BUSINESS_TYPES.map(bt => (
              <button key={bt.id} onClick={() => setVenueType(bt.id)} style={{
                padding: '8px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                border: `2px solid ${venueType === bt.id ? C.primary : C.border}`,
                background: venueType === bt.id ? C.light : 'white',
                color: venueType === bt.id ? C.primary : C.muted,
              }}>
                {bt.icon} {bt.label}
              </button>
            ))}
          </div>
          <label style={T.label}>Venue name</label>
          <Input value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Boulangerie Martin, Pizzeria Roma…" />
          {locError && <p style={{ color: '#C0392B', fontSize: 13, margin: '-6px 0 10px' }}>{locError}</p>}
          <Btn onClick={() => { if (!venueName.trim()) return; getLocation(loc => registerVenue(loc)); }} disabled={saving}>
            {saving ? 'Registering…' : '📍 Register with GPS'}
          </Btn>
          <p style={{ ...T.small, textAlign: 'center', margin: '4px 0 0' }}>Your location is only used so customers can find you.</p>
        </Card>
      </div>
    </div>
  );

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  if (screen === 'dashboard') {
    const myItems     = items.filter(i => i.venue_id === myVenue.id);
    const productList = PRODUCTS_BY_TYPE[myVenue.type] || [];
    return (
      <div style={APP}>
        <div style={{ background: C.dark, padding: '20px 20px 24px', position: 'relative' }}>
          <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer', padding: 0, position: 'absolute', left: 20, top: 22 }}>←</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{myVenue.icon} {myVenue.name}</div>
            <div style={{ ...T.h2, color: 'white' }}>Dashboard</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10, background: 'rgba(255,255,255,0.07)', borderRadius: 100, padding: '6px 14px' }}>
              <LiveDot />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{myItems.length} live</span>
            </div>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔥</div>
              <div style={T.h3}>Announce a fresh batch</div>
            </div>
            <label style={T.label}>Product</label>
            {productList.length > 0 && (
              <Select value={product} onChange={e => { setProduct(e.target.value); setCustomProduct(''); }}>
                {productList.map(p => <option key={p}>{p}</option>)}
              </Select>
            )}
            <Input value={customProduct} onChange={e => setCustomProduct(e.target.value)}
              placeholder={productList.length > 0 ? 'Or type a custom product…' : 'Product name…'} />
            <label style={T.label}>Quantity</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
              {QUANTITIES.map(q => (
                <button key={q.id} onClick={() => setQuantity(q.id)} style={{
                  padding: '12px 8px', borderRadius: 14, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${quantity === q.id ? q.color : C.border}`,
                  background: quantity === q.id ? q.bg : 'white',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{q.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: quantity === q.id ? q.color : C.muted }}>{q.label}</div>
                  <div style={{ fontSize: 10, color: C.faint, marginTop: 1 }}>{q.sub}</div>
                </button>
              ))}
            </div>
            {justDone
              ? <div style={{ background: '#E8F5E9', borderRadius: 12, padding: 14, textAlign: 'center', color: '#2E7D32', fontWeight: 700, fontSize: 14 }}>✅ Live! Customers can see it now.</div>
              : <Btn onClick={announce} disabled={saving}>{saving ? 'Publishing…' : '📣 Out of the oven NOW!'}</Btn>
            }
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: myItems.length ? 16 : 0 }}>
              <div style={T.h3}>Live right now</div>
              <span style={{ background: C.primary, color: 'white', borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{myItems.length}</span>
            </div>
            {myItems.length === 0
              ? <p style={{ ...T.small, textAlign: 'center', margin: '10px 0 4px' }}>Nothing announced yet.</p>
              : myItems.map((it, idx) => {
                  const f = freshnessInfo(it.at);
                  const q = QUANTITIES.find(q => q.id === it.quantity);
                  return (
                    <div key={it.id} style={{ paddingTop: idx > 0 ? 14 : 0, marginTop: idx > 0 ? 14 : 0, borderTop: idx > 0 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <Tag>{it.product}</Tag>
                            {q && <span style={{ fontSize: 13, color: q.color, fontWeight: 700 }}>{q.emoji} {q.label}</span>}
                          </div>
                          <div style={{ ...T.small, marginTop: 5 }}>
                            <span style={{ color: f.color, fontWeight: 600 }}>{f.label}</span>
                            <span style={{ color: C.faint }}> · {timeAgo(it.at)}</span>
                          </div>
                          <FreshBar dateStr={it.at} />
                        </div>
                        <button onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', color: C.faint, fontSize: 22, cursor: 'pointer', padding: '0 0 0 12px', lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                  );
                })
            }
            {myItems.length > 0 && <p style={{ ...T.small, margin: '14px 0 0', borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>Items auto-expire after 2 hours.</p>}
          </Card>
          <Btn ghost onClick={() => { setMyVenue(null); localStorage.removeItem('hn_mine'); setScreen('register'); }}>Switch venue</Btn>
        </div>
      </div>
    );
  }

  // ── EXPLORE / FAVORITES ────────────────────────────────────────────────────
  if (screen === 'explore' || screen === 'favorites') {
    const isFav     = screen === 'favorites';
    const enriched  = venues
      .map(v => ({ ...v, distance: userLoc ? getDistance(userLoc.lat, userLoc.lng, v.lat, v.lng) : null, hotItems: items.filter(i => i.venue_id === v.id) }))
      .filter(v => v.hotItems.length > 0)
      .filter(v => !isFav || favorites.includes(v.id))
      .filter(v => filterType === 'all' || v.type === filterType)
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
    const activeTypes = [...new Set(venues.filter(v => items.some(i => i.venue_id === v.id)).map(v => v.type))];

    return (
      <div style={APP}>
        <div style={{ background: C.dark, padding: '20px 20px 24px', position: 'relative' }}>
          <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer', padding: 0, position: 'absolute', left: 20, top: 22 }}>←</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...T.h2, color: 'white' }}>{isFav ? '❤️ Favorites' : '🔥 HotNow'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
              {loading ? 'Loading…' : isFav ? 'Your saved spots' : `${enriched.length} fresh spot${enriched.length !== 1 ? 's' : ''} near you`}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 16px 0' }}>
          {!isFav && activeTypes.length > 1 && (
            <div style={{ display: 'flex', overflowX: 'auto', gap: 8, paddingBottom: 14 }}>
              {[{ id: 'all', icon: '🌍', label: 'All' }, ...BUSINESS_TYPES.filter(b => activeTypes.includes(b.id))].map(bt => (
                <button key={bt.id} onClick={() => setFilterType(bt.id)} style={{
                  padding: '7px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  border: `2px solid ${filterType === bt.id ? C.primary : C.border}`,
                  background: filterType === bt.id ? C.light : C.card,
                  color: filterType === bt.id ? C.primary : C.muted,
                }}>
                  {bt.icon} {bt.label}
                </button>
              ))}
            </div>
          )}

          {!userLoc && !locError && (
            <Card style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📍</div>
              <div style={{ ...T.h3, marginBottom: 6 }}>Getting your location…</div>
              <div style={T.small}>Allow location access to see nearby spots</div>
            </Card>
          )}
          {locError && <Card><p style={{ color: '#C0392B', fontSize: 14, margin: '0 0 12px' }}>{locError}</p><Btn onClick={() => { setLocError(''); getLocation(); }}>Try again</Btn></Card>}
          {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 14 }}>⏳ Loading fresh items…</div>}

          {!loading && userLoc && enriched.length === 0 && (
            <Card style={{ textAlign: 'center', padding: '36px 20px' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>{isFav ? '❤️' : '🍞'}</div>
              <div style={{ ...T.h3, marginBottom: 8 }}>{isFav ? 'No fresh items at your favorites' : 'Nothing fresh nearby'}</div>
              <div style={{ fontSize: 14, color: C.muted }}>Items appear for up to 2 hours after being announced.</div>
            </Card>
          )}

          {enriched.map(v => {
            const isFaved = favorites.includes(v.id);
            return (
              <Card key={v.id} style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{v.icon}</div>
                    <div>
                      <div style={T.h3}>{v.name}</div>
                      <div style={{ ...T.small, marginTop: 2 }}>{BUSINESS_TYPES.find(b => b.id === v.type)?.label}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {v.distance !== null && (
                      <div style={{ background: C.light, color: C.primary, borderRadius: 100, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                        {v.distance < 1 ? `${Math.round(v.distance * 1000)}m` : `${v.distance.toFixed(1)}km`}
                      </div>
                    )}
                    <button onClick={() => toggleFav(v.id)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                      {isFaved ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>

                {v.hotItems.map((it, idx) => {
                  const f = freshnessInfo(it.at);
                  const q = QUANTITIES.find(q => q.id === it.quantity);
                  return (
                    <div key={it.id} style={{ paddingTop: 12, marginTop: 12, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <Tag>{it.product}</Tag>
                            {q && <span style={{ fontSize: 12, color: q.color, fontWeight: 700 }}>{q.emoji} {q.label}</span>}
                          </div>
                          <div style={{ ...T.small, marginTop: 5 }}>
                            <span style={{ color: f.color, fontWeight: 600 }}>{f.label}</span>
                            <span style={{ color: C.faint }}> · {timeAgo(it.at)}</span>
                          </div>
                        </div>
                        {idx === 0 && v.hotItems.length > 1 && (
                          <span style={{ fontSize: 11, color: C.faint, marginLeft: 8, marginTop: 4, flexShrink: 0 }}>+{v.hotItems.length - 1} more</span>
                        )}
                      </div>
                      {idx === 0 && <FreshBar dateStr={it.at} />}
                    </div>
                  );
                })}
              </Card>
            );
          })}

          <Btn ghost onClick={() => { setUserLoc(null); setLocError(''); getLocation(); loadData(); }}>🔄 Refresh</Btn>
          <div style={{ height: 16 }} />
        </div>
      </div>
    );
  }

  return null;
}
