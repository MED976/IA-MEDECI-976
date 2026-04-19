import { useState } from 'react';
import { supabase } from './supabaseClient';
import T from './translations';
import './animations.css';

// ── HotNow — Marketing Landing Page ──────────────────────────────────────────
export default function LandingPage({ onExplore, onRegister, lang, setLang }) {
  const t = T[lang].landing;
  const types = T[lang].app.businessTypes;

  const [leadEmail, setLeadEmail]   = useState('');
  const [leadDone, setLeadDone]     = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);

  const C = {
    primary: '#FF5000', black: '#0A0A0A',
    white: '#FFFFFF', offWhite: '#F6F6F6', muted: '#757575',
    card: '#FFFFFF', border: '#EEEEEE',
  };
  const grad = 'linear-gradient(135deg,#FF5000,#FF8C42)';

  const TYPE_ACCENT = {
    bakery: '#FF7A00', pizzeria: '#D32F2F', pastry: '#C2185B',
    restaurant: '#2E7D32', cafe: '#6D4C41', fromagerie: '#F9A825',
    boucherie: '#C62828', traiteur: '#388E3C', glacier: '#00838F',
    foodtruck: '#EF6C00', sushi: '#880E4F', chocolatier: '#5D4037',
    rotisserie: '#D84315', creperie: '#F57F17',
  };

  const pill = (text, light = false) => ({
    display: 'inline-block', padding: '5px 14px', borderRadius: 100, fontSize: 12,
    fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
    background: light ? 'rgba(255,255,255,0.15)' : '#FFF0EB',
    color: light ? 'white' : C.primary,
    marginBottom: 16,
  });

  const btn = (primary = true, small = false) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: small ? '11px 22px' : '15px 28px',
    borderRadius: small ? 12 : 14, fontFamily: 'inherit', cursor: 'pointer',
    fontSize: small ? 14 : 15, fontWeight: 700, border: 'none',
    background: primary ? grad : 'rgba(255,255,255,0.12)',
    color: 'white', boxShadow: primary ? '0 4px 20px rgba(255,80,0,0.35)' : 'none',
  });

  const langToggle = {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10, padding: '6px 4px', display: 'flex', gap: 2,
  };

  const langBtn = (active) => ({
    padding: '4px 10px', borderRadius: 8, fontFamily: 'inherit', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, border: 'none',
    background: active ? 'white' : 'transparent',
    color: active ? C.black : 'rgba(255,255,255,0.6)',
  });

  const submitLead = async () => {
    if (!leadEmail.includes('@') || leadSaving) return;
    setLeadSaving(true);
    await supabase.from('leads').insert({ email: leadEmail.trim() }).then(() => {});
    setLeadDone(true);
    setLeadSaving(false);
  };

  const MOCK_ITEMS = [
    { icon: '🥖', name: lang === 'fr' ? 'Boulangerie Martin' : 'Boulangerie Martin', product: lang === 'fr' ? 'Baguettes tradition' : 'Traditional baguettes', qty: `🔥 ${lang === 'fr' ? 'Beaucoup' : 'Plenty'}`, badge: lang === 'fr' ? 'Tout chaud !' : 'Just out!', bc: '#FF5000', bg: 'linear-gradient(135deg,#FF8C42,#FF5000)', ago: lang === 'fr' ? 'à l\'instant' : 'just now', confs: 4, bar: 97 },
    { icon: '🍱', name: lang === 'fr' ? 'Sushi Sakura' : 'Sushi Sakura', product: lang === 'fr' ? 'Plateau sushi du midi' : 'Midday sushi tray', qty: `✨ ${lang === 'fr' ? 'Quelques-uns' : 'A few'}`, badge: lang === 'fr' ? 'Très frais' : 'Very fresh', bc: '#FF7A00', bg: 'linear-gradient(135deg,#EF9A9A,#880E4F)', ago: lang === 'fr' ? 'il y a 18 min' : '18 min ago', confs: 7, bar: 72 },
    { icon: '🍦', name: lang === 'fr' ? 'Glacier des Alpes' : 'Glacier des Alpes', product: lang === 'fr' ? 'Sorbet citron maison' : 'Homemade lemon sorbet', qty: `⚡ ${lang === 'fr' ? 'Les derniers !' : 'Last ones!'}`, badge: lang === 'fr' ? 'Frais' : 'Fresh', bc: '#1A8917', bg: 'linear-gradient(135deg,#80DEEA,#00838F)', ago: lang === 'fr' ? 'il y a 35 min' : '35 min ago', confs: 2, bar: 51 },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.offWhite, overflowX: 'hidden' }}>

      {/* ── STICKY NAV ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.94)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>HotNow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={langToggle}>
            <button onClick={() => setLang('fr')} style={langBtn(lang === 'fr')}>FR</button>
            <button onClick={() => setLang('en')} style={langBtn(lang === 'en')}>EN</button>
          </div>
          <button onClick={onRegister} style={btn(true, true)}>{t.navCta}</button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ background: C.black, padding: '60px 24px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,80,0,0.32) 0%, rgba(255,80,0,0.08) 45%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,80,0,0.3), transparent)', pointerEvents: 'none' }} />

        <div className="badge-enter" style={pill(t.pill, true)}>{t.pill}</div>

        <h1 className="card-enter" style={{ fontSize: 38, fontWeight: 900, color: 'white', margin: '0 0 18px', lineHeight: 1.15, letterSpacing: '-1px' }}>
          {t.heroTitle1}<br />
          <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t.heroTitle2}
          </span>
        </h1>

        <p className="card-enter" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 36px', maxWidth: 340, marginLeft: 'auto', marginRight: 'auto', animationDelay: '80ms' }}>
          {t.heroSub}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <button onClick={onRegister} style={{ ...btn(true), width: '100%', maxWidth: 320, fontSize: 16 }}>{t.ctaVenue}</button>
          <button onClick={onExplore}  style={{ ...btn(false), width: '100%', maxWidth: 320, fontSize: 15 }}>{t.ctaExplore}</button>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, background: 'rgba(255,255,255,0.07)', borderRadius: 100, padding: '8px 16px' }}>
          <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#1DB954', display: 'inline-block', boxShadow: '0 0 6px #1DB954' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{t.liveBadge}</span>
        </div>
      </div>

      {/* ── LIVE PREVIEW MOCK ── */}
      <div style={{ background: C.black, padding: '0 20px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34C759', animation: 'pulseDot 1.1s ease-in-out infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t.liveLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
          {MOCK_ITEMS.map((v, i) => (
            <div key={i} className="card-enter"
              style={{ flexShrink: 0, width: 188, height: 200, borderRadius: 22, overflow: 'hidden', position: 'relative', background: v.bg, animationDelay: `${i * 100}ms`, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 52, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{v.icon}</span>
              </div>
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <div style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 100, padding: '5px 11px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.bc, display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'white' }}>{v.badge}</span>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 12px 12px', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.92))' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 3 }}>{v.ago}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{v.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 7 }}>{v.product}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <div style={{ height: 2, flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${v.bar}%`, background: v.bc, borderRadius: 10 }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 700, flexShrink: 0 }}>{v.bar}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>👍 {v.confs}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>·</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{v.qty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ background: C.white, padding: '40px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        {t.stats.map((s, i) => {
          const statColors = ['#FF5000', '#FF7A00', '#34C759'];
          return (
            <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: statColors[i], letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.4, fontWeight: 600 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── FOR VENUES ── */}
      <div style={{ background: C.offWhite, padding: '52px 20px' }}>
        <div style={pill()}>{t.venuePill}</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C.black, margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{t.venueTitle}</h2>
        <p style={{ fontSize: 15, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>{t.venueSub}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {t.venueSteps.map((s, i) => {
            const stepGrads = ['linear-gradient(135deg,#FF5000,#FF8C42)', 'linear-gradient(135deg,#6C63FF,#9B59B6)', 'linear-gradient(135deg,#34C759,#28A349)'];
            return (
              <div key={i} className="card-enter" style={{ background: C.card, borderRadius: 20, padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', animationDelay: `${i * 80}ms`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: `${['rgba(255,80,0,0.06)', 'rgba(108,99,255,0.06)', 'rgba(52,199,89,0.06)'][i]}` }} />
                <div style={{ width: 50, height: 50, borderRadius: 16, background: stepGrads[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{s.icon}</div>
                <div style={{ paddingTop: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${['rgba(255,80,0,0.12)', 'rgba(108,99,255,0.12)', 'rgba(52,199,89,0.12)'][i]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: ['#FF5000', '#6C63FF', '#34C759'][i] }}>{i + 1}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.black }}>{s.title}</div>
                  </div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BUSINESS TYPES ── */}
      <div style={{ background: C.black, padding: '48px 20px' }}>
        <div style={pill(t.typesPill, true)}>{t.typesPill}</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px' }}>{t.typesTitle}</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', lineHeight: 1.6 }}>{t.typesSub}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {types.filter(tp => tp.id !== 'other').map((tp, i) => {
            const accent = TYPE_ACCENT[tp.id] || '#FF5000';
            return (
              <div key={tp.id} className="card-enter card-press" onClick={onExplore}
                style={{ background: `${accent}18`, border: `1px solid ${accent}30`, borderRadius: 16, padding: '18px 8px 14px', textAlign: 'center', animationDelay: `${i * 40}ms`, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: -10, right: -10, width: 40, height: 40, borderRadius: '50%', background: `${accent}12`, pointerEvents: 'none' }} />
                <div style={{ fontSize: 28, marginBottom: 8 }}>{tp.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: accent, lineHeight: 1.3 }}>{tp.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOR CUSTOMERS ── */}
      <div style={{ background: C.white, padding: '52px 20px' }}>
        <div style={pill()}>{t.customerPill}</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C.black, margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{t.customerTitle}</h2>
        <p style={{ fontSize: 15, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>{t.customerSub}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {t.customerSteps.map((s, i) => {
            const custColors = ['#007AFF', '#FF5000', '#34C759'];
            return (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px', background: `${custColors[i]}08`, borderRadius: 18, border: `1px solid ${custColors[i]}14` }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: `${custColors[i]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                <div style={{ paddingTop: 3 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.black, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onExplore} style={{ border: `2px solid ${C.border}`, background: 'white', color: C.black, marginTop: 32, width: '100%', padding: '15px 28px', borderRadius: 14, fontFamily: 'inherit', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
          {t.customerCta}
        </button>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ background: C.offWhite, padding: '52px 20px' }}>
        <div style={pill()}>{t.testimonialsPill}</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C.black, margin: '0 0 28px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{t.testimonialsTitle}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {t.testimonials.map((item, i) => (
            <div key={i} className="card-enter" style={{ background: C.card, borderRadius: 20, padding: '22px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', animationDelay: `${i * 70}ms`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: i === 0 ? grad : i === 1 ? 'linear-gradient(90deg,#6C63FF,#9B59B6)' : 'linear-gradient(90deg,#34C759,#28A349)', borderRadius: '20px 20px 0 0' }} />
              <div style={{ display: 'flex', gap: 1, marginBottom: 12 }}>
                {'★★★★★'.split('').map((star, si) => <span key={si} style={{ fontSize: 14, color: '#FF5000' }}>{star}</span>)}
              </div>
              <p style={{ fontSize: 15, color: C.black, lineHeight: 1.65, margin: '0 0 18px' }}>{item.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: i === 0 ? grad : i === 1 ? 'linear-gradient(135deg,#6C63FF,#9B59B6)' : 'linear-gradient(135deg,#34C759,#28A349)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.black }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LEAD CAPTURE ── */}
      <div style={{ background: C.black, padding: '52px 20px', textAlign: 'center' }}>
        <div style={pill(t.leadPill, true)}>{t.leadPill}</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{t.leadTitle}</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', lineHeight: 1.6 }}>{t.leadSub}</p>
        {leadDone
          ? <div style={{ background: 'rgba(29,185,84,0.15)', border: '1px solid rgba(29,185,84,0.3)', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 600, color: '#1DB954' }}>{t.leadDone}</div>
          : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={leadEmail} onChange={e => setLeadEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitLead()} placeholder={t.leadPlaceholder} type="email"
                style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 15, fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={submitLead} disabled={leadSaving} style={{ padding: '14px 18px', borderRadius: 12, border: 'none', background: grad, color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {leadSaving ? '…' : t.leadBtn}
              </button>
            </div>
          )
        }
      </div>

      {/* ── PRICING ── */}
      <div style={{ background: '#060606', padding: '52px 20px' }}>
        <div style={pill(t.pricingPill, true)}>{t.pricingPill}</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{t.pricingTitle}</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 32px', lineHeight: 1.6 }}>{t.pricingSub}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {t.plans.map((plan, i) => (
            <div key={i} style={{ borderRadius: 20, padding: '24px 20px', position: 'relative', overflow: 'hidden', background: plan.highlight ? 'white' : 'rgba(255,255,255,0.06)', border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)', boxShadow: plan.highlight ? '0 8px 40px rgba(255,80,0,0.25)' : 'none' }}>
              {plan.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: grad }} />}
              {plan.badge && <div style={{ display: 'inline-block', background: '#FFF0EB', color: '#FF5000', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, marginBottom: 12 }}>{plan.badge}</div>}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: plan.highlight ? C.black : 'white' }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: plan.highlight ? C.primary : 'white' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: plan.highlight ? C.muted : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{plan.period}</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: plan.highlight ? C.muted : 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>{plan.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {plan.features.map((f, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: plan.highlight ? '#FF5000' : '#1DB954', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 14, color: plan.highlight ? C.black : 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => plan.ctaAction === 'stripe' ? window.open(process.env.REACT_APP_STRIPE_LINK || 'https://buy.stripe.com/aFa6oG0wc6iY5dwcVh8EM00', '_blank') : onRegister()}
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer', fontSize: 15, fontWeight: 700, border: 'none', background: plan.highlight ? grad : 'rgba(255,255,255,0.1)', color: 'white', boxShadow: plan.highlight ? '0 4px 16px rgba(255,80,0,0.35)' : 'none' }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 16 }}>{t.pricingNote}</p>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ background: C.black, padding: '60px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,80,0,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {[{ text: lang === 'fr' ? '🥖 Fournée prête !' : '🥖 Batch ready!', color: '#FF5000' }, { text: lang === 'fr' ? '🍦 Sorti du four' : '🍦 Just baked', color: '#00838F' }, { text: lang === 'fr' ? '🍱 Sushi du jour' : "🍱 Today's sushi", color: '#C2185B' }].map((b, bi) => (
            <div key={bi} className="badge-enter" style={{ background: `${b.color}18`, border: `1px solid ${b.color}30`, borderRadius: 100, padding: '6px 14px', animationDelay: `${bi * 80}ms` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.text}</span>
            </div>
          ))}
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          {t.ctaTitle1}<br />
          <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t.ctaTitle2}</span>
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 36px', lineHeight: 1.6 }}>{t.ctaSub}</p>
        <button onClick={onRegister} style={{ display: 'block', width: '100%', padding: '18px 28px', borderRadius: 16, fontFamily: 'inherit', cursor: 'pointer', fontSize: 17, fontWeight: 700, border: 'none', background: grad, color: 'white', boxShadow: '0 6px 30px rgba(255,80,0,0.4)' }}>
          {t.ctaFinal}
        </button>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>{t.ctaNote}</p>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: '#050505', padding: '32px 20px 28px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <span style={{ fontSize: 17, fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>HotNow</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['🇫🇷', '🇬🇧'].map((flag, i) => (
              <button key={i} onClick={() => setLang(i === 0 ? 'fr' : 'en')}
                style={{ background: lang === (i === 0 ? 'fr' : 'en') ? 'rgba(255,255,255,0.12)' : 'transparent', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                {flag}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
          {[{ label: lang === 'fr' ? '🏪 Pour les commerces' : '🏪 For businesses', action: onRegister }, { label: lang === 'fr' ? '🔍 Découvrir' : '🔍 Explore', action: onExplore }].map((link, i) => (
            <button key={i} onClick={link.action}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textAlign: 'left' }}>
              {link.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>{t.footerTagline}</p>
      </div>

    </div>
  );
}
