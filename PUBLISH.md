# Guide de publication HotNow sur App Store & Play Store

## Prérequis

| Élément | Coût | Lien |
|---|---|---|
| Apple Developer Account | 99 €/an | developer.apple.com/enroll |
| Google Play Developer Account | 25 € (une fois) | play.google.com/console |
| Mac avec Xcode 15+ | (pour iOS) | |
| Android Studio | gratuit | developer.android.com/studio |

---

## Étape 1 — Préparer les icônes

Tu as besoin d'une icône **1024×1024 px** fond plein (pas de transparence pour iOS).

Génère toutes les tailles avec : https://www.appicon.co

Tailles nécessaires dans `public/` :
- icon-72.png, icon-96.png, icon-128.png, icon-144.png
- icon-152.png, icon-192.png, icon-384.png, icon-512.png

---

## Étape 2 — Initialiser les projets natifs (une seule fois)

```bash
# Sur Mac (pour iOS + Android)
npm run build
npx cap add ios
npx cap add android
```

---

## Étape 3 — Ouvrir et builder

### iOS (Xcode)
```bash
npm run open:ios
```
Dans Xcode :
1. Sélectionne ton équipe de développement (Apple Developer Account)
2. Change le Bundle ID → `app.hotnow`
3. Product → Archive → Distribute App → App Store Connect

### Android (Android Studio)
```bash
npm run open:android
```
Dans Android Studio :
1. Build → Generate Signed Bundle/APK → Android App Bundle (.aab)
2. Crée une clé de signature (garde-la précieusement !)
3. Upload le `.aab` sur Google Play Console

---

## Étape 4 — Mettre à jour après chaque modification

```bash
npm run sync   # rebuild + synchronise avec les projets natifs
```
Puis re-builder depuis Xcode / Android Studio.

---

## Fiches store recommandées

**Nom :** HotNow  
**Sous-titre :** Fournées fraîches en direct  
**Catégorie :** Food & Drink / Lifestyle  
**Mots-clés :** boulangerie, pain frais, pizzeria, fournée, fraîcheur, livraison

**Description courte :**
> Trouvez les fournées fraîches près de vous en temps réel. Boulangeries, pizzerias, pâtisseries — dès la sortie du four.

**Description longue :**
> HotNow est l'application qui connecte les clients aux boulangeries et restaurants au moment exact où leurs produits sortent du four.
> 
> Pour les clients : voyez en temps réel quels établissements près de vous viennent d'annoncer une fournée fraîche. Sauvegardez vos favoris.
> 
> Pour les établissements : inscrivez-vous en 30 secondes et annoncez chaque fournée d'un simple appui. Vos clients arrivent pendant que c'est encore chaud.

---

## Variables d'environnement Vercel (rappel)

Dans le dashboard Vercel → Settings → Environment Variables :
- `REACT_APP_SUPABASE_URL` = `https://lcgudzxbndvmqcoalqfz.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY` = ta clé anon Supabase
