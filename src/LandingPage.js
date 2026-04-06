// ── HotNow — Marketing Landing Page ──────────────────────────────────────────
export default function LandingPage({ onExplore, onRegister }) {

  const C = {
    primary: '#FF5000', orange: '#FF8C42', black: '#0A0A0A',
    white: '#FFFFFF', offWhite: '#F6F6F6', muted: '#757575',
    card: '#FFFFFF', border: '#EEEEEE',
  };

  const grad = 'linear-gradient(135deg,#FF5000,#FF8C42)';

  const TYPES = [
    { icon: '🥖', label: 'Bakery' },
    { icon: '🍕', label: 'Pizzeria' },
    { icon: '🥐', label: 'Pastry' },
    { icon: '🍽️', label: 'Restaurant' },
    { icon: '☕', label: 'Café' },
    { icon: '🏪', label: 'Other' },
  ];

  const STEPS_VENUE = [
    { icon: '📝', title: 'Inscrivez-vous en 30 secondes', desc: 'Entrez le nom de votre établissement, son type et confirmez votre position GPS. C\'est tout.' },
    { icon: '📣', title: 'Appuyez quand c\'est prêt', desc: 'Sélectionnez le produit, la quantité, appuyez sur le bouton. Votre annonce est en ligne instantanément.' },
    { icon: '🔥', title: 'Les clients arrivent', desc: 'Les clients affamés à proximité voient votre établissement apparaître en tête du fil HotNow.' },
  ];

  const STEPS_CUSTOMER = [
    { icon: '📍', title: 'Ouvrez HotNow', desc: 'L\'application vous montre toutes les fournées fraîches annoncées près de vous en ce moment.' },
    { icon: '❤️', title: 'Sauvegardez vos favoris', desc: 'Mettez en favori vos boulangeries préférées et soyez alerté à la prochaine fournée.' },
    { icon: '🚶', title: 'Rendez-vous sur place', desc: 'Une barre de fraîcheur vous indique le temps qu\'il vous reste avant que ce soit froid.' },
  ];

  const TESTIMONIALS = [
    { quote: '"Depuis que j\'utilise HotNow, mes croissants sont vendus 20 minutes après la sortie du four."', name: 'Marie L.', role: 'Boulangère, Lyon' },
    { quote: '"Je sais enfin exactement quand descendre à la boulangerie. Plus jamais de pain froid !"', name: 'Thomas K.', role: 'Client, Paris' },
    { quote: '"Inscrit en moins d\'une minute. Ma file d\'attente double les midis maintenant."', name: 'Enzo R.', role: 'Pizzaïolo, Marseille' },
  ];

  const STATS = [
    { value: '2 min', label: 'Pour annoncer une fournée' },
    { value: '100%', label: 'Gratuit pour les établissements' },
    { value: '2 h', label: 'Fenêtre de fraîcheur en temps réel' },
  ];

  // ── Shared helpers ──────────────────────────────────────────────────────────
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
    transition: 'transform 0.1s, box-shadow 0.1s',
  });

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.offWhite, overflowX: 'hidden' }}>

      {/* ── STICKY NAV ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>HotNow</span>
        </div>
        <button onClick={onRegister} style={btn(true, true)}>
          Inscrire mon établissement
        </button>
      </div>

      {/* ── HERO ── */}
      <div style={{ background: C.black, padding: '60px 24px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* ambient glow */}
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,80,0,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={pill('Pour les boulangers & restaurateurs', true)}>Pour les boulangers & restaurateurs 🔥</div>

        <h1 style={{ fontSize: 38, fontWeight: 900, color: 'white', margin: '0 0 18px', lineHeight: 1.15, letterSpacing: '-1px' }}>
          Le four vient de sonner.<br />
          <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Dites-le au monde.
          </span>
        </h1>

        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 36px', maxWidth: 340, marginLeft: 'auto', marginRight: 'auto' }}>
          HotNow permet aux établissements d'annoncer leurs fournées en temps réel. Les clients affamés à proximité vous voient instantanément.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <button onClick={onRegister} style={{ ...btn(true), width: '100%', maxWidth: 320, fontSize: 16 }}>
            🏪 Inscrire mon établissement — c'est gratuit
          </button>
          <button onClick={onExplore} style={{ ...btn(false), width: '100%', maxWidth: 320, fontSize: 15 }}>
            🔍 Voir les fournées près de moi
          </button>
        </div>

        {/* Live badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28, background: 'rgba(255,255,255,0.07)', borderRadius: 100, padding: '8px 16px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1DB954', display: 'inline-block', boxShadow: '0 0 6px #1DB954' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Annonces en direct · mis à jour en temps réel</span>
        </div>
      </div>

      {/* ── LIVE PREVIEW MOCK ── */}
      <div style={{ background: C.black, padding: '0 20px 48px' }}>
        <div style={{ background: '#181818', borderRadius: 20, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>En direct près de vous</div>
          {[
            { icon: '🥖', name: 'Boulangerie Martin', type: 'Bakery', product: 'Baguettes', qty: '🔥 Plenty', time: '2m ago', badge: 'Just out!', badgeColor: '#FF5000' },
            { icon: '🍕', name: 'Pizzeria Roma', type: 'Pizzeria', product: 'Pizza Margherita', qty: '✨ A few', time: '18m ago', badge: 'Very fresh', badgeColor: '#FF7A00' },
            { icon: '🥐', name: 'Maison Dupont', type: 'Pastry', product: 'Pain au chocolat', qty: '⚡ Last ones!', time: '45m ago', badge: 'Fresh', badgeColor: '#1A8917' },
          ].map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: i === 0 ? 'linear-gradient(135deg,#FF8C42,#FF5000)' : i === 1 ? 'linear-gradient(135deg,#FF6B6B,#C0392B)' : 'linear-gradient(135deg,#F8BBD0,#E91E63)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{v.icon}</div>
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
        {STATS.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.black, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FOR VENUES ── */}
      <div style={{ background: C.offWhite, padding: '52px 20px' }}>
        <div style={pill()}>Pour les établissements</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C.black, margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          Transformez chaque fournée en trafic immédiat
        </h2>
        <p style={{ fontSize: 15, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>
          Vos clients n'ont rien à installer. Pas d'abonnement. Un appui et vous êtes en ligne.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {STEPS_VENUE.map((s, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 18, padding: '20px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
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
        <div style={pill('Qui peut rejoindre', true)}>Qui peut rejoindre</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Tous ceux qui cuisinent, cuisent ou rôtissent
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', lineHeight: 1.6 }}>
          Si vous avez un four, HotNow est fait pour vous.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {TYPES.map((t, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOR CUSTOMERS ── */}
      <div style={{ background: C.white, padding: '52px 20px' }}>
        <div style={pill()}>Pour les clients</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C.black, margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          Ne ratez plus jamais une fournée
        </h2>
        <p style={{ fontSize: 15, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>
          Voyez ce qui sort du four près de chez vous, maintenant.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {STEPS_CUSTOMER.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.black, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onExplore} style={{ ...btn(false), border: `2px solid ${C.border}`, background: 'white', color: C.black, marginTop: 32, width: '100%' }}>
          🔍 Voir les fournées près de moi
        </button>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ background: C.offWhite, padding: '52px 20px' }}>
        <div style={pill()}>Ce qu'ils en disent</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C.black, margin: '0 0 28px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          Ils ont essayé. Ils adorent.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 18, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 24, color: C.primary, marginBottom: 12, lineHeight: 1 }}>"</div>
              <p style={{ fontSize: 15, color: C.black, lineHeight: 1.6, margin: '0 0 16px', fontStyle: 'italic' }}>{t.quote.replace(/^"|"$/g, '')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FF8C42,#FF5000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'white', fontWeight: 700 }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.black }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ background: C.black, padding: '60px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,80,0,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 52, marginBottom: 20 }}>🔥</div>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
          Prêt à remplir votre<br />
          <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>boutique à chaque fournée ?</span>
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 36px', lineHeight: 1.6 }}>
          Gratuit. 30 secondes. Sans carte bancaire. Sans engagement.
        </p>
        <button onClick={onRegister} style={{ ...btn(true), width: '100%', fontSize: 17, padding: '18px 28px', borderRadius: 16, boxShadow: '0 6px 30px rgba(255,80,0,0.4)' }}>
          🏪 Inscrire mon établissement gratuitement
        </button>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
          Vous gardez le contrôle. Supprimable à tout moment.
        </p>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: '#050505', padding: '28px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>HotNow</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.6 }}>
          La fraîcheur en temps réel. Maintenant.
        </p>
      </div>

    </div>
  );
}
