# Guide du Menu Master

## Compte Master créé

**Email**: `master@pizzeria.com`
**UID Firebase**: `MASTER_ACCOUNT_UID`

## Comment ça fonctionne ?

### 1. Tu crées le menu de base
- Connecte-toi avec le compte master (`master@pizzeria.com`)
- Va dans l'espace "Pizzeria"
- Crée/modifie/supprime des pizzas selon ton menu de base

### 2. Les nouveaux utilisateurs reçoivent le menu
- Quand un nouvel utilisateur s'inscrit
- Le système copie AUTOMATIQUEMENT toutes les pizzas du compte master
- Chaque utilisateur reçoit sa propre COPIE

### 3. Chaque utilisateur est isolé
- Utilisateur A modifie une pizza → Seul A voit ses modifications
- Utilisateur B modifie une pizza → Seul B voit ses modifications
- Le compte master reste intact

## Configuration Firebase

### Règles Firestore importantes

Assure-toi que ton compte master a l'UID exact : `MASTER_MENU_ACCOUNT`

Tu peux créer ce compte :
1. Via Firebase Console → Authentication
2. Créer un utilisateur avec email `master@pizzeria.com`
3. Copier son UID
4. Mettre à jour la constante `MASTER_ACCOUNT_UID` dans `src/services/firebaseService.ts`

Ou manuellement dans Firebase Console :
1. Créer un document dans la collection `users` avec l'ID `MASTER_MENU_ACCOUNT`
2. Créer les pizzas avec `owner_id: "MASTER_MENU_ACCOUNT"`

## Avantages

✅ Tu contrôles le menu de base depuis un seul compte
✅ Chaque utilisateur a son menu complètement isolé
✅ Les modifications d'un utilisateur n'affectent pas les autres
✅ Facile à maintenir : tu modifies juste le compte master
