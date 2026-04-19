import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from './supabaseClient';
import LandingPage from './LandingPage';
import T from './translations';
import './animations.css';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function freshnessInfo(dateStr, labels) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  const bar = Math.max(0, Math.round(100 - (mins / 120) * 100));
  if (mins < 15) return { label: labels.justOut,   color: '#FF5000', bg: '#FFF0EB', bar };
  if (mins < 30) return { label: labels.veryFresh, color: '#FF7A00', bg: '#FFF5EC', bar };
  if (mins < 60) return { label: labels.fresh,     color: '#1A8917', bg: '#E8F5E9', bar };
  if (mins < 90) return { label: labels.stillWarm, color: '#5F9EA0', bg: '#E8F4F4', bar };
  return             { label: labels.fading,       color: '#ADADAD', bg: '#F5F5F5', bar };
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

const VENUE_SUGGESTIONS = {
  bakery:      ['Boulangerie du Coin','Boulangerie Martin','Le Pain Doré','Au Bon Pain','La Mie Enchantée','Le Fournil du Village','Boulangerie Artisanale','Le Grenier à Pain'],
  pizzeria:    ['Pizzeria Roma','La Bella Italia','Pizza Napoli','Pizzeria del Corso','La Piazza','Pizzeria Calabrese'],
  pastry:      ['Pâtisserie du Centre','Maison Martin','Les Délices Sucrés','Pâtisserie Artisanale','La Tarte et la Douceur'],
  restaurant:  ['Le Bistrot du Coin','Chez Marie','Le Petit Chef','La Maison','Restaurant du Marché'],
  cafe:        ['Café de la Place','Le Petit Café','Café des Artistes','Le Zinc','Café Central'],
  fromagerie:  ['La Fromagerie du Marché','Maison du Fromage','L\'Affineur','Fromagerie Artisanale'],
  boucherie:   ['Boucherie du Village','Maison Martin','La Boucherie Artisanale','Au Bœuf Saignant'],
  traiteur:    ['Traiteur Dupont','La Table du Traiteur','Les Saveurs du Marché','Épicerie Fine'],
  glacier:     ['La Crème Glacée','Glacier Artisanal','Le Petit Gelato','Glacerie du Soleil'],
  foodtruck:   ['Le Truck Gourmand','Street Food Express','Le Camion du Chef','Food Truck du Marché'],
  sushi:       ['Sushi Express','Tokyo Sushi','Sakura Restaurant','Sushi Bar','Japan Food'],
  chocolatier: ['Chocolaterie Artisanale','Maison du Chocolat','Les Délices Cacaotés'],
  rotisserie:  ['Rôtisserie du Marché','Le Poulet Doré','Chez le Rôtisseur','La Broche d\'Or'],
  creperie:    ['Crêperie Bretonne','Les Crêpes de Marie','La Galette du Coin','Crêperie Artisanale'],
  other:       [],
};

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
  bg: '#F2F2F7', card: '#FFFFFF', black: '#0A0A0A',
  primary: '#FF5000', text: '#0A0A0A', muted: '#8A8A8E',
  faint: '#C7C7CC', border: '#E8E8ED', light: '#FFF0EB',
  surface: 'rgba(255,255,255,0.72)',
};

const TYPE_ACCENT = {
  bakery:'#FF7A00', pizzeria:'#D32F2F', pastry:'#C2185B', restaurant:'#2E7D32',
  cafe:'#6D4C41', fromagerie:'#F9A825', boucherie:'#C62828', traiteur:'#388E3C',
  glacier:'#00838F', foodtruck:'#EF6C00', sushi:'#C2185B', chocolatier:'#5D4037',
  rotisserie:'#D84315', creperie:'#F57F17',
};

const FREE_DAILY_LIMIT = 5;
function todayKey() { return 'hn_daily_' + new Date().toISOString().slice(0, 10); }
function getDailyCount() { return parseInt(localStorage.getItem(todayKey()) || '0', 10); }
function incDailyCount() { localStorage.setItem(todayKey(), getDailyCount() + 1); }
const PHOTO_OVERLAY = 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.75) 100%)';

function fmtDist(km, lang = 'fr') {
  const m = Math.round(km * 1000);
  const label = km < 1 ? `${m}m` : `${km.toFixed(1)}km`;
  const walkMins = Math.round((km / 5) * 60);
  if (walkMins < 2) return lang === 'fr' ? `${label} · à pied` : `${label} · walking`;
  if (walkMins > 20) return label;
  return lang === 'fr' ? `${label} · ~${walkMins} min` : `${label} · ~${walkMins} min`;
}

function gradientByType(type) {
  const g = {
    bakery:'linear-gradient(160deg,#FF9A3C 0%,#FF5000 55%,#CC2900 100%)',
    pizzeria:'linear-gradient(160deg,#FF7043 0%,#D32F2F 55%,#880E27 100%)',
    pastry:'linear-gradient(160deg,#F8BBD0 0%,#E91E8C 55%,#880E4F 100%)',
    restaurant:'linear-gradient(160deg,#A5D6A7 0%,#2E7D32 55%,#1B3B1B 100%)',
    cafe:'linear-gradient(160deg,#BCAAA4 0%,#6D4C41 55%,#3E2723 100%)',
    fromagerie:'linear-gradient(160deg,#FFF176 0%,#F9A825 55%,#E65100 100%)',
    boucherie:'linear-gradient(160deg,#FFCDD2 0%,#C62828 55%,#7B1111 100%)',
    traiteur:'linear-gradient(160deg,#C8E6C9 0%,#388E3C 55%,#1B5E20 100%)',
    glacier:'linear-gradient(160deg,#B2EBF2 0%,#00838F 55%,#006064 100%)',
    foodtruck:'linear-gradient(160deg,#FFE0B2 0%,#EF6C00 55%,#BF360C 100%)',
    sushi:'linear-gradient(160deg,#FCE4EC 0%,#C2185B 55%,#6A0032 100%)',
    chocolatier:'linear-gradient(160deg,#D7CCC8 0%,#5D4037 55%,#321911 100%)',
    rotisserie:'linear-gradient(160deg,#FFE0B2 0%,#D84315 55%,#8B2500 100%)',
    creperie:'linear-gradient(160deg,#FFF9C4 0%,#F57F17 55%,#9E5E00 100%)',
    other:'linear-gradient(160deg,#CFD8DC 0%,#546E7A 55%,#263238 100%)',
  };
  return g[type] || g.other;
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

const labelStyle = { display:'block', fontSize:11, fontWeight:700, color:'#757575', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:8 };
const inputStyle = { width:'100%', padding:'14px 16px', borderRadius:14, border:'none', fontSize:15, fontFamily:'inherit', fontWeight:500, color:'#000', background:'#F2F2F7', boxSizing:'border-box', marginBottom:14, appearance:'none', outline:'none' };
function btnStyle(bg, ghost=false) {
  return { display:'block', width:'100%', padding:'15px 20px', borderRadius:14, border: ghost?'1.5px solid #E5E5EA':'none', background: ghost?'transparent':'linear-gradient(135deg,#FF5000,#FF8C42)', color: ghost?'#8A8A8E':'white', fontSize:15, fontWeight:700, fontFamily:'inherit', cursor:'pointer', marginBottom:8, boxShadow: ghost?'none':'0 4px 18px rgba(255,80,0,0.3)' };
}
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
  const [sortMode, setSortMode]            = useState('distance');
  const [distFilter, setDistFilter]        = useState(0);
  const [onboarded, setOnboarded]          = useState(() => !!localStorage.getItem('hn_onboarded'));
  const [onboardSlide, setOnboardSlide]    = useState(0);
  const [isOpen, setIsOpen]               = useState(() => myVenue?.is_open !== false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [touchStartY, setTouchStartY]      = useState(null);
  const [toast, setToast]                  = useState(null);
  const scrollRef = useRef(null);
  const t = T[lang].app;
  const isPro = myVenue?.plan === 'pro';
  const dailyLeft = Math.max(0, FREE_DAILY_LIMIT - dailyCount);
  const canAnnounce = isPro || dailyLeft > 0;
  const stripeLink = process.env.REACT_APP_STRIPE_LINK || 'https://buy.stripe.com/aFa6oG0wc6iY5dwcVh8EM00';

  useEffect(() => { localStorage.setItem('hn_lang', lang); }, [lang]);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);
  useEffect(() => { const hot = items.filter(i => (Date.now()-new Date(i.at))/60000 < 15).length; document.title = hot > 0 ? `(${hot} 🔥) HotNow` : 'HotNow'; }, [items, now]);
  useEffect(() => { scrollRef.current?.scrollTo({ top:0, behavior:'smooth' }); }, [tab]);
  useEffect(() => { localStorage.setItem('hn_favs', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('hn_mine', JSON.stringify(myVenue)); }, [myVenue]);
  useEffect(() => { setProduct(PRODUCTS_BY_TYPE[venueType]?.[0] || ''); setCustomProduct(''); }, [venueType]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vId = params.get('v'); const tabParam = params.get('tab');
    if (vId) { setSelectedVenueId(vId); goToApp('explore'); window.history.replaceState({}, '', '/'); }
    else if (tabParam === 'explore' || tabParam === 'venue') { goToApp(tabParam); window.history.replaceState({}, '', '/'); }
  }, []); // eslint-disable-line

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true' && myVenue) {
      const upgraded = { ...myVenue, plan: 'pro' };
      setMyVenue(upgraded);
      supabase.from('venues').update({ plan: 'pro' }).eq('id', myVenue.id);
      setProJustActivated(true); setTimeout(() => setProJustActivated(false), 5000);
      goToApp('venue'); window.history.replaceState({}, '', '/');
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
        if (confs) { const counts = {}; confs.forEach(c => { counts[c.item_id] = (counts[c.item_id]||0)+1; }); setConfirmCounts(counts); }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const ch = supabase.channel('hn-rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'items' }, p => {
        setItems(prev => [p.new, ...prev]);
        setVenues(allVenues => {
          setUserLoc(loc => {
            const venue = allVenues.find(v => v.id === p.new.venue_id);
            if (!venue) return loc;
            if (myVenue && venue.id === myVenue.id) return loc;
            const dist = loc ? getDistance(loc.lat, loc.lng, venue.lat, venue.lng) : null;
            if (!dist || dist <= 2) { setToast({ venueName: venue.name, product: p.new.product, icon: venue.icon||'🔥', dist }); setTimeout(() => setToast(null), 5000); }
            return loc;
          });
          return allVenues;
        });
      })
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'items' },  p => setItems(prev => prev.filter(i => i.id !== p.old.id)))
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'venues' }, p => setVenues(prev => [...prev, p.new]))
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'venues' }, p => setVenues(prev => prev.map(v => v.id===p.new.id ? {...v,...p.new} : v)))
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'confirmations' }, p => setConfirmCounts(prev => ({...prev, [p.new.item_id]:(prev[p.new.item_id]||0)+1})))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [loadData]); // eslint-disable-line

  useEffect(() => { const cutoff = Date.now()-FRESHNESS_LIMIT_MS; setItems(prev => prev.filter(i => new Date(i.at).getTime() > cutoff)); }, [now]); // eslint-disable-line

  const getLocation = useCallback((cb) => {
    if (!navigator.geolocation) { setLocError(t.locError); return; }
    navigator.geolocation.getCurrentPosition(
      p => { const l={lat:p.coords.latitude,lng:p.coords.longitude}; setUserLoc(l); setLocError(''); if(cb) cb(l); },
      () => setLocError(t.locError)
    );
  }, [t.locError]);

  useEffect(() => { if (tab==='explore'||tab==='favorites') getLocation(); }, [tab, getLocation]);

  const registerVenue = async (loc) => {
    setSaving(true);
    try {
      const bt = t.businessTypes.find(b => b.id === venueType);
      const v = { id: crypto.randomUUID(), name: venueName.trim(), type: venueType, icon: bt.icon, lat: loc.lat, lng: loc.lng, plan: 'free' };
      const { error } = await supabase.from('venues').insert(v);
      if (error) throw error;
      setMyVenue(v); setVenueName(''); setVenueScreen('dashboard');
    } catch { setLocError(lang==='fr' ? 'Erreur d\'inscription. Réessayez.' : 'Registration failed. Please retry.'); }
    setSaving(false);
  };

  const haptic = (pattern=[10]) => { try { navigator.vibrate?.(pattern); } catch(_) {} };

  const announce = async () => {
    const name = customProduct.trim() || product;
    if (!name) return;
    haptic([10,40,20]);
    if (userLoc && myVenue) {
      const dist = getDistance(userLoc.lat, userLoc.lng, myVenue.lat, myVenue.lng);
      if (dist > 0.5) setGpsWarning(true); else setGpsWarning(false);
    }
    if (!isPro) {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const { count } = await supabase.from('items').select('*',{count:'exact',head:true}).eq('venue_id',myVenue.id).gte('at',todayStart.toISOString());
      if (count >= FREE_DAILY_LIMIT) { setShowUpgrade(true); setSaving(false); return; }
    }
    setSaving(true);
    try {
      let photo_url = null;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const fileName = `${myVenue.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('fournees').upload(fileName, photoFile, { cacheControl:'3600', upsert:false });
        if (!upErr) { const { data: pubData } = supabase.storage.from('fournees').getPublicUrl(fileName); photo_url = pubData.publicUrl; }
      }
      const { error } = await supabase.from('items').insert({ id:crypto.randomUUID(), venue_id:myVenue.id, product:name, quantity, at:new Date().toISOString(), live_url:liveUrl.trim()||null, photo_url });
      if (error) throw error;
      setCustomProduct(''); setLiveUrl(''); setPhotoFile(null); setPhotoPreview('');
      if (!isPro) { incDailyCount(); setDailyCount(getDailyCount()); }
      setJustDone(true); setTimeout(() => setJustDone(false), 4000);
    } catch { /* retry */ }
    setSaving(false);
  };

  const removeItem = (id) => supabase.from('items').delete().eq('id', id);
  const toggleFav  = (id) => { haptic([8]); setFavorites(prev => prev.includes(id) ? prev.filter(f=>f!==id) : [...prev,id]); };

  const toggleOpen = async () => {
    const next = !isOpen; setIsOpen(next);
    const updated = { ...myVenue, is_open: next }; setMyVenue(updated);
    await supabase.from('venues').update({ is_open: next }).eq('id', myVenue.id);
  };

  const pullToRefresh = (e) => {
    if (e.touches[0].clientY - (touchStartY||0) > 70 && !pullRefreshing) {
      haptic([8,30,8]); setPullRefreshing(true);
      loadData().then(() => setTimeout(() => setPullRefreshing(false), 600));
    }
  };

  const confirmItem = async (itemId) => {
    if (myConfirmations.includes(itemId)) return;
    haptic([10,20,30]);
    const updated = [...myConfirmations, itemId];
    setMyConfirmations(updated); localStorage.setItem('hn_confirmed', JSON.stringify(updated));
    setToast(lang==='fr' ? '✅ Merci ! Confirmation envoyée' : '✅ Thanks! Confirmation sent');
    setTimeout(() => setToast(''), 2500);
    await supabase.from('confirmations').insert({ item_id: itemId });
  };

  const enriched = useMemo(() => venues
    .map(v => ({ ...v, distance: userLoc ? getDistance(userLoc.lat,userLoc.lng,v.lat,v.lng) : null, hotItems: items.filter(i=>i.venue_id===v.id), bt: t.businessTypes.find(b=>b.id===v.type) }))
    .filter(v => v.hotItems.length > 0)
    .filter(v => tab==='favorites' ? favorites.includes(v.id) : true)
    .filter(v => filterType==='all' || v.type===filterType)
    .filter(v => { if(!searchQuery.trim()) return true; const q=searchQuery.toLowerCase(); return v.name.toLowerCase().includes(q)||v.hotItems.some(it=>it.product.toLowerCase().includes(q)); })
    .filter(v => { if(freshnessFilter==='all') return true; const mins=(Date.now()-new Date(v.hotItems[0].at))/60000; if(freshnessFilter==='hot') return mins<15; if(freshnessFilter==='vfresh') return mins<30; if(freshnessFilter==='fresh') return mins<60; return true; })
    .filter(v => distFilter===0 || v.distance==null || v.distance<=distFilter)
    .sort((a,b) => {
      if(sortMode==='freshness') return new Date(b.hotItems[0].at)-new Date(a.hotItems[0].at);
      if(sortMode==='popular') { const ca=a.hotItems.reduce((s,i)=>s+(confirmCounts[i.id]||0),0); const cb=b.hotItems.reduce((s,i)=>s+(confirmCounts[i.id]||0),0); return cb-ca; }
      const da=a.distance??9999, db=b.distance??9999;
      if(Math.abs(da-db)<0.2 && a.plan!==b.plan) return a.plan==='pro'?-1:1;
      return da-db;
    })
  , [venues,items,userLoc,tab,favorites,filterType,searchQuery,freshnessFilter,distFilter,sortMode,confirmCounts,t.businessTypes]); // eslint-disable-line

  const activeTypes = [...new Set(venues.filter(v=>items.some(i=>i.venue_id===v.id)).map(v=>v.type))];
  const goToApp = useCallback((targetTab='explore') => { localStorage.setItem('hn_seen','1'); setTab(targetTab); setView('app'); }, []);
  const langBtnStyle = (active) => ({ padding:'3px 9px', borderRadius:7, fontFamily:'inherit', cursor:'pointer', fontSize:11, fontWeight:700, border:'none', background: active?'white':'transparent', color: active?C.black:'rgba(255,255,255,0.5)' });

  const shareVenue = () => {
    const url = `${window.location.origin}/?v=${myVenue.id}`;
    if (navigator.share) { navigator.share({ title:myVenue.name, text: lang==='fr'?'Retrouvez mes produits frais en direct !':'See my fresh products live!', url }); }
    else { navigator.clipboard?.writeText(url).then(() => { setShareCopied(true); setTimeout(()=>setShareCopied(false),2500); }); }
  };
  // ── Upgrade modal ─────────────────────────────────────────────────────────
  const UpgradeModal = () => {
    const proFeatures = lang === 'fr' ? [
      { icon: '∞',  text: 'Annonces quotidiennes illimitées' },
      { icon: '⭐', text: 'Badge PRO visible par vos clients' },
      { icon: '🔝', text: 'Priorité dans le fil de découverte' },
      { icon: '📸', text: 'Photos de fournées en illimité' },
      { icon: '🔴', text: 'Lien live (YouTube, Instagram…) illimité' },
    ] : [
      { icon: '∞',  text: 'Unlimited daily announcements' },
      { icon: '⭐', text: 'PRO badge visible to customers' },
      { icon: '🔝', text: 'Priority in the discovery feed' },
      { icon: '📸', text: 'Unlimited batch photos' },
      { icon: '🔴', text: 'Live link (YouTube, Instagram…) unlimited' },
    ];
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={() => setShowUpgrade(false)}>
        <div className="modal-enter" style={{ background: '#0F0F0F', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 480, overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ background: 'linear-gradient(160deg,#FF3D00 0%,#FF5000 40%,#FF8C42 100%)', padding: '32px 24px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 280, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <button onClick={() => setShowUpgrade(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.22)', border: 'none', borderRadius: '50%', width: 34, height: 34, color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>×</button>
            <div style={{ fontSize: 40, marginBottom: 8, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>⭐</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 12px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>{t.upgradeTitle}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, background: 'rgba(0,0,0,0.22)', borderRadius: 100, padding: '7px 20px', backdropFilter: 'blur(8px)' }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>{t.upgradePrice.split(' ')[0]}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}> {t.upgradePrice.split(' ').slice(1).join(' ')}</span>
            </div>
          </div>
          <div style={{ padding: '20px 24px 32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {proFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,80,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 600, lineHeight: 1.4 }}>{f.text}</span>
                </div>
              ))}
            </div>
            <a href={`${stripeLink}?client_reference_id=${myVenue?.id}`}
              style={{ display: 'block', width: '100%', padding: '17px', borderRadius: 16, fontFamily: 'inherit', cursor: 'pointer', fontSize: 16, fontWeight: 800, border: 'none', background: 'linear-gradient(135deg,#FF5000,#FF8C42)', color: 'white', textAlign: 'center', textDecoration: 'none', boxShadow: '0 6px 28px rgba(255,80,0,0.45)', boxSizing: 'border-box', letterSpacing: '-0.2px' }}>
              {t.upgradeBtn}
            </a>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '10px 0 14px' }}>{t.upgradeNote}</p>
            <button onClick={() => setShowUpgrade(false)} style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              {t.upgradeLater}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Venue detail modal ────────────────────────────────────────────────────
  const selectedVenue = selectedVenueId ? enriched.find(v => v.id === selectedVenueId) || venues.find(v => v.id === selectedVenueId) : null;
  const VenueDetailModal = () => {
    if (!selectedVenue) return null;
    const sv = { ...selectedVenue, hotItems: selectedVenue.hotItems || items.filter(i => i.venue_id === selectedVenue.id), bt: selectedVenue.bt || t.businessTypes.find(b => b.id === selectedVenue.type) };
    const imgUrl = typeImageUrl(sv.type);
    const topIt  = sv.hotItems[0];
    if (!topIt) return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={() => setSelectedVenueId(null)}>
        <div className="modal-enter" style={{ background: C.bg, borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 480, padding: '32px 24px 48px', textAlign: 'center' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ width: 5, height: 5, borderRadius: 100, background: C.border, margin: '0 auto 24px' }} />
          <div style={{ width: 80, height: 80, borderRadius: 24, background: gradientByType(sv.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, margin: '0 auto 16px', boxShadow: `0 6px 20px ${TYPE_ACCENT[sv.type] || '#FF5000'}30` }}>{sv.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 8, letterSpacing: '-0.3px' }}>{sv.name}</div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
            {lang === 'fr' ? 'Aucune annonce active pour l\'instant.\nRepassez plus tard !' : 'No active announcements right now.\nCheck back soon!'}
          </div>
          <button onClick={() => { toggleFav(sv.id); }}
            style={{ background: favorites.includes(sv.id) ? 'rgba(255,80,0,0.1)' : C.card, border: `1.5px solid ${favorites.includes(sv.id) ? 'rgba(255,80,0,0.3)' : C.border}`, borderRadius: 14, padding: '12px 24px', fontFamily: 'inherit', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: favorites.includes(sv.id) ? '#FF5000' : C.muted }}>
            {favorites.includes(sv.id) ? '❤️ ' + (lang === 'fr' ? 'En favori' : 'Saved') : '🤍 ' + (lang === 'fr' ? 'Sauvegarder' : 'Save')}
          </button>
        </div>
      </div>
    );
    const topF = freshnessInfo(topIt.at, t.freshnessLabels);
    const topMins = Math.floor((Date.now() - new Date(topIt.at)) / 60000);
    const totalConfsModal = sv.hotItems.reduce((s, i) => s + (confirmCounts[i.id] || 0), 0);
    const bgModal = topIt.photo_url
      ? `${PHOTO_OVERLAY}, url(${topIt.photo_url}) center/cover`
      : imgUrl
        ? `${PHOTO_OVERLAY}, url(${imgUrl}) center/cover`
        : gradientByType(sv.type);
    let _modalSwipeY = null;
    const onModalTouchStart = e => { _modalSwipeY = e.touches[0].clientY; };
    const onModalTouchEnd   = e => {
      if (_modalSwipeY == null) return;
      const dy = e.changedTouches[0].clientY - _modalSwipeY;
      if (dy > 80) setSelectedVenueId(null);
      _modalSwipeY = null;
    };
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={() => setSelectedVenueId(null)}>
        <div className="modal-enter" style={{ background: 'white', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', paddingBottom: 40 }}
          onClick={e => e.stopPropagation()}
          onTouchStart={onModalTouchStart} onTouchEnd={onModalTouchEnd}>

          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.4)', zIndex: 10 }} />

          <div style={{ height: 260, position: 'relative', overflow: 'hidden', borderRadius: '28px 28px 0 0', background: bgModal, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {!topIt.photo_url && !imgUrl && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 88, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}>{sv.icon}</span>
              </div>
            )}
            <button onClick={() => setSelectedVenueId(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: 38, height: 38, color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            <button onClick={() => toggleFav(sv.id)}
              style={{ position: 'absolute', top: 16, right: 62, background: favorites.includes(sv.id) ? 'rgba(255,80,0,0.85)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: 38, height: 38, fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {favorites.includes(sv.id) ? '❤️' : '🤍'}
            </button>
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: 100, padding: '6px 14px' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{topF.label}</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.4px', textShadow: '0 2px 8px rgba(0,0,0,0.4)', lineHeight: 1.1 }}>{sv.name}</h2>
                    {sv.plan === 'pro' && <span style={{ fontSize: 10, fontWeight: 800, color: 'white', background: '#FF5000', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>⭐ PRO</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{sv.bt?.icon} {sv.bt?.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{t.timeAgo(topMins)}</span>
                    {totalConfsModal > 0 && <><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>·</span><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>👍 {totalConfsModal}</span></>}
                  </div>
                </div>
                {sv.distance != null && (
                  <div style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', borderRadius: 100, padding: '6px 13px', flexShrink: 0, marginLeft: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{fmtDist(sv.distance, lang)}</span>
                  </div>
                )}
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden', marginTop: 12 }}>
                <div style={{ height: '100%', width: `${topF.bar}%`, background: 'white', borderRadius: 10 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '16px 20px 4px' }}>
            <button onClick={() => confirmItem(topIt.id)} disabled={myConfirmations.includes(topIt.id)}
              style={{ background: myConfirmations.includes(topIt.id) ? '#E8F5E9' : C.bg, border: myConfirmations.includes(topIt.id) ? '1.5px solid #34C75940' : `1.5px solid ${C.border}`, borderRadius: 16, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: myConfirmations.includes(topIt.id) ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' }}>
              <span style={{ fontSize: 22 }}>{myConfirmations.includes(topIt.id) ? '✅' : '👍'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: myConfirmations.includes(topIt.id) ? '#1A8917' : C.muted, textAlign: 'center', lineHeight: 1.3 }}>
                {myConfirmations.includes(topIt.id) ? (lang === 'fr' ? "J'y étais !" : 'Was there!') : (lang === 'fr' ? "J'y étais" : 'I was there')}
              </span>
            </button>
            {(() => {
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
              const mapsUrl = isIOS
                ? `maps://maps.apple.com/?q=${encodeURIComponent(sv.name)}${sv.lat && sv.lng ? `&ll=${sv.lat},${sv.lng}` : ''}`
                : `https://www.google.com/maps/search/?api=1&query=${sv.lat && sv.lng ? `${sv.lat},${sv.lng}` : encodeURIComponent(sv.name)}`;
              return (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ background: 'linear-gradient(135deg,#0A0A0A,#2C2C2C)', borderRadius: 16, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none', boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
                  <span style={{ fontSize: 22 }}>📍</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white', textAlign: 'center', lineHeight: 1.3 }}>{lang === 'fr' ? 'Y aller' : 'Navigate'}</span>
                </a>
              );
            })()}
            <button onClick={() => {
              const url = `${window.location.origin}/?v=${sv.id}`;
              if (navigator.share) {
                navigator.share({ title: sv.name, url });
              } else {
                navigator.clipboard?.writeText(url).then(() => {
                  setToast(lang === 'fr' ? '🔗 Lien copié !' : '🔗 Link copied!');
                  setTimeout(() => setToast(''), 2500);
                });
              }
            }}
              style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 22 }}>🔗</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textAlign: 'center', lineHeight: 1.3 }}>{lang === 'fr' ? 'Partager' : 'Share'}</span>
            </button>
          </div>

          <div style={{ padding: '12px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF5000', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {lang === 'fr' ? `${sv.hotItems.length} produit${sv.hotItems.length > 1 ? 's' : ''} en direct` : `${sv.hotItems.length} item${sv.hotItems.length > 1 ? 's' : ''} live`}
              </span>
            </div>
            {sv.hotItems.map(it => {
              const f = freshnessInfo(it.at, t.freshnessLabels);
              const q = t.quantities.find(q => q.id === it.quantity);
              const mins = Math.floor((Date.now() - new Date(it.at)) / 60000);
              const confs = confirmCounts[it.id] || 0;
              const lp = it.live_url ? detectLivePlatform(it.live_url) : null;
              return (
                <div key={it.id} style={{ display: 'flex', alignItems: 'stretch', background: C.bg, borderRadius: 16, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ width: 4, flexShrink: 0, background: f.color, borderRadius: '4px 0 0 4px' }} />
                  <div style={{ flex: 1, padding: '14px 14px 14px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.2px' }}>{it.product}</span>
                        {q && <span style={{ fontSize: 16 }}>{q.emoji}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: f.color, fontWeight: 700 }}>{f.label}</span>
                        <span style={{ fontSize: 10, color: C.faint }}>·</span>
                        <span style={{ fontSize: 12, color: C.muted }}>{t.timeAgo(mins)}</span>
                        {confs > 0 && <><span style={{ fontSize: 10, color: C.faint }}>·</span><span style={{ fontSize: 12, color: C.muted }}>👍 {confs}</span></>}
                      </div>
                    </div>
                    <div style={{ background: `${f.color}15`, borderRadius: 8, padding: '4px 9px', flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: f.color }}>{f.bar}%</span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${f.bar}%`, background: f.color, borderRadius: 10, transition: 'width 1s ease' }} />
                  </div>
                  {lp && (
                    <a href={it.live_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: '#D32F2F', borderRadius: 100, padding: '5px 14px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(211,47,47,0.4)' }}>
                      <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: '0.4px' }}>LIVE · {lp.name}</span>
                    </a>
                  )}
                  {it.photo_url && <img src={it.photo_url} alt={it.product} loading="lazy" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, marginTop: 10, display: 'block' }} />}
                  </div>
                </div>
              );
            })}
          </div>

          {(() => {
            const similar = enriched.filter(v => v.type === sv.type && v.id !== sv.id).slice(0, 3);
            if (similar.length === 0) return null;
            return (
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                  {lang === 'fr' ? `Autres ${sv.bt?.label || 'établissements'} à proximité` : `Other ${sv.bt?.label || 'venues'} nearby`}
                </div>
                {similar.map((sv2, i) => {
                  const f2 = freshnessInfo(sv2.hotItems[0].at, t.freshnessLabels);
                  return (
                    <div key={sv2.id} onClick={() => setSelectedVenueId(sv2.id)} className="card-press"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: `1px solid ${C.border}`, cursor: 'pointer' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: gradientByType(sv2.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{sv2.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sv2.name}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
                          <span style={{ color: f2.color, fontWeight: 700 }}>{f2.label}</span>
                          {sv2.distance != null && <span> · {fmtDist(sv2.distance, lang)}</span>}
                        </div>
                      </div>
                      <span style={{ color: C.faint, fontSize: 20, flexShrink: 0 }}>›</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // ── Onboarding slides ────────────────────────────────────────────────────
  const SLIDES = lang === 'fr' ? [
    { emoji: '🔥', title: 'Tout frais, en direct', sub: 'Boulangers, sushimen, glaciers… annoncent leurs produits dès qu\'ils sont prêts. Vous le voyez instantanément.' },
    { emoji: '❤️', title: 'Sauvegardez vos favoris', sub: 'Appuyez sur ❤️ pour sauvegarder un établissement. Retrouvez-le à tout moment dans l\'onglet Favoris.' },
    { emoji: '🏪', title: 'Vous êtes commerçant ?', sub: 'Inscrivez votre établissement en 30 secondes et annoncez vos produits frais à vos clients à proximité.' },
  ] : [
    { emoji: '🔥', title: 'Fresh products, live', sub: 'Bakers, sushi chefs, ice cream makers… announce their products the moment they\'re ready. You see it instantly.' },
    { emoji: '❤️', title: 'Save your favourites', sub: 'Tap ❤️ to save a venue. Find it anytime in the Favorites tab.' },
    { emoji: '🏪', title: 'Own a food venue?', sub: 'Register in 30 seconds and announce your fresh products to hungry customers nearby.' },
  ];

  const finishOnboarding = () => { localStorage.setItem('hn_onboarded', '1'); setOnboarded(true); };

  if (view === 'app' && !onboarded) {
    const slide = SLIDES[onboardSlide];
    const isLast = onboardSlide === SLIDES.length - 1;
    const glowColors = ['rgba(255,80,0,0.25)', 'rgba(255,59,48,0.22)', 'rgba(52,199,89,0.2)'];
    let _swipeX = null;
    const handleSwipeStart = e => { _swipeX = e.touches[0].clientX; };
    const handleSwipeEnd   = e => {
      if (_swipeX == null) return;
      const dx = e.changedTouches[0].clientX - _swipeX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0 && !isLast) setOnboardSlide(s => s + 1);
      if (dx > 0 && onboardSlide > 0) setOnboardSlide(s => s - 1);
      _swipeX = null;
    };
    return (
      <div onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd}
        style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${glowColors[onboardSlide]} 0%, transparent 70%)`, pointerEvents: 'none', transition: 'all 0.5s ease' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ height: '100%', width: `${((onboardSlide + 1) / SLIDES.length) * 100}%`, background: 'linear-gradient(90deg,#FF5000,#FF8C42)', borderRadius: '0 3px 3px 0', transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
        <div className="card-enter" key={onboardSlide} style={{ width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 120, height: 120, borderRadius: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 56 }}>
            {slide.emoji}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: 'white', margin: '0 0 14px', letterSpacing: '-0.6px', lineHeight: 1.15 }}>{slide.title}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 48px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>{slide.sub}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, position: 'relative', zIndex: 1 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setOnboardSlide(i)}
              style={{ width: i === onboardSlide ? 24 : 7, height: 7, borderRadius: 100, border: 'none', cursor: 'pointer', padding: 0, background: i === onboardSlide ? '#FF5000' : 'rgba(255,255,255,0.18)', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)' }} />
          ))}
        </div>
        <button onClick={() => isLast ? finishOnboarding() : setOnboardSlide(s => s + 1)}
          style={{ display: 'block', width: '100%', padding: '17px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#FF5000,#FF8C42)', color: 'white', fontSize: 17, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 6px 28px rgba(255,80,0,0.4)', position: 'relative', zIndex: 1, letterSpacing: '-0.2px' }}>
          {isLast ? (lang === 'fr' ? "C'est parti ! 🚀" : "Let's go! 🚀") : (lang === 'fr' ? 'Continuer →' : 'Continue →')}
        </button>
        <button onClick={finishOnboarding} style={{ marginTop: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 20px', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', position: 'relative', zIndex: 1 }}>
          {lang === 'fr' ? 'Passer' : 'Skip'}
        </button>
      </div>
    );
  }
  // ── Layout ────────────────────────────────────────────────────────────────
  if (view === 'landing') {
    return <LandingPage onExplore={() => goToApp('explore')} onRegister={() => goToApp('venue')} lang={lang} setLang={setLang} />;
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {showUpgrade && <UpgradeModal />}
      {selectedVenueId && <VenueDetailModal />}

      {toast && (
        <div className="toast-enter" style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 300, width: 'calc(100% - 32px)', maxWidth: 420, pointerEvents: 'none' }}>
          {typeof toast === 'string' ? (
            <div style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 18, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white', textAlign: 'center' }}>{toast}</span>
            </div>
          ) : (
            <div style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 18, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,80,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{toast.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF5000', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {lang === 'fr' ? 'Tout frais !' : 'Just out!'}
                    {toast.dist != null && ` · ${fmtDist(toast.dist, lang)}`}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.1px' }}>
                  {toast.venueName} · {toast.product}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}
        onTouchStart={e => setTouchStartY(e.touches[0].clientY)}
        onTouchMove={pullToRefresh}>
        {pullRefreshing && (
          <div style={{ textAlign: 'center', padding: '10px 0', background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 700, letterSpacing: '0.2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="spin" style={{ fontSize: 16 }}>↻</span>
            {lang === 'fr' ? 'Actualisation…' : 'Refreshing…'}
          </div>
        )}

        {/* ══ EXPLORE / FAVORITES ══ */}
        {(tab === 'explore' || tab === 'favorites') && (
          <div key={tab} className="float-in" style={{ animation: 'floatIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #111111 100%)', padding: '52px 20px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(255,80,0,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  {tab === 'explore' && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 5, letterSpacing: '0.3px' }}>
                      {(() => { const h = new Date().getHours(); return h < 12 ? (lang === 'fr' ? 'Bonjour 👋' : 'Good morning 👋') : h < 18 ? (lang === 'fr' ? 'Bon après-midi 👋' : 'Good afternoon 👋') : (lang === 'fr' ? 'Bonsoir 👋' : 'Good evening 👋'); })()}
                    </div>
                  )}
                  {tab === 'favorites' && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 5, letterSpacing: '0.3px' }}>
                      {t.savedSpots}
                    </div>
                  )}
                  <h1 style={{ fontSize: 30, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.8px', lineHeight: 1.1 }}>
                    {tab === 'favorites' ? t.myFavorites : t.appName}
                  </h1>
                  {tab === 'explore' && !loading && venues.length > 0 && (
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759', display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
                        {venues.filter(v => items.some(i => i.venue_id === v.id)).length} {lang === 'fr' ? 'établissements actifs' : 'venues live'}
                      </span>
                    </div>
                  )}
                  {tab === 'favorites' && (
                    <div style={{ marginTop: 8 }}>
                      {favorites.length > 0
                        ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,80,0,0.12)', borderRadius: 100, padding: '5px 13px', border: '1px solid rgba(255,80,0,0.2)' }}>
                            <span style={{ fontSize: 11, color: '#FF8C42', fontWeight: 700 }}>❤️ {favorites.length} {lang === 'fr' ? (favorites.length > 1 ? 'établissements' : 'établissement') : (favorites.length > 1 ? 'venues' : 'venue')}</span>
                          </div>
                        : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{lang === 'fr' ? 'Aucun favori encore' : 'No favorites yet'}</span>
                      }
                    </div>
                  )}
                  {tab === 'explore' && !loading && items.length > 0 && (() => {
                    const hot   = items.filter(it => (Date.now() - new Date(it.at)) / 60000 < 15).length;
                    const vfresh = items.filter(it => { const m = (Date.now() - new Date(it.at)) / 60000; return m >= 15 && m < 30; }).length;
                    const fresh  = items.filter(it => { const m = (Date.now() - new Date(it.at)) / 60000; return m >= 30; }).length;
                    return (
                      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                        {[
                          { label: lang === 'fr' ? 'Tout chaud' : 'Just out',   count: hot,    color: '#FF5000', filter: 'hot',    dot: true  },
                          { label: lang === 'fr' ? 'Très frais' : 'Very fresh', count: vfresh, color: '#FF7A00', filter: 'vfresh', dot: false },
                          { label: lang === 'fr' ? 'Frais'      : 'Fresh',      count: fresh,  color: '#34C759', filter: 'fresh',  dot: false },
                        ].map((s, i) => (
                          <button key={i} onClick={() => setFreshnessFilter(f => f === s.filter ? 'all' : s.filter)}
                            style={{ textAlign: 'center', background: freshnessFilter === s.filter ? `${s.color}22` : 'rgba(255,255,255,0.06)', border: `1px solid ${freshnessFilter === s.filter ? s.color + '55' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '7px 4px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.18s ease, border-color 0.18s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                              {s.dot && <span className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />}
                              <span style={{ fontSize: 16, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</span>
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</div>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '4px 3px', display: 'flex', gap: 2 }}>
                    <button onClick={() => setLang('fr')} style={langBtnStyle(lang === 'fr')}>FR</button>
                    <button onClick={() => setLang('en')} style={langBtnStyle(lang === 'en')}>EN</button>
                  </div>
                </div>
              </div>

              {(tab === 'explore' || tab === 'favorites') && (
                <div style={{ background: searchQuery ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.09)', borderRadius: 14, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 9, border: `1px solid ${searchQuery ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`, transition: 'background 0.2s ease, border-color 0.2s ease' }}>
                  <span style={{ fontSize: 14, flexShrink: 0, opacity: searchQuery ? 0.9 : 0.5 }}>🔍</span>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: 15, width: '100%', fontFamily: 'inherit', fontWeight: 500 }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>×</button>
                  )}
                </div>
              )}
            </div>

            {tab === 'explore' && activeTypes.length > 0 && (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 16px 0', scrollbarWidth: 'none' }}>
                  {[{ id: 'all', icon: '⚡', label: lang === 'fr' ? 'Tout' : 'All' }, ...t.businessTypes.filter(b => activeTypes.includes(b.id))].map(bt => {
                    const accent = bt.id === 'all' ? C.black : (TYPE_ACCENT[bt.id] || C.black);
                    const isActive = filterType === bt.id;
                    return (
                      <button key={bt.id} onClick={() => setFilterType(isActive && bt.id !== 'all' ? 'all' : bt.id)} style={{
                        padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 700,
                        fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        border: 'none',
                        background: isActive ? accent : C.card,
                        color: isActive ? 'white' : C.text,
                        boxShadow: isActive ? `0 3px 12px ${accent}44` : '0 1px 4px rgba(0,0,0,0.08)',
                        transition: 'background 0.2s ease, box-shadow 0.2s ease',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <span>{bt.icon} {bt.label}</span>
                        {isActive && bt.id !== 'all' && <span style={{ fontSize: 12, opacity: 0.7, lineHeight: 1 }}>×</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 32, background: `linear-gradient(to left, ${C.bg}, transparent)`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 16, background: `linear-gradient(to right, ${C.bg}, transparent)`, pointerEvents: 'none' }} />
              </div>
            )}

            {tab === 'explore' && (
              <div style={{ borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', padding: '10px 16px 6px' }}>
                  {[
                    { id: 'all',    icon: '⚡', label: lang === 'fr' ? 'Tous'       : 'All',        color: C.black },
                    { id: 'hot',    icon: '🔥', label: lang === 'fr' ? 'Tout chaud' : 'Just out',   color: '#FF5000' },
                    { id: 'vfresh', icon: '🧡', label: lang === 'fr' ? 'Très frais' : 'Very fresh', color: '#FF7A00' },
                    { id: 'fresh',  icon: '🟢', label: lang === 'fr' ? 'Frais'      : 'Fresh',      color: '#1A8917' },
                  ].map(f => (
                    <button key={f.id} onClick={() => setFreshnessFilter(f.id)} style={{
                      padding: '7px 13px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                      fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: 'none',
                      background: freshnessFilter === f.id ? f.color : C.card,
                      color: freshnessFilter === f.id ? 'white' : C.muted,
                      boxShadow: freshnessFilter === f.id ? `0 2px 10px ${f.color}44` : '0 1px 4px rgba(0,0,0,0.07)',
                      transition: 'background 0.2s ease, box-shadow 0.2s ease',
                    }}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px 10px' }}>
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, flexShrink: 0 }}>📍</span>
                  {[
                    { v: 0,   label: lang === 'fr' ? 'Tout' : 'Any' },
                    { v: 0.5, label: '500m' },
                    { v: 1,   label: '1km'  },
                    { v: 2,   label: '2km'  },
                    { v: 5,   label: '5km'  },
                  ].map(d => (
                    <button key={d.v} onClick={() => setDistFilter(d.v)} style={{
                      padding: '5px 11px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                      fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: 'none',
                      background: distFilter === d.v ? C.black : C.card,
                      color: distFilter === d.v ? 'white' : C.muted,
                      boxShadow: distFilter === d.v ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
                    }}>
                      {d.label}
                    </button>
                  ))}
                  <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0, margin: '0 2px' }} />
                  {[
                    { id: 'distance',  label: lang === 'fr' ? '📍 Proche'    : '📍 Near'    },
                    { id: 'freshness', label: lang === 'fr' ? '🔥 Frais'     : '🔥 Fresh'   },
                    { id: 'popular',   label: lang === 'fr' ? '👍 Populaire' : '👍 Popular' },
                  ].map(s => (
                    <button key={s.id} onClick={() => setSortMode(s.id)} style={{
                      padding: '5px 11px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                      fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: 'none',
                      background: sortMode === s.id ? C.black : C.card,
                      color: sortMode === s.id ? 'white' : C.muted,
                      boxShadow: sortMode === s.id ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
                      transition: 'background 0.2s ease',
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'explore' && !loading && enriched.length > 0 && (
              <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
                  {enriched.length} {lang === 'fr' ? (enriched.length > 1 ? 'établissements' : 'établissement') : (enriched.length > 1 ? 'venues' : 'venue')}
                </span>
                {(filterType !== 'all' || freshnessFilter !== 'all' || distFilter !== 0) && (
                  <button onClick={() => { setFilterType('all'); setFreshnessFilter('all'); setDistFilter(0); }}
                    style={{ fontSize: 11, fontWeight: 700, color: '#FF5000', background: 'rgba(255,80,0,0.08)', border: 'none', borderRadius: 100, padding: '2px 9px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {lang === 'fr' ? '× Effacer filtres' : '× Clear filters'}
                  </button>
                )}
              </div>
            )}

            {tab === 'explore' && !loading && (() => {
              const hotVenues = enriched.filter(v => (Date.now() - new Date(v.hotItems[0].at)) / 60000 < 5);
              if (hotVenues.length === 0) return null;
              const hv = hotVenues[0];
              return (
                <div className="badge-enter badge-hot" onClick={() => setSelectedVenueId(hv.id)}
                  style={{ margin: '14px 16px 0', background: 'linear-gradient(135deg,#FF5000,#FF8C42)', borderRadius: 18, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: '0 6px 24px rgba(255,80,0,0.35)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {hv.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                        {lang === 'fr' ? 'Tout chaud — à l\'instant !' : 'Just out — right now!'}
                      </span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'white', letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hv.name} · {hv.hotItems[0].product}
                    </div>
                    {hv.distance != null && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: 600 }}>
                        {fmtDist(hv.distance, lang)} {lang === 'fr' ? 'de vous' : 'away'}
                        {hotVenues.length > 1 && ` · +${hotVenues.length - 1} ${lang === 'fr' ? 'autres' : 'more'}`}
                      </div>
                    )}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, flexShrink: 0 }}>›</span>
                </div>
              );
            })()}

            {tab === 'explore' && !loading && userLoc && (() => {
              const nearbyV = enriched.filter(v => v.distance != null && v.distance <= 0.5).slice(0, 6);
              if (nearbyV.length < 2) return null;
              return (
                <div style={{ paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: '-0.1px' }}>
                        📍 {lang === 'fr' ? 'Tout près de vous' : 'Right nearby'}
                      </span>
                      <span style={{ background: C.black, color: 'white', borderRadius: 100, padding: '1px 8px', fontSize: 10, fontWeight: 800 }}>{nearbyV.length}</span>
                    </div>
                    <button onClick={() => { setDistFilter(0.5); scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{ fontSize: 11, fontWeight: 700, color: '#FF5000', background: 'rgba(255,80,0,0.08)', border: 'none', borderRadius: 100, padding: '4px 11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {lang === 'fr' ? 'Voir tous →' : 'See all →'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px 4px', WebkitOverflowScrolling: 'touch' }}>
                    {nearbyV.map(v => {
                      const topItem = v.hotItems[0];
                      const f = freshnessInfo(topItem.at, t.freshnessLabels);
                      const imgUrl = typeImageUrl(v.type);
                      const bg = topItem.photo_url
                        ? `${PHOTO_OVERLAY}, url(${topItem.photo_url}) center/cover`
                        : imgUrl
                          ? `${PHOTO_OVERLAY}, url(${imgUrl}) center/cover`
                          : gradientByType(v.type);
                      return (
                        <div key={v.id} className="card-press" onClick={() => setSelectedVenueId(v.id)}
                          style={{ width: 116, flexShrink: 0, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: 100, background: bg, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 3px 16px rgba(0,0,0,0.12)' }}>
                          {!topItem.photo_url && !imgUrl && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 34 }}>{v.icon}</span>
                            </div>
                          )}
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 8px 8px', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.82))' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{v.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
                                {fmtDist(v.distance, lang)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div style={{ padding: '14px 16px 0' }}>
              {loading && [0,1,2].map(i => (
                <div key={i} className="shimmer-bg" style={{ borderRadius: 24, marginBottom: 14, height: 260 }} />
              ))}
              {locError && (
                <div style={{ background: '#FFF4F3', border: '1px solid rgba(192,57,43,0.15)', borderRadius: 16, padding: '14px 16px', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: '#FDECEA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📍</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#C0392B', margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>{locError}</p>
                    <button onClick={() => { setLocError(''); getLocation(); }} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#C0392B', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{t.locErrorRetry}</button>
                  </div>
                </div>
              )}
              {!loading && enriched.length === 0 && (() => {
                const hasActiveFilters = filterType !== 'all' || freshnessFilter !== 'all' || distFilter !== 0 || searchQuery.trim();
                const hasItems = items.length > 0;
                if (tab === 'explore' && hasItems && hasActiveFilters) {
                  return (
                    <div className="float-in" style={{ textAlign: 'center', padding: '52px 28px' }}>
                      <div style={{ width: 88, height: 88, borderRadius: 28, background: 'linear-gradient(135deg,#F2F2F7,#E5E5EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', fontSize: 44, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>🔍</div>
                      <div style={{ fontSize: 21, fontWeight: 900, marginBottom: 10, letterSpacing: '-0.4px' }}>
                        {lang === 'fr' ? 'Aucun résultat' : 'No results'}
                      </div>
                      <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 260, margin: '0 auto' }}>
                        {lang === 'fr' ? 'Essayez de modifier ou supprimer vos filtres.' : 'Try adjusting or clearing your filters.'}
                      </div>
                      <button onClick={() => { setFilterType('all'); setFreshnessFilter('all'); setDistFilter(0); setSearchQuery(''); }}
                        style={{ marginTop: 24, padding: '12px 26px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#FF5000,#FF8C42)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,80,0,0.3)' }}>
                        {lang === 'fr' ? '× Effacer tous les filtres' : '× Clear all filters'}
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="float-in" style={{ textAlign: 'center', padding: '52px 28px' }}>
                    <div style={{
                      width: 88, height: 88, borderRadius: 28,
                      background: tab === 'favorites' ? 'linear-gradient(135deg,#FF5000,#FF8C42)' : 'linear-gradient(135deg,#F2F2F7,#E5E5EA)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 22px', fontSize: 44,
                      boxShadow: tab === 'favorites' ? '0 8px 28px rgba(255,80,0,0.28)' : '0 4px 16px rgba(0,0,0,0.08)',
                    }}>
                      {tab === 'favorites' ? '❤️' : '🍞'}
                    </div>
                    <div style={{ fontSize: 21, fontWeight: 900, marginBottom: 10, letterSpacing: '-0.4px' }}>
                      {tab === 'favorites' ? t.noFavorites : t.nothingFresh}
                    </div>
                    <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 260, margin: '0 auto' }}>
                      {tab === 'favorites' ? t.noFavoritesSub : t.nothingFreshSub}
                    </div>
                    {tab === 'favorites' ? (
                      <button onClick={() => setTab('explore')} style={{ marginTop: 24, padding: '12px 26px', borderRadius: 100, border: 'none', background: 'linear-gradient(135deg,#FF5000,#FF8C42)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,80,0,0.3)' }}>
                        {lang === 'fr' ? '🔥 Explorer les établissements' : '🔥 Explore venues'}
                      </button>
                    ) : (
                      <button onClick={() => setTab('venue')} style={{ marginTop: 24, padding: '12px 26px', borderRadius: 100, border: 'none', background: C.black, color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                        {lang === 'fr' ? '🏪 Inscrire mon établissement' : '🏪 Register my venue'}
                      </button>
                    )}
                  </div>
                );
              })()}

              {enriched.map((v, idx) => {
                const isFaved = favorites.includes(v.id);
                const topItem = v.hotItems[0];
                const f = freshnessInfo(topItem.at, t.freshnessLabels);
                const mins = Math.floor((Date.now() - new Date(topItem.at)) / 60000);
                const imgUrl = typeImageUrl(v.type);
                const bgImg = topItem.photo_url
                  ? `${PHOTO_OVERLAY}, url(${topItem.photo_url}) center/cover`
                  : imgUrl
                    ? `${PHOTO_OVERLAY}, url(${imgUrl}) center/cover`
                    : gradientByType(v.type);
                const totalConfs = v.hotItems.reduce((s, i) => s + (confirmCounts[i.id] || 0), 0);
                return (
                  <div key={v.id} className="card-enter card-press" onClick={() => setSelectedVenueId(v.id)}
                    style={{
                      borderRadius: 24, marginBottom: 14, overflow: 'hidden',
                      boxShadow: '0 4px 28px rgba(0,0,0,0.13)',
                      animationDelay: `${idx * 55}ms`, cursor: 'pointer',
                      position: 'relative', height: 260,
                      background: bgImg, backgroundSize: 'cover', backgroundPosition: 'center',
                    }}>

                    {!topItem.photo_url && !imgUrl && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 80, filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.4))' }}>{v.icon}</span>
                      </div>
                    )}

                    <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: 100, padding: '5px 13px', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: '0.3px' }}>{f.label}</span>
                      </div>
                      {mins < 5 && <div className="badge-hot" style={{ background: '#FF5000', borderRadius: 100, padding: '5px 11px' }}><span style={{ fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: '0.6px' }}>🔥 NEW</span></div>}
                      {v.is_open === false && <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 100, padding: '5px 11px' }}><span style={{ fontSize: 10, fontWeight: 800, color: '#FF6B6B' }}>{lang === 'fr' ? 'FERMÉ' : 'CLOSED'}</span></div>}
                    </div>

                    <button onClick={e => { e.stopPropagation(); toggleFav(v.id); }}
                      style={{ position: 'absolute', top: 12, right: 12, background: isFaved ? 'rgba(255,80,0,0.85)' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: 38, height: 38, fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isFaved ? '❤️' : '🤍'}
                    </button>

                    {topItem.live_url && (() => {
                      const lp = detectLivePlatform(topItem.live_url);
                      return (
                        <a href={topItem.live_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: '#D32F2F', borderRadius: 100, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', boxShadow: '0 2px 12px rgba(211,47,47,0.5)' }}>
                          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>🔴 LIVE · {lp.name}</span>
                        </a>
                      );
                    })()}

                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px 14px 14px', background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.86) 100%)', borderRadius: '0 0 24px 24px' }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 9, overflow: 'hidden' }}>
                        {v.hotItems.slice(0, 3).map(it => {
                          const iq = t.quantities.find(qq => qq.id === it.quantity);
                          return (
                            <div key={it.id} style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', borderRadius: 100, padding: '4px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.92)', fontWeight: 700 }}>{it.product}</span>
                              {iq && <span style={{ fontSize: 10 }}>{iq.emoji}</span>}
                            </div>
                          );
                        })}
                        {v.hotItems.length > 3 && (
                          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 100, padding: '4px 10px', flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>+{v.hotItems.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: 'white', letterSpacing: '-0.3px', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                            {v.plan === 'pro' && <span style={{ fontSize: 9, fontWeight: 900, color: 'white', background: 'linear-gradient(135deg,#FF5000,#FF8C42)', padding: '2px 7px', borderRadius: 6, flexShrink: 0, letterSpacing: '0.3px' }}>⭐ PRO</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{v.bt?.icon} {v.bt?.label}</span>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>·</span>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{t.timeAgo(mins)}</span>
                            {totalConfs > 0 && <><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>·</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>👍 {totalConfs}</span></>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginLeft: 10, flexShrink: 0 }}>
                          {v.distance != null && (
                            <div style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', borderRadius: 100, padding: '5px 11px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{fmtDist(v.distance, lang)}</span>
                            </div>
                          )}
                          <button onClick={e => { e.stopPropagation(); confirmItem(topItem.id); }}
                            style={{
                              background: myConfirmations.includes(topItem.id) ? 'rgba(52,199,89,0.35)' : 'rgba(255,255,255,0.14)',
                              border: 'none', borderRadius: 100, padding: '5px 12px',
                              display: 'flex', alignItems: 'center', gap: 4,
                              cursor: myConfirmations.includes(topItem.id) ? 'default' : 'pointer',
                              fontFamily: 'inherit', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                            }}>
                            <span style={{ fontSize: 11 }}>{myConfirmations.includes(topItem.id) ? '✅' : '👍'}</span>
                            {(totalConfs > 0 || myConfirmations.includes(topItem.id)) && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>
                                {totalConfs > 0 ? totalConfs : '✓'}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                      <div style={{ height: 2, background: 'rgba(255,255,255,0.18)', borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
                        <div style={{ height: '100%', width: `${f.bar}%`, background: 'white', borderRadius: 10, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ MY VENUE ══ */}
        {tab === 'venue' && (
          <div key="venue" className="float-in" style={{ animation: 'floatIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div style={{ background: myVenue && isPro ? 'linear-gradient(160deg,#FF5000 0%,#CC2900 100%)' : 'linear-gradient(180deg, #0A0A0A 0%, #111111 100%)', padding: '52px 20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: myVenue && isPro ? 'radial-gradient(ellipse 80% 60% at 20% 120%, rgba(255,255,255,0.1) 0%, transparent 60%)' : 'radial-gradient(ellipse 70% 50% at 50% -20%, rgba(255,80,0,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {myVenue ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: gradientByType(myVenue.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, boxShadow: `0 4px 14px ${TYPE_ACCENT[myVenue.type] || '#FF5000'}50` }}>
                        {myVenue.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: isPro ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.3px', marginBottom: 2 }}>
                          {t.dashboardTitle}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                          {myVenue.name}
                        </div>
                        {isPro && (
                          <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 100, padding: '3px 10px' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>⭐ PRO</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 5, letterSpacing: '0.3px' }}>{t.setupLabel}</div>
                      <h1 style={{ fontSize: 30, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.8px', lineHeight: 1.1 }}>{t.registerTitle}</h1>
                    </>
                  )}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '4px 3px', display: 'flex', gap: 2, marginTop: 4, flexShrink: 0 }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
                    {t.businessTypes.map(bt => {
                      const accent = TYPE_ACCENT[bt.id] || C.primary;
                      const isSelected = venueType === bt.id;
                      return (
                        <button key={bt.id} onClick={() => setVenueType(bt.id)} style={{
                          padding: '14px 6px 12px', borderRadius: 16, fontFamily: 'inherit', cursor: 'pointer',
                          textAlign: 'center',
                          border: `2px solid ${isSelected ? accent : 'transparent'}`,
                          background: isSelected ? `${accent}18` : C.bg,
                          boxShadow: isSelected ? `0 3px 14px ${accent}30` : 'none',
                          transition: 'all 0.18s ease',
                        }}>
                          <div style={{ fontSize: 28, marginBottom: 5 }}>{bt.icon}</div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: isSelected ? accent : C.muted, lineHeight: 1.3, letterSpacing: '0.1px' }}>{bt.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ ...labelStyle, margin: 0 }}>{t.venueNameLabel}</label>
                    {venueName.length > 30 && <span style={{ fontSize: 11, color: venueName.length >= 58 ? '#C0392B' : C.faint, fontWeight: 700 }}>{60 - venueName.length}</span>}
                  </div>
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
                    {proJustActivated && (
                      <div className="badge-enter" style={{ background: 'linear-gradient(135deg,#FF5000,#FF8C42)', borderRadius: 18, padding: '18px 20px', marginBottom: 12, textAlign: 'center', boxShadow: '0 6px 24px rgba(255,80,0,0.35)' }}>
                        <div style={{ fontSize: 32, marginBottom: 6, lineHeight: 1 }}>🎊</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: 'white', marginBottom: 4, letterSpacing: '-0.3px' }}>{t.proActivated}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                          {lang === 'fr' ? 'Annonces illimitées débloquées !' : 'Unlimited announcements unlocked!'}
                        </div>
                      </div>
                    )}
                    <div style={{ background: isPro ? 'linear-gradient(135deg,#FF5000,#FF8C42)' : C.card, borderRadius: 16, padding: '16px 18px', marginBottom: 12, boxShadow: isPro ? '0 4px 16px rgba(255,80,0,0.25)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isPro ? 0 : 10 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isPro ? 'rgba(255,255,255,0.7)' : C.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{isPro ? t.planPro : t.planFree}</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: isPro ? 'white' : C.text, letterSpacing: '-0.3px' }}>
                            {isPro ? (lang === 'fr' ? '∞ annonces — illimité' : '∞ announcements') : (dailyLeft > 0 ? t.dailyLeft(dailyLeft) : t.dailyExhausted)}
                          </div>
                        </div>
                        {!isPro && (
                          <button onClick={() => setShowUpgrade(true)} style={{ background: 'linear-gradient(135deg,#FF5000,#FF8C42)', border: 'none', borderRadius: 10, padding: '8px 14px', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 3px 10px rgba(255,80,0,0.3)' }}>
                            ⭐ {lang === 'fr' ? 'Passer Pro' : 'Go Pro'}
                          </button>
                        )}
                      </div>
                      {!isPro && (
                        <>
                          <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(dailyCount / FREE_DAILY_LIMIT) * 100}%`, background: dailyLeft === 0 ? '#C0392B' : dailyLeft <= 1 ? '#FF7A00' : C.primary, borderRadius: 10, transition: 'width 0.5s ease' }} />
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 5, fontWeight: 600 }}>
                            {dailyCount}/{FREE_DAILY_LIMIT} {lang === 'fr' ? 'annonces aujourd\'hui' : 'announcements today'}
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ background: C.card, borderRadius: 16, padding: '14px 18px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{lang === 'fr' ? 'Statut' : 'Status'}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: isOpen ? '#1A8917' : '#8E8E93', transition: 'color 0.2s ease' }}>
                          {isOpen ? (lang === 'fr' ? 'Ouvert · visible' : 'Open · visible') : (lang === 'fr' ? 'Fermé · masqué' : 'Closed · hidden')}
                        </div>
                      </div>
                      <button onClick={toggleOpen} style={{ width: 51, height: 31, borderRadius: 100, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, position: 'relative', background: isOpen ? '#34C759' : '#E5E5EA', boxShadow: isOpen ? '0 2px 8px rgba(52,199,89,0.4)' : 'inset 0 0 0 1px rgba(0,0,0,0.08)', transition: 'background 0.22s ease, box-shadow 0.22s ease' }}>
                        <div style={{ position: 'absolute', top: 3, left: isOpen ? 23 : 3, width: 25, height: 25, borderRadius: '50%', background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', transition: 'left 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                      </button>
                    </div>

                    {myItems.length > 0 && (() => {
                      const totalConfs = myItems.reduce((s, it) => s + (confirmCounts[it.id] || 0), 0);
                      const liveItems  = myItems.filter(it => it.live_url).length;
                      const photoItems = myItems.filter(it => it.photo_url).length;
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                          {[
                            { label: lang === 'fr' ? 'Confirmations' : 'Confirmations', value: totalConfs, icon: '👍', accent: '#FF5000', bg: '#FFF0EB' },
                            { label: lang === 'fr' ? 'En direct' : 'Live items',        value: myItems.length, icon: '🔥', accent: '#FF7A00', bg: '#FFF5EC' },
                            { label: lang === 'fr' ? 'Preuves' : 'Proofs',              value: liveItems + photoItems, icon: '📸', accent: '#1A8917', bg: '#E8F5E9' },
                          ].map((stat, si) => (
                            <div key={si} style={{ background: C.card, borderRadius: 18, padding: '16px 10px 14px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden' }}>
                              <div style={{ position: 'absolute', top: -8, right: -8, width: 40, height: 40, borderRadius: '50%', background: `${stat.accent}10` }} />
                              <div style={{ width: 36, height: 36, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18, position: 'relative' }}>{stat.icon}</div>
                              <div style={{ fontSize: 26, fontWeight: 900, color: stat.accent, lineHeight: 1, letterSpacing: '-0.5px' }}>{stat.value}</div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <div style={{ background: C.card, borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: gradientByType(myVenue.type), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: `0 3px 10px ${TYPE_ACCENT[myVenue.type] || C.primary}40` }}>{myVenue.icon}</div>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.3px' }}>{t.announceTitle}</div>
                          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 1 }}>{myVenue.name}</div>
                        </div>
                      </div>

                      <label style={labelStyle}>{t.productLabel}</label>
                      {productList.length > 0 && (
                        <div style={{ position: 'relative', marginBottom: 14 }}>
                          <select value={product} onChange={e => { setProduct(e.target.value); setCustomProduct(''); }}
                            style={{ ...inputStyle, marginBottom: 0, paddingRight: 40, cursor: 'pointer' }}>
                            {productList.map(p => <option key={p}>{p}</option>)}
                          </select>
                          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: C.muted, pointerEvents: 'none' }}>▾</span>
                        </div>
                      )}
                      <div style={{ position: 'relative' }}>
                        <input value={customProduct} onChange={e => setCustomProduct(e.target.value.slice(0, 50))}
                          placeholder={productList.length > 0 ? t.customPlaceholder : t.customPlaceholderOnly}
                          style={{ ...inputStyle, paddingRight: customProduct.length > 30 ? 48 : 16 }} maxLength={50} />
                        {customProduct.length > 30 && (
                          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: customProduct.length >= 48 ? '#C0392B' : C.faint, fontWeight: 700, pointerEvents: 'none' }}>
                            {50 - customProduct.length}
                          </span>
                        )}
                      </div>

                      <label style={labelStyle}>{t.quantityLabel}</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
                        {t.quantities.map(q => (
                          <button key={q.id} onClick={() => setQuantity(q.id)} style={{
                            padding: '14px 6px 12px', borderRadius: 16, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'center',
                            border: `2px solid ${quantity === q.id ? q.color : 'transparent'}`,
                            background: quantity === q.id ? q.bg : C.bg,
                            boxShadow: quantity === q.id ? `0 3px 14px ${q.color}30` : 'none',
                            transition: 'all 0.18s ease',
                          }}>
                            <div style={{ fontSize: 24, marginBottom: 5 }}>{q.emoji}</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: quantity === q.id ? q.color : C.muted }}>{q.label}</div>
                            <div style={{ fontSize: 10, color: quantity === q.id ? q.color : C.faint, marginTop: 2, opacity: 0.75 }}>{q.sub}</div>
                          </button>
                        ))}
                      </div>

                      {gpsWarning && (
                        <div style={{ background: '#FFF8E1', border: '1px solid rgba(245,127,23,0.2)', borderRadius: 14, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFF3CD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📍</div>
                          <span style={{ fontSize: 13, color: '#F57F17', fontWeight: 600, lineHeight: 1.4 }}>
                            {lang === 'fr' ? 'Vous semblez loin de votre établissement. Êtes-vous bien sur place ?' : 'You seem far from your venue. Are you on-site?'}
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#D32F2F', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          {lang === 'fr' ? 'Lien live (optionnel)' : 'Live link (optional)'}
                        </span>
                      </div>
                      <input
                        value={liveUrl}
                        onChange={e => setLiveUrl(e.target.value)}
                        placeholder={lang === 'fr' ? 'YouTube, Instagram, TikTok, Facebook...' : 'YouTube, Instagram, TikTok, Facebook...'}
                        style={{ ...inputStyle, fontSize: 13 }}
                      />
                      {liveUrl.trim() && (() => {
                        const lp = detectLivePlatform(liveUrl.trim());
                        return (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(211,47,47,0.09)', border: '1px solid rgba(211,47,47,0.2)', borderRadius: 100, padding: '4px 12px', marginTop: -6, marginBottom: 14 }}>
                            <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#D32F2F', display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#D32F2F' }}>🔴 LIVE · {lp.name}</span>
                          </div>
                        );
                      })()}

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
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '22px 16px', borderRadius: 18, border: '1.5px dashed rgba(255,80,0,0.25)', background: 'linear-gradient(135deg,rgba(255,80,0,0.04) 0%,rgba(255,140,66,0.04) 100%)', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,80,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📷</div>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#FF5000' }}>{lang === 'fr' ? 'Ajouter une photo' : 'Add a photo'}</span>
                            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, textAlign: 'center', lineHeight: 1.5 }}>{lang === 'fr' ? 'Boostez votre annonce ↑ clics et ↑ clients' : 'Boost clicks & attract more customers'}</span>
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
                        ? (
                          <div className="badge-enter" style={{ background: 'linear-gradient(135deg,#1DB954,#28A349)', borderRadius: 18, padding: '22px 20px', textAlign: 'center', marginBottom: 8, boxShadow: '0 6px 24px rgba(29,185,84,0.35)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 180, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
                            <div style={{ fontSize: 38, marginBottom: 8, lineHeight: 1 }}>🎉</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: 'white', marginBottom: 5, letterSpacing: '-0.3px' }}>{t.liveSuccess}</div>
                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 16 }}>
                              {lang === 'fr' ? 'Vos clients à proximité sont notifiés.' : 'Customers nearby are notified.'}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => setTab('explore')} style={{ flex: 1, background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '10px 14px', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                                {lang === 'fr' ? '→ Voir' : '→ See live'}
                              </button>
                              <button onClick={() => setJustDone(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 14px', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                                {lang === 'fr' ? '+ Un autre' : '+ Another'}
                              </button>
                            </div>
                          </div>
                        )
                        : !canAnnounce
                          ? <button onClick={() => setShowUpgrade(true)} style={{ display: 'block', width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#FF5000,#FF8C42)', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 8 }}>⭐ {t.upgradeBtn}</button>
                          : <button disabled={saving} onClick={announce} style={{ ...btnStyle(C.primary), opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s ease' }}>{saving ? '⏳ ' + t.announcing : t.announceBtn}</button>
                      }
                    </div>

                    <div style={{ background: C.card, borderRadius: 20, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: myItems.length ? 16 : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {myItems.length > 0 && <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF5000', display: 'inline-block' }} />}
                          <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.3px' }}>{t.liveNow}</span>
                        </div>
                        <span style={{ background: myItems.length > 0 ? '#FF5000' : C.black, color: 'white', borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 700, transition: 'background 0.2s ease' }}>{myItems.length}</span>
                      </div>
                      {myItems.length === 0
                        ? <p style={{ fontSize: 14, color: C.muted, margin: '8px 0 0' }}>{t.nothingLive}</p>
                        : myItems.map((it) => {
                            const f = freshnessInfo(it.at, t.freshnessLabels);
                            const q = t.quantities.find(q => q.id === it.quantity);
                            const mins = Math.floor((Date.now() - new Date(it.at)) / 60000);
                            return (
                              <div key={it.id} style={{ display: 'flex', alignItems: 'stretch', gap: 0, background: C.bg, borderRadius: 14, marginBottom: 8, overflow: 'hidden' }}>
                                <div style={{ width: 4, flexShrink: 0, background: f.color }} />
                                <div style={{ flex: 1, padding: '12px 10px 12px 12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontSize: 14, fontWeight: 800 }}>{it.product}</span>
                                        {q && <span style={{ fontSize: 13 }}>{q.emoji}</span>}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 11, color: f.color, fontWeight: 700 }}>{f.label}</span>
                                        <span style={{ fontSize: 10, color: C.faint }}>·</span>
                                        <span style={{ fontSize: 11, color: C.muted }}>{t.timeAgo(mins)}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                      <button onClick={() => {
                                        setCustomProduct(it.product);
                                        setQuantity(it.quantity || 'plenty');
                                        setLiveUrl(it.live_url || '');
                                        setJustDone(false);
                                        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                        setToast(lang === 'fr' ? '↺ Formulaire pré-rempli' : '↺ Form pre-filled');
                                        setTimeout(() => setToast(''), 2000);
                                      }} title={lang === 'fr' ? 'Répéter' : 'Repeat'}
                                        style={{ background: 'rgba(255,80,0,0.08)', border: 'none', borderRadius: 8, width: 28, height: 28, color: '#FF5000', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↺</button>
                                      <button onClick={() => removeItem(it.id)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8, width: 28, height: 28, color: C.muted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                    </div>
                                  </div>
                                  <div style={{ height: 3, background: 'rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
                                    <div style={{ height: '100%', width: `${f.bar}%`, background: f.color, borderRadius: 10, transition: 'width 1s ease' }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      }
                    </div>

                    <button onClick={shareVenue} style={{ display: 'block', width: '100%', padding: '14px 20px', borderRadius: 14, border: 'none', background: shareCopied ? 'linear-gradient(135deg,#34C759,#28A349)' : 'linear-gradient(135deg,#0A0A0A,#2C2C2C)', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 8, transition: 'background 0.25s ease', boxShadow: shareCopied ? '0 4px 16px rgba(52,199,89,0.3)' : '0 2px 8px rgba(0,0,0,0.1)' }}>
                      {shareCopied ? `✅ ${lang === 'fr' ? 'Lien copié !' : 'Link copied!'}` : `🔗 ${lang === 'fr' ? 'Partager mon lien live' : 'Share my live link'}`}
                    </button>

                    <button onClick={() => { setMyVenue(null); localStorage.removeItem('hn_mine'); setVenueScreen('register'); }}
                      style={{ display: 'block', width: '100%', padding: '13px 20px', borderRadius: 14, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>{t.switchVenue}</button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV — floating pill ── */}
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)', maxWidth: 400,
        background: 'rgba(10,10,10,0.88)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 100,
        boxShadow: '0 8px 40px rgba(0,0,0,0.40), 0 1px 0 rgba(255,255,255,0.06) inset',
        display: 'flex', zIndex: 100,
        border: '1px solid rgba(255,255,255,0.10)',
        padding: '6px',
        gap: 4,
      }}>
        {(() => {
          const myActiveCount = myVenue ? items.filter(i => i.venue_id === myVenue.id).length : 0;
          const favCount = favorites.length;
          const hotCount = items.filter(i => (Date.now() - new Date(i.at)) / 60000 < 15).length;
          return [
            { id: 'explore',   icon: '🔥', label: t.navDiscover,  badge: tab !== 'explore' ? hotCount : 0 },
            { id: 'favorites', icon: '❤️', label: t.navFavorites, badge: favCount },
            { id: 'venue',     icon: '🏪', label: t.navVenue,     badge: myActiveCount },
          ].map(nav => (
            <button key={nav.id} onClick={() => setTab(nav.id)} style={{
              flex: 1, padding: '9px 8px 8px',
              background: tab === nav.id ? 'rgba(255,255,255,0.13)' : 'transparent',
              border: 'none', borderRadius: 100,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              transition: 'background 0.2s ease', position: 'relative',
            }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <span style={{ fontSize: 20, lineHeight: 1, transition: 'transform 0.2s ease', transform: tab === nav.id ? 'scale(1.12)' : 'scale(1)' }}>{nav.icon}</span>
                {nav.badge > 0 && (
                  <div style={{ position: 'absolute', top: -4, right: -6, background: '#FF5000', borderRadius: 100, minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxSizing: 'border-box' }}>
                    <span style={{ fontSize: 8, fontWeight: 900, color: 'white', fontFamily: 'inherit' }}>{nav.badge > 9 ? '9+' : nav.badge}</span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: tab === nav.id ? 'white' : 'rgba(255,255,255,0.38)', fontFamily: 'inherit', letterSpacing: '0.3px', transition: 'color 0.2s ease' }}>
                {nav.label}
              </span>
              <div style={{ width: tab === nav.id ? 16 : 0, height: 2, borderRadius: 100, background: 'rgba(255,255,255,0.6)', transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)', overflow: 'hidden' }} />
            </button>
          ));
        })()}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function gradientByType(type) {
  const g = {
    bakery:      'linear-gradient(160deg,#FF9A3C 0%,#FF5000 55%,#CC2900 100%)',
    pizzeria:    'linear-gradient(160deg,#FF7043 0%,#D32F2F 55%,#880E27 100%)',
    pastry:      'linear-gradient(160deg,#F8BBD0 0%,#E91E8C 55%,#880E4F 100%)',
    restaurant:  'linear-gradient(160deg,#A5D6A7 0%,#2E7D32 55%,#1B3B1B 100%)',
    cafe:        'linear-gradient(160deg,#BCAAA4 0%,#6D4C41 55%,#3E2723 100%)',
    fromagerie:  'linear-gradient(160deg,#FFF176 0%,#F9A825 55%,#E65100 100%)',
    boucherie:   'linear-gradient(160deg,#FFCDD2 0%,#C62828 55%,#7B1111 100%)',
    traiteur:    'linear-gradient(160deg,#C8E6C9 0%,#388E3C 55%,#1B5E20 100%)',
    glacier:     'linear-gradient(160deg,#B2EBF2 0%,#00838F 55%,#006064 100%)',
    foodtruck:   'linear-gradient(160deg,#FFE0B2 0%,#EF6C00 55%,#BF360C 100%)',
    sushi:       'linear-gradient(160deg,#FCE4EC 0%,#C2185B 55%,#6A0032 100%)',
    chocolatier: 'linear-gradient(160deg,#D7CCC8 0%,#5D4037 55%,#321911 100%)',
    rotisserie:  'linear-gradient(160deg,#FFE0B2 0%,#D84315 55%,#8B2500 100%)',
    creperie:    'linear-gradient(160deg,#FFF9C4 0%,#F57F17 55%,#9E5E00 100%)',
    other:       'linear-gradient(160deg,#CFD8DC 0%,#546E7A 55%,#263238 100%)',
  };
  return g[type] || g.other;
}

const PHOTO_OVERLAY = 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.75) 100%)';

function fmtDist(km, lang = 'fr') {
  const m = Math.round(km * 1000);
  const label = km < 1 ? `${m}m` : `${km.toFixed(1)}km`;
  const walkMins = Math.round((km / 5) * 60);
  if (walkMins < 2) return lang === 'fr' ? `${label} · à pied` : `${label} · walking`;
  if (walkMins > 20) return label;
  return lang === 'fr' ? `${label} · ~${walkMins} min` : `${label} · ~${walkMins} min`;
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#757575',
  textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8,
};

const inputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: 14,
  border: 'none', fontSize: 15, fontFamily: 'inherit',
  fontWeight: 500, color: '#000', background: '#F2F2F7',
  boxSizing: 'border-box', marginBottom: 14, appearance: 'none',
  outline: 'none',
};

function btnStyle(bg, ghost = false) {
  return {
    display: 'block', width: '100%', padding: '15px 20px', borderRadius: 14,
    border: ghost ? '1.5px solid #E5E5EA' : 'none',
    background: ghost ? 'transparent' : 'linear-gradient(135deg,#FF5000,#FF8C42)',
    color: ghost ? '#8A8A8E' : 'white',
    fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
    marginBottom: 8,
    boxShadow: ghost ? 'none' : '0 4px 18px rgba(255,80,0,0.3)',
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
