import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import LandingPage from './LandingPage';
import T from './translations';
import './animations.css';

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
  bakery:      ['Baguette tradition','Croissant','Pain au chocolat','Brioche','Ficelle','Pain de campagne','Fougasse','Chausson aux pommes','Pain aux céréales'],
  pizzeria:    ['Pizza Margherita','Pizza 4 formaggi','Pizza Pepperoni','Pizza Reine','Calzone','Focaccia','Pizza du jour'],
  pastry:      ['Éclair chocolat','Tarte aux fraises','Mille-feuille','Paris-Brest','Macaron','Kouign-amann','Saint-Honoré','Choux à la crème'],
  restaurant:  ['Plat du jour','Pain maison','Quiche','Lasagne','Gratin','Tourte','Soupe du jour'],
  cafe:        ['Muffin','Scone','Banana bread','Cookie','Brownie','Croissant','Cake du jour'],
  fromagerie:  ['Comté affiné','Camembert AOP','Brie de Meaux','Roquefort','Chèvre frais','Morbier','Raclette','Époisses'],
  boucherie:   ['Rôti du jour','Entrecôte','Merguez fraîches','Saucisses maison','Terrine maison','Poulet fermier','Côtelettes'],
  traiteur:    ['Plat du jour','Quiche fraîche','Taboulé maison','Gratin du jour','Pâté en croûte','Salade composée','Lasagnes'],
  glacier:     ['Glace vanille','Sorbet citron','Sundae chocolat','Glace framboise','Coupe 3 boules','Cornet artisanal'],
  foodtruck:   ['Burger du jour','Hot dog','Tacos','Frites maison','Wrap','Bowl du jour','Sandwich grillé'],
  sushi:       ['Plateau sushi','Maki California','Temaki saumon','Chirashi','Gyoza','Ramen du jour','Poké bowl'],
  chocolatier: ['Bonbons chocolat','Tablette du jour','Truffes','Mendiant','Rocher','Pralinés','Ganache fraîche'],
  rotisserie:  ['Poulet rôti','Demi-poulet','Rôti de porc','Agneau rôti','Pommes sarladaises','Magret de canard'],
  creperie:    ['Crêpe beurre-sucre','Crêpe complète','Galette jambon-fromage','Crêpe Nutella','Galette champignons','Crêpe flambée'],
  other:       [],
};

// ── Venue name autocomplete suggestions ───────────────────────────────────────
const VENUE_SUGGESTIONS = {
  bakery:      ['Boulangerie du Coin','Boulangerie Martin','Le Pain Doré','Au Bon Pain','La Mie Enchantée','Le Fournil du Village','Boulangerie Artisanale','Le Grenier à Pain','Boulangerie de la Mairie'],
  pizzeria:    ['Pizzeria Roma','La Bella Italia','Pizza Napoli','Pizzeria del Corso','La Piazza','Pizzeria Calabrese','L\'Olive et le Four','Pizza di Napoli'],
  pastry:      ['Pâtisserie du Centre','Maison Martin','Les Délices Sucrés','Pâtisserie Artisanale','La Tarte et la Douceur','Au Palais Sucré','La Pâtisserie'],
  restaurant:  ['Le Bistrot du Coin','Chez Marie','Le Petit Chef','La Maison','Restaurant du Marché','Au Fil des Saisons','Le Terroir'],
  cafe:        ['Café de la Place','Le Petit Café','Café des Artistes','Le Zinc','Café Central','Le Comptoir','Café du Commerce'],
  fromagerie:  ['La Fromagerie du Marché','Maison du Fromage','L\'Affineur','Fromagerie Artisanale','Au Plateau de Fromages','La Cave à Fromages'],
  boucherie:   ['Boucherie du Village','Maison Martin','La Boucherie Artisanale','Au Bœuf Saignant','Boucherie-Charcuterie','La Bonne Viande'],
  traiteur:    ['Traiteur Dupont','La Table du Traiteur','Les Saveurs du Marché','Épicerie Fine','Traiteur de Qualité','Le Délice Traiteur'],
  glacier:     ['La Crème Glacée','Glacier Artisanal','Le Petit Gelato','Glacerie du Soleil','Les Glaces de Marie','Gelato di Roma'],
  foodtruck:   ['Le Truck Gourmand','Street Food Express','Le Camion du Chef','Food Truck du Marché','Le Burger Mobile'],
  sushi:       ['Sushi Express','Tokyo Sushi','Sakura Restaurant','Sushi Bar','Japan Food','Wasabi Sushi','Edo Sushi'],
  chocolatier: ['Chocolaterie Artisanale','Maison du Chocolat','Les Délices Cacaotés','La Truffe de Chocolat','Cacao & Co'],
  rotisserie:  ['Rôtisserie du Marché','Le Poulet Doré','Chez le Rôtisseur','La Broche d\'Or','Rôtisserie Artisanale'],
  creperie:    ['Crêperie Bretonne','Les Crêpes de Marie','La Galette du Coin','Crêperie Artisanale','Breiz Crêperie'],
  other:       [],
};

// ── Type background images (Unsplash, free-to-use) ────────────────────────────
const TYPE_IMAGES = {
  bakery:      'photo-1509440159596-0249088772ff',
  pizzeria:    'photo-1513104890138-7c749659a591',
  pastry:      'photo-1558961363-fa8fdf82db35',
  restaurant:  'photo-1414235077428-338989a2e8c0',
  cafe:        'photo-1495474472287-4d71bcdd2085',
  fromagerie:  'photo-1452195100486-9cc7a74d9176',
  boucherie:   'photo-1529692236671-f1f6cf9683ba',
  traiteur:    'photo-1547592166-23ac45744acd',
  glacier:     'photo-1501443762994-82bd5dace89a',
  foodtruck:   'photo-1565123409695-7b5ef63a2efb',
  sushi:       'photo-1579584425555-c3ce17fd4351',
  chocolatier: 'photo-1511381939415-e44015466834',
  rotisserie:  'photo-1598103442097-8b74394b95c3',
  creperie:    'photo-1519676867240-f03562e64548',
};

function typeImageUrl(type) {
  const id = TYPE_IMAGES[type];
  if (!id) return null;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=65`;
}

const C = {
  bg: '#F6F6F6', card: '#FFFFFF', black: '#000000',
  primary: '#FF5000', text: '#000000', muted: '#757575',
  faint: '#BBBBBB', border: '#EEEEEE', light: '#FFF0EB',
};

const FREE_DAILY_LIMIT = 5;

function todayKey() { return 'hn_daily_' + new Date().toISOString().slice(0, 10); }
function getDailyCount() { return parseInt(localStorage.getItem(todayKey()) || '0', 10); }
function incDailyCount() { localStorage.setItem(todayKey(), getDailyCount() + 1); }

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
  const [showUpgrade, setShowUpgrade]      = useState(false);
  const [proJustActivated, setProJustActivated] = useState(false);
  const [dailyCount, setDailyCount]        = useState(getDailyCount);
  const [liveUrl, setLiveUrl]              = useState('');
  const [photoFile, setPhotoFile]          = useState(null);
  const [photoPreview, setPhotoPreview]    = useState('');
  const [confirmCounts, setConfirmCounts]  = useState({});
  const [myConfirmations, setMyConfirmations] = useState(() => JSON.parse(localStorage.getItem('hn_confirmed') || '[]'));
  const [gpsWarning, setGpsWarning]        = useState(false);
  const [searchQuery, setSearchQuery]      = useState('');
  const [freshnessFilter, setFreshnessFilter] = useState('all');
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [shareCopied, setShareCopied]      = useState(false);

  const t = T[lang].app;

  // ── Plan helpers ──────────────────────────────────────────────────────────
  const isPro = myVenue?.plan === 'pro';
  const dailyLeft = Math.max(0, FREE_DAILY_LIMIT - dailyCount);
  const canAnnounce = isPro || dailyLeft > 0;

  useEffect(() => { localStorage.setItem('hn_lang', lang); }, [lang]);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);
  useEffect(() => { localStorage.setItem('hn_favs', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('hn_mine', JSON.stringify(myVenue)); }, [myVenue]);
  useEffect(() => { setProduct(PRODUCTS_BY_TYPE[venueType]?.[0] || ''); setCustomProduct(''); }, [venueType]);

  // ── Deep link ?v=venueId ─────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vId = params.get('v');
    if (vId) { setSelectedVenueId(vId); goToApp('explore'); window.history.replaceState({}, '', '/'); }
  }, []); // eslint-disable-line

  // ── Stripe return: activate Pro ───────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true' && myVenue) {
      const upgraded = { ...myVenue, plan: 'pro' };
      setMyVenue(upgraded);
      supabase.from('venues').update({ plan: 'pro' }).eq('id', myVenue.id);
      setProJustActivated(true);
      setTimeout(() => setProJustActivated(false), 5000);
      goToApp('venue');
      window.history.replaceState({}, '', '/');
    }
  }, []); // eslint-disable-line

  const loadData = useCallback(async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - FRESHNESS_LIMIT_MS).toISOString();
    const [{ data: v }, { data: i }] = await Promise.all([
      supabase.from('venues').select('*'),
      supabase.from('items').select('*').gte('at', cutoff).order('at', { ascending: false }),
    ]);
    if (v) setVenues(v);
    if (i) {
      setItems(i);
      if (i.length > 0) {
        const ids = i.map(it => it.id);
        const { data: confs } = await supabase.from('confirmations').select('item_id').in('item_id', ids);
        if (confs) {
          const counts = {};
          confs.forEach(c => { counts[c.item_id] = (counts[c.item_id] || 0) + 1; });
          setConfirmCounts(counts);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const ch = supabase.channel('hn-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' },  p => setItems(prev => [p.new, ...prev]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' },  p => setItems(prev => prev.filter(i => i.id !== p.old.id)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'venues' }, p => setVenues(prev => [...prev, p.new]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'venues' }, p => setVenues(prev => prev.map(v => v.id === p.new.id ? { ...v, ...p.new } : v)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'confirmations' }, p => setConfirmCounts(prev => ({ ...prev, [p.new.item_id]: (prev[p.new.item_id] || 0) + 1 })))
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
    try {
      const bt = t.businessTypes.find(b => b.id === venueType);
      const v = { id: crypto.randomUUID(), name: venueName.trim(), type: venueType, icon: bt.icon, lat: loc.lat, lng: loc.lng, plan: 'free' };
      const { error } = await supabase.from('venues').insert(v);
      if (error) throw error;
      setMyVenue(v); setVenueName(''); setVenueScreen('dashboard');
    } catch (e) {
      setLocError(lang === 'fr' ? 'Erreur d\'inscription. Réessayez.' : 'Registration failed. Please retry.');
    }
    setSaving(false);
  };

  const announce = async () => {
    const name = customProduct.trim() || product;
    if (!name) return;

    // GPS verification — warn if > 500m from venue
    if (userLoc && myVenue) {
      const dist = getDistance(userLoc.lat, userLoc.lng, myVenue.lat, myVenue.lng);
      if (dist > 0.5) setGpsWarning(true);
      else setGpsWarning(false);
    }

    // Vérification côté serveur (non contournable via localStorage)
    if (!isPro) {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const { count } = await supabase.from('items')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', myVenue.id)
        .gte('at', todayStart.toISOString());
      if (count >= FREE_DAILY_LIMIT) { setShowUpgrade(true); setSaving(false); return; }
    }
    setSaving(true);
    try {
      // Photo upload
      let photo_url = null;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const fileName = `${myVenue.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('fournees').upload(fileName, photoFile, { cacheControl: '3600', upsert: false });
        if (!upErr) {
          const { data: pubData } = supabase.storage.from('fournees').getPublicUrl(fileName);
          photo_url = pubData.publicUrl;
        }
      }

      const { error } = await supabase.from('items').insert({
        id: crypto.randomUUID(), venue_id: myVenue.id, product: name, quantity, at: new Date().toISOString(),
        live_url: liveUrl.trim() || null,
        photo_url,
      });
      if (error) throw error;
      setCustomProduct(''); setLiveUrl(''); setPhotoFile(null); setPhotoPreview('');
      if (!isPro) { incDailyCount(); setDailyCount(getDailyCount()); }
      setJustDone(true);
      setTimeout(() => setJustDone(false), 4000);
    } catch {
      // silently ignore — user can retry
    }
    setSaving(false);
  };

  const removeItem   = (id) => supabase.from('items').delete().eq('id', id);
  const toggleFav    = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const confirmItem = async (itemId) => {
    if (myConfirmations.includes(itemId)) return;
    const updated = [...myConfirmations, itemId];
    setMyConfirmations(updated);
    localStorage.setItem('hn_confirmed', JSON.stringify(updated));
    await supabase.from('confirmations').insert({ item_id: itemId });
  };

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
    .filter(v => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return v.name.toLowerCase().includes(q) || v.hotItems.some(it => it.product.toLowerCase().includes(q));
    })
    .filter(v => {
      if (freshnessFilter === 'all') return true;
      const mins = (Date.now() - new Date(v.hotItems[0].at)) / 60000;
      if (freshnessFilter === 'hot')   return mins < 15;
      if (freshnessFilter === 'vfresh') return mins < 30;
      if (freshnessFilter === 'fresh')  return mins < 60;
      return true;
    })
    // Pro venues float up at equal distance (±200m)
    .sort((a, b) => {
      const da = a.distance ?? 9999, db = b.distance ?? 9999;
      if (Math.abs(da - db) < 0.2 && a.plan !== b.plan) return a.plan === 'pro' ? -1 : 1;
      return da - db;
    });

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

  const stripeLink = process.env.REACT_APP_STRIPE_LINK || 'https://buy.stripe.com/aFa6oG0wc6iY5dwcVh8EM00';

  const shareVenue = () => {
    const url = `${window.location.origin}/?v=${myVenue.id}`;
    if (navigator.share) {
      navigator.share({ title: myVenue.name, text: lang === 'fr' ? 'Retrouvez mes produits frais en direct !' : 'See my fresh products live!', url });
    } else {
      navigator.clipboard?.writeText(url).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); });
    }
  };

  // ── Upgrade modal ─────────────────────────────────────────────────────────
  const UpgradeModal = () => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={() => setShowUpgrade(false)}>
      <div className="modal-enter" style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '32px 24px 40px', width: '100%', maxWidth: 480 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.5px' }}>{t.upgradeTitle}</h2>
          <p style={{ fontSize: 15, color: '#757575', margin: 0, lineHeight: 1.5 }}>{t.upgradeSub}</p>
        </div>
        <div style={{ background: '#FFF0EB', borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#FF5000' }}>{t.upgradePrice}</span>
        </div>
        <a href={`${stripeLink}?client_reference_id=${myVenue?.id}`}
          style={{ display: 'block', width: '100%', padding: '16px', borderRadius: 14, fontFamily: 'inherit', cursor: 'pointer', fontSize: 16, fontWeight: 700, border: 'none', background: 'linear-gradient(135deg,#FF5000,#FF8C42)', color: 'white', textAlign: 'center', textDecoration: 'none', boxShadow: '0 4px 20px rgba(255,80,0,0.35)', boxSizing: 'border-box' }}>
          {t.upgradeBtn}
        </a>
        <p style={{ fontSize: 12, color: '#AAAAAA', textAlign: 'center', margin: '10px 0 16px' }}>{t.upgradeNote}</p>
        <button onClick={() => setShowUpgrade(false)} style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 12, border: '2px solid #EEEEEE', background: 'transparent', color: '#757575', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          {t.upgradeLater}
        </button>
      </div>
    </div>
  );

  // ── Venue detail modal ────────────────────────────────────────────────────
  const selectedVenue = selectedVenueId ? enriched.find(v => v.id === selectedVenueId) || venues.find(v => v.id === selectedVenueId) : null;
  const VenueDetailModal = () => {
    if (!selectedVenue) return null;
    const sv = { ...selectedVenue, hotItems: selectedVenue.hotItems || items.filter(i => i.venue_id === selectedVenue.id), bt: selectedVenue.bt || t.businessTypes.find(b => b.id === selectedVenue.type) };
    const imgUrl = typeImageUrl(sv.type);
    const topIt  = sv.hotItems[0];
    if (!topIt) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={() => setSelectedVenueId(null)}>
        <div className="modal-enter" style={{ background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', paddingBottom: 32 }}
          onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div style={{ height: 200, position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0',
            background: topIt.photo_url ? `url(${topIt.photo_url}) center/cover` : imgUrl ? `linear-gradient(to bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.5)),url(${imgUrl}) center/cover` : gradientByType(sv.type),
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!topIt.photo_url && <span style={{ fontSize: 72, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}>{sv.icon}</span>}
            <button onClick={() => setSelectedVenueId(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.6)', borderRadius: 100, padding: '4px 12px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{freshnessInfo(topIt.at, t.freshnessLabels).label}</span>
            </div>
            {sv.distance !== null && sv.distance !== undefined && (
              <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.6)', borderRadius: 100, padding: '4px 10px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>
                  {sv.distance < 1 ? `${Math.round(sv.distance * 1000)}m` : `${sv.distance.toFixed(1)}km`}
                </span>
              </div>
            )}
          </div>
          {/* Content */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 3px', letterSpacing: '-0.3px' }}>{sv.name}</h2>
                <span style={{ fontSize: 13, color: C.muted }}>{sv.bt?.icon} {sv.bt?.label}</span>
              </div>
              {sv.plan === 'pro' && <span style={{ fontSize: 11, fontWeight: 800, color: '#FF5000', background: '#FFF0EB', padding: '4px 10px', borderRadius: 8, flexShrink: 0 }}>⭐ PRO</span>}
            </div>
            {/* Items */}
            {sv.hotItems.map(it => {
              const f = freshnessInfo(it.at, t.freshnessLabels);
              const q = t.quantities.find(q => q.id === it.quantity);
              const mins = Math.floor((Date.now() - new Date(it.at)) / 60000);
              const confs = confirmCounts[it.id] || 0;
              const lp = it.live_url ? detectLivePlatform(it.live_url) : null;
              return (
                <div key={it.id} style={{ background: C.bg, borderRadius: 16, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{it.product}</span>
                      {q && <span style={{ fontSize: 14 }}>{q.emoji}</span>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>{f.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{t.timeAgo(mins)}</span>
                    {confs > 0 && <span style={{ fontSize: 12, color: C.muted }}>👍 {confs}</span>}
                  </div>
                  <div style={{ height: 3, background: C.border, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${f.bar}%`, background: f.color, borderRadius: 10 }} />
                  </div>
                  {lp && (
                    <a href={it.live_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: '#E53935', borderRadius: 100, padding: '4px 12px', textDecoration: 'none' }}>
                      <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>🔴 LIVE · {lp.name}</span>
                    </a>
                  )}
                  {it.photo_url && <img src={it.photo_url} alt={it.product} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10, marginTop: 8, display: 'block' }} />}
                </div>
              );
            })}
            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => confirmItem(topIt.id)} disabled={myConfirmations.includes(topIt.id)}
                style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: myConfirmations.includes(topIt.id) ? 'default' : 'pointer', background: myConfirmations.includes(topIt.id) ? '#E8F5E9' : C.bg, color: myConfirmations.includes(topIt.id) ? '#1A8917' : C.muted }}>
                {myConfirmations.includes(topIt.id) ? `✅ ${lang === 'fr' ? "J'y étais !" : 'I was there!'}` : `👍 ${lang === 'fr' ? "J'y étais ✓" : 'I was there ✓'}`}
              </button>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sv.name)}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: '13px', borderRadius: 12, background: C.black, color: 'white', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                📍 {lang === 'fr' ? 'Y aller' : 'Get there'}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  if (view === 'landing') {
    return <LandingPage onExplore={() => goToApp('explore')} onRegister={() => goToApp('venue')} lang={lang} setLang={setLang} />;
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {showUpgrade && <UpgradeModal />}
      {selectedVenueId && <VenueDetailModal />}

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

              {(tab === 'explore' || tab === 'favorites') && (
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 15, width: '100%', fontFamily: 'inherit' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
                  )}
                </div>
              )}
            </div>

            {/* Category chips */}
            {tab === 'explore' && activeTypes.length > 0 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 16px 0', scrollbarWidth: 'none' }}>
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

            {/* Freshness filter chips */}
            {tab === 'explore' && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px 14px', scrollbarWidth: 'none' }}>
                {[
                  { id: 'all',    icon: '⚡', label: lang === 'fr' ? 'Tous'       : 'All'        },
                  { id: 'hot',    icon: '🔥', label: lang === 'fr' ? 'Tout chaud' : 'Just out'   },
                  { id: 'vfresh', icon: '🧡', label: lang === 'fr' ? 'Très frais' : 'Very fresh' },
                  { id: 'fresh',  icon: '🟢', label: lang === 'fr' ? 'Frais'      : 'Fresh'      },
                ].map(f => (
                  <button key={f.id} onClick={() => setFreshnessFilter(f.id)} style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                    fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: 'none',
                    background: freshnessFilter === f.id ? C.primary : C.card,
                    color: freshnessFilter === f.id ? 'white' : C.muted,
                    boxShadow: freshnessFilter === f.id ? '0 2px 10px rgba(255,80,0,0.3)' : '0 1px 4px rgba(0,0,0,0.07)',
                  }}>
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ padding: '0 16px' }}>
              {loading && [0,1,2].map(i => (
                <div key={i} style={{ borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
                  <div className="shimmer-bg" style={{ height: 160, borderRadius: '20px 20px 0 0' }} />
                  <div style={{ background: 'white', padding: '14px 16px 18px', borderRadius: '0 0 20px 20px' }}>
                    <div className="shimmer-bg" style={{ height: 16, borderRadius: 8, width: '60%', marginBottom: 10 }} />
                    <div className="shimmer-bg" style={{ height: 12, borderRadius: 8, width: '40%' }} />
                  </div>
                </div>
              ))}
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
                const imgUrl = typeImageUrl(v.type);
                return (
                  <div key={v.id} className="card-enter" onClick={() => setSelectedVenueId(v.id)} style={{ background: C.card, borderRadius: 20, marginBottom: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', animationDelay: `${idx * 60}ms`, cursor: 'pointer' }}>
                    <div style={{
                      height: 160, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      background: topItem.photo_url
                        ? `url(${topItem.photo_url}) center/cover`
                        : imgUrl
                          ? `linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%), url(${imgUrl}) center/cover`
                          : gradientByType(v.type),
                      backgroundColor: gradientByType(v.type).includes('gradient') ? undefined : gradientByType(v.type),
                    }}>
                      {!topItem.photo_url && !imgUrl && (
                        <span style={{ fontSize: 64, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{v.icon}</span>
                      )}
                      {!topItem.photo_url && imgUrl && (
                        <span style={{ fontSize: 52, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))', position: 'absolute' }}>{v.icon}</span>
                      )}
                      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: 100, padding: '4px 12px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{f.label}</span>
                      </div>
                      {topItem.live_url && (() => {
                        const lp = detectLivePlatform(topItem.live_url);
                        return (
                          <a href={topItem.live_url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: '#E53935', borderRadius: 100, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', zIndex: 5 }}>
                            <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>🔴 LIVE · {lp.name}</span>
                          </a>
                        );
                      })()}
                      <button onClick={e => { e.stopPropagation(); toggleFav(v.id); }} style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{v.name}</span>
                            {v.plan === 'pro' && <span style={{ fontSize: 10, fontWeight: 800, color: '#FF5000', background: '#FFF0EB', padding: '2px 6px', borderRadius: 6 }}>⭐ PRO</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, color: C.muted }}>{v.bt?.label} · {t.timeAgo(mins)}</span>
                            <button onClick={() => {
                              if (window.confirm(lang === 'fr' ? 'Signaler une fausse annonce ?' : 'Report a false announcement?')) {
                                supabase.from('reports').insert({ venue_id: v.id, item_id: topItem.id, at: new Date().toISOString() }).then(() => {});
                                alert(lang === 'fr' ? 'Merci, signalement envoyé.' : 'Thank you, report sent.');
                              }
                            }} style={{ background: 'none', border: 'none', color: C.faint, fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'underline' }}>
                              {lang === 'fr' ? 'Signaler' : 'Report'}
                            </button>
                          </div>
                        </div>
                        {v.hotItems.length > 1 && (
                          <div style={{ background: C.black, color: 'white', borderRadius: 100, padding: '3px 10px', fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 8, marginTop: 2 }}>
                            {t.itemsMore(v.hotItems.length - 1)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
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
                      {/* Confirm button */}
                      <button onClick={e => { e.stopPropagation(); confirmItem(topItem.id); }} style={{
                        background: myConfirmations.includes(topItem.id) ? '#E8F5E9' : C.bg,
                        border: 'none', borderRadius: 100, padding: '7px 14px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        cursor: myConfirmations.includes(topItem.id) ? 'default' : 'pointer',
                        fontFamily: 'inherit',
                      }}>
                        <span style={{ fontSize: 14 }}>{myConfirmations.includes(topItem.id) ? '✅' : '👍'}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: myConfirmations.includes(topItem.id) ? '#1A8917' : C.muted }}>
                          {myConfirmations.includes(topItem.id)
                            ? (lang === 'fr' ? 'J\'y étais !' : 'I was there!')
                            : (lang === 'fr' ? 'J\'y étais ✓' : 'I was there ✓')}
                          {(confirmCounts[topItem.id] || 0) > 0 && ` · ${confirmCounts[topItem.id]}`}
                        </span>
                      </button>
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
                  <input value={venueName} onChange={e => setVenueName(e.target.value.slice(0, 60))}
                    placeholder={t.venueNamePlaceholder} style={inputStyle} maxLength={60}
                    list="venue-suggestions" autoComplete="off" />
                  <datalist id="venue-suggestions">
                    {(VENUE_SUGGESTIONS[venueType] || [])
                      .filter(s => venueName.length < 3 || s.toLowerCase().includes(venueName.toLowerCase()))
                      .map(s => <option key={s} value={s} />)
                    }
                  </datalist>
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
                    {/* ── Plan status ── */}
                    {proJustActivated && (
                      <div style={{ background: '#E8F5E9', borderRadius: 16, padding: '14px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>⭐</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A8917' }}>{t.proActivated}</span>
                      </div>
                    )}
                    <div style={{ background: isPro ? 'linear-gradient(135deg,#FF5000,#FF8C42)' : C.card, borderRadius: 16, padding: '14px 18px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: isPro ? '0 4px 16px rgba(255,80,0,0.25)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isPro ? 'rgba(255,255,255,0.7)' : C.muted, marginBottom: 2 }}>{isPro ? t.planPro : t.planFree}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: isPro ? 'white' : C.text }}>
                          {isPro ? '∞ annonces' : (dailyLeft > 0 ? t.dailyLeft(dailyLeft) : t.dailyExhausted)}
                        </div>
                      </div>
                      {!isPro && (
                        <button onClick={() => setShowUpgrade(true)} style={{ background: 'linear-gradient(135deg,#FF5000,#FF8C42)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          ⭐ Pro
                        </button>
                      )}
                    </div>

                    {/* ── Stats rapides ── */}
                    {myItems.length > 0 && (() => {
                      const totalConfs = myItems.reduce((s, it) => s + (confirmCounts[it.id] || 0), 0);
                      const liveItems  = myItems.filter(it => it.live_url).length;
                      const photoItems = myItems.filter(it => it.photo_url).length;
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                          {[
                            { label: lang === 'fr' ? 'Confirmations' : 'Confirmations', value: totalConfs, icon: '👍' },
                            { label: lang === 'fr' ? 'En direct' : 'Live items',        value: myItems.length, icon: '🔥' },
                            { label: lang === 'fr' ? 'Preuves' : 'Proofs',              value: liveItems + photoItems, icon: '📸' },
                          ].map((stat, si) => (
                            <div key={si} style={{ background: C.card, borderRadius: 16, padding: '14px 10px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                              <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
                              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1 }}>{stat.value}</div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

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
                      <input value={customProduct} onChange={e => setCustomProduct(e.target.value.slice(0, 50))}
                        placeholder={productList.length > 0 ? t.customPlaceholder : t.customPlaceholderOnly}
                        style={inputStyle} maxLength={50} />

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

                      {/* GPS warning */}
                      {gpsWarning && (
                        <div style={{ background: '#FFF8E1', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>📍</span>
                          <span style={{ fontSize: 13, color: '#F57F17', fontWeight: 600 }}>
                            {lang === 'fr' ? 'Vous semblez loin de votre établissement. Êtes-vous bien sur place ?' : 'You seem far from your venue. Are you on-site?'}
                          </span>
                        </div>
                      )}

                      {/* Live stream URL */}
                      <label style={labelStyle}>
                        🔴 {lang === 'fr' ? 'Lien live (optionnel)' : 'Live link (optional)'}
                      </label>
                      <input
                        value={liveUrl}
                        onChange={e => setLiveUrl(e.target.value)}
                        placeholder={lang === 'fr' ? 'YouTube, Instagram, TikTok, Facebook...' : 'YouTube, Instagram, TikTok, Facebook...'}
                        style={{ ...inputStyle, fontSize: 13 }}
                      />

                      {/* Photo */}
                      <label style={labelStyle}>
                        📸 {lang === 'fr' ? 'Photo de la fournée (optionnel)' : 'Batch photo (optional)'}
                      </label>
                      {photoPreview
                        ? (
                          <div style={{ position: 'relative', marginBottom: 14 }}>
                            <img src={photoPreview} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
                            <button onClick={() => { setPhotoFile(null); setPhotoPreview(''); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: 'white', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 12, border: '2px dashed #EEEEEE', background: 'white', cursor: 'pointer', fontSize: 13, color: C.muted, fontFamily: 'inherit', fontWeight: 600, boxSizing: 'border-box', marginBottom: 14 }}>
                            📷 {lang === 'fr' ? 'Prendre / choisir une photo' : 'Take / choose a photo'}
                            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              setPhotoFile(f);
                              const reader = new FileReader();
                              reader.onload = ev => setPhotoPreview(ev.target.result);
                              reader.readAsDataURL(f);
                            }} />
                          </label>
                        )
                      }

                      {justDone
                        ? <div style={{ background: '#E8F5E9', borderRadius: 12, padding: 14, textAlign: 'center', color: '#1A8917', fontWeight: 700, fontSize: 14 }}>{t.liveSuccess}</div>
                        : !canAnnounce
                          ? <button onClick={() => setShowUpgrade(true)} style={{ display: 'block', width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#FF5000,#FF8C42)', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 8 }}>⭐ {t.upgradeBtn}</button>
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

                    {/* ── Share link ── */}
                    <button onClick={shareVenue} style={{ display: 'block', width: '100%', padding: '14px 20px', borderRadius: 14, border: 'none', background: shareCopied ? '#E8F5E9' : 'linear-gradient(135deg,#0A0A0A,#2C2C2C)', color: shareCopied ? '#1A8917' : 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 8 }}>
                      {shareCopied ? `✅ ${lang === 'fr' ? 'Lien copié !' : 'Link copied!'}` : `🔗 ${lang === 'fr' ? 'Partager mon lien live' : 'Share my live link'}`}
                    </button>

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
    bakery:      'linear-gradient(135deg,#FF8C42,#FF5000)',
    pizzeria:    'linear-gradient(135deg,#FF6B6B,#C0392B)',
    pastry:      'linear-gradient(135deg,#F48FB1,#E91E63)',
    restaurant:  'linear-gradient(135deg,#81C784,#2E7D32)',
    cafe:        'linear-gradient(135deg,#A1887F,#4E342E)',
    fromagerie:  'linear-gradient(135deg,#FFE082,#F9A825)',
    boucherie:   'linear-gradient(135deg,#EF9A9A,#B71C1C)',
    traiteur:    'linear-gradient(135deg,#A5D6A7,#1B5E20)',
    glacier:     'linear-gradient(135deg,#80DEEA,#00838F)',
    foodtruck:   'linear-gradient(135deg,#FFCC80,#E65100)',
    sushi:       'linear-gradient(135deg,#EF9A9A,#880E4F)',
    chocolatier: 'linear-gradient(135deg,#BCAAA4,#3E2723)',
    rotisserie:  'linear-gradient(135deg,#FFAB91,#BF360C)',
    creperie:    'linear-gradient(135deg,#F0F4C3,#827717)',
    other:       'linear-gradient(135deg,#B0BEC5,#546E7A)',
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

function detectLivePlatform(url) {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/.test(url))  return { name: 'YouTube' };
  if (/instagram\.com/.test(url))          return { name: 'Instagram' };
  if (/tiktok\.com/.test(url))             return { name: 'TikTok' };
  if (/facebook\.com|fb\.watch/.test(url)) return { name: 'Facebook' };
  if (/twitch\.tv/.test(url))              return { name: 'Twitch' };
  return { name: 'Live' };
}
