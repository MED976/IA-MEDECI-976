import T from './translations';

// ── HotNow — Marketing Landing Page ──────────────────────────────────────────
export default function LandingPage({ onExplore, onRegister, lang, setLang }) {
  const t = T[lang].landing;

  const TYPES = [
    { icon: '🥖', label: lang === 'fr' ? 'Boulangerie' : 'Bakery' },
    { icon: '🍕', label: 'Pizzeria' },
    { icon: '🥐', label: lang === 'fr' ? 'Pâtisserie' : 'Pastry' },
    { icon: '🍽️', label: 'Restaurant' },
    { icon: '☕', label: 'Café' },
    { icon: '🏪', label: lang === 'fr' ? 'Autre' : 'Other' },
  ];

  const C = {
    primary: '#FF5000', black: '#0A0A0A',
    white: '#FFFFFF', offWhite: '#F6F6F6', muted: '#757575',
    card: '#FFFFFF', border: '#EEEEEE',
  };

  const grad = 'linear-gradient(135deg,#FF5000,#FF8C42)';

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

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.offWhite, overflowX: 'hidden' }}>

      {/* ── STICKY NAV ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>HotNow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Language toggle */}
          <div style={langToggle}>
            <button onClick={() => setLang('fr')} style={langBtn(lang === 'fr')}>FR</button>
            <button onClick={() => setLang('en')} style={langBtn(lang === 'en')}>EN</button>
          </div>
          <button onClick={onRegister} style={btn(true, true)}>{t.navCta}</button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ background: C.black, padding: '60px 24px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,80,0,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={pill(t.pill, true)}>{t.pill}</div>

        <h1 style={{ fontSize: 38, fontWeight: 900, color: 'white', margin: '0 0 18px', lineHeight: 1.15, letterSpacing: '-1px' }}>
          {t.heroTitle1}<br />
          <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t.heroTitle2}
          </span>
        </h1>

        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 36px', maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
          {t.heroSub}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <button onClick={onRegister} style={{ ...btn(true), width: '100%', maxWidth: 320, fontSize: 16 }}>{t.ctaVenue}</button>
          <button onClick={onExplore}  style={{ ...btn(false), width: '100%', maxWidth: 320, fontSize: 15 }}>{t.ctaExplore}</button>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, background: 'rgba(255,255,255,0.07)', borderRadius: 100, padding: '8px 16px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1DB954', display: 'inline-block', boxShadow: '0 0 6px #1DB954' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{t.liveBadge}</span>
        </div>
      </div>

      {/* ── LIVE PREVIEW MOCK ── */}
      <div style={{ background: C.black, padding: '0 20px 48px' }}>
        <div style={{ background: '#181818', borderRadius: 20, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>{t.liveLabel}</div>
          {[
            { icon: '🥖', name: 'Boulangerie Martin', product: lang === 'fr' ? 'Baguettes' : 'Baguettes', qty: `🔥 ${lang === 'fr' ? 'Beaucoup' : 'Plenty'}`, badge: lang === 'fr' ? 'Tout chaud !' : 'Just out!', badgeColor: '#FF5000', bg: 'linear-gradient(135deg,#FF8C42,#FF5000)' },
            { icon: '🍕', name: 'Pizzeria Roma',      product: 'Pizza Margherita',                          qty: `✨ ${lang === 'fr' ? 'Quelques-uns' : 'A few'}`,   badge: lang === 'fr' ? 'Très frais' : 'Very fresh', badgeColor: '#FF7A00', bg: 'linear-gradient(135deg,#FF6B6B,#C0392B)' },
            { icon: '🥐', name: 'Maison Dupont',      product: 'Pain au chocolat',                          qty: `⚡ ${lang === 'fr' ? 'Les derniers !' : 'Last ones!'}`, badge: lang === 'fr' ? 'Frais' : 'Fresh', badgeColor: '#1A8917', bg: 'linear-gradient(135deg,#F8BBD0,#E91E63)' },
          ].map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{v.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{v.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: v.badgeColor }}>{v.badge}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{v.product} · {v.qty}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg,#FF5000,transparent)', borderRadius: 10 }} />
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ background: C.white, padding: '40px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {t.stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.black, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FOR VENUES ── */}
      <div style={{ background: C.offWhite, padding: '52px 20px' }}>
        <div style={pill()}>{t.venuePill}</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C.black, margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{t.venueTitle}</h2>
        <p style={{ fontSize: 15, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>{t.venueSub}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {t.venueSteps.map((s, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 18, padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.black, marginBottom: 4 }}>
                  <span style={{ color: C.primary, marginRight: 6 }}>{i + 1}.</span>{s.title}
                </div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BUSINESS TYPES ── */}
      <div style={{ background: C.black, padding: '48px 20px' }}>
        <div style={pill(t.typesPill, true)}>{t.typesPill}</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px' }}>{t.typesTitle}</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', lineHeight: 1.6 }}>{t.typesSub}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {TYPES.map((type, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{type.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{type.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOR CUSTOMERS ── */}
      <div style={{ background: C.white, padding: '52px 20px' }}>
        <div style={pill()}>{t.customerPill}</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C.black, margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{t.customerTitle}</h2>
        <p style={{ fontSize: 15, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>{t.customerSub}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {t.customerSteps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.black, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            </div>
          ))}
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
            <div key={i} style={{ background: C.card, borderRadius: 18, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 24, color: C.primary, marginBottom: 12, lineHeight: 1 }}>"</div>
              <p style={{ fontSize: 15, color: C.black, lineHeight: 1.6, margin: '0 0 16px', fontStyle: 'italic' }}>{item.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FF8C42,#FF5000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'white', fontWeight: 700 }}>
                  {item.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.black }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING ── */}
      <div style={{ background: C.black, padding: '52px 20px' }}>
        <div style={pill(t.pricingPill, true)}>{t.pricingPill}</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{t.pricingTitle}</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 32px', lineHeight: 1.6 }}>{t.pricingSub}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {t.plans.map((plan, i) => (
            <div key={i} style={{
              borderRadius: 20, padding: '24px 20px', position: 'relative', overflow: 'hidden',
              background: plan.highlight ? 'white' : 'rgba(255,255,255,0.06)',
              border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: plan.highlight ? '0 8px 40px rgba(255,80,0,0.25)' : 'none',
            }}>
              {plan.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: grad }} />}
              {plan.badge && (
                <div style={{ display: 'inline-block', background: '#FFF0EB', color: '#FF5000', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, marginBottom: 12 }}>
                  {plan.badge}
                </div>
              )}
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
              <button
                onClick={() => plan.ctaAction === 'stripe' ? window.open(process.env.REACT_APP_STRIPE_LINK || 'https://buy.stripe.com/aFa6oG0wc6iY5dwcVh8EM00', '_blank') : onRegister()}
                style={{
                  display: 'block', width: '100%', padding: '14px', borderRadius: 12, fontFamily: 'inherit',
                  cursor: 'pointer', fontSize: 15, fontWeight: 700, border: 'none',
                  background: plan.highlight ? grad : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  boxShadow: plan.highlight ? '0 4px 16px rgba(255,80,0,0.35)' : 'none',
                }}>
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
        <div style={{ fontSize: 52, marginBottom: 20 }}>🔥</div>
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
      <div style={{ background: '#050505', padding: '28px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>HotNow</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.6 }}>{t.footerTagline}</p>
      </div>

    </div>
  );
}
