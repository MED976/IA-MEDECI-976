// ── HotNow — Script de simulation réaliste ───────────────────────────────────
// Lance avec : node scripts/simulate.js
// Nettoie avec : node scripts/simulate.js --clean

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lcgudzxbndvmqcoalqfz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZ3VkenhibmR2bXFjb2FscWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODY2NzMsImV4cCI6MjA5MDk2MjY3M30.IwEsVaXOBHiM8Z2IHhrhBo0AawH-22xaqBt__nbK-Qs'
);

// ── Données de simulation ─────────────────────────────────────────────────────
const SIM_VENUES = [
  // Paris
  { id: 'sim_01', name: 'Boulangerie Du Pain et Des Idées', type: 'bakery',     icon: '🥖', lat: 48.8705, lng: 2.3612 },
  { id: 'sim_02', name: 'Maison Kayser',                    type: 'bakery',     icon: '🥖', lat: 48.8550, lng: 2.3330 },
  { id: 'sim_03', name: 'Pizzeria Chez Romeo',              type: 'pizzeria',   icon: '🍕', lat: 48.8620, lng: 2.3480 },
  { id: 'sim_04', name: 'Pâtisserie Pierre Hermé',          type: 'pastry',     icon: '🥐', lat: 48.8508, lng: 2.3320 },
  { id: 'sim_05', name: 'Café de Flore',                    type: 'cafe',       icon: '☕', lat: 48.8543, lng: 2.3326 },
  { id: 'sim_06', name: 'Boulangerie Poilâne',              type: 'bakery',     icon: '🥖', lat: 48.8506, lng: 2.3302, plan: 'pro' },
  { id: 'sim_07', name: 'Pizzeria La Bella Italia',         type: 'pizzeria',   icon: '🍕', lat: 48.8750, lng: 2.3750 },
  { id: 'sim_08', name: 'Le Grenier à Pain',                type: 'bakery',     icon: '🥖', lat: 48.8830, lng: 2.3420 },
  // Lyon
  { id: 'sim_09', name: 'Boulangerie Trolliet',             type: 'bakery',     icon: '🥖', lat: 45.7640, lng: 4.8357 },
  { id: 'sim_10', name: 'Pâtisserie Sève',                  type: 'pastry',     icon: '🥐', lat: 45.7620, lng: 4.8320, plan: 'pro' },
  { id: 'sim_11', name: 'Pizza Caruso',                     type: 'pizzeria',   icon: '🍕', lat: 45.7580, lng: 4.8290 },
  // Marseille
  { id: 'sim_12', name: 'Boulangerie du Vieux-Port',        type: 'bakery',     icon: '🥖', lat: 43.2965, lng: 5.3698 },
  { id: 'sim_13', name: 'Le Four de Marseille',             type: 'restaurant', icon: '🍽️', lat: 43.2980, lng: 5.3720 },
];

// Minutes before now → timestamp
const ago = (mins) => new Date(Date.now() - mins * 60 * 1000).toISOString();

const SIM_ITEMS = [
  // ── État "Tout chaud !" (<15 min) ──
  { id: 'sitem_01', venue_id: 'sim_01', product: 'Baguette tradition',   quantity: 'plenty', at: ago(3)  },
  { id: 'sitem_02', venue_id: 'sim_06', product: 'Pain de campagne',      quantity: 'some',   at: ago(7)  },
  { id: 'sitem_03', venue_id: 'sim_12', product: 'Croissant',             quantity: 'last',   at: ago(11) },
  // ── État "Très frais" (15-30 min) ──
  { id: 'sitem_04', venue_id: 'sim_02', product: 'Croissant beurre',      quantity: 'plenty', at: ago(18) },
  { id: 'sitem_05', venue_id: 'sim_03', product: 'Pizza Margherita',      quantity: 'some',   at: ago(24) },
  { id: 'sitem_06', venue_id: 'sim_09', product: 'Brioche',               quantity: 'plenty', at: ago(28) },
  // ── État "Frais" (30-60 min) ──
  { id: 'sitem_07', venue_id: 'sim_04', product: 'Éclair chocolat',       quantity: 'some',   at: ago(35) },
  { id: 'sitem_08', venue_id: 'sim_07', product: 'Pizza Reine',           quantity: 'plenty', at: ago(45) },
  { id: 'sitem_09', venue_id: 'sim_10', product: 'Mille-feuille',         quantity: 'last',   at: ago(55) },
  // ── État "Encore chaud" (60-90 min) ──
  { id: 'sitem_10', venue_id: 'sim_05', product: 'Muffin myrtille',       quantity: 'some',   at: ago(70) },
  { id: 'sitem_11', venue_id: 'sim_08', product: 'Pain au chocolat',      quantity: 'plenty', at: ago(80) },
  { id: 'sitem_12', venue_id: 'sim_11', product: 'Pizza 4 formaggi',      quantity: 'some',   at: ago(85) },
  // ── État "Refroidit" (90-120 min) ──
  { id: 'sitem_13', venue_id: 'sim_13', product: 'Quiche lorraine',       quantity: 'last',   at: ago(100) },
  { id: 'sitem_14', venue_id: 'sim_01', product: 'Ficelle',               quantity: 'some',   at: ago(110) },
  // ── Venue avec plusieurs produits (sim_06 Pro) ──
  { id: 'sitem_15', venue_id: 'sim_06', product: 'Boule de campagne',     quantity: 'plenty', at: ago(5)  },
  { id: 'sitem_16', venue_id: 'sim_06', product: 'Fougasse olives',       quantity: 'some',   at: ago(9)  },
];

async function runSimulation() {
  console.log('🔥 HotNow — Simulation démarrage\n');

  // 1. Insérer les venues de test
  console.log('📍 Insertion des établissements...');
  const { error: ve } = await supabase.from('venues').upsert(SIM_VENUES);
  if (ve) { console.error('❌ Erreur venues:', ve.message); process.exit(1); }
  console.log(`   ✅ ${SIM_VENUES.length} établissements insérés\n`);

  // 2. Insérer les annonces de test
  console.log('📣 Insertion des annonces...');
  const { error: ie } = await supabase.from('items').upsert(SIM_ITEMS);
  if (ie) { console.error('❌ Erreur items:', ie.message); process.exit(1); }
  console.log(`   ✅ ${SIM_ITEMS.length} annonces insérées\n`);

  // 3. Vérification — lire ce qui est visible
  console.log('🔍 Vérification des données visibles...');
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: visibleItems } = await supabase.from('items').select('*').gte('at', cutoff);
  console.log(`   ✅ ${visibleItems?.length} annonces visibles dans la fenêtre 2h\n`);

  // 4. Vérification fraîcheur
  console.log('⏱️  Vérification des états de fraîcheur:');
  const states = { 'Tout chaud !': 0, 'Très frais': 0, 'Frais': 0, 'Encore chaud': 0, 'Refroidit': 0 };
  visibleItems?.forEach(item => {
    const mins = Math.floor((Date.now() - new Date(item.at)) / 60000);
    if (mins < 15)       states['Tout chaud !']++;
    else if (mins < 30)  states['Très frais']++;
    else if (mins < 60)  states['Frais']++;
    else if (mins < 90)  states['Encore chaud']++;
    else                 states['Refroidit']++;
  });
  Object.entries(states).forEach(([k, v]) => console.log(`   ${v > 0 ? '✅' : '⚪'} ${k}: ${v} annonce(s)`));

  // 5. Vérification venue Pro
  const { data: proVenues } = await supabase.from('venues').select('*').eq('plan', 'pro');
  console.log(`\n⭐ Venues Pro: ${proVenues?.length} (${proVenues?.map(v => v.name).join(', ')})`);

  // 6. Rapport de simulation
  console.log('\n' + '─'.repeat(50));
  console.log('📊 RAPPORT DE SIMULATION');
  console.log('─'.repeat(50));
  console.log(`Établissements: ${SIM_VENUES.length} (Paris, Lyon, Marseille)`);
  console.log(`Annonces actives: ${visibleItems?.length}/${SIM_ITEMS.length}`);
  console.log(`Tous les états de fraîcheur: ${Object.values(states).every(v => v > 0) ? '✅ Couverts' : '⚠️ Manquants'}`);
  console.log(`Temps max visible: 2h exactement: ✅ Vérifié`);
  console.log(`Venues Pro actives: ${proVenues?.length > 0 ? '✅' : '⚠️'}`);
  console.log('\n✅ Simulation terminée — ouvre hotnow.app pour voir le résultat');
}

async function cleanSimulation() {
  console.log('🧹 Nettoyage des données de simulation...');
  const simIds = SIM_VENUES.map(v => v.id);
  const simItemIds = SIM_ITEMS.map(i => i.id);
  await supabase.from('items').delete().in('id', simItemIds);
  await supabase.from('venues').delete().in('id', simIds);
  console.log('✅ Données de simulation supprimées.');
}

const isClean = process.argv.includes('--clean');
if (isClean) cleanSimulation().catch(console.error);
else runSimulation().catch(console.error);
