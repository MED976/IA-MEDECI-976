import { useState, useEffect } from 'react';

// Haversine distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `il y a ${h}h${m > 0 ? m : ''}`;
}

function freshnessColor(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (mins < 20) return { bg: '#fff3e0', color: '#e65100', label: 'Très frais !' };
  if (mins < 60) return { bg: '#e8f5e9', color: '#2e7d32', label: 'Frais' };
  return { bg: '#f5f5f5', color: '#757575', label: 'Encore chaud' };
}

const CATEGORIES = {
  '🥖 Boulangerie': [
    'Baguette', 'Croissant', 'Pain au chocolat', 'Brioche',
    'Ficelle', 'Pain de campagne', 'Fougasse', 'Chausson aux pommes',
    'Éclair', 'Tarte', 'Mille-feuille', 'Paris-Brest',
  ],
  '🍕 Pizzeria': [
    'Pizza Margherita', 'Pizza 4 fromages', 'Pizza Reine',
    'Pizza Pepperoni', 'Pizza Végétarienne', 'Pizza Calzone',
    'Pizza Napolitaine', 'Focaccia',
  ],
  '🥐 Viennoiserie': [
    'Kouign-amann', 'Escargot raisin', 'Palmier', 'Choquette',
    'Tresse au beurre', 'Pain aux raisins',
  ],
};

const ALL_PRODUCTS = Object.values(CATEGORIES).flat();

const FRESHNESS_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 heures

const s = {
  app: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    maxWidth: 480,
    margin: '0 auto',
    minHeight: '100vh',
    background: '#fdf8f0',
  },
  header: {
    background: '#c8571b',
    color: 'white',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerCenter: { textAlign: 'center' },
  title: { margin: 0, fontSize: 20, fontWeight: 700 },
  sub: { margin: '2px 0 0', fontSize: 12, opacity: 0.85 },
  backBtn: {
    position: 'absolute',
    left: 16,
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: 22,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  },
  body: { padding: '20px 16px' },
  card: {
    background: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  btn: {
    background: '#c8571b',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginBottom: 8,
    transition: 'opacity 0.2s',
  },
  btnSecondary: {
    background: '#f0e8dc',
    color: '#c8571b',
    border: 'none',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '2px solid #e0d5c5',
    fontSize: 15,
    boxSizing: 'border-box',
    marginBottom: 10,
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '2px solid #e0d5c5',
    fontSize: 15,
    boxSizing: 'border-box',
    marginBottom: 10,
    background: 'white',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
    marginBottom: 4,
  },
  tag: {
    display: 'inline-block',
    background: '#fff3e8',
    color: '#c8571b',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 13,
    fontWeight: 600,
    marginRight: 4,
    marginBottom: 4,
  },
  modeCard: {
    background: 'white',
    borderRadius: 16,
    padding: '24px 20px',
    marginBottom: 14,
    boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
    textAlign: 'center',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'border-color 0.15s',
  },
  error: { color: '#c0392b', fontSize: 13, margin: '4px 0' },
  bigEmoji: { fontSize: 36, marginBottom: 10 },
  divider: { height: 1, background: '#f0e8dc', margin: '10px 0' },
};

export default function App() {
  const [mode, setMode] = useState('home');
  const [bakeries, setBakeries] = useState(
    () => JSON.parse(localStorage.getItem('fc_bakeries') || '[]')
  );
  const [freshProducts, setFreshProducts] = useState(
    () => JSON.parse(localStorage.getItem('fc_fresh') || '[]')
  );
  const [currentBakery, setCurrentBakery] = useState(
    () => JSON.parse(localStorage.getItem('fc_current') || 'null')
  );
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [bakeryName, setBakeryName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(ALL_PRODUCTS[0]);
  const [now, setNow] = useState(Date.now());
  const [justAnnounced, setJustAnnounced] = useState(false);

  // Persist
  useEffect(() => { localStorage.setItem('fc_bakeries', JSON.stringify(bakeries)); }, [bakeries]);
  useEffect(() => { localStorage.setItem('fc_fresh', JSON.stringify(freshProducts)); }, [freshProducts]);
  useEffect(() => { localStorage.setItem('fc_current', JSON.stringify(currentBakery)); }, [currentBakery]);

  // Tick every 30s
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Clean expired products every tick
  useEffect(() => {
    setFreshProducts(prev => prev.filter(p => Date.now() - new Date(p.outOfOvenAt) < FRESHNESS_LIMIT_MS));
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const getLocation = (onSuccess) => {
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationError('');
        if (onSuccess) onSuccess(loc);
      },
      () => setLocationError('Impossible d\'obtenir votre position. Vérifiez les permissions de localisation.')
    );
  };

  const registerBakery = (loc) => {
    const id = Date.now().toString();
    const bakery = { id, name: bakeryName.trim(), lat: loc.lat, lng: loc.lng };
    setBakeries(prev => [...prev, bakery]);
    setCurrentBakery(bakery);
    setBakeryName('');
    setMode('bakery');
  };

  const announceProduct = () => {
    setFreshProducts(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        bakeryId: currentBakery.id,
        product: selectedProduct,
        outOfOvenAt: new Date().toISOString(),
      },
    ]);
    setJustAnnounced(true);
    setTimeout(() => setJustAnnounced(false), 3000);
  };

  const removeProduct = (id) => {
    setFreshProducts(prev => prev.filter(p => p.id !== id));
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (mode === 'home') {
    return (
      <div style={s.app}>
        <div style={{ ...s.header, flexDirection: 'column', padding: '20px' }}>
          <h1 style={{ ...s.title, fontSize: 26 }}>🔥 HotNow</h1>
          <p style={{ ...s.sub, fontSize: 13 }}>Fresh from the oven, right now</p>
        </div>
        <div style={s.body}>
          <p style={{ color: '#888', textAlign: 'center', marginBottom: 20, fontSize: 15 }}>
            Vous êtes…
          </p>

          <div
            style={s.modeCard}
            onClick={() => { currentBakery ? setMode('bakery') : setMode('bakery-register'); }}
          >
            <div style={s.bigEmoji}>🏪</div>
            <strong style={{ fontSize: 17 }}>Une boulangerie</strong>
            <p style={{ color: '#888', fontSize: 14, margin: '6px 0 0' }}>
              Boulangerie, pizzeria… annoncez vos fournées en temps réel
            </p>
          </div>

          <div
            style={s.modeCard}
            onClick={() => { setMode('customer'); getLocation(); }}
          >
            <div style={s.bigEmoji}>🧑</div>
            <strong style={{ fontSize: 17 }}>Un client</strong>
            <p style={{ color: '#888', fontSize: 14, margin: '6px 0 0' }}>
              Trouvez les boulangeries avec du frais près de vous
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── BAKERY REGISTER ───────────────────────────────────────────────────────
  if (mode === 'bakery-register') {
    return (
      <div style={s.app}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => setMode('home')}>←</button>
          <div style={s.headerCenter}>
            <h1 style={s.title}>Ma boulangerie</h1>
            <p style={s.sub}>Enregistrement</p>
          </div>
        </div>
        <div style={s.body}>
          <div style={s.card}>
            <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
              Entrez le nom de votre boulangerie. Votre position GPS sera utilisée pour permettre
              aux clients de vous localiser.
            </p>
            <label style={s.label}>Nom de la boulangerie</label>
            <input
              style={s.input}
              value={bakeryName}
              onChange={e => setBakeryName(e.target.value)}
              placeholder="Ex : Boulangerie Martin"
            />
            {locationError && <p style={s.error}>{locationError}</p>}
            <button
              style={s.btn}
              onClick={() => {
                if (!bakeryName.trim()) return;
                getLocation(loc => registerBakery(loc));
              }}
            >
              📍 Enregistrer avec ma position GPS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── BAKERY DASHBOARD ──────────────────────────────────────────────────────
  if (mode === 'bakery') {
    const myProducts = freshProducts.filter(
      p => p.bakeryId === currentBakery.id
    );

    return (
      <div style={s.app}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => setMode('home')}>←</button>
          <div style={s.headerCenter}>
            <h1 style={s.title}>{currentBakery.name}</h1>
            <p style={s.sub}>Tableau de bord</p>
          </div>
        </div>
        <div style={s.body}>

          {/* Announce */}
          <div style={s.card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>🔥 Annoncer une fournée</h3>
            <label style={s.label}>Produit sorti du four</label>
            <select
              style={s.select}
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              {Object.entries(CATEGORIES).map(([cat, items]) => (
              <optgroup key={cat} label={cat}>
                {items.map(p => <option key={p}>{p}</option>)}
              </optgroup>
            ))}
            </select>
            <button style={s.btn} onClick={announceProduct}>
              📣 Sortie du four maintenant !
            </button>
            {justAnnounced && (
              <p style={{ color: '#2e7d32', fontSize: 14, textAlign: 'center', margin: 0 }}>
                ✅ Annonce envoyée !
              </p>
            )}
          </div>

          {/* Current fresh products */}
          <div style={s.card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>
              Produits frais en ce moment&nbsp;
              <span style={{ background: '#c8571b', color: 'white', borderRadius: 10, padding: '1px 8px', fontSize: 13 }}>
                {myProducts.length}
              </span>
            </h3>
            {myProducts.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>
                Aucun produit annoncé. Utilisez le bouton ci-dessus dès qu'une fournée sort du four.
              </p>
            ) : (
              myProducts.map(p => {
                const fresh = freshnessColor(p.outOfOvenAt);
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f5f0e8',
                    }}
                  >
                    <span style={s.tag}>{p.product}</span>
                    <span
                      style={{
                        fontSize: 12,
                        background: fresh.bg,
                        color: fresh.color,
                        borderRadius: 10,
                        padding: '2px 8px',
                        fontWeight: 600,
                      }}
                    >
                      {timeAgo(p.outOfOvenAt)}
                    </span>
                    <button
                      onClick={() => removeProduct(p.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ccc',
                        cursor: 'pointer',
                        fontSize: 20,
                        lineHeight: 1,
                        padding: '0 4px',
                      }}
                      title="Retirer"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
            {myProducts.length > 0 && (
              <p style={{ color: '#aaa', fontSize: 12, marginBottom: 0, marginTop: 10 }}>
                Les produits disparaissent automatiquement après 2 heures.
              </p>
            )}
          </div>

          <button
            style={s.btnSecondary}
            onClick={() => {
              setCurrentBakery(null);
              localStorage.removeItem('fc_current');
              setMode('bakery-register');
            }}
          >
            Changer de boulangerie
          </button>
        </div>
      </div>
    );
  }

  // ── CUSTOMER ──────────────────────────────────────────────────────────────
  if (mode === 'customer') {
    const nearbyBakeries = bakeries
      .map(b => {
        const dist = userLocation
          ? getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng)
          : null;
        const products = freshProducts.filter(p => p.bakeryId === b.id);
        return { ...b, distance: dist, freshItems: products };
      })
      .filter(b => b.freshItems.length > 0)
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));

    return (
      <div style={s.app}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => setMode('home')}>←</button>
          <div style={s.headerCenter}>
            <h1 style={s.title}>🔥 HotNow</h1>
            <p style={s.sub}>Fresh spots near you</p>
          </div>
        </div>
        <div style={s.body}>

          {!userLocation && !locationError && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: '#888' }}>📍 Récupération de votre position…</p>
            </div>
          )}

          {locationError && (
            <div style={s.card}>
              <p style={s.error}>{locationError}</p>
              <button style={s.btn} onClick={() => { setLocationError(''); getLocation(); }}>
                Réessayer
              </button>
            </div>
          )}

          {userLocation && nearbyBakeries.length === 0 && (
            <div style={{ ...s.card, textAlign: 'center', padding: '32px 20px' }}>
              <div style={s.bigEmoji}>😔</div>
              <p style={{ color: '#666', marginBottom: 4 }}>
                Aucune boulangerie n'a de produits frais à proximité pour le moment.
              </p>
              <p style={{ color: '#aaa', fontSize: 13 }}>
                Les produits sont visibles jusqu'à 2h après la sortie du four.
              </p>
            </div>
          )}

          {nearbyBakeries.map(b => (
            <div key={b.id} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <strong style={{ fontSize: 16 }}>{b.name}</strong>
                {b.distance !== null && (
                  <span style={{ fontSize: 13, color: '#c8571b', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {b.distance < 1
                      ? `${Math.round(b.distance * 1000)} m`
                      : `${b.distance.toFixed(1)} km`}
                  </span>
                )}
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#888' }}>🔥 Frais maintenant :</p>
              {b.freshItems.map(p => {
                const fresh = freshnessColor(p.outOfOvenAt);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <span style={s.tag}>{p.product}</span>
                    <span
                      style={{
                        fontSize: 12,
                        background: fresh.bg,
                        color: fresh.color,
                        borderRadius: 10,
                        padding: '2px 8px',
                        fontWeight: 600,
                      }}
                    >
                      {fresh.label} — {timeAgo(p.outOfOvenAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          <button
            style={s.btnSecondary}
            onClick={() => { setUserLocation(null); setLocationError(''); getLocation(); }}
          >
            🔄 Actualiser ma position
          </button>
        </div>
      </div>
    );
  }

  return null;
}
