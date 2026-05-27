# 🎹 MIDI to BDO Music Converter 🎶

> **Encodez et chiffrez vos fichiers MIDI (.mid) au format musical officiel de Black Desert Online (.ms2) à 100% localement dans votre navigateur !**

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.x-00DC82.svg?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel Statique](https://img.shields.io/badge/Vercel-SPA_Pure-000000.svg?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Licence MIT](https://img.shields.io/badge/Licence-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Fonctionnalités / Features

### 🇫🇷 Version Française
- **100% Côté Client (Sécurisé & Privé)** : Tout le traitement MIDI, le chiffrement ICE et l'encodage binaire se font localement dans le navigateur. Vos fichiers ne quittent jamais votre machine.
- **Support MIDI Complet** : Analyse et découpage automatique des fichiers MIDI complexes.
- **Conversion Haute Qualité (V9)** : Port exact de l'algorithme d'encodage binaire officiel de Black Desert Online.
- **Chiffrement ICE (Level-0)** : Intégration fidèle du chiffrement propriétaire nécessaire pour que BDO valide la partition.
- **Synthétiseur Audio Intégré** : Écoutez un aperçu dynamique en temps réel grâce à la Web Audio API, reproduisant plus de 15 instruments traditionnels de BDO (Florchestra, Débutant, Marnian, Guitare Électrique).
- **Importation d'identité de propriétaire** : Importez une partition MS2 existante pour cloner l'ID de propriétaire originel et conserver la propriété en jeu.
- **Optimisation des Vélocités** : Modes avancés de gestion des vélocités (stepped, layered, rescale, floor) pour affiner les nuances de jeu.
- **Interface Premium** : Design sombre et luxueux inspiré de l'univers de BDO, doté d'effets de glassmorphism et d'un piano roll dynamique et réactif.

### 🇬🇧 English Version
- **100% Client-Side (Secure & Private)**: All MIDI parsing, ICE encryption, and binary packaging happen entirely inside your browser. Your files never touch any external server.
- **Full MIDI Support**: Robust parsing and automatic track splitting for complex MIDI files.
- **Premium BDO V9 Encoder**: Exact port of the official Black Desert Online music binary format.
- **ICE Level-0 Encryption**: Clean cryptographic implementation required for the game to load the sheet music.
- **Built-in Audio Workstation**: Preview compositions using a Web Audio API synth featuring 15+ BDO-accurate instruments (Florchestra, Beginner, Marnian, Electric Guitars).
- **Owner ID Cloner**: Decrypt and extract Owner ID/Character Name from existing `.ms2` files to retain ownership in-game.
- **Nuanced Velocity Mapping**: Stepped, layered, rescale, or floor velocity filters to craft beautiful dynamics.
- **Premium Interface**: High-end BDO-inspired dark mode UI with glassmorphism layout, dynamic canvas piano roll, and confetti animations upon successful encoding.

---

## 🛠️ Architecture & Technologies

L'application repose sur les technologies modernes suivantes :
- **Framework** : [Nuxt 4](https://nuxt.com/) (configuré en mode SPA pure pour des performances maximales et un déploiement statique ultra-léger)
- **Styles** : [Tailwind CSS](https://tailwindcss.com/) & animations personnalisées
- **Parsing MIDI** : [@tonejs/midi](https://github.com/Tonejs/Midi)
- **Confettis** : [canvas-confetti](https://github.com/catdad/canvas-confetti)
- **Icônes** : [lucide-vue-next](https://lucide.dev/)

---

## 🚀 Développement Local / Local Development

### 1. Prérequis / Prerequisites
- [Node.js](https://nodejs.org/) (Version >= 20.0.0 recommandée)
- Un gestionnaire de paquets (`npm`, `pnpm` ou `yarn`)

### 2. Installation / Setup
Installez les dépendances du projet :
```bash
npm install
```

### 3. Serveur de développement / Dev Server
Lancez le serveur localement :
```bash
npm run dev
```
Ouvrez ensuite [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 4. Build de Production / Build for Production
Pour compiler l'application de façon statique pour la production :
```bash
npm run build
```

---

## 🌐 Déploiement / Deployment

Le projet est configuré pour être déployé sur **Vercel** en tant que Single Page Application (SPA) statique :
- Aucun coût de serveur ni de "Serverless Functions".
- Détection automatique par Vercel grâce au preset `"framework": "nuxtjs"`.
- Configuration documentée dans `vercel.json`.

---

## 📄 Licence

Ce projet est sous licence **MIT**.
