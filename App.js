import { useState, useEffect } from 'react';

// ── Haversine distance in km ────────────────────────────────────────────────
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
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? m + 'm' : ''} ago`;
}

function freshnessInfo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 15) return { bg: '#fff3e0', color: '#e65100', label: '🔥 Just out!', bar: 100 };
  if (mins < 30) return { bg: '#fff8e1', color: '#f57c00', label: '🔥 Very fresh', bar: 80 };
  if (mins < 60) return { bg: '#e8f5e9', color: '#2e7d32', label: '✅ Fresh', bar: 60 };
  if (mins < 90) return { bg: '#f1f8e9', color: '#558b2f', label: '👍 Still warm', bar: 40 };
  return { bg: '#f5f5f5', color: '#757575', label: '⏳ Getting old', bar: 20 };
}

const FRESHNESS_LIMIT_MS = 2 * 60 * 60 * 1000;

// ── Business types ──────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { id: 'bakery',     icon: '🥖', label: 'Bakery / Boulangerie' },
  { id: 'pizzeria',   icon: '🍕', label: 'Pizzeria' },
  { id: 'pastry',     icon: '🥐', label: 'Pastry / Pâtisserie' },
  { id: 'restaurant', icon: '🍽️', label: 'Restaurant' },
  { id: 'cafe',       icon: '☕', label: 'Café / Coffee shop' },
  { id: 'other',      icon: '🏪', label: 'Other / Autre' },
];

// ── Products by business type ───────────────────────────────────────────────
const PRODUCTS_BY_TYPE = {
  bakery:     ['Baguette', 'Croissant', 'Pain au chocolat', 'Brioche', 'Ficelle', 'Pain de campagne', 'Fougasse', 'Chausson aux pommes', 'Pain aux noix', 'Bâtard'],
  pizzeria:   ['Pizza Margherita', 'Pizza 4 formaggi', 'Pizza Pepperoni', 'Pizza Reine', 'Pizza Végétarienne', 'Calzone', 'Focaccia', 'Pizza Napolitaine', 'Pizza du jour'],
  pastry:     ['Éclair', 'Tarte', 'Mille-feuille', 'Paris-Brest', 'Opéra', 'Religieuse', 'Macaron', 'Kouign-amann', 'Saint-Honoré', 'Choquette'],
  restaurant: ['Plat du jour', 'Pain maison', 'Tarte salée', 'Quiche', 'Lasagne', 'Gratin', 'Tourte', 'Crumble'],
  cafe:       ['Muffin', 'Scone', 'Banana bread', 'Cookie', 'Brownie', 'Croissant', 'Pain aux raisins'],
  other:      [],
};

// ── Quantities ──────────────────────────────────────────────────────────────
const QUANTITIES = [
  { id: 'plenty', label: 'Plenty / En grande quantité', badge: '🔥🔥🔥', color: '#e65100' },
  { id: 'some',   label: 'A few / Quelques pièces',     badge: '🔥🔥',   color: '#f57c00' },
  { id: 'last',   label: 'Last ones! / Dernières pièces !', badge: '⚡ Last!', color: '#c62828' },
];

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  app:      { fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#fafafa' },
  header:   { background: 'linear-gradient(135deg, #e65c00, #f9d423)', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  hCenter:  { textAlign: 'center' },
  title:    { margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' },
  sub:      { margin: '2px 0 0', fontSize: 12, opacity: 0.9 },
  backBtn:  { position: 'absolute', left: 14, background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1 },
  body:     { padding: '16px' },
  card:     { background: 'white', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  btn:      { background: 'linear-gradient(135deg, #e65c00, #f9a825)', color: 'white', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%', marginBottom: 8 },
  btnGhost: { background: 'white', color: '#e65c00', border: '2px solid #e65c00', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: 8 },
  input:    { width: '100%', padding: '11px 13px', borderRadius: 9, border: '2px solid #eee', fontSize: 15, boxSizing: 'border-box', marginBottom: 10, outline: 'none', transition: 'border-color 0.2s' },
  select:   { width: '100%', padding: '11px 13px', borderRadius: 9, border: '2px solid #eee', fontSize: 15, boxSizing: 'border-box', marginBottom: 10, background: 'white' },
  label:    { display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' },
  tag:      { display: 'inline-block', background: '#fff3e0', color: '#e65c00', borderRadius: 20, padding: '3px 10px', fontSize: 13, fontWeight: 700, marginRight: 4, marginBottom: 4 },
  modeCard: { background: 'white', borderRadius: 16, padding: '20px 16px', marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 },
  error:    { color: '#c62828', fontSize: 13, margin: '4px 0' },
  bigIcon:  { fontSize: 40, lineHeight: 1 },
  pill:     { display: 'inline-block', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 },
  filterBtn:{ borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '2px solid #eee', background: 'white', marginRight: 6, marginBottom: 6, whiteSpace: 'nowrap' },
};

// ── Component ───────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]               = useState('home');
  const [venues, setVenues]               = useState(() => JSON.parse(localStorage.getItem('hn_venues') || '[]'));
  const [items, setItems]                 = useState(() => JSON.parse(localStorage.getItem('hn_items') || '[]'));
  const [myVenue, setMyVenue]             = useState(() => JSON.parse(localStorage.getItem('hn_mine') || 'null'));
  const [userLoc, setUserLoc]             = useState(null);
  const [locError, setLocError]           = useState('');
  const [venueName, setVenueName]         = useState('');
  const [venueType, setVenueType]         = useState('bakery');
  const [product, setProduct]             = useState('');
  const [customProduct, setCustomProduct] = useState('');
  const [quantity, setQuantity]           = useState('plenty');
  const [filterType, setFilterType]       = useState('all');
  const [justDone, setJustDone]           = useState(false);
  const [favorites, setFavorites]         = useState(() => JSON.parse(localStorage.getItem('hn_favs') || '[]'));
  const [now, setNow]                     = useState(Date.now());

  // Sync product default when type changes
  useEffect(() => {
    const list = PRODUCTS_BY_TYPE[venueType] || [];
    setProduct(list[0] || '');
    setCustomProduct('');
  }, [venueType]);

  // Persist
  useEffect(() => { localStorage.setItem('hn_venues', JSON.stringify(venues)); }, [venues]);
  useEffect(() => { localStorage.setItem('hn_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('hn_mine', JSON.stringify(myVenue)); }, [myVenue]);
  useEffect(() => { localStorage.setItem('hn_favs', JSON.stringify(favorites)); }, [favorites]);

  // Tick & expire
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    setItems(prev => prev.filter(i => Date.now() - new Date(i.at) < FRESHNESS_LIMIT_MS));
  }, [now]); // eslint-disable-line

  const getLocation = (cb) => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      p => { const l = { lat: p.coords.latitude, lng: p.coords.longitude }; setUserLoc(l); setLocError(''); if (cb) cb(l); },
      () => setLocError('Could not get your location. Please allow location access.')
    );
  };

  const registerVenue = (loc) => {
    const bt = BUSINESS_TYPES.find(b => b.id === venueType);
    const v = { id: Date.now().toString(), name: venueName.trim(), type: venueType, icon: bt.icon, lat: loc.lat, lng: loc.lng };
    setVenues(prev => [...prev, v]);
    setMyVenue(v);
    setVenueName('');
    setScreen('dashboard');
  };

  const announce = () => {
    const name = customProduct.trim() || product;
    if (!name) return;
    setItems(prev => [...prev, { id: Date.now().toString(), venueId: myVenue.id, product: name, quantity, at: new Date().toISOString() }]);
    setCustomProduct('');
    setJustDone(true);
    setTimeout(() => setJustDone(false), 3000);
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const toggleFav = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  // ── HOME ────────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <div style={S.app}>
      <div style={{ ...S.header, flexDirection: 'column', padding: '24px 20px' }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🔥</div>
        <h1 style={{ ...S.title, fontSize: 28 }}>HotNow</h1>
        <p style={{ ...S.sub, fontSize: 13 }}>Fresh from the oven · right now · near you</p>
      </div>
      <div style={S.body}>
        <p style={{ color: '#aaa', textAlign: 'center', fontSize: 14, margin: '8px 0 16px' }}>Who are you?</p>

        <div style={S.modeCard} onClick={() => myVenue ? setScreen('dashboard') : setScreen('register')}>
          <div style={S.bigIcon}>🏪</div>
          <div>
            <strong style={{ fontSize: 16 }}>I run a venue</strong>
            <p style={{ color: '#aaa', fontSize: 13, margin: '2px 0 0' }}>Bakery, pizzeria, restaurant… announce your fresh batches</p>
          </div>
        </div>

        <div style={S.modeCard} onClick={() => { setScreen('explore'); getLocation(); }}>
          <div style={S.bigIcon}>📍</div>
          <div>
            <strong style={{ fontSize: 16 }}>I'm a customer</strong>
            <p style={{ color: '#aaa', fontSize: 13, margin: '2px 0 0' }}>Find fresh food near you, right now</p>
          </div>
        </div>

        {favorites.length > 0 && (
          <div style={S.modeCard} onClick={() => { setScreen('favorites'); getLocation(); }}>
            <div style={S.bigIcon}>❤️</div>
            <div>
              <strong style={{ fontSize: 16 }}>My favorites</strong>
              <p style={{ color: '#aaa', fontSize: 13, margin: '2px 0 0' }}>{favorites.length} saved spot{favorites.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── REGISTER ────────────────────────────────────────────────────────────
  if (screen === 'register') return (
    <div style={S.app}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => setScreen('home')}>←</button>
        <div style={S.hCenter}><h1 style={S.title}>My venue</h1><p style={S.sub}>Setup</p></div>
      </div>
      <div style={S.body}>
        <div style={S.card}>
          <label style={S.label}>Type of venue</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {BUSINESS_TYPES.map(bt => (
              <button
                key={bt.id}
                onClick={() => setVenueType(bt.id)}
                style={{
                  ...S.filterBtn,
                  background: venueType === bt.id ? '#e65c00' : 'white',
                  color: venueType === bt.id ? 'white' : '#333',
                  border: `2px solid ${venueType === bt.id ? '#e65c00' : '#eee'}`,
                }}
              >
                {bt.icon} {bt.label.split(' / ')[0]}
              </button>
            ))}
          </div>

          <label style={S.label}>Venue name</label>
          <input
            style={S.input}
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            placeholder="e.g. Boulangerie Martin, Pizzeria Roma…"
          />

          {locError && <p style={S.error}>{locError}</p>}

          <button style={S.btn} onClick={() => { if (!venueName.trim()) return; getLocation(loc => registerVenue(loc)); }}>
            📍 Register with my GPS location
          </button>
          <p style={{ color: '#bbb', fontSize: 12, textAlign: 'center', margin: 0 }}>
            Your location helps customers find you. It is only used for distance calculation.
          </p>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD ───────────────────────────────────────────────────────────
  if (screen === 'dashboard') {
    const myItems = items.filter(i => i.venueId === myVenue.id);
    const productList = PRODUCTS_BY_TYPE[myVenue.type] || [];

    return (
      <div style={S.app}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => setScreen('home')}>←</button>
          <div style={S.hCenter}>
            <h1 style={S.title}>{myVenue.icon} {myVenue.name}</h1>
            <p style={S.sub}>Dashboard</p>
          </div>
        </div>
        <div style={S.body}>

          {/* Announce */}
          <div style={S.card}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>🔥 Announce a fresh batch</h3>

            <label style={S.label}>Product</label>
            {productList.length > 0 && (
              <select style={S.select} value={product} onChange={e => { setProduct(e.target.value); setCustomProduct(''); }}>
                {productList.map(p => <option key={p}>{p}</option>)}
              </select>
            )}
            <input
              style={S.input}
              value={customProduct}
              onChange={e => setCustomProduct(e.target.value)}
              placeholder={productList.length > 0 ? 'Or type a custom product…' : 'Product name…'}
            />

            <label style={S.label}>Quantity</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {QUANTITIES.map(q => (
                <button
                  key={q.id}
                  onClick={() => setQuantity(q.id)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                    border: `2px solid ${quantity === q.id ? q.color : '#eee'}`,
                    background: quantity === q.id ? q.color : 'white',
                    color: quantity === q.id ? 'white' : '#555',
                    cursor: 'pointer',
                  }}
                >
                  {q.badge}
                </button>
              ))}
            </div>

            <button style={S.btn} onClick={announce}>
              📣 Out of the oven NOW!
            </button>
            {justDone && <p style={{ color: '#2e7d32', fontSize: 14, textAlign: 'center', margin: 0 }}>✅ Announced!</p>}
          </div>

          {/* Live items */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Live right now</h3>
              <span style={{ background: '#e65c00', color: 'white', borderRadius: 10, padding: '1px 9px', fontSize: 13, fontWeight: 700 }}>
                {myItems.length}
              </span>
            </div>
            {myItems.length === 0
              ? <p style={{ color: '#ccc', fontSize: 14, margin: 0 }}>Nothing announced yet. Hit the button above when something comes out!</p>
              : myItems.map(it => {
                  const f = freshnessInfo(it.at);
                  const q = QUANTITIES.find(q => q.id === it.quantity);
                  return (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div>
                        <span style={S.tag}>{it.product}</span>
                        {q && <span style={{ fontSize: 12, marginLeft: 4 }}>{q.badge}</span>}
                        <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{timeAgo(it.at)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ ...S.pill, background: f.bg, color: f.color, fontSize: 11 }}>{f.label}</span>
                        <button onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', color: '#ddd', fontSize: 20, cursor: 'pointer', padding: '0 4px' }}>×</button>
                      </div>
                    </div>
                  );
                })
            }
            {myItems.length > 0 && <p style={{ color: '#ccc', fontSize: 11, margin: '10px 0 0' }}>Items auto-expire after 2 hours.</p>}
          </div>

          <button style={S.btnGhost} onClick={() => { setMyVenue(null); localStorage.removeItem('hn_mine'); setScreen('register'); }}>
            Switch venue
          </button>
        </div>
      </div>
    );
  }

  // ── EXPLORE (customer) ──────────────────────────────────────────────────
  if (screen === 'explore' || screen === 'favorites') {
    const isFavScreen = screen === 'favorites';

    const enriched = venues.map(v => {
      const dist = userLoc ? getDistance(userLoc.lat, userLoc.lng, v.lat, v.lng) : null;
      const hotItems = items.filter(i => i.venueId === v.id);
      return { ...v, distance: dist, hotItems };
    })
    .filter(v => v.hotItems.length > 0)
    .filter(v => isFavScreen ? favorites.includes(v.id) : true)
    .filter(v => filterType === 'all' || v.type === filterType)
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));

    const activeTypes = [...new Set(venues.filter(v => items.some(i => i.venueId === v.id)).map(v => v.type))];

    return (
      <div style={S.app}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => setScreen('home')}>←</button>
          <div style={S.hCenter}>
            <h1 style={S.title}>🔥 {isFavScreen ? 'My Favorites' : 'HotNow'}</h1>
            <p style={S.sub}>{isFavScreen ? 'Your saved spots' : 'Fresh near you'}</p>
          </div>
        </div>
        <div style={S.body}>

          {/* Filter bar */}
          {!isFavScreen && activeTypes.length > 1 && (
            <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 4, marginBottom: 8, gap: 6 }}>
              <button
                style={{ ...S.filterBtn, background: filterType === 'all' ? '#e65c00' : 'white', color: filterType === 'all' ? 'white' : '#333', border: `2px solid ${filterType === 'all' ? '#e65c00' : '#eee'}` }}
                onClick={() => setFilterType('all')}
              >All</button>
              {activeTypes.map(t => {
                const bt = BUSINESS_TYPES.find(b => b.id === t);
                return (
                  <button
                    key={t}
                    style={{ ...S.filterBtn, background: filterType === t ? '#e65c00' : 'white', color: filterType === t ? 'white' : '#333', border: `2px solid ${filterType === t ? '#e65c00' : '#eee'}` }}
                    onClick={() => setFilterType(t)}
                  >{bt.icon} {bt.label.split(' / ')[0]}</button>
                );
              })}
            </div>
          )}

          {/* Location loading */}
          {!userLoc && !locError && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>📍 Getting your location…</div>
          )}

          {locError && (
            <div style={S.card}>
              <p style={S.error}>{locError}</p>
              <button style={S.btn} onClick={() => { setLocError(''); getLocation(); }}>Retry</button>
            </div>
          )}

          {/* Empty state */}
          {userLoc && enriched.length === 0 && (
            <div style={{ ...S.card, textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>{isFavScreen ? '❤️' : '😔'}</div>
              <p style={{ color: '#666', margin: '0 0 6px' }}>
                {isFavScreen ? 'None of your favorites have fresh items right now.' : 'No fresh items nearby right now.'}
              </p>
              <p style={{ color: '#bbb', fontSize: 13, margin: 0 }}>Items appear for up to 2 hours after being announced.</p>
            </div>
          )}

          {/* Venue cards */}
          {enriched.map(v => {
            const isFav = favorites.includes(v.id);
            return (
              <div key={v.id} style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 18, marginRight: 6 }}>{v.icon}</span>
                    <strong style={{ fontSize: 16 }}>{v.name}</strong>
                    <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>
                      {BUSINESS_TYPES.find(b => b.id === v.type)?.label}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {v.distance !== null && (
                      <span style={{ fontSize: 13, color: '#e65c00', fontWeight: 700 }}>
                        {v.distance < 1 ? `${Math.round(v.distance * 1000)} m` : `${v.distance.toFixed(1)} km`}
                      </span>
                    )}
                    <button
                      onClick={() => toggleFav(v.id)}
                      style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >{isFav ? '❤️' : '🤍'}</button>
                  </div>
                </div>

                {v.hotItems.map(it => {
                  const f = freshnessInfo(it.at);
                  const q = QUANTITIES.find(q => q.id === it.quantity);
                  return (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={S.tag}>{it.product}</span>
                        {q && (
                          <span style={{ ...S.pill, background: it.quantity === 'last' ? '#ffebee' : '#fff3e0', color: q.color, fontSize: 11 }}>
                            {q.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <span style={{ ...S.pill, background: f.bg, color: f.color, fontSize: 11 }}>{f.label}</span>
                        <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{timeAgo(it.at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <button style={S.btnGhost} onClick={() => { setUserLoc(null); setLocError(''); getLocation(); }}>
            🔄 Refresh location
          </button>
        </div>
      </div>
    );
  }

  return null;
}
