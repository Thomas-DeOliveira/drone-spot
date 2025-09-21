# Configuration Email pour Drone Spot

## 🚀 Mode Développement (par défaut)

**Aucune configuration requise !** Le système fonctionne en mode simulation :
- Les emails sont affichés dans la console
- Les liens de vérification sont loggés
- Parfait pour tester l'interface utilisateur

## 📧 Mode Production

Pour activer l'envoi réel d'emails, ajoutez ces variables à votre fichier `.env` :

```env
# Configuration Email (requis pour l'envoi réel d'emails)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@drone-spot.com"
```

## Configuration avec différents providers

### Gmail (recommandé pour le développement)
1. Activez l'authentification à 2 facteurs sur votre compte Google
2. Générez un "Mot de passe d'application" dans les paramètres de sécurité
3. Utilisez ce mot de passe dans `EMAIL_SERVER_PASSWORD`

```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-16-char-app-password"
EMAIL_FROM="noreply@drone-spot.com"
```

### SendGrid (recommandé pour la production)
1. Créez un compte sur SendGrid
2. Générez une clé API
3. Configurez comme suit :

```env
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="your-sendgrid-api-key"
EMAIL_FROM="noreply@drone-spot.com"
```

### Resend (moderne et simple)
1. Créez un compte sur Resend
2. Générez une clé API
3. Configurez comme suit :

```env
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="your-resend-api-key"
EMAIL_FROM="noreply@drone-spot.com"
```

## Fonctionnalités implémentées

- ✅ Connexion par email (magic link)
- ✅ Vérification d'email après inscription
- ✅ Renvoi de lien de vérification
- ✅ Interface utilisateur intuitive
- ✅ Gestion des erreurs et états

## Pages créées

- `/verify-email` - Page de vérification d'email
- `/resend-verification` - Page pour renvoyer un lien de vérification

## APIs créées

- `/api/auth/send-verification` - Renvoyer un lien de vérification
