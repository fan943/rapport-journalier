# Rapport Journalier

Rapport journalier d'intervention SSI : date, état de la centrale à l'arrivée et au départ, essais/observations en texte libre, avec export texte copiable.

## Développement local

```bash
npm install
npm run dev
```

## Build de production

```bash
npm run build
npm run preview
```

## Déploiement sur Vercel

1. Pousser ce repo sur GitHub.
2. Aller sur https://vercel.com → "Add New..." → "Project".
3. Importer le repo GitHub `rapport-journalier`.
4. Vercel détecte Vite automatiquement. Laisser les réglages par défaut.
5. "Deploy".

## Pousser sur GitHub

```bash
git remote add origin https://github.com/fan943/rapport-journalier.git
git branch -M main
git push -u origin main
```
