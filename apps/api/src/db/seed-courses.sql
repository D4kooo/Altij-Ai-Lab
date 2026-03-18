-- ============================================================================
-- ALTIJ LAB — Seed: Courses, Modules, Lessons, Quizzes & Questions
-- Ready to paste into Supabase SQL Editor
-- ============================================================================

-- Add 'organisation' to the course_audience enum if it doesn't exist
ALTER TYPE "course_audience" ADD VALUE IF NOT EXISTS 'organisation';

-- ============================================================================
-- JUNIORS — Course 1: "Ma vie numérique en sécurité"
-- ============================================================================
DO $$
DECLARE
  c1_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c1_id, NULL, NULL,
  'Ma vie numérique en sécurité',
  'Apprends à protéger tes comptes, ta vie privée et à comprendre l''intelligence artificielle. Un parcours conçu pour les 12-17 ans.',
  'juniors', 'Shield', '#3B82F6', 'Sécurité', true, true, 1);

-- Module 1: Les mots de passe
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c1_id,
  'Les mots de passe, c''est sérieux !',
  'Découvre pourquoi les mots de passe sont ta première ligne de défense et comment en créer des vraiment solides.',
  'Key', 15, 'facile', 'Sécurité', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'Pourquoi protéger ses comptes',
'## Pourquoi protéger ses comptes ?

Imagine que quelqu''un trouve la clé de ta maison et puisse entrer quand il veut. C''est exactement ce qui se passe quand quelqu''un récupère ton mot de passe.

### Des histoires vraies

Chaque année, **des milliers d''adolescents** se font pirater leurs comptes Instagram, TikTok ou Snapchat. Voici ce qui peut arriver :

- **Vol de compte Instagram** : un pirate change ton mot de passe, publie des contenus à ta place et contacte tes amis en se faisant passer pour toi
- **Usurpation d''identité sur TikTok** : tes vidéos privées deviennent publiques, et quelqu''un utilise ton image
- **Arnaque via Snapchat** : un pirate envoie des messages à tes contacts pour leur demander de l''argent

> **Le savais-tu ?** En 2023, plus de 60 % des piratages de comptes chez les jeunes étaient dus à des mots de passe trop simples comme « 123456 » ou le prénom suivi de l''année de naissance.

### Pourquoi ça arrive ?

Les pirates utilisent des **programmes automatiques** qui testent des millions de combinaisons par seconde. Si ton mot de passe est simple, il est trouvé en quelques secondes.

Ils utilisent aussi les **fuites de données** : quand un site se fait pirater, les mots de passe de tous ses utilisateurs se retrouvent sur Internet. Si tu utilises le même mot de passe partout, **tous tes comptes sont compromis d''un coup**.

### Les conséquences

- Perte de tous tes contacts et souvenirs
- Publications embarrassantes en ton nom
- Harcèlement ou chantage
- Problèmes avec ton établissement scolaire

**La bonne nouvelle ?** Protéger ses comptes, c''est facile quand on sait comment faire. C''est ce qu''on va voir dans la leçon suivante !', 'text', 8, 1),

(m1_id, 'Créer un mot de passe incassable',
'## Créer un mot de passe incassable

### La méthode de la phrase secrète

Oublie les mots de passe classiques. La meilleure technique, c''est la **phrase secrète** (passphrase).

**Le principe :** prends une phrase que tu inventes et qui n''existe nulle part, puis utilise-la comme mot de passe.

Exemples :
- `MonChat-Mange3Pizzas!` → facile à retenir, très dur à deviner
- `Lundi*Je*Vole*Vers*Mars42` → 25 caractères, quasi impossible à craquer

> **Règle d''or :** un bon mot de passe fait **au moins 12 caractères** et mélange lettres, chiffres et symboles.

### Ce qu''il ne faut JAMAIS faire

- ❌ Utiliser ton prénom, ta date de naissance ou le nom de ton animal
- ❌ Utiliser le même mot de passe pour plusieurs comptes
- ❌ Écrire son mot de passe sur un post-it collé à l''écran
- ❌ Le partager avec un ami (même ton meilleur ami)
- ❌ Utiliser « password », « 123456 » ou « azerty »

### Les gestionnaires de mots de passe

Tu ne peux pas retenir 30 mots de passe différents ? C''est normal. Utilise un **gestionnaire de mots de passe** :

- **Bitwarden** (gratuit et open source)
- **Le gestionnaire intégré** à ton navigateur (Chrome, Firefox, Safari)

Ces outils :
- Génèrent des mots de passe ultra-sécurisés
- Les stockent de façon chiffrée
- Les remplissent automatiquement

Tu n''as qu''**un seul mot de passe maître** à retenir — celui du gestionnaire. Choisis-le bien avec la méthode de la phrase secrète !

### L''authentification à deux facteurs (2FA)

En plus du mot de passe, active la **double vérification** sur tes comptes importants. Quand tu te connectes, on te demande un code envoyé par SMS ou généré par une application.

Même si quelqu''un vole ton mot de passe, il ne pourra pas se connecter sans ton téléphone.

**Résumé :** phrase secrète + gestionnaire + 2FA = compte quasi inviolable.', 'text', 7, 2);

-- Quiz Module 1
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : Les mots de passe', 'Teste tes connaissances sur la sécurité des mots de passe.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Quel est le mot de passe le plus sécurisé parmi ces choix ?',
 'multiple_choice',
 '[{"id":"a","text":"MonAnniV2010","isCorrect":false},{"id":"b","text":"123456789","isCorrect":false},{"id":"c","text":"Mon-Chat-Adore-Les-Pizzas!42","isCorrect":true},{"id":"d","text":"password123","isCorrect":false}]',
 'Une phrase secrète longue avec des caractères spéciaux et des chiffres est beaucoup plus sécurisée qu''un mot court ou prévisible.', 1),

(q1_id, 'Pourquoi ne faut-il pas utiliser le même mot de passe partout ?',
 'multiple_choice',
 '[{"id":"a","text":"Parce que c''est interdit par la loi","isCorrect":false},{"id":"b","text":"Parce que si un site est piraté, tous tes comptes sont compromis","isCorrect":true},{"id":"c","text":"Parce que les sites le détectent et bloquent ton compte","isCorrect":false},{"id":"d","text":"Parce que ça ralentit ta connexion","isCorrect":false}]',
 'Lors d''une fuite de données, les pirates testent automatiquement les mots de passe volés sur d''autres sites. C''est le credential stuffing.', 2),

(q1_id, 'Qu''est-ce qu''un gestionnaire de mots de passe ?',
 'multiple_choice',
 '[{"id":"a","text":"Un site qui vérifie si ton mot de passe a fuité","isCorrect":false},{"id":"b","text":"Un logiciel qui stocke et génère tes mots de passe de façon sécurisée","isCorrect":true},{"id":"c","text":"Un technicien qui gère les mots de passe en entreprise","isCorrect":false},{"id":"d","text":"Un paramètre du téléphone qui empêche le piratage","isCorrect":false}]',
 'Un gestionnaire de mots de passe chiffre et stocke tous tes mots de passe. Tu n''as besoin de retenir qu''un seul mot de passe maître.', 3),

(q1_id, 'L''authentification à deux facteurs (2FA) rend tes comptes plus sûrs.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":true},{"id":"b","text":"Faux","isCorrect":false}]',
 'La 2FA ajoute une couche de sécurité : même si ton mot de passe est volé, le pirate a besoin de ton téléphone pour se connecter.', 4);

-- Module 2: Les réseaux sociaux
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c1_id,
  'Les réseaux sociaux sans risques',
  'Apprends à utiliser les réseaux sociaux en protégeant ta vie privée et ta réputation.',
  'Users', 20, 'facile', 'Sécurité', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Ce qu''on partage et ce qu''on garde pour soi',
'## Ce qu''on partage et ce qu''on garde pour soi

### L''empreinte numérique

Chaque photo que tu postes, chaque commentaire que tu écris, chaque like que tu mets laisse une trace. C''est ton **empreinte numérique**. Et contrairement à ce que tu crois, elle ne disparaît jamais vraiment.

> **Important :** des recruteurs, des écoles et même des inconnus peuvent retrouver ce que tu as publié il y a des années. 70 % des recruteurs consultent les réseaux sociaux des candidats.

### Ce qui est OK de partager

- ✅ Tes passions et hobbies (musique, sport, art)
- ✅ Des photos où tu es à l''aise (sans info sensible en arrière-plan)
- ✅ Tes créations (dessins, musique, vidéos créatives)
- ✅ Tes opinions (en restant respectueux)

### Ce qu''il ne faut JAMAIS partager

- ❌ **Ton adresse** ou des photos qui montrent ta maison/immeuble
- ❌ **Le nom de ton collège/lycée** ou des photos en uniforme
- ❌ **Ton emploi du temps** (« je suis seul(e) à la maison »)
- ❌ **Tes documents d''identité** (carte d''identité, passeport)
- ❌ **Des photos intimes** — une fois envoyées, tu perds tout contrôle
- ❌ **Ta géolocalisation en temps réel**

### Le test de la grand-mère et du futur employeur

Avant de publier quoi que ce soit, pose-toi deux questions :
1. **Est-ce que je serais à l''aise si ma grand-mère voyait ça ?**
2. **Est-ce que ça pourrait me gêner dans 5 ans ?**

Si la réponse est non à l''une des deux, ne publie pas.

### Les stories « éphémères » ne le sont pas

Sur Snapchat ou Instagram, les stories disparaissent après 24h ? Pas vraiment :
- N''importe qui peut faire une **capture d''écran**
- Les données sont **stockées sur les serveurs** de l''entreprise
- Des outils permettent de **sauvegarder les stories** sans que tu le saches

**Règle simple :** ne publie rien en story que tu ne publierais pas en permanent.', 'text', 10, 1),

(m2_id, 'Paramètres de confidentialité',
'## Paramètres de confidentialité

### Pourquoi configurer ses paramètres ?

Par défaut, la plupart des réseaux sociaux laissent ton profil **ouvert à tout le monde**. C''est voulu : plus ton profil est visible, plus la plateforme gagne de l''argent avec la publicité.

C''est à toi de reprendre le contrôle.

### Instagram

1. Va dans **Paramètres** → **Confidentialité**
2. Active le **Compte privé** : seuls tes abonnés approuvés voient tes publications
3. Désactive le **Statut en ligne** pour qu''on ne sache pas quand tu es connecté(e)
4. Dans **Story** → désactive le **Partage vers Facebook**
5. Dans **Tags** → active **Approuver manuellement les tags**
6. Désactive la **Géolocalisation** dans les paramètres de ton téléphone pour Instagram

### TikTok

1. Va dans **Paramètres et confidentialité** → **Confidentialité**
2. Passe ton compte en **Privé**
3. Désactive **Suggérer ton compte à d''autres**
4. Dans **Téléchargement**, désactive pour empêcher le téléchargement de tes vidéos
5. Désactive les **Messages directs** des inconnus (« Personne » ou « Amis »)
6. Limite les **Commentaires** à tes amis si tu le souhaites

### Snapchat

1. Va dans **Paramètres** → **Qui peut...**
2. **Me contacter** → « Mes amis » (pas « Tout le monde »)
3. **Voir ma story** → « Mes amis » ou « Personnalisé »
4. **Me voir dans Ajout rapide** → Désactivé
5. **Snap Map** → Active le **Mode Fantôme** pour masquer ta position

### Règles générales pour tous les réseaux

- **Révise tes paramètres chaque mois** : les mises à jour les réinitialisent parfois
- **Vérifie tes abonnés** régulièrement et supprime les inconnus
- **Désactive la géolocalisation** pour toutes tes applications de réseaux sociaux
- **N''accepte pas les demandes d''inconnus**, même s''ils semblent sympathiques

> **Astuce :** fais cet exercice maintenant ! Prends ton téléphone et vérifie tes paramètres sur chaque réseau.', 'text', 10, 2);

-- Quiz Module 2
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : Les réseaux sociaux', 'Vérifie que tu sais protéger ta vie privée sur les réseaux.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'Qu''est-ce que l''empreinte numérique ?',
 'multiple_choice',
 '[{"id":"a","text":"L''empreinte de ton doigt utilisée pour déverrouiller ton téléphone","isCorrect":false},{"id":"b","text":"L''ensemble des traces que tu laisses en ligne (publications, likes, commentaires)","isCorrect":true},{"id":"c","text":"Le nombre de followers que tu as","isCorrect":false},{"id":"d","text":"La mémoire utilisée par tes applications","isCorrect":false}]',
 'Ton empreinte numérique est l''ensemble de toutes les traces que tu laisses sur Internet. Elle est quasi permanente.', 1),

(q2_id, 'Les stories Snapchat disparaissent complètement après 24 heures.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'Les stories peuvent être capturées par des screenshots, et les données restent sur les serveurs de Snapchat.', 2),

(q2_id, 'Quelle information ne faut-il JAMAIS partager sur les réseaux sociaux ?',
 'multiple_choice',
 '[{"id":"a","text":"Ton sport préféré","isCorrect":false},{"id":"b","text":"Un dessin que tu as fait","isCorrect":false},{"id":"c","text":"Le nom de ton collège et ton emploi du temps","isCorrect":true},{"id":"d","text":"Ton avis sur un film","isCorrect":false}]',
 'Partager le nom de ton établissement et ton emploi du temps permet à des inconnus de te localiser facilement.', 3),

(q2_id, 'Pourquoi faut-il activer le mode « Compte privé » sur Instagram ?',
 'multiple_choice',
 '[{"id":"a","text":"Pour avoir plus de followers","isCorrect":false},{"id":"b","text":"Pour que seules les personnes que tu approuves voient tes publications","isCorrect":true},{"id":"c","text":"Pour accéder à des filtres exclusifs","isCorrect":false},{"id":"d","text":"Pour publier plus de stories","isCorrect":false}]',
 'Le compte privé te donne le contrôle : tu choisis qui peut voir tes publications et tes stories.', 4);

-- Module 3: C'est quoi l'IA
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c1_id,
  'C''est quoi l''IA ?',
  'Découvre ce qu''est vraiment l''intelligence artificielle et comment fonctionnent les assistants comme ChatGPT.',
  'Cpu', 15, 'facile', 'Intelligence artificielle', false, false, 3);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m3_id, 'L''intelligence artificielle, c''est quoi exactement ?',
'## L''intelligence artificielle, c''est quoi exactement ?

### Pas un robot qui pense

Quand on entend « intelligence artificielle », on imagine souvent un robot super intelligent comme dans les films. La réalité est très différente.

L''IA, c''est un **programme informatique** qui apprend à reconnaître des schémas (des patterns) dans de grandes quantités de données.

> **En résumé :** l''IA ne « pense » pas. Elle calcule des probabilités à partir d''exemples qu''on lui a montrés.

### Comment ça marche ? Un exemple simple

Imagine que tu veuilles apprendre à une IA à reconnaître des chats dans des photos :

1. Tu lui montres **des millions de photos** étiquetées « chat » ou « pas chat »
2. L''IA cherche des **points communs** entre toutes les photos de chats (oreilles pointues, moustaches, forme du visage)
3. Quand tu lui montres une nouvelle photo, elle **calcule la probabilité** que ce soit un chat

C''est comme si tu apprenais à reconnaître une chanson en écoutant des milliers de morceaux du même artiste. Tu finis par reconnaître son style, même sur une chanson que tu n''as jamais entendue.

### Les différents types d''IA

- **IA de reconnaissance** : reconnaître des visages, des objets, de la voix (Siri, Google Photos)
- **IA de recommandation** : te suggérer des vidéos, de la musique (TikTok, Spotify, YouTube)
- **IA générative** : créer du texte, des images, de la musique (ChatGPT, Midjourney)
- **IA de jeu** : jouer aux échecs, aux jeux vidéo (AlphaGo, bots de jeu)

### Ce que l''IA sait faire (et ce qu''elle ne sait PAS faire)

**L''IA sait :**
- Traiter énormément de données très vite
- Reconnaître des formes et des schémas
- Générer du texte, des images, du son
- Traduire des langues

**L''IA ne sait PAS :**
- Comprendre vraiment ce qu''elle dit
- Avoir des émotions ou des opinions
- Faire preuve de bon sens
- Être créative au sens humain du terme

**L''IA est un outil puissant, mais elle reste un outil. C''est toi qui décides comment l''utiliser.**', 'text', 8, 1),

(m3_id, 'ChatGPT et les assistants IA',
'## ChatGPT et les assistants IA

### Comment fonctionne ChatGPT ?

ChatGPT est un **modèle de langage** (LLM - Large Language Model). Concrètement :

1. Il a été entraîné sur **des milliards de textes** issus d''Internet (articles, livres, sites web)
2. Quand tu lui poses une question, il **prédit le mot suivant** le plus probable, mot après mot
3. Il ne « sait » rien : il génère du texte qui **ressemble** à ce qu''un humain écrirait

> **Analogie :** imagine un élève qui a lu toute la bibliothèque du collège. Il peut écrire des textes qui semblent intelligents, mais il ne comprend pas vraiment ce qu''il écrit. C''est un peu ça, ChatGPT.

### Ce que ChatGPT peut faire pour toi

- **T''aider à comprendre** un cours difficile (demande-lui d''expliquer simplement)
- **Brainstormer** des idées pour un exposé
- **Corriger** un texte (orthographe, grammaire)
- **Traduire** des textes
- **Expliquer** du code informatique

### Les pièges à éviter

#### Les hallucinations
ChatGPT **invente parfois des informations** avec un air très sûr de lui. On appelle ça des « hallucinations ». Il peut :
- Citer des livres qui n''existent pas
- Inventer des statistiques
- Donner des informations fausses avec assurance

**Règle d''or : vérifie toujours** ce que ChatGPT te dit avec d''autres sources.

#### Le plagiat
Copier-coller la réponse de ChatGPT pour un devoir, c''est du **plagiat**. Les profs ont des outils pour le détecter. Utilise l''IA comme un assistant, pas comme un remplaçant.

#### Les données personnelles
Ne partage **jamais d''informations personnelles** avec ChatGPT : nom complet, adresse, numéro de téléphone. Tout ce que tu écris peut être utilisé pour entraîner le modèle.

### Les autres assistants IA

- **Google Gemini** : l''assistant de Google, intégré à la recherche
- **Copilot** : l''assistant de Microsoft, intégré à Bing et Office
- **Claude** : l''assistant d''Anthropic, conçu pour être plus prudent

Chaque assistant a ses forces et ses faiblesses. Aucun n''est parfait.

**Retiens :** l''IA est un outil formidable si tu l''utilises avec esprit critique. Ne crois pas tout ce qu''elle dit, vérifie toujours, et ne lui confie pas tes secrets.', 'text', 7, 2);

-- Quiz Module 3
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q3_id, m3_id, 'Quiz : L''intelligence artificielle', 'Teste tes connaissances sur l''IA.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q3_id, 'Comment une IA apprend-elle à reconnaître des chats dans des photos ?',
 'multiple_choice',
 '[{"id":"a","text":"Un programmeur lui décrit à quoi ressemble un chat","isCorrect":false},{"id":"b","text":"Elle analyse des millions de photos étiquetées pour trouver des points communs","isCorrect":true},{"id":"c","text":"Elle regarde des vidéos de chats sur YouTube","isCorrect":false},{"id":"d","text":"Elle lit la définition du mot chat dans le dictionnaire","isCorrect":false}]',
 'L''IA apprend par l''exemple : on lui montre des millions de photos étiquetées et elle identifie des patterns récurrents.', 1),

(q3_id, 'ChatGPT comprend vraiment ce qu''il écrit, comme un humain.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'ChatGPT ne comprend pas : il prédit le mot suivant le plus probable. C''est un calcul statistique, pas de la compréhension.', 2),

(q3_id, 'Qu''est-ce qu''une « hallucination » de l''IA ?',
 'multiple_choice',
 '[{"id":"a","text":"Quand l''IA rêve la nuit","isCorrect":false},{"id":"b","text":"Quand l''IA invente des informations fausses avec assurance","isCorrect":true},{"id":"c","text":"Quand l''IA refuse de répondre","isCorrect":false},{"id":"d","text":"Quand l''IA devient consciente","isCorrect":false}]',
 'Les hallucinations sont des réponses fausses que l''IA génère avec confiance. C''est pourquoi il faut toujours vérifier.', 3),

(q3_id, 'Comment faut-il utiliser ChatGPT pour un devoir scolaire ?',
 'multiple_choice',
 '[{"id":"a","text":"Copier-coller la réponse directement","isCorrect":false},{"id":"b","text":"L''utiliser comme assistant pour comprendre et vérifier les informations","isCorrect":true},{"id":"c","text":"Ne jamais l''utiliser car c''est interdit","isCorrect":false},{"id":"d","text":"Lui faire écrire tout le devoir puis changer quelques mots","isCorrect":false}]',
 'L''IA est un outil d''aide à la compréhension. L''utiliser pour copier-coller est du plagiat, mais s''en servir pour mieux comprendre est intelligent.', 4);

END $$;

-- ============================================================================
-- JUNIORS — Course 2: "Mes données, mes droits"
-- ============================================================================
DO $$
DECLARE
  c_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c_id, NULL, NULL,
  'Mes données, mes droits',
  'Comprends ce que sont les données personnelles, qui les collecte et quels sont tes droits pour les protéger.',
  'juniors', 'FileText', '#10B981', 'Droits numériques', true, true, 2);

-- Module 1
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c_id,
  'Qu''est-ce qu''une donnée personnelle ?',
  'Découvre ce que sont vraiment tes données personnelles et qui les collecte.',
  'Database', 15, 'facile', 'Droits numériques', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'Tes données, c''est toi',
'## Tes données, c''est toi

### Qu''est-ce qu''une donnée personnelle ?

Une donnée personnelle, c''est toute information qui permet de t''identifier, directement ou indirectement. C''est bien plus que ton nom et ton adresse.

### Les données évidentes

- Ton **nom et prénom**
- Ton **adresse email**
- Ton **numéro de téléphone**
- Ton **adresse postale**
- Ta **photo** et tes vidéos
- Ta **date de naissance**

### Les données moins évidentes

Ce que beaucoup de gens ne savent pas, c''est que ces informations sont aussi des données personnelles :

- **Ton adresse IP** : le numéro unique de ta connexion Internet
- **Ta géolocalisation** : où tu es, à chaque instant
- **Ton historique de navigation** : tous les sites que tu visites
- **Tes recherches Google** : tout ce que tu tapes dans la barre de recherche
- **Tes likes et commentaires** : ce que tu aimes révèle ta personnalité
- **Tes contacts** : la liste de tes amis

> **Le savais-tu ?** En combinant seulement 4 données (âge, sexe, code postal, date de naissance), on peut identifier 87 % des Américains. Tes données sont comme les pièces d''un puzzle : séparées elles semblent anodines, ensemble elles dessinent ton portrait complet.

### Qui collecte tes données et pourquoi ?

| Qui | Quelles données | Pourquoi |
|-----|-----------------|----------|
| **Google** | Recherches, position, emails | Publicité ciblée |
| **Instagram/Meta** | Photos, likes, messages | Publicité ciblée |
| **TikTok** | Vidéos regardées, temps passé | Recommandations et publicité |
| **Jeux mobiles** | Achats, temps de jeu, contacts | Monétisation et publicité |
| **Apps gratuites** | Diverses | Revente de données |

**Rappelle-toi :** quand un service est gratuit, c''est souvent toi le produit.', 'text', 8, 1),

(m1_id, 'Où vont tes données ?',
'## Où vont tes données ?

### Le voyage de tes données

Quand tu t''inscris sur une application ou un site web, tes données commencent un long voyage. Suivons-les.

**Étape 1 : La collecte**
Tu crées un compte TikTok. Tu donnes ton email, ta date de naissance, tu acceptes les conditions d''utilisation (que personne ne lit, soyons honnêtes). L''application collecte aussi ta position GPS, le modèle de ton téléphone et ta liste de contacts.

**Étape 2 : Le stockage**
Tes données sont envoyées sur des **serveurs** (d''énormes ordinateurs) quelque part dans le monde. Pour TikTok, ces serveurs sont aux États-Unis, à Singapour, et en Irlande.

**Étape 3 : L''analyse**
Des algorithmes analysent tes données pour créer ton **profil publicitaire** : ton âge, tes centres d''intérêt, tes habitudes, ton pouvoir d''achat estimé.

**Étape 4 : Le partage**
Tes données (ou ton profil) sont partagées avec des **annonceurs** qui veulent te montrer des publicités personnalisées.

### Les cookies : des mouchards sur ton navigateur

Les **cookies** sont de petits fichiers déposés sur ton navigateur quand tu visites un site web. Il en existe deux types :

- **Cookies utiles** : ils retiennent ta langue, ton panier d''achats, ta connexion
- **Cookies traceurs** : ils suivent ta navigation d''un site à l''autre pour créer ton profil publicitaire

> **Exemple concret :** tu cherches des baskets sur un site. Ensuite, tu vois des publicités pour des baskets partout sur Internet. Ce sont les cookies traceurs.

### Comment limiter la collecte ?

- **Refuse les cookies non essentiels** quand un site te le demande
- **Utilise un navigateur respectueux** comme Firefox avec la protection renforcée
- **Vérifie les permissions** de tes applications (caméra, micro, contacts, position)
- **Désinstalle les applications** que tu n''utilises plus
- **Ne te connecte pas** avec « Se connecter avec Google/Facebook » : ça partage encore plus de données

**Retiens :** tes données ont de la valeur. Les entreprises dépensent des milliards pour les collecter. Tu as le droit de les protéger — et la loi est de ton côté. C''est ce qu''on verra dans le module suivant.', 'text', 7, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : Les données personnelles', 'Vérifie que tu comprends ce que sont les données personnelles.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Laquelle de ces informations est une donnée personnelle ?',
 'multiple_choice',
 '[{"id":"a","text":"La météo de ta ville","isCorrect":false},{"id":"b","text":"Ton adresse IP","isCorrect":true},{"id":"c","text":"Le prix d''un jeu vidéo","isCorrect":false},{"id":"d","text":"La date de la rentrée scolaire","isCorrect":false}]',
 'Ton adresse IP est une donnée personnelle car elle permet de t''identifier indirectement.', 1),

(q1_id, 'Quand un service en ligne est gratuit, c''est souvent parce que...',
 'multiple_choice',
 '[{"id":"a","text":"L''entreprise est très généreuse","isCorrect":false},{"id":"b","text":"Tes données sont le produit vendu aux annonceurs","isCorrect":true},{"id":"c","text":"Le service est financé par l''État","isCorrect":false},{"id":"d","text":"L''application ne coûte rien à développer","isCorrect":false}]',
 'Les services gratuits se financent généralement en collectant et monétisant les données de leurs utilisateurs via la publicité ciblée.', 2),

(q1_id, 'Qu''est-ce qu''un cookie traceur ?',
 'multiple_choice',
 '[{"id":"a","text":"Un virus informatique","isCorrect":false},{"id":"b","text":"Un fichier qui retient ton mot de passe","isCorrect":false},{"id":"c","text":"Un fichier qui suit ta navigation pour créer ton profil publicitaire","isCorrect":true},{"id":"d","text":"Un logiciel de sécurité","isCorrect":false}]',
 'Les cookies traceurs suivent ta navigation d''un site à l''autre pour construire un profil publicitaire et te montrer des pubs ciblées.', 3),

(q1_id, 'Quelle est la meilleure façon de limiter la collecte de tes données ?',
 'multiple_choice',
 '[{"id":"a","text":"Ne jamais utiliser Internet","isCorrect":false},{"id":"b","text":"Accepter tous les cookies pour aller plus vite","isCorrect":false},{"id":"c","text":"Refuser les cookies non essentiels et vérifier les permissions des apps","isCorrect":true},{"id":"d","text":"Utiliser un faux nom partout","isCorrect":false}]',
 'Refuser les cookies traceurs et contrôler les permissions de tes applications sont les gestes les plus efficaces au quotidien.', 4);

-- Module 2
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c_id,
  'Tes droits sur tes données',
  'Le RGPD te donne des droits puissants. Apprends à les utiliser.',
  'Scale', 20, 'moyen', 'Droits numériques', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Le RGPD, ton bouclier numérique',
'## Le RGPD, ton bouclier numérique

### C''est quoi le RGPD ?

Le **RGPD** (Règlement Général sur la Protection des Données) est une loi européenne entrée en vigueur le 25 mai 2018. C''est l''une des lois les plus protectrices au monde en matière de données personnelles.

> **En une phrase :** le RGPD te donne le contrôle sur tes données personnelles et oblige les entreprises à les respecter.

### Tes droits en tant que jeune

Oui, même si tu as moins de 18 ans, tu as des droits ! Et à partir de **15 ans en France**, tu peux exercer ces droits toi-même (avant 15 ans, ce sont tes parents qui le font pour toi).

### Les droits essentiels

**1. Droit d''accès** 📋
Tu peux demander à n''importe quelle entreprise : « Quelles données avez-vous sur moi ? » Ils sont obligés de te répondre en 30 jours maximum.

**2. Droit de rectification** ✏️
Si une information est fausse ou incomplète, tu peux demander sa correction.

**3. Droit à l''effacement** 🗑️
Tu peux demander la suppression de tes données. C''est le fameux « droit à l''oubli ». Très utile pour supprimer un ancien compte ou des publications gênantes.

**4. Droit d''opposition** ✋
Tu peux refuser que tes données soient utilisées pour la publicité ciblée.

**5. Droit à la portabilité** 📦
Tu peux récupérer toutes tes données dans un format lisible pour les transférer vers un autre service.

### Qui doit respecter le RGPD ?

Toute entreprise qui traite les données de personnes en Europe, **même si l''entreprise est américaine ou chinoise**. Google, TikTok, Instagram, Snapchat — tous doivent respecter le RGPD quand ils traitent tes données.

### Que risquent les entreprises qui ne respectent pas le RGPD ?

Des amendes colossales :
- Jusqu''à **20 millions d''euros** ou **4 % du chiffre d''affaires mondial**
- En 2023, Meta (Facebook/Instagram) a reçu une amende de **1,2 milliard d''euros** pour transfert illégal de données vers les États-Unis

**Le RGPD est ton allié. Apprends à l''utiliser !**', 'text', 10, 1),

(m2_id, 'Comment exercer tes droits',
'## Comment exercer tes droits

### Étape par étape

Exercer tes droits RGPD, c''est plus simple que tu ne le crois. Voici comment faire concrètement.

### 1. Trouver le bon contact

Chaque entreprise doit avoir un **DPO** (Délégué à la Protection des Données). Pour le trouver :
- Cherche dans les **mentions légales** ou la **politique de confidentialité** du site
- Cherche « DPO » ou « protection des données » ou « privacy »
- L''adresse email ressemble souvent à `dpo@entreprise.com` ou `privacy@entreprise.com`

### 2. Écrire ta demande

Voici un modèle que tu peux réutiliser :

> **Objet :** Demande d''exercice de mon droit [d''accès / d''effacement / etc.] — Article [15/17/etc.] du RGPD
>
> Madame, Monsieur,
>
> Conformément à l''article [15/17/20/21] du Règlement Général sur la Protection des Données, je souhaite [accéder à mes données / supprimer mes données / etc.].
>
> Mon identifiant sur votre service : [email ou pseudo]
>
> Je vous rappelle que vous disposez d''un délai de 30 jours pour répondre à ma demande.
>
> Cordialement,
> [Ton prénom]

### 3. Les délais

- L''entreprise a **30 jours** pour te répondre
- Ce délai peut être prolongé de **2 mois** si la demande est complexe (mais ils doivent te prévenir)

### 4. Si l''entreprise ne répond pas

Si après 30 jours tu n''as pas de réponse, ou si la réponse n''est pas satisfaisante :

1. **Relance** l''entreprise une fois par email
2. Si toujours rien : **dépose une plainte à la CNIL** (Commission Nationale de l''Informatique et des Libertés)
   - Va sur [cnil.fr](https://www.cnil.fr)
   - Clique sur « Plaintes en ligne »
   - Remplis le formulaire (c''est gratuit)

### Récupérer tes données (droit à la portabilité)

La plupart des grands services proposent un outil pour télécharger tes données :
- **Google** : [takeout.google.com](https://takeout.google.com)
- **Instagram** : Paramètres → Votre activité → Télécharger vos informations
- **TikTok** : Paramètres → Confidentialité → Télécharger vos données
- **Snapchat** : [accounts.snapchat.com](https://accounts.snapchat.com) → Mes données

> **Exercice pratique :** choisis un service que tu utilises et demande une copie de tes données. Tu seras surpris(e) de la quantité d''informations collectées !

**Tu as le pouvoir de contrôler tes données. Utilise-le.**', 'text', 10, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : Tes droits RGPD', 'Vérifie que tu connais tes droits sur tes données.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'À partir de quel âge peux-tu exercer tes droits RGPD seul(e) en France ?',
 'multiple_choice',
 '[{"id":"a","text":"10 ans","isCorrect":false},{"id":"b","text":"13 ans","isCorrect":false},{"id":"c","text":"15 ans","isCorrect":true},{"id":"d","text":"18 ans","isCorrect":false}]',
 'En France, le seuil est fixé à 15 ans. Avant cet âge, ce sont les parents qui exercent les droits RGPD pour l''enfant.', 1),

(q2_id, 'Combien de temps une entreprise a-t-elle pour répondre à ta demande RGPD ?',
 'multiple_choice',
 '[{"id":"a","text":"7 jours","isCorrect":false},{"id":"b","text":"30 jours","isCorrect":true},{"id":"c","text":"3 mois","isCorrect":false},{"id":"d","text":"1 an","isCorrect":false}]',
 'Le délai légal est de 30 jours, extensible à 2 mois supplémentaires pour les demandes complexes.', 2),

(q2_id, 'Que faire si une entreprise refuse de supprimer tes données ?',
 'multiple_choice',
 '[{"id":"a","text":"Rien, elle a le droit de refuser","isCorrect":false},{"id":"b","text":"Pirater le site pour supprimer les données soi-même","isCorrect":false},{"id":"c","text":"Déposer une plainte gratuite auprès de la CNIL","isCorrect":true},{"id":"d","text":"Créer un nouveau compte","isCorrect":false}]',
 'La CNIL est l''autorité française de protection des données. Tu peux déposer une plainte gratuitement sur cnil.fr si une entreprise ne respecte pas tes droits.', 3),

(q2_id, 'Le RGPD s''applique uniquement aux entreprises françaises.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'Le RGPD s''applique à toute entreprise traitant des données de personnes en Europe, quel que soit le pays où elle est basée (y compris Google, TikTok, etc.).', 4);

END $$;

-- ============================================================================
-- ADULTES — Course 1: "RGPD au quotidien : exercer vos droits"
-- ============================================================================
DO $$
DECLARE
  c_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c_id, NULL, NULL,
  'RGPD au quotidien : exercer vos droits',
  'Comprenez le RGPD, exercez vos droits et décryptez les conditions d''utilisation des services numériques.',
  'adultes', 'Scale', '#21B2AA', 'Droits numériques', true, true, 1);

-- Module 1: Comprendre le RGPD
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c_id,
  'Comprendre le RGPD en 30 minutes',
  'Les principes fondamentaux, vos droits et le consentement expliqués simplement.',
  'BookOpen', 30, 'facile', 'Droits numériques', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'Les principes fondamentaux',
'## Les principes fondamentaux du RGPD

Le Règlement Général sur la Protection des Données (RGPD), entré en vigueur le 25 mai 2018, repose sur **six principes fondamentaux** que toute organisation doit respecter lorsqu''elle traite vos données personnelles.

### 1. Licéité, loyauté et transparence

Le traitement de vos données doit être **légal** (basé sur l''une des six bases juridiques prévues par le RGPD), **loyal** (pas de collecte à votre insu) et **transparent** (vous devez être informé clairement de ce qui est fait avec vos données).

> **Concrètement :** une entreprise ne peut pas collecter vos données « au cas où ». Elle doit vous dire pourquoi elle les collecte et sur quelle base légale elle s''appuie.

### 2. Limitation des finalités

Les données collectées pour un objectif précis ne peuvent pas être réutilisées pour un autre objectif incompatible. Si vous donnez votre email pour recevoir une facture, l''entreprise ne peut pas l''utiliser pour vous envoyer de la publicité sans votre accord.

### 3. Minimisation des données

Seules les données **strictement nécessaires** à l''objectif poursuivi doivent être collectées. Un site de livraison a besoin de votre adresse, mais pas de votre date de naissance ni de votre situation familiale.

### 4. Exactitude

Les données doivent être **exactes et tenues à jour**. L''organisation doit prendre des mesures raisonnables pour corriger ou supprimer les données inexactes.

### 5. Limitation de la conservation

Les données ne peuvent pas être conservées indéfiniment. Elles doivent être supprimées ou anonymisées dès qu''elles ne sont plus nécessaires à l''objectif pour lequel elles ont été collectées.

> **Exemple :** un recruteur ne peut pas conserver votre CV plus de 2 ans après votre dernier contact (recommandation CNIL).

### 6. Intégrité et confidentialité

Les données doivent être protégées contre l''accès non autorisé, la perte ou la destruction. Cela implique des mesures techniques (chiffrement, contrôle d''accès) et organisationnelles (formation du personnel, procédures de sécurité).

### Le principe de responsabilité (accountability)

En plus de ces six principes, le RGPD impose un principe transversal de **responsabilité** : l''organisation doit être en mesure de **démontrer** sa conformité. Ce n''est pas à vous de prouver qu''elle ne respecte pas la loi, c''est à elle de prouver qu''elle la respecte.', 'text', 10, 1),

(m1_id, 'Vos 8 droits fondamentaux',
'## Vos 8 droits fondamentaux

Le RGPD vous confère huit droits que vous pouvez exercer auprès de tout organisme qui traite vos données personnelles.

### 1. Droit d''accès (article 15)

Vous pouvez demander à toute organisation si elle détient des données vous concernant et, le cas échéant, obtenir une copie de ces données. L''organisation doit répondre **dans un délai de 30 jours**.

### 2. Droit de rectification (article 16)

Vous pouvez faire corriger des données inexactes ou compléter des données incomplètes.

### 3. Droit à l''effacement (article 17)

Aussi appelé « droit à l''oubli », il vous permet de demander la suppression de vos données dans certains cas : retrait du consentement, données plus nécessaires, traitement illicite, etc.

> **Attention :** ce droit n''est pas absolu. Une entreprise peut refuser si les données sont nécessaires pour une obligation légale (ex : données fiscales pendant 6 ans).

### 4. Droit à la limitation du traitement (article 18)

Vous pouvez demander le gel temporaire de l''utilisation de vos données, par exemple pendant que vous contestez leur exactitude.

### 5. Droit à la portabilité (article 20)

Vous pouvez récupérer vos données dans un format structuré et lisible par machine, et les transmettre à un autre prestataire.

### 6. Droit d''opposition (article 21)

Vous pouvez vous opposer à tout moment au traitement de vos données pour la prospection commerciale. Pour les autres finalités, vous devez justifier de motifs légitimes.

### 7. Droit relatif aux décisions automatisées (article 22)

Vous avez le droit de ne pas faire l''objet d''une décision fondée exclusivement sur un traitement automatisé, y compris le profilage, produisant des effets juridiques vous concernant.

> **Exemple :** un algorithme bancaire qui refuse automatiquement votre crédit sans intervention humaine viole ce droit.

### 8. Droit de réclamation auprès de la CNIL (article 77)

Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la CNIL gratuitement sur [cnil.fr](https://www.cnil.fr/fr/plaintes).

### Comment exercer vos droits ?

1. Identifiez le **DPO** ou le contact « données personnelles » de l''organisation
2. Envoyez votre demande par **email ou courrier recommandé**
3. Joignez une **pièce d''identité** si demandé
4. Notez la date : l''organisme a **30 jours** pour répondre', 'text', 10, 2),

(m1_id, 'Consentement : ce que la loi exige vraiment',
'## Consentement : ce que la loi exige vraiment

Le consentement est l''une des six bases légales du RGPD, et c''est souvent la plus mal comprise — tant par les utilisateurs que par les entreprises.

### Les 4 critères d''un consentement valide

Pour être valable au sens du RGPD, le consentement doit être :

**1. Libre**
Vous ne devez pas être forcé(e). Un site qui bloque l''accès si vous refusez les cookies publicitaires viole ce principe (sauf s''il propose un accès payant alternatif — décision CNIL de 2023).

**2. Spécifique**
Le consentement doit porter sur une finalité précise. Un consentement « global » pour tout n''est pas valide. Vous devez pouvoir accepter la newsletter mais refuser le partage avec des partenaires.

**3. Éclairé**
Vous devez disposer d''informations claires et compréhensibles **avant** de consentir : qui collecte, pourquoi, combien de temps, avec qui les données sont partagées.

**4. Univoque**
Le consentement nécessite un acte positif clair : cocher une case, cliquer sur un bouton. Les cases pré-cochées sont illicites (arrêt Planet49 de la CJUE, 2019).

### Opt-in vs opt-out

- **Opt-in** (légal) : vous devez activement accepter — la case est décochée par défaut
- **Opt-out** (souvent illicite) : vous êtes inscrit par défaut et devez vous désinscrire — la case est pré-cochée

> **Règle simple :** si vous n''avez pas activement dit « oui », ce n''est pas un consentement valide.

### Les dark patterns : quand le design manipule

Les **dark patterns** sont des techniques de conception qui manipulent l''utilisateur pour qu''il donne son consentement sans vraiment le vouloir :

- **Bouton « Tout accepter »** bien visible, « Refuser » caché ou minuscule
- **Cookie wall** : accès bloqué si vous refusez les cookies
- **Parcours de refus complexe** : 5 clics pour refuser vs 1 clic pour accepter
- **Culpabilisation** : « Non, je ne veux pas économiser de l''argent »

La CNIL a sanctionné plusieurs entreprises pour ces pratiques. En décembre 2021, Google et Facebook ont reçu respectivement 150 et 60 millions d''euros d''amende pour avoir rendu le refus des cookies plus compliqué que l''acceptation.

### Le retrait du consentement

Vous pouvez retirer votre consentement **à tout moment**, et cela doit être aussi facile que de l''avoir donné. Si vous avez accepté en un clic, vous devez pouvoir refuser en un clic.', 'text', 10, 3);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : Comprendre le RGPD', 'Testez vos connaissances sur les principes et droits du RGPD.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Combien de principes fondamentaux le RGPD impose-t-il pour le traitement des données ?',
 'multiple_choice',
 '[{"id":"a","text":"3","isCorrect":false},{"id":"b","text":"6","isCorrect":true},{"id":"c","text":"8","isCorrect":false},{"id":"d","text":"10","isCorrect":false}]',
 'Le RGPD repose sur 6 principes fondamentaux : licéité, limitation des finalités, minimisation, exactitude, limitation de conservation, intégrité et confidentialité.', 1),

(q1_id, 'Le droit à l''effacement est un droit absolu : une entreprise doit toujours supprimer vos données si vous le demandez.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'Le droit à l''effacement connaît des exceptions : obligations légales (données fiscales), liberté d''expression, intérêt public, etc.', 2),

(q1_id, 'Qu''est-ce qu''un dark pattern en matière de cookies ?',
 'multiple_choice',
 '[{"id":"a","text":"Un virus caché dans un cookie","isCorrect":false},{"id":"b","text":"Un design qui manipule l''utilisateur pour qu''il accepte les cookies","isCorrect":true},{"id":"c","text":"Un cookie qui s''active automatiquement la nuit","isCorrect":false},{"id":"d","text":"Un cookie chiffré impossible à supprimer","isCorrect":false}]',
 'Les dark patterns sont des techniques de design trompeuses : bouton « Refuser » caché, parcours de refus complexe, etc.', 3),

(q1_id, 'Quel délai a une organisation pour répondre à une demande d''exercice de droits RGPD ?',
 'multiple_choice',
 '[{"id":"a","text":"48 heures","isCorrect":false},{"id":"b","text":"15 jours","isCorrect":false},{"id":"c","text":"30 jours","isCorrect":true},{"id":"d","text":"6 mois","isCorrect":false}]',
 'Le délai légal est de 30 jours, prolongeable de 2 mois maximum pour les demandes complexes (avec notification).', 4),

(q1_id, 'Une case pré-cochée constitue un consentement valide au sens du RGPD.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'L''arrêt Planet49 de la CJUE (2019) a confirmé qu''une case pré-cochée ne constitue pas un consentement valide car il manque l''acte positif univoque.', 5);

-- Module 2: Exercer vos droits concrètement
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c_id,
  'Exercer vos droits concrètement',
  'Guides pratiques pour demander l''accès, la suppression de vos données et gérer les refus.',
  'FileCheck', 25, 'moyen', 'Droits numériques', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Demander l''accès à vos données',
'## Demander l''accès à vos données

Le droit d''accès (article 15 du RGPD) est votre premier outil pour reprendre le contrôle. Voici comment l''utiliser efficacement.

### Que pouvez-vous obtenir ?

Lorsque vous exercez votre droit d''accès, l''organisme doit vous fournir :

- La **confirmation** qu''il traite (ou non) vos données
- Une **copie** de toutes les données personnelles vous concernant
- Les **finalités** du traitement
- Les **catégories** de données traitées
- Les **destinataires** à qui les données ont été communiquées
- La **durée de conservation** prévue
- L''**origine** des données (si elles n''ont pas été collectées directement auprès de vous)

### La procédure étape par étape

**Étape 1 : Identifier le bon interlocuteur**

Recherchez le DPO (Délégué à la Protection des Données) de l''organisme. Ces informations se trouvent généralement dans :
- La politique de confidentialité du site
- Les mentions légales
- Le registre public des DPO sur le site de la CNIL

**Étape 2 : Rédiger votre demande**

Votre email doit contenir :
- L''objet : « Demande d''accès — Article 15 du RGPD »
- Votre identité (nom, prénom, email associé au compte)
- La mention explicite de l''article 15 du RGPD
- Ce que vous souhaitez obtenir (copie des données, liste des destinataires, etc.)

**Étape 3 : Envoyer et documenter**

- Envoyez par email avec accusé de réception ou par courrier recommandé
- Conservez une copie horodatée de votre envoi
- Notez la date : le délai de réponse de 30 jours court à partir de la réception

### Modèle de demande

> Objet : Demande d''exercice du droit d''accès — Article 15 du RGPD
>
> Madame, Monsieur le Délégué à la Protection des Données,
>
> Conformément à l''article 15 du Règlement (UE) 2016/679 (RGPD), je souhaite accéder à l''ensemble des données personnelles me concernant que votre organisme détient.
>
> Je vous prie de me communiquer : une copie de mes données, les finalités du traitement, les catégories de données, les destinataires, la durée de conservation prévue et l''origine des données.
>
> Identifiant du compte : [votre email]
>
> Conformément à l''article 12 du RGPD, je vous rappelle que vous disposez d''un délai d''un mois pour répondre.
>
> Cordialement,
> [Nom Prénom]

### Ce qui se passe ensuite

- **Réponse sous 30 jours** : l''organisme vous envoie vos données (souvent un fichier JSON ou CSV)
- **Demande de vérification d''identité** : l''organisme peut vous demander une pièce d''identité — c''est légitime
- **Prolongation** : le délai peut être étendu de 2 mois si la demande est complexe (notification obligatoire)', 'text', 10, 1),

(m2_id, 'Faire effacer vos données',
'## Faire effacer vos données

Le droit à l''effacement (article 17 du RGPD), aussi appelé « droit à l''oubli », vous permet de demander la suppression de vos données personnelles.

### Quand pouvez-vous demander l''effacement ?

L''effacement est possible dans ces cas :

- Les données **ne sont plus nécessaires** au regard de la finalité initiale
- Vous **retirez votre consentement** et il n''existe pas d''autre base légale
- Vous **exercez votre droit d''opposition** et il n''y a pas de motif légitime impérieux
- Les données ont fait l''objet d''un **traitement illicite**
- Les données doivent être effacées pour respecter une **obligation légale**
- Les données ont été collectées auprès d''un **mineur** dans le cadre de services en ligne

### Quand l''entreprise peut-elle refuser ?

Le droit à l''effacement n''est pas absolu. L''organisme peut refuser si la conservation est nécessaire pour :

- L''exercice du droit à la **liberté d''expression et d''information**
- Le respect d''une **obligation légale** (ex : données comptables pendant 10 ans)
- Des motifs d''**intérêt public** dans le domaine de la santé publique
- Des fins **archivistiques, de recherche scientifique ou historique**
- La constatation, l''exercice ou la défense de **droits en justice**

> **Exemple concret :** votre banque ne peut pas supprimer vos relevés bancaires avant le délai légal de conservation, même si vous le demandez.

### Procédure pratique

1. **Identifiez le DPO** de l''organisme
2. **Envoyez votre demande** en citant l''article 17 du RGPD et le motif d''effacement applicable
3. **Précisez les données** que vous souhaitez voir supprimées (ou demandez l''effacement intégral)
4. **Conservez la preuve** de votre envoi

### Que se passe-t-il après l''effacement ?

L''organisme doit :
- Supprimer les données de ses systèmes actifs **et** de ses sauvegardes (dans un délai raisonnable)
- Si les données ont été rendues publiques, prendre des **mesures raisonnables** pour informer les autres responsables de traitement
- Vous **confirmer** la suppression

### Cas particulier : les moteurs de recherche

Vous pouvez demander à Google de déréférencer des résultats de recherche vous concernant via le formulaire dédié. Google analyse chaque demande au cas par cas en mettant en balance votre droit à la vie privée et l''intérêt public.', 'text', 8, 2),

(m2_id, 'Que faire si on vous refuse ?',
'## Que faire si on vous refuse ?

Malgré le RGPD, certaines organisations traînent des pieds, refusent sans motif valable ou ne répondent tout simplement pas. Voici comment réagir.

### Étape 1 : La relance formelle

Si vous n''avez pas reçu de réponse après 30 jours :

1. Envoyez un **courrier de relance** par email et/ou recommandé
2. Rappelez votre demande initiale et sa date
3. Mentionnez que l''absence de réponse constitue un **manquement aux articles 12 et 15-22 du RGPD**
4. Indiquez que vous saisirez la CNIL en l''absence de réponse sous 15 jours

### Étape 2 : La plainte à la CNIL

Si la relance reste sans effet, déposez une plainte auprès de la CNIL :

**En ligne (le plus simple) :**
1. Rendez-vous sur [cnil.fr/fr/plaintes](https://www.cnil.fr/fr/plaintes)
2. Cliquez sur « Adresser une plainte »
3. Remplissez le formulaire en précisant l''organisme concerné, votre demande initiale et la réponse (ou l''absence de réponse)
4. Joignez les preuves : copie de votre demande, accusé de réception, éventuels échanges

**Ce que fait la CNIL :**
- Elle instruit votre plainte
- Elle peut mettre en demeure l''organisme de se conformer
- Elle peut prononcer des sanctions (avertissement, amende, injonction)

> **Bon à savoir :** la CNIL a reçu plus de 16 000 plaintes en 2023. Elle traite chaque plainte, mais les délais peuvent être longs (plusieurs mois).

### Étape 3 : La médiation

Dans certains secteurs, un médiateur peut intervenir :
- **Médiateur du e-commerce** pour les sites marchands
- **Médiateur bancaire** pour les établissements financiers
- **Médiateur des communications électroniques** pour les opérateurs télécoms

### Étape 4 : L''action en justice

En dernier recours, vous pouvez saisir le **tribunal judiciaire** pour obtenir réparation du préjudice subi. Le RGPD prévoit un droit à réparation (article 82) pour tout dommage matériel ou moral résultant d''une violation.

Vous pouvez aussi rejoindre une **action de groupe** menée par une association agréée (comme NOYB, La Quadrature du Net, UFC-Que Choisir).

### Conseils pratiques

- **Documentez tout** : conservez chaque email, chaque réponse, chaque preuve d''envoi
- **Soyez précis** dans vos demandes : citez les articles du RGPD
- **Restez courtois** mais ferme : la loi est de votre côté
- **N''hésitez pas** : la CNIL est là pour vous aider, et sa saisine est gratuite', 'text', 7, 3);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : Exercer vos droits', 'Vérifiez que vous savez exercer vos droits RGPD concrètement.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'Quel est le délai légal de réponse à une demande d''accès aux données ?',
 'multiple_choice',
 '[{"id":"a","text":"7 jours ouvrés","isCorrect":false},{"id":"b","text":"30 jours calendaires","isCorrect":true},{"id":"c","text":"3 mois","isCorrect":false},{"id":"d","text":"Il n''y a pas de délai imposé","isCorrect":false}]',
 'L''article 12 du RGPD impose un délai de réponse d''un mois (30 jours calendaires), prolongeable de 2 mois.', 1),

(q2_id, 'Une entreprise peut-elle vous demander une pièce d''identité pour vérifier votre demande RGPD ?',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":true},{"id":"b","text":"Faux","isCorrect":false}]',
 'L''organisme peut demander une vérification d''identité pour s''assurer que la demande émane bien de la personne concernée.', 2),

(q2_id, 'Dans quel cas une entreprise peut-elle légitimement refuser l''effacement de vos données ?',
 'multiple_choice',
 '[{"id":"a","text":"Si elle estime que vos données ont de la valeur commerciale","isCorrect":false},{"id":"b","text":"Si la conservation est requise par une obligation légale","isCorrect":true},{"id":"c","text":"Si elle a investi de l''argent pour collecter vos données","isCorrect":false},{"id":"d","text":"Si elle trouve que la demande est ennuyeuse","isCorrect":false}]',
 'Les obligations légales de conservation (comptabilité, fiscalité, etc.) sont un motif légitime de refus d''effacement.', 3),

(q2_id, 'Auprès de quel organisme pouvez-vous déposer une plainte gratuite en France si vos droits RGPD ne sont pas respectés ?',
 'multiple_choice',
 '[{"id":"a","text":"La police nationale","isCorrect":false},{"id":"b","text":"Le tribunal de commerce","isCorrect":false},{"id":"c","text":"La CNIL","isCorrect":true},{"id":"d","text":"Le ministère de l''Intérieur","isCorrect":false}]',
 'La CNIL (Commission Nationale de l''Informatique et des Libertés) est l''autorité de contrôle française compétente en matière de protection des données.', 4),

(q2_id, 'Quel article du RGPD prévoit un droit à réparation en cas de violation ?',
 'multiple_choice',
 '[{"id":"a","text":"Article 15","isCorrect":false},{"id":"b","text":"Article 22","isCorrect":false},{"id":"c","text":"Article 82","isCorrect":true},{"id":"d","text":"Article 99","isCorrect":false}]',
 'L''article 82 du RGPD prévoit un droit à réparation pour tout dommage matériel ou moral résultant d''une violation du règlement.', 5);

-- Module 3: Les CGU décryptées
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c_id,
  'Les CGU décryptées',
  'Apprenez à lire et comprendre les conditions générales d''utilisation des services numériques.',
  'FileSearch', 20, 'moyen', 'Droits numériques', false, false, 3);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m3_id, 'Anatomie d''une CGU',
'## Anatomie d''une CGU

Les Conditions Générales d''Utilisation (CGU) sont des contrats juridiques que vous acceptez en utilisant un service en ligne. Personne ne les lit — et c''est précisément le problème.

### Pourquoi faut-il s''y intéresser ?

En cliquant « J''accepte », vous signez un contrat qui peut :
- Autoriser l''entreprise à **utiliser vos contenus** (photos, textes, vidéos)
- Permettre le **partage de vos données** avec des centaines de partenaires
- Limiter votre **droit de recours** en cas de litige
- Modifier les conditions **unilatéralement** et sans préavis

> **Chiffre clé :** il faudrait environ **76 jours de travail par an** pour lire toutes les CGU des services que vous utilisez (étude Carnegie Mellon University).

### Les sections clés à lire

Vous n''avez pas besoin de tout lire. Concentrez-vous sur ces sections :

**1. Collecte et utilisation des données**
Cherchez les mots : « données », « informations personnelles », « collecte », « traitement ». Identifiez quelles données sont collectées et pourquoi.

**2. Partage avec des tiers**
Cherchez : « partenaires », « tiers », « affiliés », « sous-traitants ». L''entreprise partage-t-elle vos données ? Avec qui ?

**3. Propriété intellectuelle et licence sur vos contenus**
Cherchez : « licence », « contenu utilisateur », « droits ». Certaines plateformes s''octroient une licence mondiale, gratuite et perpétuelle sur tout ce que vous publiez.

**4. Modification des conditions**
Cherchez : « modification », « mise à jour », « notification ». L''entreprise peut-elle changer les règles sans vous prévenir ?

**5. Résiliation et suppression du compte**
Cherchez : « résiliation », « suppression », « données après résiliation ». Que se passe-t-il quand vous fermez votre compte ?

**6. Juridiction et règlement des litiges**
Cherchez : « juridiction », « tribunal compétent », « arbitrage ». Certaines CGU imposent un tribunal étranger, ce qui complique les recours.

### Les clauses abusives

Le droit français protège les consommateurs contre les **clauses abusives** (articles L. 212-1 et suivants du Code de la consommation). Une clause est abusive si elle crée un « déséquilibre significatif » au détriment du consommateur. Ces clauses sont réputées non écrites.', 'text', 10, 1),

(m3_id, 'Les pires pratiques des géants du numérique',
'## Les pires pratiques des géants du numérique

Les grandes entreprises technologiques ont des CGU et des politiques de confidentialité parmi les plus intrusives au monde. Décryptons les pratiques de trois géants.

### Meta (Facebook, Instagram, WhatsApp)

**Ce que Meta collecte :**
- Vos publications, photos, vidéos, messages (y compris supprimés)
- Votre localisation GPS, même quand l''app est fermée
- Vos contacts téléphoniques (si vous avez autorisé l''accès)
- Vos habitudes de navigation sur les sites tiers (via le pixel Meta)
- Les métadonnées de vos appels et SMS (durée, fréquence, contacts)

**La licence sur vos contenus :**
En publiant sur Facebook ou Instagram, vous accordez à Meta une « licence non exclusive, transférable, sous-licenciable, gratuite et mondiale » sur vos contenus. Concrètement, Meta peut utiliser vos photos et vidéos à des fins commerciales.

> **Amende :** 1,2 milliard d''euros en mai 2023 par l''autorité irlandaise pour transfert illégal de données européennes vers les États-Unis.

### Google (Search, Gmail, YouTube, Android)

**Ce que Google sait de vous :**
- Toutes vos recherches (conservées indéfiniment par défaut)
- Tous les sites que vous visitez (via Chrome et Google Analytics)
- Vos emails Gmail (analysés par IA)
- Votre historique de localisation (Timeline/Chronologie)
- Vos achats (via Gmail et Google Pay)
- Votre voix (enregistrements Google Assistant)

**Vérifiez par vous-même :** rendez-vous sur [myaccount.google.com](https://myaccount.google.com) → Données et confidentialité → Mon activité. Vous serez surpris(e) par la quantité de données stockées.

> **Amende :** 150 millions d''euros en décembre 2021 par la CNIL pour avoir rendu le refus des cookies plus complexe que l''acceptation.

### Amazon

**Ce que Amazon collecte :**
- Votre historique d''achats complet
- Vos recherches de produits
- Les produits consultés (même sans achat)
- Votre voix (via Alexa — enregistrée et analysée par des humains)
- Vos habitudes de lecture (Kindle : pages lues, surlignages, annotations)

**L''écosystème de surveillance :**
Avec Ring (caméras), Alexa (assistant vocal), Kindle (lecture), Prime Video (vidéo), Amazon construit un profil complet de votre vie quotidienne : ce que vous regardez, lisez, achetez, dites, et même qui sonne à votre porte.

### Comment se protéger ?

- Utilisez [tosdr.org](https://tosdr.org) (Terms of Service; Didn''t Read) : ce site note les CGU des services populaires
- Révisez régulièrement vos paramètres de confidentialité
- Supprimez périodiquement vos historiques (recherches, localisation)
- Utilisez des alternatives respectueuses de la vie privée quand c''est possible', 'text', 10, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q3_id, m3_id, 'Quiz : Les CGU décryptées', 'Testez votre compréhension des CGU et des pratiques des géants du numérique.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q3_id, 'En publiant une photo sur Instagram, vous accordez à Meta...',
 'multiple_choice',
 '[{"id":"a","text":"Aucun droit particulier sur votre photo","isCorrect":false},{"id":"b","text":"Une licence mondiale, gratuite et transférable sur votre contenu","isCorrect":true},{"id":"c","text":"Le droit de supprimer votre photo","isCorrect":false},{"id":"d","text":"L''obligation de vous payer des droits d''auteur","isCorrect":false}]',
 'Les CGU de Meta prévoient une licence non exclusive, transférable, sous-licenciable, gratuite et mondiale sur les contenus que vous publiez.', 1),

(q3_id, 'Quel site permet de consulter des notes simplifiées sur les CGU des services en ligne ?',
 'multiple_choice',
 '[{"id":"a","text":"cnil.fr","isCorrect":false},{"id":"b","text":"tosdr.org","isCorrect":true},{"id":"c","text":"legifrance.gouv.fr","isCorrect":false},{"id":"d","text":"wikipedia.org","isCorrect":false}]',
 'ToS;DR (Terms of Service; Didn''t Read) est un projet qui évalue et note les conditions d''utilisation des services en ligne.', 2),

(q3_id, 'Une clause abusive dans des CGU est juridiquement contraignante pour le consommateur.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'En droit français, les clauses abusives sont réputées non écrites (article L. 241-1 du Code de la consommation). Elles n''ont aucune valeur juridique.', 3),

(q3_id, 'Où pouvez-vous consulter l''ensemble des données que Google détient sur vous ?',
 'multiple_choice',
 '[{"id":"a","text":"google.com/settings","isCorrect":false},{"id":"b","text":"myaccount.google.com → Données et confidentialité","isCorrect":true},{"id":"c","text":"gmail.com/privacy","isCorrect":false},{"id":"d","text":"Ce n''est pas possible","isCorrect":false}]',
 'Google propose un tableau de bord complet de vos données sur myaccount.google.com, dans la section Données et confidentialité.', 4);

END $$;

-- ============================================================================
-- ADULTES — Course 2: "Sécurité numérique : les fondamentaux"
-- ============================================================================
DO $$
DECLARE
  c_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c_id, NULL, NULL,
  'Sécurité numérique : les fondamentaux',
  'Protégez vos comptes, reconnaissez les arnaques et sécurisez vos appareils au quotidien.',
  'adultes', 'Lock', '#EF4444', 'Sécurité', true, true, 2);

-- Module 1: Mots de passe et authentification
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c_id,
  'Mots de passe et authentification',
  'Maîtrisez l''art du mot de passe et de l''authentification forte.',
  'Key', 20, 'facile', 'Sécurité', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'L''art du mot de passe',
'## L''art du mot de passe

### L''entropie : mesurer la force d''un mot de passe

La force d''un mot de passe se mesure en **bits d''entropie**. Plus l''entropie est élevée, plus le mot de passe est difficile à deviner.

| Mot de passe | Entropie | Temps de crack |
|---|---|---|
| `123456` | ~20 bits | < 1 seconde |
| `Soleil2024` | ~35 bits | Quelques minutes |
| `X7$kL9mP` | ~52 bits | Quelques jours |
| `Mon-Chien-Adore-Les-Croquettes!` | ~130 bits | Des milliards d''années |

> **Règle fondamentale :** la longueur bat la complexité. Un mot de passe de 25 caractères simples est plus sûr qu''un mot de passe de 8 caractères complexes.

### La méthode de la phrase secrète (passphrase)

La meilleure approche actuelle est la **phrase secrète** :

1. Inventez une phrase absurde et mémorable
2. Ajoutez des caractères spéciaux et des chiffres
3. Visez au moins 20 caractères

**Exemples :**
- `Trois-Girafes-Mangent-Du-Code!42`
- `Le*Piano*Bleu*Danse*Sur*Mars`

### Les gestionnaires de mots de passe

Vous ne pouvez pas retenir un mot de passe unique pour chacun de vos comptes (en moyenne 80 à 100 par personne). La solution : un **gestionnaire de mots de passe**.

**Recommandations :**
- **Bitwarden** — open source, gratuit, audité indépendamment
- **1Password** — excellent UX, plans famille et entreprise
- **KeePass** — open source, stockage local (recommandé par l''ANSSI)

**Avantages :**
- Génération de mots de passe aléatoires de 20+ caractères
- Stockage chiffré (AES-256)
- Remplissage automatique
- Alertes en cas de fuite de données (Have I Been Pwned)

**Le mot de passe maître :** c''est le seul que vous devez retenir. Utilisez une phrase secrète longue et unique. Ne l''écrivez nulle part en clair.

### Vérifier si vos mots de passe ont fuité

Rendez-vous sur [haveibeenpwned.com](https://haveibeenpwned.com) pour vérifier si votre email apparaît dans des fuites de données. Si c''est le cas, changez immédiatement les mots de passe des comptes concernés.', 'text', 10, 1),

(m1_id, 'L''authentification à deux facteurs',
'## L''authentification à deux facteurs (2FA)

L''authentification à deux facteurs ajoute une couche de sécurité au-delà du mot de passe. Même si votre mot de passe est compromis, un attaquant ne peut pas accéder à votre compte sans le deuxième facteur.

### Les trois facteurs d''authentification

1. **Ce que vous savez** — mot de passe, PIN, question secrète
2. **Ce que vous possédez** — téléphone, clé physique, carte à puce
3. **Ce que vous êtes** — empreinte digitale, reconnaissance faciale, iris

La 2FA combine au moins deux de ces facteurs.

### Les méthodes de 2FA

**SMS (faible sécurité)**
Un code est envoyé par SMS. C''est mieux que rien, mais vulnérable au **SIM swapping** (un attaquant convainc votre opérateur de transférer votre numéro sur sa carte SIM).

**Application TOTP (bonne sécurité)**
Une application génère un code temporaire (valable 30 secondes) basé sur un secret partagé. Applications recommandées :
- **Aegis** (Android, open source)
- **2FAS** (iOS et Android, open source)
- **Google Authenticator** ou **Microsoft Authenticator**

> **Conseil :** sauvegardez vos codes de récupération ! Si vous perdez votre téléphone sans backup, vous perdez l''accès à vos comptes.

**Clé de sécurité physique (très haute sécurité)**
Des clés USB comme **YubiKey** ou **Titan** (Google) offrent le plus haut niveau de sécurité. Vous branchez la clé ou la posez sur votre téléphone (NFC) pour vous authentifier.

- Résistantes au phishing (la clé vérifie le domaine du site)
- Utilisées en interne chez Google : depuis leur adoption, zéro compte employé compromis par phishing

### Où activer la 2FA en priorité ?

1. **Email principal** — c''est la clé de voûte de tous vos comptes (réinitialisation de mot de passe)
2. **Banque en ligne**
3. **Réseaux sociaux**
4. **Cloud / stockage** (Google Drive, iCloud, Dropbox)
5. **Gestionnaire de mots de passe**

### Les passkeys : l''avenir sans mot de passe

Les **passkeys** (clés d''accès) sont la nouvelle norme soutenue par Apple, Google et Microsoft. Elles remplacent le mot de passe par une authentification biométrique ou par PIN, liée à votre appareil. Plus besoin de retenir quoi que ce soit, et impossible à phisher.

De plus en plus de services les proposent : Google, Apple, PayPal, eBay, GitHub...', 'text', 10, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : Mots de passe et authentification', 'Testez vos connaissances en sécurité des mots de passe et 2FA.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Quel type de mot de passe est le plus sécurisé ?',
 'multiple_choice',
 '[{"id":"a","text":"X7$kL9 (8 caractères complexes)","isCorrect":false},{"id":"b","text":"Trois-Girafes-Mangent-Du-Code!42 (longue phrase secrète)","isCorrect":true},{"id":"c","text":"Motdepasse2024 (mot courant + année)","isCorrect":false},{"id":"d","text":"azertyuiop (10 caractères simples)","isCorrect":false}]',
 'La longueur bat la complexité : une phrase secrète longue a une entropie bien supérieure à un mot de passe court même complexe.', 1),

(q1_id, 'Pourquoi l''authentification par SMS est-elle considérée comme la moins sécurisée des méthodes 2FA ?',
 'multiple_choice',
 '[{"id":"a","text":"Les SMS sont trop lents","isCorrect":false},{"id":"b","text":"Elle est vulnérable au SIM swapping","isCorrect":true},{"id":"c","text":"Les SMS coûtent cher","isCorrect":false},{"id":"d","text":"Tous les téléphones ne reçoivent pas de SMS","isCorrect":false}]',
 'Le SIM swapping permet à un attaquant de détourner votre numéro de téléphone en convainquant l''opérateur de transférer votre ligne.', 2),

(q1_id, 'Quel compte faut-il sécuriser en priorité avec la 2FA ?',
 'multiple_choice',
 '[{"id":"a","text":"Votre compte Netflix","isCorrect":false},{"id":"b","text":"Votre email principal","isCorrect":true},{"id":"c","text":"Votre compte de jeu vidéo","isCorrect":false},{"id":"d","text":"Votre compte sur un forum","isCorrect":false}]',
 'L''email principal est la clé de voûte : c''est par lui que passent les réinitialisations de mot de passe de tous vos autres comptes.', 3),

(q1_id, 'Les passkeys sont vulnérables au phishing.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'Les passkeys sont résistantes au phishing car elles vérifient cryptographiquement le domaine du site. Un faux site ne peut pas déclencher l''authentification.', 4);

-- Module 2: Phishing et ingénierie sociale
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c_id,
  'Phishing et ingénierie sociale',
  'Apprenez à reconnaître et déjouer les tentatives de phishing et d''arnaque.',
  'AlertTriangle', 25, 'moyen', 'Sécurité', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Reconnaître une tentative de phishing',
'## Reconnaître une tentative de phishing

Le **phishing** (hameçonnage) est la technique d''attaque la plus répandue. Elle consiste à se faire passer pour un organisme de confiance pour vous soutirer des informations sensibles.

### Les canaux de phishing

- **Email** : le plus classique (« Votre compte sera suspendu... »)
- **SMS** (smishing) : « Votre colis est en attente de livraison... »
- **Téléphone** (vishing) : appel d''un faux conseiller bancaire
- **QR code** (quishing) : QR codes malveillants sur des affiches ou parkings
- **Réseaux sociaux** : faux profils, messages privés avec liens piégés

### Les signaux d''alerte dans un email

**1. L''adresse de l''expéditeur**
Vérifiez le domaine complet. `service@ameli.fr` est légitime, `service@ameli-info.com` ne l''est pas.

**2. L''urgence artificielle**
« Votre compte sera fermé dans 24h », « Action immédiate requise », « Dernière chance ». Les vrais organismes ne menacent pas par email.

**3. Les fautes et la mise en forme**
Fautes d''orthographe, mise en page inhabituelle, logo pixelisé. Mais attention : les phishings de qualité sont de plus en plus soignés grâce à l''IA.

**4. Les liens suspects**
Survolez le lien SANS cliquer : l''URL de destination apparaît en bas de votre navigateur ou dans une infobulle. Vérifiez que le domaine est bien celui de l''organisme.

**5. Les pièces jointes inattendues**
Ne jamais ouvrir une pièce jointe inattendue, surtout les fichiers .exe, .zip, .docm ou .xlsm.

> **Réflexe à adopter :** en cas de doute, ne cliquez sur rien. Allez directement sur le site officiel en tapant l''adresse vous-même dans votre navigateur, ou appelez le numéro officiel de l''organisme.

### Exemples réels

**Faux email Ameli :** « Suite à votre dernier remboursement, un montant de 247,85 € vous est dû. Cliquez ici pour procéder au virement. » → Ameli ne demande jamais vos coordonnées bancaires par email.

**Faux SMS La Poste :** « Votre colis est en attente. Payez 1,99 € de frais de douane pour le recevoir : [lien] » → La Poste ne demande jamais de paiement par SMS.

**Faux appel bancaire :** « Bonjour, je suis du service anti-fraude de votre banque. Nous avons détecté un mouvement suspect. Pouvez-vous me communiquer votre code confidentiel ? » → Votre banque ne vous demande JAMAIS votre code par téléphone.', 'text', 12, 1),

(m2_id, 'Les arnaques courantes',
'## Les arnaques courantes

Au-delà du phishing classique, les cybercriminels utilisent des techniques d''**ingénierie sociale** sophistiquées. Voici les arnaques les plus fréquentes.

### L''arnaque au président (CEO fraud)

Un employé reçoit un email (ou un appel) semblant provenir du PDG ou d''un dirigeant, demandant un virement urgent et confidentiel. La pression hiérarchique et l''urgence empêchent la victime de vérifier.

> **Cas réel :** en 2024, une entreprise hongkongaise a perdu 25 millions de dollars après qu''un employé a participé à une visioconférence avec des deepfakes de ses collègues et de son directeur financier.

### L''arnaque au support technique

Un pop-up apparaît sur votre écran : « Votre ordinateur est infecté ! Appelez immédiatement le 01 XX XX XX XX ». Vous appelez, un faux technicien prend le contrôle de votre ordinateur et vous fait payer une « réparation » fictive.

**Comment réagir :**
- Ne jamais appeler le numéro affiché
- Fermer le navigateur (Ctrl+W ou Cmd+W)
- Si bloqué, forcer la fermeture (Ctrl+Alt+Suppr ou Cmd+Option+Esc)

### L''arnaque sentimentale (romance scam)

Sur les sites de rencontre ou les réseaux sociaux, un profil séduisant engage une relation. Après des semaines ou des mois d''échanges, il demande de l''argent (urgence médicale, billet d''avion, investissement). Les victimes perdent en moyenne **plusieurs milliers d''euros**.

**Signaux d''alerte :**
- La personne ne veut jamais faire de visioconférence
- Elle est toujours à l''étranger
- Elle demande de l''argent, même de petites sommes au début
- Son profil semble trop parfait (photos de mannequin)

### L''arnaque au faux RIB

Un pirate intercepte un email contenant une facture (entre un artisan et son client, par exemple) et remplace le RIB du bénéficiaire par le sien. La victime paie la facture, mais l''argent part chez le fraudeur.

**Prévention :**
- Vérifiez toujours un RIB par téléphone avant un premier virement
- Méfiez-vous des changements de RIB en cours de transaction
- Utilisez des canaux sécurisés pour transmettre les informations bancaires

### La fausse notification de livraison

SMS ou email annonçant un colis en attente avec des frais à payer (1 ou 2 euros) via un lien. Le lien mène à un faux site qui capture vos coordonnées bancaires.

**Règle :** les frais de livraison sont toujours inclus dans le prix. Aucun transporteur ne vous demandera de payer par SMS.

### Que faire si vous êtes victime ?

1. **Bloquez votre carte bancaire** immédiatement (via l''app ou en appelant votre banque)
2. **Changez vos mots de passe** compromis
3. **Déposez plainte** (en ligne sur pre-plainte-en-ligne.gouv.fr ou au commissariat)
4. **Signalez** sur [cybermalveillance.gouv.fr](https://www.cybermalveillance.gouv.fr)
5. **Contactez** Info Escroqueries au 0 805 805 817 (appel gratuit)', 'text', 13, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : Phishing et arnaques', 'Sauriez-vous déjouer une tentative de phishing ?', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'Quel est le premier réflexe à avoir face à un email suspect vous demandant de cliquer sur un lien ?',
 'multiple_choice',
 '[{"id":"a","text":"Cliquer rapidement pour ne pas perdre votre compte","isCorrect":false},{"id":"b","text":"Répondre à l''email pour demander des précisions","isCorrect":false},{"id":"c","text":"Ne pas cliquer et aller directement sur le site officiel en tapant l''adresse","isCorrect":true},{"id":"d","text":"Transférer l''email à vos amis pour avoir leur avis","isCorrect":false}]',
 'Ne cliquez jamais sur un lien suspect. Accédez toujours au site officiel en tapant vous-même l''adresse dans votre navigateur.', 1),

(q2_id, 'Votre banque peut légitimement vous demander votre code confidentiel par téléphone.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'Aucune banque ne demande jamais votre code confidentiel par téléphone, email ou SMS. C''est toujours une arnaque.', 2),

(q2_id, 'Qu''est-ce que l''arnaque au faux RIB ?',
 'multiple_choice',
 '[{"id":"a","text":"Créer un faux compte bancaire","isCorrect":false},{"id":"b","text":"Intercepter une facture et remplacer le RIB du bénéficiaire par celui du fraudeur","isCorrect":true},{"id":"c","text":"Pirater le site de votre banque","isCorrect":false},{"id":"d","text":"Envoyer un faux relevé bancaire","isCorrect":false}]',
 'L''arnaque au faux RIB consiste à intercepter un email contenant une facture pour substituer le RIB. Vérifiez toujours un RIB par téléphone.', 3),

(q2_id, 'Un SMS vous indique qu''un colis attend avec 1,99€ de frais. Que faites-vous ?',
 'multiple_choice',
 '[{"id":"a","text":"Vous payez rapidement pour recevoir le colis","isCorrect":false},{"id":"b","text":"Vous cliquez sur le lien pour vérifier","isCorrect":false},{"id":"c","text":"Vous ignorez le SMS car les transporteurs ne demandent jamais de paiement par SMS","isCorrect":true},{"id":"d","text":"Vous répondez STOP au SMS","isCorrect":false}]',
 'Les transporteurs n''envoient jamais de SMS demandant un paiement. C''est toujours une tentative de phishing.', 4),

(q2_id, 'Sur quel site français pouvez-vous signaler une cyberarnaque ?',
 'multiple_choice',
 '[{"id":"a","text":"signalement.gouv.fr","isCorrect":false},{"id":"b","text":"cybermalveillance.gouv.fr","isCorrect":true},{"id":"c","text":"service-public.fr","isCorrect":false},{"id":"d","text":"cnil.fr","isCorrect":false}]',
 'Cybermalveillance.gouv.fr est la plateforme nationale d''assistance et de signalement des actes de cybermalveillance.', 5);

-- Module 3: Protéger ses appareils
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c_id,
  'Protéger ses appareils',
  'Sécurisez votre smartphone, votre ordinateur et votre navigation web.',
  'Smartphone', 20, 'moyen', 'Sécurité', false, false, 3);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m3_id, 'Smartphone et tablette',
'## Sécuriser son smartphone et sa tablette

Votre smartphone contient votre vie entière : emails, photos, contacts, banque, santé. Le sécuriser est indispensable.

### Les mises à jour : votre première défense

Les mises à jour du système (iOS, Android) corrigent des **failles de sécurité** exploitées par les attaquants. Retarder une mise à jour, c''est laisser une porte ouverte.

- **Activez les mises à jour automatiques** dans les paramètres
- **Mettez à jour vos applications** régulièrement
- **Évitez les téléphones** qui ne reçoivent plus de mises à jour de sécurité (plus de 3-4 ans pour Android)

### Les permissions des applications

Chaque application demande des permissions (caméra, micro, contacts, position). Le principe : **accordez le minimum nécessaire**.

**Questions à se poser :**
- Une lampe torche a-t-elle besoin de vos contacts ? Non.
- Un jeu a-t-il besoin de votre micro ? Rarement.
- Une app météo a-t-elle besoin de votre position en permanence ? Seulement quand vous l''utilisez.

**Comment vérifier :**
- **iPhone** : Réglages → Confidentialité et sécurité
- **Android** : Paramètres → Applications → Autorisations

> **Conseil :** choisissez « Uniquement pendant l''utilisation » pour la localisation plutôt que « Toujours ».

### Le VPN : quand et pourquoi

Un **VPN** (Virtual Private Network) chiffre votre connexion Internet. Utile quand :
- Vous utilisez un **Wi-Fi public** (café, hôtel, aéroport)
- Vous voulez empêcher votre **FAI de surveiller** votre navigation

**Recommandations :**
- **Mullvad** — anonyme, pas de compte, audité
- **ProtonVPN** — version gratuite fiable, basé en Suisse

**Attention :** un VPN ne vous rend pas anonyme et ne protège pas contre le phishing.

### La sauvegarde

Sauvegardez régulièrement vos données :
- **iPhone** : iCloud ou sauvegarde locale via Finder/iTunes
- **Android** : Google One ou sauvegarde locale

En cas de perte, vol ou ransomware, la sauvegarde est votre filet de sécurité.', 'text', 10, 1),

(m3_id, 'Ordinateur et navigation web',
'## Sécuriser son ordinateur et sa navigation web

### Le navigateur : votre fenêtre sur le web

Le choix du navigateur et sa configuration ont un impact direct sur votre sécurité et votre vie privée.

**Navigateurs recommandés :**
- **Firefox** — open source, protection renforcée contre le pistage activée par défaut
- **Brave** — bloqueur de pubs et traceurs intégré, basé sur Chromium
- **Safari** — bonne protection vie privée sur macOS/iOS (Intelligent Tracking Prevention)

### Les extensions indispensables

- **uBlock Origin** — bloqueur de publicités et de traceurs (le plus efficace et le plus léger)
- **Bitwarden** — gestionnaire de mots de passe
- **HTTPS Everywhere** — force les connexions sécurisées (intégré dans la plupart des navigateurs modernes)

> **Attention :** installez le minimum d''extensions. Chaque extension a accès à vos données de navigation. Privilégiez les extensions open source et populaires.

### HTTPS : le cadenas dans la barre d''adresse

Le **HTTPS** (le « S » signifie Secure) chiffre la communication entre votre navigateur et le site web. Vérifiez la présence du cadenas avant de saisir des informations sensibles.

**Mais attention :** HTTPS ne signifie pas que le site est fiable. Un site de phishing peut aussi avoir HTTPS. Le cadenas garantit le chiffrement, pas la légitimité du site.

### Le Wi-Fi public : danger réel

Les réseaux Wi-Fi ouverts (cafés, gares, hôtels) sont des terrains de chasse pour les attaquants :

- **Attaque Man-in-the-Middle** : l''attaquant intercepte vos communications
- **Faux point d''accès** : un réseau « Free Wi-Fi Hotel » créé par un attaquant
- **Sniffing** : capture du trafic réseau non chiffré

**Règles de sécurité sur Wi-Fi public :**
- Utilisez un **VPN**
- Ne consultez jamais votre **banque en ligne** sur un Wi-Fi public
- Désactivez le **partage de fichiers**
- « Oubliez » le réseau après utilisation

### Le chiffrement de votre disque dur

Le chiffrement protège vos données en cas de vol de votre ordinateur :

- **macOS** : FileVault (activé par défaut sur les Mac récents)
- **Windows** : BitLocker (éditions Pro et Enterprise) ou VeraCrypt (gratuit)
- **Linux** : LUKS (configurable à l''installation)

Avec le chiffrement activé, vos fichiers sont illisibles sans votre mot de passe de session, même si quelqu''un retire le disque dur de votre ordinateur.

### Les sauvegardes : la règle du 3-2-1

- **3** copies de vos données importantes
- **2** supports différents (disque externe + cloud)
- **1** copie hors site (cloud ou disque chez un proche)

En cas de ransomware, la sauvegarde est souvent votre seule planche de salut.', 'text', 10, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q3_id, m3_id, 'Quiz : Protéger ses appareils', 'Vérifiez vos bonnes pratiques de sécurité numérique.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q3_id, 'Pourquoi est-il crucial d''installer les mises à jour du système de votre smartphone ?',
 'multiple_choice',
 '[{"id":"a","text":"Pour avoir de nouvelles fonctionnalités","isCorrect":false},{"id":"b","text":"Parce qu''elles corrigent des failles de sécurité exploitables","isCorrect":true},{"id":"c","text":"Pour que le téléphone soit plus rapide","isCorrect":false},{"id":"d","text":"Parce que c''est obligatoire","isCorrect":false}]',
 'Les mises à jour corrigent des vulnérabilités de sécurité. Retarder une mise à jour laisse votre appareil exposé à des attaques connues.', 1),

(q3_id, 'Un site avec le cadenas HTTPS est forcément un site de confiance.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'HTTPS garantit que la connexion est chiffrée, mais pas que le site est légitime. Un site de phishing peut aussi utiliser HTTPS.', 2),

(q3_id, 'Quelle est la règle de sauvegarde recommandée ?',
 'multiple_choice',
 '[{"id":"a","text":"La règle du 1-1-1","isCorrect":false},{"id":"b","text":"La règle du 3-2-1","isCorrect":true},{"id":"c","text":"La règle du 5-3-2","isCorrect":false},{"id":"d","text":"Il n''y a pas de règle, une sauvegarde suffit","isCorrect":false}]',
 'La règle 3-2-1 : 3 copies, 2 supports différents, 1 copie hors site. C''est la meilleure protection contre la perte de données.', 3),

(q3_id, 'Quelle est la meilleure pratique sur un Wi-Fi public ?',
 'multiple_choice',
 '[{"id":"a","text":"Se connecter normalement, le Wi-Fi est sûr si un mot de passe est demandé","isCorrect":false},{"id":"b","text":"Utiliser un VPN pour chiffrer sa connexion","isCorrect":true},{"id":"c","text":"Vérifier ses emails bancaires rapidement","isCorrect":false},{"id":"d","text":"Partager la connexion avec ses amis","isCorrect":false}]',
 'Sur un Wi-Fi public, un VPN chiffre tout votre trafic, empêchant les attaquants d''intercepter vos communications.', 4);

END $$;

-- ============================================================================
-- ADULTES — Course 3: "Comprendre l'IA générative"
-- ============================================================================
DO $$
DECLARE
  c_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c_id, NULL, NULL,
  'Comprendre l''IA générative',
  'Comprenez comment fonctionne ChatGPT, les biais algorithmiques et les risques liés aux deepfakes et à la désinformation.',
  'adultes', 'Brain', '#8B5CF6', 'Intelligence artificielle', true, true, 3);

-- Module 1: Comment fonctionne ChatGPT
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c_id,
  'Comment fonctionne ChatGPT',
  'Du texte aux probabilités : comprenez les mécanismes derrière les modèles de langage.',
  'Cpu', 25, 'moyen', 'Intelligence artificielle', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'Du texte aux probabilités',
'## Du texte aux probabilités

ChatGPT et les autres modèles de langage (LLM) ne « comprennent » pas le langage. Ils calculent des probabilités. Voici comment.

### La tokenisation : découper le texte

La première étape est la **tokenisation** : le texte est découpé en petits morceaux appelés « tokens ». Un token peut être un mot, une partie de mot ou un caractère de ponctuation.

**Exemple :** « L''intelligence artificielle » devient : `["L''", "int", "elligence", " artific", "ielle"]`

Le modèle GPT-4 utilise un vocabulaire d''environ 100 000 tokens. Chaque token est converti en un **vecteur numérique** (une liste de nombres) qui capture sa signification dans un espace mathématique.

### La prédiction du prochain token

Le fonctionnement fondamental d''un LLM est simple à comprendre :

**Étant donné une séquence de tokens, quel est le prochain token le plus probable ?**

Quand vous tapez « La capitale de la France est », le modèle calcule que le token « Paris » a la probabilité la plus élevée de suivre cette séquence, basé sur tout ce qu''il a vu pendant son entraînement.

> **Point clé :** ChatGPT ne « sait » pas que Paris est la capitale de la France. Il sait que dans les textes qu''il a lus, après « La capitale de la France est », le mot « Paris » apparaissait le plus souvent.

### L''architecture Transformer

Les LLM modernes reposent sur l''architecture **Transformer**, inventée par Google en 2017 (article « Attention is All You Need »).

Le mécanisme clé est l''**attention** : pour chaque mot, le modèle regarde tous les autres mots de la phrase et calcule lesquels sont les plus pertinents pour prédire la suite.

**Exemple simplifié :**
Dans la phrase « Le chat dort sur le canapé parce qu''**il** est fatigué », le mécanisme d''attention permet au modèle de comprendre que « il » fait référence à « chat » (et non à « canapé »), car dans les millions de phrases similaires vues pendant l''entraînement, c''est le sujet animé qui est généralement fatigué.

### Les paramètres : des milliards de boutons

Un LLM est défini par ses **paramètres** (ou poids), qui sont des nombres ajustés pendant l''entraînement. GPT-4 aurait environ **1 800 milliards de paramètres**. Chaque paramètre est comme un bouton de réglage très fin qui influence la façon dont le modèle traite l''information.

### La température : contrôler la créativité

La **température** est un réglage qui contrôle le caractère aléatoire des réponses :
- **Température basse (0,1)** : réponses prévisibles et factuelles
- **Température haute (1,0)** : réponses plus créatives et variées, mais plus de risques d''erreurs', 'text', 12, 1),

(m1_id, 'Entraînement et données',
'## Entraînement et données

### Les trois phases d''entraînement

La création d''un modèle comme ChatGPT passe par trois phases distinctes.

**Phase 1 : Le pré-entraînement (pre-training)**

Le modèle est entraîné sur d''**énormes quantités de texte** provenant d''Internet : pages web, livres, articles scientifiques, forums, code source, Wikipedia, etc.

Pour GPT-4, on estime que le corpus d''entraînement fait **plusieurs téraoctets de texte** — l''équivalent de millions de livres.

Pendant cette phase, le modèle apprend la grammaire, les faits, le raisonnement, le style — tout cela implicitement, en prédisant le mot suivant des milliards de fois.

**Phase 2 : Le fine-tuning (ajustement fin)**

Le modèle brut est ensuite ajusté sur des données plus spécifiques et de meilleure qualité. Des humains rédigent des exemples de conversations idéales : une question et la réponse parfaite attendue. Le modèle apprend à imiter ce format.

**Phase 3 : RLHF (Reinforcement Learning from Human Feedback)**

C''est l''étape qui transforme un modèle brut en assistant utile et sûr :

1. Le modèle génère **plusieurs réponses** à une même question
2. Des annotateurs humains **classent** ces réponses de la meilleure à la pire
3. Un modèle de récompense apprend ce que les humains préfèrent
4. Le LLM est ajusté pour maximiser cette récompense

C''est le RLHF qui apprend au modèle à être poli, à refuser les demandes dangereuses et à reconnaître ses limites.

### D''où viennent les données ?

Les données d''entraînement proviennent principalement :
- De **Common Crawl** : un archivage massif du web (des milliards de pages)
- De **livres numérisés** (parfois sans l''accord des auteurs — sujet de procès en cours)
- De **Wikipedia** et de sources encyclopédiques
- De **dépôts de code** (GitHub)
- De **conversations publiques** sur Reddit, forums, etc.

> **Problème majeur :** les données d''entraînement reflètent les biais présents sur Internet. Si le web contient des stéréotypes, des inexactitudes ou des opinions biaisées, le modèle les apprend aussi.

### Les biais intégrés

Les biais dans les données d''entraînement se retrouvent dans les réponses du modèle :
- **Biais linguistique** : meilleures performances en anglais qu''en français
- **Biais culturel** : perspective occidentale dominante
- **Biais de genre** : association stéréotypée de certains métiers à un genre
- **Biais temporel** : le modèle ne connaît pas les événements postérieurs à sa date de coupure

**En résumé :** un LLM est aussi bon (et aussi biaisé) que les données sur lesquelles il a été entraîné.', 'text', 13, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : Fonctionnement de ChatGPT', 'Testez votre compréhension du fonctionnement des LLM.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Comment fonctionne fondamentalement un modèle de langage comme ChatGPT ?',
 'multiple_choice',
 '[{"id":"a","text":"Il comprend le sens des mots comme un humain","isCorrect":false},{"id":"b","text":"Il prédit le prochain token le plus probable dans une séquence","isCorrect":true},{"id":"c","text":"Il cherche les réponses dans une base de données","isCorrect":false},{"id":"d","text":"Il copie des textes existants d''Internet","isCorrect":false}]',
 'Un LLM fonctionne par prédiction statistique du prochain token. Il ne comprend pas le sens des mots au sens humain.', 1),

(q1_id, 'Qu''est-ce que le RLHF ?',
 'multiple_choice',
 '[{"id":"a","text":"Un langage de programmation pour l''IA","isCorrect":false},{"id":"b","text":"Un processus d''ajustement basé sur les retours humains pour rendre le modèle plus utile et sûr","isCorrect":true},{"id":"c","text":"Un algorithme de chiffrement des données","isCorrect":false},{"id":"d","text":"Un test de performance pour les processeurs","isCorrect":false}]',
 'Le RLHF (Reinforcement Learning from Human Feedback) est le processus qui entraîne le modèle à fournir des réponses préférées par les humains.', 2),

(q1_id, 'La température élevée dans un LLM produit des réponses plus prévisibles.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'C''est l''inverse : une température élevée augmente le caractère aléatoire et la créativité. Une température basse produit des réponses plus prévisibles.', 3),

(q1_id, 'Pourquoi les LLM peuvent-ils reproduire des stéréotypes de genre ?',
 'multiple_choice',
 '[{"id":"a","text":"Parce qu''ils sont programmés pour être sexistes","isCorrect":false},{"id":"b","text":"Parce que leurs données d''entraînement reflètent les biais présents sur Internet","isCorrect":true},{"id":"c","text":"Parce qu''ils ont des opinions propres","isCorrect":false},{"id":"d","text":"Parce que les développeurs n''ont pas fait attention","isCorrect":false}]',
 'Les LLM apprennent des patterns dans leurs données. Si les données contiennent des biais, le modèle les reproduit.', 4);

-- Module 2: Biais, hallucinations et limites
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c_id,
  'Biais, hallucinations et limites',
  'Comprenez pourquoi l''IA se trompe et quels biais elle amplifie.',
  'AlertCircle', 20, 'moyen', 'Intelligence artificielle', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Quand l''IA se trompe',
'## Quand l''IA se trompe

### Les hallucinations : l''IA fabule

Les **hallucinations** sont des réponses fausses générées avec une apparence de certitude. Le modèle ne distingue pas le vrai du faux — il génère du texte plausible.

**Types d''hallucinations :**

- **Fabrication de sources** : citation d''articles, de livres ou d''études qui n''existent pas. Un avocat américain a soumis un mémoire juridique rédigé par ChatGPT citant six jurisprudences complètement inventées.
- **Statistiques inventées** : « 73 % des Français... » avec des chiffres sortis de nulle part
- **Faux raisonnements** : une logique apparemment cohérente aboutissant à une conclusion fausse
- **Anachronismes** : confusion de dates, attribution d''événements aux mauvaises personnes

> **Pourquoi ça arrive ?** Le modèle est entraîné à générer du texte plausible, pas du texte vrai. Quand il ne « connaît » pas la réponse, il génère ce qui semble le plus probable statistiquement — et parfois c''est faux.

### La confabulation

Plus insidieux que l''hallucination pure : la **confabulation**. Le modèle mélange des informations réelles pour créer un récit faux mais très convaincant. Par exemple, il peut attribuer correctement une théorie à un scientifique réel, mais se tromper sur l''année ou les détails.

### L''excès de confiance

Un LLM ne dit jamais « je ne sais pas » spontanément (sauf s''il a été entraîné à le faire). Il présente ses réponses avec le même niveau d''assurance, qu''elles soient correctes ou fausses. C''est particulièrement dangereux dans les domaines :

- **Médical** : un autodiagnostic basé sur ChatGPT peut être dangereux
- **Juridique** : les conseils juridiques générés peuvent être incorrects
- **Financier** : les recommandations d''investissement sont basées sur des patterns, pas sur une analyse réelle

### Comment se protéger ?

1. **Vérifiez toujours** les faits importants avec des sources primaires
2. **Demandez les sources** au modèle, puis vérifiez qu''elles existent
3. **Méfiez-vous des chiffres précis** : souvent inventés
4. **Utilisez l''IA comme point de départ**, pas comme source de vérité
5. **Croisez les sources** : si l''IA vous dit quelque chose, vérifiez avec un deuxième moyen', 'text', 10, 1),

(m2_id, 'Les biais algorithmiques',
'## Les biais algorithmiques

Les systèmes d''IA ne sont pas neutres. Ils reflètent et amplifient les biais présents dans leurs données d''entraînement et dans les choix de conception.

### Biais de genre

**Exemple célèbre :** l''outil de recrutement d''Amazon, développé en 2014, pénalisait systématiquement les CV de femmes. Pourquoi ? Il avait été entraîné sur 10 ans de CV reçus — majoritairement masculins dans le secteur tech. Le système avait appris que « homme » = bon candidat.

**Dans les LLM :** demandez à ChatGPT de décrire un(e) chirurgien(ne), un(e) PDG ou un(e) infirmier(ère). Les descriptions tendent à reproduire les stéréotypes de genre dominants.

### Biais racial

**Cas documentés :**
- **COMPAS** (justice américaine) : cet algorithme d''évaluation du risque de récidive attribuait des scores de risque plus élevés aux personnes noires, même à profil comparable
- **Reconnaissance faciale** : les systèmes ont des taux d''erreur jusqu''à 35 % plus élevés pour les femmes à peau foncée (étude Gender Shades du MIT, 2018)
- **Génération d''images** : les modèles comme DALL-E ou Midjourney associent certaines professions à certaines ethnies

### Biais culturel

Les LLM sont majoritairement entraînés sur des textes en anglais et reflètent une vision du monde occidentale. Cela se traduit par :
- Des réponses moins précises dans d''autres langues
- Des références culturelles américano-centrées
- Une sous-représentation des savoirs non occidentaux

### Impact réel sur les personnes

Les biais algorithmiques ont des conséquences concrètes :

- **Recrutement** : des candidats qualifiés écartés à cause de leur genre ou origine
- **Justice** : des peines ou des évaluations de risque biaisées
- **Santé** : des algorithmes qui sous-diagnostiquent certaines populations
- **Crédit** : des refus de prêt basés sur des corrélations discriminatoires
- **Publicité** : des offres d''emploi bien rémunérées montrées préférentiellement aux hommes (étude Carnegie Mellon, 2015)

> **Le paradoxe :** l''IA est souvent présentée comme « objective » car elle est mathématique. Mais les mathématiques ne font qu''encoder les biais humains présents dans les données.

### Comment lutter contre les biais ?

- **Audit régulier** des systèmes IA pour détecter les biais
- **Diversification** des données d''entraînement
- **Équipes diverses** dans le développement de l''IA
- **Transparence** sur les limites et les biais connus
- **Réglementation** (AI Act européen, article 22 du RGPD)', 'text', 10, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : Biais et hallucinations', 'Testez votre compréhension des limites de l''IA.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'Qu''est-ce qu''une hallucination dans le contexte de l''IA ?',
 'multiple_choice',
 '[{"id":"a","text":"Un bug qui fait planter le programme","isCorrect":false},{"id":"b","text":"Une réponse fausse présentée avec assurance comme étant vraie","isCorrect":true},{"id":"c","text":"Un problème de connexion avec le serveur","isCorrect":false},{"id":"d","text":"Une fonctionnalité expérimentale du modèle","isCorrect":false}]',
 'Une hallucination est une information inventée que le modèle présente comme un fait. Le modèle ne distingue pas le vrai du plausible.', 1),

(q2_id, 'L''outil de recrutement d''Amazon était biaisé contre les femmes parce que...',
 'multiple_choice',
 '[{"id":"a","text":"Les développeurs avaient programmé un biais volontairement","isCorrect":false},{"id":"b","text":"Il avait été entraîné sur des CV historiques majoritairement masculins","isCorrect":true},{"id":"c","text":"Les femmes avaient de moins bons CV","isCorrect":false},{"id":"d","text":"C''était un problème technique sans rapport avec les données","isCorrect":false}]',
 'Le système avait appris des patterns dans les CV reçus pendant 10 ans, majoritairement masculins, et en avait déduit que le profil masculin était « meilleur ».', 2),

(q2_id, 'Les systèmes de reconnaissance faciale ont le même taux d''erreur pour toutes les populations.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'L''étude Gender Shades (MIT, 2018) a montré des taux d''erreur jusqu''à 35 % plus élevés pour les femmes à peau foncée.', 3),

(q2_id, 'Quelle est la meilleure approche face aux réponses de ChatGPT ?',
 'multiple_choice',
 '[{"id":"a","text":"Faire confiance car l''IA est objective","isCorrect":false},{"id":"b","text":"Ne jamais utiliser l''IA car elle est biaisée","isCorrect":false},{"id":"c","text":"Utiliser l''IA comme point de départ et toujours vérifier avec d''autres sources","isCorrect":true},{"id":"d","text":"Utiliser uniquement les réponses courtes car elles sont plus fiables","isCorrect":false}]',
 'L''IA est un outil utile mais faillible. La vérification croisée avec des sources primaires est essentielle.', 4);

-- Module 3: Deepfakes et désinformation
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c_id,
  'Deepfakes et désinformation',
  'Apprenez à reconnaître les deepfakes et comprenez les mécanismes de la désinformation algorithmique.',
  'Eye', 25, 'expert', 'Intelligence artificielle', false, false, 3);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m3_id, 'Reconnaître un deepfake',
'## Reconnaître un deepfake

Un **deepfake** est un contenu audiovisuel généré ou modifié par intelligence artificielle pour faire croire qu''une personne dit ou fait quelque chose qu''elle n''a jamais dit ou fait.

### Les types de deepfakes

**Deepfake vidéo (face swap)**
Le visage d''une personne est superposé sur celui d''une autre dans une vidéo. La technologie est aujourd''hui accessible à tous via des applications gratuites.

**Deepfake audio (voice cloning)**
La voix d''une personne est clonée à partir de quelques secondes d''enregistrement. Un appel téléphonique peut être simulé de façon convaincante. En 2024, des parents ont reçu des appels de leurs enfants « kidnappés » — c''étaient des deepfakes audio.

**Deepfake image**
Des photos réalistes de personnes qui n''existent pas, générées par des modèles comme StyleGAN ou Midjourney. Utilisées pour créer de faux profils sur les réseaux sociaux.

### Cas réels

- **Politique** : des vidéos deepfake de chefs d''État circulant pendant des élections
- **Finance** : la visioconférence deepfake à 25 millions de dollars (Hong Kong, 2024)
- **Harcèlement** : des deepfakes pornographiques non consentis (un fléau croissant)
- **Arnaque** : des publicités avec de fausses célébrités promouvant des arnaques à l''investissement

### Comment détecter un deepfake ?

**Signes visuels (pour les vidéos) :**
- Clignement des yeux irrégulier ou absent
- Contour du visage flou ou instable, surtout autour des cheveux
- Incohérences d''éclairage (ombres qui ne correspondent pas)
- Mouvements de tête saccadés
- Lèvres mal synchronisées avec l''audio
- Artefacts autour des oreilles, des dents ou des bijoux

**Signes pour les images :**
- Doigts déformés ou en nombre incorrect
- Texte illisible en arrière-plan
- Motifs incohérents (bijoux, lunettes, vêtements)
- Asymétrie inhabituelle du visage
- Arrière-plan flou ou incohérent

> **Attention :** la technologie évolue très vite. Les deepfakes de 2026 sont bien plus convaincants que ceux de 2023. Les signes visuels deviennent de plus en plus subtils.

### Outils de détection

- **Microsoft Video Authenticator** — analyse les artefacts invisibles à l''œil nu
- **Deepfake-o-meter** — outil universitaire de détection
- **Recherche inversée d''images** — Google Images ou TinEye pour vérifier l''origine d''une photo

### Se protéger

- Méfiez-vous de tout contenu choquant ou improbable
- Vérifiez la source originale avant de partager
- Attention aux contenus viraux en période électorale
- La loi française punit la diffusion de deepfakes malveillants (jusqu''à 2 ans de prison et 60 000 € d''amende)', 'text', 12, 1),

(m3_id, 'Bulles de filtre et manipulation algorithmique',
'## Bulles de filtre et manipulation algorithmique

### Qu''est-ce qu''une bulle de filtre ?

Le concept de **bulle de filtre** (filter bubble) a été théorisé par Eli Pariser en 2011. Il décrit un phénomène où les algorithmes de recommandation vous enferment dans un univers informationnel personnalisé, en ne vous montrant que du contenu qui confirme vos croyances existantes.

### Comment fonctionnent les algorithmes de recommandation ?

Les plateformes (YouTube, TikTok, Instagram, Twitter/X) utilisent des algorithmes qui optimisent un objectif simple : **maximiser le temps passé sur la plateforme**.

Pour cela, ils analysent :
- Ce que vous regardez et combien de temps
- Ce sur quoi vous cliquez
- Ce que vous aimez, commentez, partagez
- Ce que des profils similaires au vôtre regardent

Ils en déduisent ce qui a le plus de chances de **capter votre attention** — et c''est ce qu''ils vous montrent.

### Le problème : l''attention est captée par l''émotion

Les études montrent que le contenu qui génère le plus d''engagement est celui qui provoque des **émotions fortes** : indignation, peur, colère, surprise. L''algorithme apprend donc à vous montrer du contenu de plus en plus extrême ou émotionnel.

> **Étude interne de Facebook (2021, Frances Haugen) :** les chercheurs de Meta ont montré que l''algorithme d''Instagram aggravait les troubles de l''image corporelle chez 32 % des adolescentes. La direction a choisi de ne rien changer.

### La radicalisation algorithmique

Le mécanisme est progressif :

1. Vous regardez une vidéo sur un sujet polémique
2. L''algorithme vous recommande une vidéo un peu plus extrême
3. Vous la regardez (par curiosité ou accord)
4. L''algorithme vous recommande du contenu encore plus radical
5. En quelques semaines, vous êtes dans un « tunnel » de contenu extrémiste

Ce phénomène a été documenté pour la radicalisation politique (extrême droite, extrême gauche), les théories du complot, les mouvements anti-vaccination et les troubles alimentaires.

### Comment sortir de sa bulle ?

- **Diversifiez vos sources** : lisez des médias avec des lignes éditoriales différentes
- **Désactivez les recommandations personnalisées** quand c''est possible
- **Utilisez le mode navigation privée** pour chercher des sujets sensibles
- **Suivez des comptes avec des opinions variées** sur les réseaux sociaux
- **Prenez conscience du mécanisme** : quand un contenu vous indigne, demandez-vous si l''algorithme ne cherche pas à exploiter cette émotion
- **Limitez votre temps** sur les plateformes à algorithme de recommandation

### Le cadre légal

Le **DSA (Digital Services Act)** européen, entré en vigueur en 2024, impose aux très grandes plateformes :
- La transparence sur le fonctionnement de leurs algorithmes
- La possibilité de refuser le profilage pour les recommandations
- Des audits indépendants des risques systémiques
- La protection des mineurs contre les contenus dangereux', 'text', 13, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q3_id, m3_id, 'Quiz : Deepfakes et désinformation', 'Testez votre capacité à identifier les manipulations numériques.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q3_id, 'Qu''est-ce qu''un deepfake ?',
 'multiple_choice',
 '[{"id":"a","text":"Un virus informatique très sophistiqué","isCorrect":false},{"id":"b","text":"Un contenu audiovisuel généré ou modifié par IA pour tromper","isCorrect":true},{"id":"c","text":"Un type de chiffrement avancé","isCorrect":false},{"id":"d","text":"Un réseau social clandestin","isCorrect":false}]',
 'Un deepfake est un contenu (vidéo, audio, image) créé ou modifié par IA pour faire croire qu''une personne dit ou fait quelque chose qu''elle n''a pas fait.', 1),

(q3_id, 'Les algorithmes de recommandation cherchent à maximiser...',
 'multiple_choice',
 '[{"id":"a","text":"La qualité de l''information","isCorrect":false},{"id":"b","text":"Le temps que vous passez sur la plateforme","isCorrect":true},{"id":"c","text":"Votre bien-être mental","isCorrect":false},{"id":"d","text":"La diversité des opinions","isCorrect":false}]',
 'Les algorithmes de recommandation optimisent l''engagement (temps passé, clics, interactions) car c''est ce qui génère des revenus publicitaires.', 2),

(q3_id, 'La radicalisation algorithmique est un phénomène prouvé par des études.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":true},{"id":"b","text":"Faux","isCorrect":false}]',
 'De nombreuses études, dont les Facebook Papers (Frances Haugen, 2021), ont documenté comment les algorithmes de recommandation peuvent contribuer à la radicalisation.', 3),

(q3_id, 'Quel règlement européen impose la transparence des algorithmes aux grandes plateformes ?',
 'multiple_choice',
 '[{"id":"a","text":"Le RGPD","isCorrect":false},{"id":"b","text":"L''AI Act","isCorrect":false},{"id":"c","text":"Le DSA (Digital Services Act)","isCorrect":true},{"id":"d","text":"La directive ePrivacy","isCorrect":false}]',
 'Le DSA, entré en vigueur en 2024, impose notamment la transparence algorithmique et la possibilité de refuser le profilage.', 4),

(q3_id, 'Quel est le meilleur indice pour détecter un deepfake vidéo ?',
 'multiple_choice',
 '[{"id":"a","text":"La vidéo est en haute définition","isCorrect":false},{"id":"b","text":"Des incohérences dans le clignement des yeux, les contours du visage ou la synchronisation labiale","isCorrect":true},{"id":"c","text":"La vidéo dure plus de 5 minutes","isCorrect":false},{"id":"d","text":"La personne parle une langue étrangère","isCorrect":false}]',
 'Les deepfakes présentent souvent des artefacts visuels : clignement irrégulier, contours flous, lèvres mal synchronisées.', 5);

END $$;

-- ============================================================================
-- SENIORS — Course 1: "Le numérique en confiance"
-- ============================================================================
DO $$
DECLARE
  c_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c_id, NULL, NULL,
  'Le numérique en confiance',
  'Apprenez à naviguer sur Internet, reconnaître les arnaques et protéger vos informations personnelles en toute sérénité.',
  'seniors', 'Heart', '#F59E0B', 'Premiers pas', true, true, 1);

-- Module 1: Naviguer sur Internet en sécurité
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c_id,
  'Naviguer sur Internet en sécurité',
  'Les bases pour comprendre Internet et créer vos comptes en ligne en toute sécurité.',
  'Globe', 20, 'facile', 'Premiers pas', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'Les bases d''Internet',
'## Les bases d''Internet

### Qu''est-ce qu''Internet ?

Internet est un immense réseau qui relie des milliards d''ordinateurs et de téléphones entre eux dans le monde entier. Quand vous consultez un site web, votre appareil envoie une demande à un autre ordinateur (appelé serveur) qui lui renvoie les informations à afficher.

### Le navigateur : votre porte d''entrée

Le **navigateur** est le logiciel que vous utilisez pour accéder aux sites web. Les plus courants sont :

- **Google Chrome** (le plus utilisé)
- **Safari** (sur iPhone et Mac)
- **Firefox** (respectueux de la vie privée)
- **Microsoft Edge** (sur les PC Windows)

C''est dans le navigateur que vous tapez l''adresse d''un site ou que vous faites vos recherches.

### Les adresses web (URL)

L''adresse d''un site web, c''est comme son adresse postale. Par exemple : `https://www.ameli.fr`

**Comment vérifier qu''un site est sûr :**
- L''adresse commence par **https://** (le « s » signifie sécurisé)
- Un petit **cadenas** apparaît à gauche de l''adresse
- L''adresse correspond bien au site officiel (attention aux fautes : `amelii.fr` n''est pas le vrai site)

> **Conseil important :** quand vous voulez accéder à votre banque, à Ameli ou aux impôts, **tapez toujours l''adresse vous-même** dans la barre d''adresse. Ne cliquez jamais sur un lien reçu par email ou SMS.

### Les moteurs de recherche

Un **moteur de recherche** est un outil qui vous aide à trouver des informations sur Internet. Le plus connu est **Google**, mais il en existe d''autres :

- **Qwant** (français, respectueux de la vie privée)
- **Bing** (de Microsoft)

Pour faire une recherche, tapez simplement votre question dans la barre de recherche. Par exemple : « horaires pharmacie près de chez moi ».

### Quelques termes utiles

- **Lien (ou lien hypertexte)** : un texte ou une image sur lesquels vous pouvez cliquer pour aller vers une autre page
- **Télécharger** : copier un fichier d''Internet vers votre appareil
- **Mot de passe** : un code secret qui protège votre compte
- **Wi-Fi** : la connexion sans fil à Internet chez vous ou dans les lieux publics', 'text', 10, 1),

(m1_id, 'Créer et gérer ses comptes en ligne',
'## Créer et gérer ses comptes en ligne

### Les comptes essentiels

Certains services en ligne sont très utiles au quotidien. Voici les principaux et comment les utiliser en sécurité.

**Votre adresse email**
C''est votre identité numérique. Elle sert à créer tous vos autres comptes. Si vous n''en avez pas encore, vous pouvez en créer une gratuitement sur :
- **Gmail** (Google) : mail.google.com
- **Outlook** (Microsoft) : outlook.com
- **Yahoo Mail** : mail.yahoo.com

**Les services publics**
- **Ameli.fr** : vos remboursements de santé
- **Impots.gouv.fr** : votre déclaration d''impôts
- **FranceConnect** : un identifiant unique pour accéder à de nombreux services publics (très pratique !)

**Les achats en ligne**
Si vous achetez sur Internet, privilégiez les sites connus et vérifiez toujours que l''adresse commence par `https://`.

### Créer un mot de passe sûr

Pour chaque compte, vous avez besoin d''un mot de passe. Voici comment en créer un bon :

**La méthode de la phrase**
Choisissez une phrase que vous seul connaissez et ajoutez des chiffres :
- `Mon-petit-chat-a-3-pattes!` → excellent mot de passe
- `J''aime-le-jardin-en-mai-42` → très bon aussi

**Les règles importantes :**
- **Ne jamais utiliser** votre date de naissance, votre prénom ou « 1234 »
- **Un mot de passe différent** pour chaque compte important (banque, email, impôts)
- **Ne jamais donner** votre mot de passe à quelqu''un, même un proche ou un « technicien » au téléphone
- **Écrire ses mots de passe** dans un carnet que vous gardez en lieu sûr chez vous (jamais à côté de l''ordinateur)

### FranceConnect : votre ami

**FranceConnect** est un service de l''État qui vous permet de vous connecter à de nombreux sites publics avec un seul identifiant (celui de vos impôts ou d''Ameli, par exemple).

C''est **sûr, officiel et gratuit**. Quand vous voyez le bouton « Se connecter avec FranceConnect » sur un site gouvernemental, n''hésitez pas à l''utiliser.

> **Astuce :** si vous êtes perdu(e), n''hésitez pas à demander de l''aide à un proche ou à vous rendre dans un **Espace France Services** près de chez vous. Des conseillers peuvent vous accompagner gratuitement.', 'text', 10, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : Naviguer en sécurité', 'Vérifiez vos connaissances sur la navigation Internet.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Comment savoir si un site web est sécurisé ?',
 'multiple_choice',
 '[{"id":"a","text":"Le site a de belles couleurs","isCorrect":false},{"id":"b","text":"L''adresse commence par https:// et un cadenas apparaît","isCorrect":true},{"id":"c","text":"Le site se charge rapidement","isCorrect":false}]',
 'Le « https » et le cadenas indiquent que la connexion entre votre appareil et le site est chiffrée (sécurisée).', 1),

(q1_id, 'Quel est le meilleur mot de passe ?',
 'multiple_choice',
 '[{"id":"a","text":"Votre date de naissance : 15061945","isCorrect":false},{"id":"b","text":"1234","isCorrect":false},{"id":"c","text":"Mon-jardin-fleurit-en-mai!3","isCorrect":true}]',
 'Une phrase longue avec des chiffres et des caractères spéciaux est beaucoup plus sûre qu''une date de naissance ou une suite de chiffres.', 2),

(q1_id, 'FranceConnect est un service officiel et gratuit de l''État.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":true},{"id":"b","text":"Faux","isCorrect":false}]',
 'FranceConnect est bien un service officiel et gratuit qui permet de se connecter à de nombreux sites publics avec un seul identifiant.', 3);

-- Module 2: Reconnaître les arnaques
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c_id,
  'Reconnaître les arnaques',
  'Apprenez à identifier les arnaques les plus courantes et à réagir si vous en êtes victime.',
  'AlertTriangle', 20, 'facile', 'Sécurité', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Les arnaques les plus fréquentes',
'## Les arnaques les plus fréquentes

Les escrocs ciblent particulièrement les personnes moins familières avec le numérique. Voici les arnaques les plus courantes et comment les reconnaître.

### Le faux SMS de livraison

Vous recevez un SMS : « Votre colis est en attente. Payez 1,99 € de frais pour le recevoir » avec un lien.

**C''est une arnaque si :**
- Vous n''attendez aucun colis
- On vous demande de payer par lien SMS
- L''expéditeur est un numéro inconnu

**La règle :** La Poste et les transporteurs ne demandent **jamais** de paiement par SMS.

### Le faux appel de Microsoft ou de votre banque

Le téléphone sonne. Une personne se présente comme un technicien Microsoft ou un conseiller de votre banque. Elle vous dit que votre ordinateur est infecté ou qu''un paiement suspect a eu lieu sur votre compte.

**C''est une arnaque si :**
- On vous demande d''installer un logiciel ou de donner un code
- On vous demande votre mot de passe ou code de carte bancaire
- On vous met sous pression (« il faut agir tout de suite »)

> **Règle d''or :** Microsoft ne vous appellera **jamais**. Votre banque ne vous demandera **jamais** votre code par téléphone. En cas de doute, raccrochez et appelez vous-même le numéro officiel de votre banque (celui inscrit sur votre carte bancaire).

### L''email du prince nigérian (et ses variantes modernes)

Un email vous promet une grosse somme d''argent si vous aidez quelqu''un à transférer des fonds. Ou encore : vous avez « gagné » à une loterie à laquelle vous n''avez jamais participé.

**Variante moderne :** un email d''un « notaire » qui vous informe d''un héritage d''un lointain parent.

**La règle :** si c''est trop beau pour être vrai, c''est faux.

### Le faux RIB par email

Un artisan, un bailleur ou un proche vous envoie un email avec un RIB pour un paiement. Mais l''email a été intercepté et le RIB a été remplacé par celui d''un escroc.

**Comment se protéger :**
- Avant un premier virement, **appelez la personne** pour confirmer le RIB
- Méfiez-vous si on vous dit « j''ai changé de banque, voici mon nouveau RIB »

### L''arnaque aux sentiments

Sur les réseaux sociaux ou les sites de rencontre, une personne charmante entre en contact avec vous. Après quelques semaines d''échanges, elle vous demande de l''argent pour une urgence.

**Signaux d''alarme :**
- La personne est toujours à l''étranger
- Elle refuse les appels vidéo
- Elle finit toujours par demander de l''argent', 'text', 10, 1),

(m2_id, 'Que faire si on a été victime',
'## Que faire si on a été victime d''une arnaque

Si vous pensez avoir été victime d''une arnaque, ne culpabilisez pas. Cela arrive à des millions de personnes chaque année, y compris des personnes très à l''aise avec le numérique. L''important est de réagir vite.

### Les premiers gestes immédiats

**Si vous avez donné vos coordonnées bancaires :**
1. **Appelez votre banque immédiatement** (le numéro est sur votre carte bancaire)
2. Demandez le **blocage de votre carte**
3. Signalez les opérations frauduleuses pour obtenir un **remboursement**
4. Votre banque est obligée de vous rembourser les opérations non autorisées (sauf négligence grave de votre part)

**Si vous avez donné votre mot de passe :**
1. **Changez immédiatement** le mot de passe du compte concerné
2. Si vous utilisez le même mot de passe ailleurs, **changez-le partout**
3. Activez la **double vérification** si disponible

**Si quelqu''un a pris le contrôle de votre ordinateur :**
1. **Éteignez votre ordinateur** en maintenant le bouton d''alimentation enfoncé
2. Ne le rallumez qu''après avoir contacté un proche de confiance ou un professionnel
3. **Changez tous vos mots de passe** depuis un autre appareil (téléphone d''un proche, par exemple)

### Déposer plainte

Vous pouvez porter plainte de deux façons :

1. **En ligne** sur [pre-plainte-en-ligne.gouv.fr](https://www.pre-plainte-en-ligne.gouv.fr) — un rendez-vous vous sera proposé au commissariat
2. **Au commissariat ou à la gendarmerie** — apportez tous les documents (emails, SMS, relevés bancaires)

### Signaler l''arnaque

- **Cybermalveillance.gouv.fr** : le site officiel d''assistance aux victimes de cybermalveillance. Vous y trouverez de l''aide personnalisée
- **Signal-spam.fr** : pour signaler les emails frauduleux
- **33700** : envoyez le SMS frauduleux par transfert au 33700 pour le signaler

### Demander de l''aide

- **Info Escroqueries** : appelez le **0 805 805 817** (appel gratuit, du lundi au vendredi de 9h à 18h30)
- **Votre mairie** : de nombreuses communes proposent des ateliers numériques gratuits
- **Les Espaces France Services** : des conseillers peuvent vous aider gratuitement
- **Un proche de confiance** : n''hésitez pas à en parler à votre famille ou à vos amis

> **Le plus important :** n''ayez pas honte. Les escrocs sont des professionnels qui utilisent des techniques de manipulation psychologique très sophistiquées. Signaler l''arnaque aide à protéger les autres.', 'text', 10, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : Reconnaître les arnaques', 'Sauriez-vous reconnaître une arnaque ?', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'Vous recevez un SMS disant que votre colis attend avec 1,99 € à payer. Que faites-vous ?',
 'multiple_choice',
 '[{"id":"a","text":"Vous cliquez sur le lien et payez","isCorrect":false},{"id":"b","text":"Vous ignorez le SMS car les transporteurs ne demandent jamais de paiement par SMS","isCorrect":true},{"id":"c","text":"Vous répondez au SMS pour demander des détails","isCorrect":false}]',
 'Les transporteurs ne demandent jamais de paiement par SMS. C''est toujours une arnaque pour récupérer vos coordonnées bancaires.', 1),

(q2_id, 'Votre banque peut vous demander votre code de carte bancaire par téléphone.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'Votre banque ne vous demandera jamais votre code confidentiel par téléphone, email ou SMS. C''est toujours une arnaque.', 2),

(q2_id, 'Quel numéro gratuit pouvez-vous appeler si vous êtes victime d''une arnaque en ligne ?',
 'multiple_choice',
 '[{"id":"a","text":"Le 15","isCorrect":false},{"id":"b","text":"Le 0 805 805 817 (Info Escroqueries)","isCorrect":true},{"id":"c","text":"Le 112","isCorrect":false}]',
 'Info Escroqueries (0 805 805 817) est le numéro gratuit dédié aux victimes d''escroquerie, disponible du lundi au vendredi.', 3);

-- Module 3: Protéger ses informations personnelles
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c_id,
  'Protéger ses informations personnelles',
  'Les réglages essentiels pour protéger vos données personnelles au quotidien.',
  'Shield', 15, 'facile', 'Sécurité', false, false, 3);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m3_id, 'Ce qu''il ne faut jamais communiquer',
'## Ce qu''il ne faut jamais communiquer

### Les informations à protéger absolument

Certaines informations sont comme les clés de votre maison : si quelqu''un les obtient, il peut accéder à votre vie privée et à votre argent.

**Ne communiquez JAMAIS :**

- **Votre code de carte bancaire** (les 4 chiffres) — à personne, jamais, sous aucun prétexte
- **Le code à 3 chiffres au dos de votre carte** (appelé CVV) — seulement sur un site de paiement sécurisé quand VOUS faites un achat
- **Votre mot de passe** — ni par téléphone, ni par email, ni à un « technicien »
- **Votre numéro de sécurité sociale** — sauf sur les sites officiels (Ameli, CAF)
- **Une copie de votre carte d''identité** — sauf si c''est strictement nécessaire (banque, administration)
- **Votre RIB** — seulement aux personnes ou organismes que vous connaissez

### L''ingénierie sociale : quand on vous manipule

Les escrocs ne forcent pas votre serrure : ils vous convainquent de leur donner la clé. C''est ce qu''on appelle l''**ingénierie sociale**.

**Techniques courantes :**

- **L''urgence** : « Il faut agir maintenant sinon votre compte sera fermé ! »
- **L''autorité** : « Je suis l''inspecteur Dupont de la brigade financière »
- **La sympathie** : « Je suis un technicien qui veut vous aider »
- **La peur** : « Votre ordinateur est infecté par un virus dangereux »

> **Règle d''or :** quand quelqu''un vous met la pression pour obtenir des informations, c''est un signal d''alarme. Prenez toujours le temps de réfléchir. Un vrai professionnel ne vous pressera jamais.

### Les bons réflexes

- **Au téléphone** : si quelqu''un prétend être de votre banque ou d''un service officiel, dites « je rappellerai moi-même » et raccrochez. Appelez ensuite le numéro officiel
- **Par email** : ne répondez jamais à un email qui vous demande des informations personnelles. Allez directement sur le site officiel
- **En personne** : ne laissez personne regarder votre écran quand vous tapez votre code ou mot de passe
- **Sur papier** : détruisez (déchirez en petits morceaux) les documents contenant des informations personnelles avant de les jeter', 'text', 8, 1),

(m3_id, 'Les réglages essentiels de sécurité',
'## Les réglages essentiels de sécurité

Voici les réglages simples mais importants à faire sur votre téléphone et vos comptes. Si besoin, demandez à un proche de vous aider.

### Sur votre téléphone

**1. Mettre un code de verrouillage**

Si quelqu''un trouve ou vole votre téléphone, le code de verrouillage l''empêche d''accéder à vos informations.

- **iPhone** : Réglages → Face ID et code → Activer le code (choisissez un code à 6 chiffres)
- **Android** : Paramètres → Sécurité → Verrouillage de l''écran → choisissez un code PIN

> **Conseil :** évitez les codes trop simples comme 000000 ou 123456. Choisissez un code que vous seul connaissez.

**2. Activer les mises à jour automatiques**

Les mises à jour corrigent les problèmes de sécurité de votre téléphone.

- **iPhone** : Réglages → Général → Mise à jour logicielle → Mises à jour automatiques → Activé
- **Android** : Paramètres → Système → Mise à jour du système → vérifiez régulièrement

**3. Vérifier les permissions des applications**

Certaines applications demandent l''accès à votre caméra, votre micro ou vos contacts alors qu''elles n''en ont pas besoin.

- **iPhone** : Réglages → Confidentialité et sécurité → regardez chaque catégorie
- **Android** : Paramètres → Applications → choisissez une app → Autorisations

### Sur votre email

**Activer la double vérification**

La double vérification (ou vérification en deux étapes) ajoute une protection supplémentaire. Quand vous vous connectez, on vous envoie un code par SMS en plus de votre mot de passe.

- **Gmail** : Gérer votre compte Google → Sécurité → Validation en deux étapes → Activer
- **Outlook** : Compte Microsoft → Sécurité → Vérification en deux étapes

### Sur vos comptes en ligne

**Vérifier l''activité de connexion**

La plupart des services vous permettent de voir qui s''est connecté à votre compte :

- **Gmail** : en bas de la page Gmail, cliquez sur « Détails » → vous verrez les dernières connexions
- **Facebook** : Paramètres → Sécurité et connexion → Où vous êtes connecté

Si vous voyez une connexion que vous ne reconnaissez pas, changez votre mot de passe immédiatement.

### En résumé : les 4 gestes essentiels

1. **Code PIN** sur votre téléphone
2. **Mises à jour** automatiques activées
3. **Double vérification** sur votre email
4. **Mots de passe** différents pour chaque compte important

> **N''oubliez pas :** si tout cela vous semble compliqué, demandez de l''aide à un proche ou rendez-vous dans un Espace France Services. Vous n''êtes pas seul(e).', 'text', 7, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q3_id, m3_id, 'Quiz : Protéger ses informations', 'Vérifiez vos connaissances sur la protection de vos données.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q3_id, 'Quelqu''un vous appelle en disant être de votre banque et vous demande votre code de carte. Que faites-vous ?',
 'multiple_choice',
 '[{"id":"a","text":"Vous donnez le code car c''est votre banque","isCorrect":false},{"id":"b","text":"Vous raccrochez et rappelez le numéro officiel de votre banque","isCorrect":true},{"id":"c","text":"Vous donnez seulement les 2 premiers chiffres","isCorrect":false}]',
 'Votre banque ne vous demandera jamais votre code par téléphone. Raccrochez et rappelez vous-même le numéro officiel.', 1),

(q3_id, 'Il est important de mettre un code de verrouillage sur son téléphone.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":true},{"id":"b","text":"Faux","isCorrect":false}]',
 'Le code de verrouillage protège toutes vos informations en cas de perte ou de vol de votre téléphone.', 2),

(q3_id, 'Qu''est-ce que la double vérification ?',
 'multiple_choice',
 '[{"id":"a","text":"Avoir deux mots de passe pour le même compte","isCorrect":false},{"id":"b","text":"Recevoir un code par SMS en plus de son mot de passe quand on se connecte","isCorrect":true},{"id":"c","text":"Vérifier son email deux fois par jour","isCorrect":false}]',
 'La double vérification envoie un code supplémentaire (par SMS ou application) pour confirmer que c''est bien vous qui vous connectez.', 3);

END $$;

-- ============================================================================
-- ORGANISATION — Course 1: "IA et prise de décision en entreprise"
-- ============================================================================
DO $$
DECLARE
  c_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c_id, NULL, NULL,
  'IA et prise de décision en entreprise',
  'Maîtrisez l''intégration de l''IA dans vos processus de décision, comprenez les biais et mettez en place une gouvernance adaptée.',
  'organisation', 'Brain', '#0EA5E9', 'IA & Décision', true, true, 1);

-- Module 1: L'IA dans la chaîne de décision
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c_id,
  'L''IA dans la chaîne de décision',
  'Cartographie des usages, risques de désapprentissage et rituels de décision avec l''IA.',
  'GitBranch', 30, 'moyen', 'IA & Décision', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'Cartographie des usages IA en entreprise',
'## Cartographie des usages IA en entreprise

### Aide à la décision vs automatisation : une distinction cruciale

Il est essentiel de distinguer deux modes d''utilisation de l''IA en entreprise :

**L''aide à la décision (decision support)**
L''IA fournit des analyses, des recommandations ou des alertes, mais **l''humain prend la décision finale**. L''IA est un conseiller, pas un décideur.

Exemples :
- Analyse prédictive des ventes pour orienter la stratégie commerciale
- Scoring de leads pour prioriser les prospects
- Détection d''anomalies dans les données financières
- Synthèse documentaire pour préparer un dossier juridique

**L''automatisation (decision automation)**
L''IA prend la décision et l''exécute **sans intervention humaine**. L''humain n''intervient qu''en cas d''exception.

Exemples :
- Filtrage automatique des spams
- Tarification dynamique (pricing)
- Détection de fraude bancaire avec blocage automatique
- Tri automatique de CV (première sélection)

> **Point clé :** plus la décision a d''impact sur des personnes, plus la supervision humaine est nécessaire. Le RGPD (article 22) et l''AI Act imposent une intervention humaine pour les décisions significatives.

### Où l''IA crée de la valeur

| Fonction | Usage IA | Valeur |
|----------|----------|--------|
| **RH** | Présélection de CV, analyse de sentiments | Gain de temps, standardisation |
| **Finance** | Détection de fraude, prévisions | Réactivité, précision |
| **Juridique** | Analyse contractuelle, recherche jurisprudentielle | Exhaustivité |
| **Marketing** | Segmentation, personnalisation | Pertinence |
| **Production** | Maintenance prédictive | Réduction des coûts |

### Où l''IA crée des risques

- **Décisions opaques** : si personne ne comprend pourquoi l''IA a recommandé X
- **Biais amplifiés** : si les données historiques sont biaisées, l''IA amplifie ces biais
- **Dépendance excessive** : si l''équipe cesse de réfléchir par elle-même
- **Responsabilité diluée** : « c''est l''IA qui a décidé » n''est pas une excuse juridiquement valable

### La matrice de décision IA

Avant de déployer un système IA, évaluez chaque cas selon deux axes :

1. **Impact de la décision** : faible (recommandation de contenu) → fort (recrutement, crédit, santé)
2. **Complexité du contexte** : faible (données structurées, règles claires) → fort (situations ambiguës, éthiques)

Plus l''impact et la complexité sont élevés, plus la supervision humaine doit être forte.', 'text', 10, 1),

(m1_id, 'Le risque de désapprentissage',
'## Le risque de désapprentissage

### Quand l''IA rend l''humain moins compétent

Le **désapprentissage** (deskilling) est un phénomène où les compétences humaines s''atrophient à force de déléguer des tâches à l''IA. C''est l''un des risques les moins discutés mais les plus importants.

### Des exemples concrets

**Aviation**
L''automatisation des cockpits a rendu les pilotes dépendants du pilote automatique. Lors de situations d''urgence nécessitant un pilotage manuel, certains accidents ont été attribués à la perte de compétences de base. Air France Rio-Paris (2009) est un cas d''étude : les pilotes n''ont pas su interpréter les données quand le pilote automatique s''est désengagé.

**Médecine**
Des études montrent que les radiologues utilisant systématiquement l''IA pour la détection de tumeurs deviennent moins performants quand l''IA n''est pas disponible. Leur « œil clinique » se dégrade.

**Finance**
Des analystes financiers s''appuyant exclusivement sur les modèles prédictifs IA perdent leur capacité d''analyse fondamentale et de détection intuitive d''anomalies.

> **Le paradoxe :** l''IA est conçue pour aider les experts, mais elle peut les rendre moins experts.

### Pourquoi ça arrive ?

Trois mécanismes psychologiques :

1. **Le biais d''automatisation** : tendance à faire confiance à l''IA même quand elle a tort, simplement parce qu''elle est « technologique »
2. **L''atrophie cognitive** : comme un muscle qu''on n''utilise plus, les compétences non exercées se dégradent
3. **L''illusion de compétence** : l''utilisateur pense maîtriser un sujet car l''IA lui fournit des réponses, mais il ne pourrait pas les produire seul

### Comment prévenir le désapprentissage ?

**Au niveau individuel :**
- Pratiquer régulièrement **sans IA** (exercices, cas pratiques)
- Utiliser l''IA comme **vérification** plutôt que comme source primaire
- Se demander « aurais-je pu arriver à cette conclusion seul(e) ? »

**Au niveau organisationnel :**
- Instaurer des **périodes sans IA** pour certaines tâches critiques
- Maintenir des **formations continues** sur les compétences de base
- Évaluer régulièrement les compétences **indépendamment de l''IA**
- Documenter le **raisonnement humain** derrière les décisions assistées par IA', 'text', 10, 2),

(m1_id, 'Rituels de décision avec l''IA',
'## Rituels de décision avec l''IA

### Le principe du Human-in-the-Loop

Le **Human-in-the-Loop** (HITL) signifie qu''un humain intervient à un moment critique du processus de décision assisté par IA. Ce n''est pas une simple formalité : c''est un rôle actif de supervision, de validation et de remise en question.

### Trois modèles d''intégration

**1. Human-in-the-Loop (supervision active)**
L''IA propose, l''humain dispose. Chaque recommandation IA est examinée et validée (ou rejetée) par un humain compétent.
→ Pour les décisions à fort impact (recrutement, crédit, diagnostic)

**2. Human-on-the-Loop (supervision par exception)**
L''IA décide dans les cas courants, l''humain intervient pour les cas limites ou les exceptions signalées par le système.
→ Pour les décisions à impact modéré et volume élevé (détection de fraude, modération de contenu)

**3. Human-out-of-the-Loop (automatisation totale)**
L''IA décide et exécute sans intervention humaine.
→ Uniquement pour les décisions à faible impact et réversibles (filtrage de spam, recommandation de contenu)

### Les rituels à mettre en place

**1. Le comité de validation IA (hebdomadaire)**
- Examiner les décisions IA significatives de la semaine
- Identifier les cas où l''IA s''est trompée (faux positifs/négatifs)
- Ajuster les seuils de confiance

**2. Le red team IA (mensuel)**
Un groupe tente délibérément de mettre le système IA en défaut :
- Soumettre des cas limites
- Tester les biais
- Vérifier la robustesse des garde-fous

**3. L''audit de divergence (trimestriel)**
Comparer les décisions IA avec les décisions qu''auraient prises des experts humains sur un échantillon. Mesurer les écarts et comprendre pourquoi.

### Le framework DECIDE pour l''IA

Pour chaque décision assistée par IA, appliquez ce framework :

- **D**éfinir : quelle est la question précise posée à l''IA ?
- **É**valuer : la réponse de l''IA est-elle cohérente avec le contexte ?
- **C**ontester : un avocat du diable remettrait-il en cause cette recommandation ?
- **I**nformer : les parties prenantes sont-elles informées de l''utilisation de l''IA ?
- **D**ocumenter : le raisonnement est-il tracé pour audit ultérieur ?
- **E**xécuter : mettre en œuvre la décision avec un plan de suivi

> **Principe fondamental :** l''IA ne prend pas de décision, elle produit des recommandations. La responsabilité de la décision reste humaine — juridiquement et éthiquement.', 'text', 10, 3);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : L''IA dans la décision', 'Testez votre compréhension de l''IA dans les processus de décision.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Quelle est la différence entre aide à la décision et automatisation ?',
 'multiple_choice',
 '[{"id":"a","text":"Il n''y a aucune différence","isCorrect":false},{"id":"b","text":"L''aide à la décision laisse l''humain décider, l''automatisation fait décider l''IA seule","isCorrect":true},{"id":"c","text":"L''aide à la décision est plus rapide","isCorrect":false},{"id":"d","text":"L''automatisation est toujours interdite par la loi","isCorrect":false}]',
 'L''aide à la décision fournit des recommandations à l''humain, tandis que l''automatisation délègue la décision entière à l''IA.', 1),

(q1_id, 'Qu''est-ce que le désapprentissage (deskilling) lié à l''IA ?',
 'multiple_choice',
 '[{"id":"a","text":"L''IA perd ses données d''entraînement","isCorrect":false},{"id":"b","text":"Les compétences humaines s''atrophient quand on délègue trop à l''IA","isCorrect":true},{"id":"c","text":"L''IA apprend de mauvaises pratiques","isCorrect":false},{"id":"d","text":"Les employés refusent d''utiliser l''IA","isCorrect":false}]',
 'Le désapprentissage survient quand les humains cessent de pratiquer certaines compétences à force de les déléguer à l''IA.', 2),

(q1_id, 'Dans le modèle Human-on-the-Loop, l''humain valide chaque décision de l''IA.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'Dans le Human-on-the-Loop, l''IA décide dans les cas courants et l''humain n''intervient que pour les exceptions. C''est le Human-in-the-Loop qui implique une validation systématique.', 3),

(q1_id, 'Qu''est-ce qu''un red team IA ?',
 'multiple_choice',
 '[{"id":"a","text":"L''équipe de développement de l''IA","isCorrect":false},{"id":"b","text":"Un groupe qui teste délibérément les failles et biais du système IA","isCorrect":true},{"id":"c","text":"L''équipe de support technique","isCorrect":false},{"id":"d","text":"Les utilisateurs finaux de l''IA","isCorrect":false}]',
 'Un red team IA est un groupe qui tente de mettre le système en défaut pour identifier ses vulnérabilités et biais.', 4),

(q1_id, 'La responsabilité juridique d''une décision assistée par IA incombe à l''IA elle-même.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'L''IA n''a pas de personnalité juridique. La responsabilité d''une décision reste humaine, même si elle est assistée par IA.', 5);

-- Module 2: Biais et explicabilité
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c_id,
  'Biais et explicabilité',
  'Identifiez les biais dans vos données d''entreprise et comprenez vos obligations d''explicabilité.',
  'Search', 25, 'moyen', 'IA & Décision', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Les biais dans vos données d''entreprise',
'## Les biais dans vos données d''entreprise

### Vos données historiques ne sont pas neutres

Les données de votre entreprise reflètent des décennies de décisions humaines — avec leurs biais conscients et inconscients. Quand vous entraînez un modèle IA sur ces données, il apprend et amplifie ces biais.

### Exemples par fonction

**Ressources humaines**
Si votre entreprise a historiquement recruté plus d''hommes pour les postes techniques, un modèle IA de présélection de CV apprendra que « homme + poste technique = bon profil ». Il reproduira cette discrimination, même involontaire.

**Biais identifiables :**
- Sous-représentation de certains profils dans les recrutements passés
- Corrélation entre genre/origine et évaluations de performance (biais d''évaluateur)
- Écarts de rémunération historiques encodés comme « normaux »

**Ventes et marketing**
Vos données clients reflètent vos cibles historiques. Un modèle de scoring client entraîné sur ces données ignorera des segments de marché que vous n''avez jamais ciblés — non pas parce qu''ils ne sont pas rentables, mais parce qu''ils sont absents de vos données.

**Juridique**
L''analyse contractuelle par IA peut reproduire des interprétations biaisées si elle est entraînée sur un corpus de décisions internes non représentatif.

### Comment détecter les biais ?

**1. Audit des données**
Avant de déployer un modèle, analysez la composition de vos données :
- Quelles populations sont représentées ? Lesquelles sont sous-représentées ?
- Y a-t-il des corrélations entre variables protégées (genre, âge, origine) et variables de résultat ?

**2. Test de disparate impact**
Vérifiez si les résultats du modèle affectent de manière disproportionnée certains groupes. La règle des 4/5 (ou « 80% rule ») est un test simple : si le taux de sélection d''un groupe est inférieur à 80 % du taux du groupe le plus favorisé, il y a un impact disproportionné.

**3. Analyse de sensibilité**
Modifiez les variables protégées (genre, âge) dans les données d''entrée et observez si la prédiction change. Si oui, le modèle utilise directement ou indirectement ces variables.

> **Point juridique :** en droit européen, l''utilisation de données personnelles sensibles (origine, religion, santé, orientation sexuelle) est en principe interdite. Mais des biais indirects (via le code postal, le prénom, l''école) peuvent contourner cette interdiction.', 'text', 12, 1),

(m2_id, 'Explicabilité et droit à l''explication',
'## Explicabilité et droit à l''explication

### Pourquoi l''explicabilité est cruciale

Un système IA qui prend ou recommande des décisions affectant des personnes doit être **explicable** : on doit pouvoir comprendre pourquoi il a produit tel résultat.

### Le cadre juridique

**Article 22 du RGPD — Décision automatisée**

L''article 22 du RGPD donne à toute personne le droit de **ne pas faire l''objet d''une décision fondée exclusivement sur un traitement automatisé** produisant des effets juridiques ou des effets significatifs similaires.

Concrètement, cela signifie :
- Un algorithme ne peut pas **seul** refuser un crédit, rejeter une candidature ou résilier un contrat
- La personne concernée a le droit d''obtenir une **intervention humaine**
- Elle a le droit de connaître la **logique sous-jacente** du traitement

**Exceptions :** la décision automatisée est permise si elle est nécessaire à un contrat, autorisée par la loi, ou basée sur le consentement explicite. Mais même dans ces cas, des garanties s''appliquent.

**AI Act — Obligations de transparence**

L''AI Act européen renforce ces exigences pour les systèmes IA à haut risque :
- **Documentation technique** obligatoire décrivant le fonctionnement du système
- **Logs de fonctionnement** permettant la traçabilité des décisions
- **Information des utilisateurs** sur les capacités et limites du système

### Les niveaux d''explicabilité

**1. Explicabilité globale**
Comprendre comment le modèle fonctionne dans son ensemble : quelles variables sont les plus importantes ? Comment le modèle pondère-t-il les facteurs ?

**2. Explicabilité locale**
Comprendre pourquoi le modèle a pris **cette** décision pour **cette** personne : quels facteurs ont pesé le plus dans ce cas précis ?

### Les outils d''explicabilité

- **SHAP (SHapley Additive exPlanations)** : mesure la contribution de chaque variable à une prédiction
- **LIME (Local Interpretable Model-agnostic Explanations)** : crée un modèle simple localement pour expliquer une prédiction spécifique
- **Tableaux de bord d''explicabilité** : visualisations des facteurs de décision

### En pratique : que doit contenir une explication ?

Quand un collaborateur ou un client demande pourquoi l''IA a pris telle décision, vous devez pouvoir fournir :

1. Les **facteurs principaux** qui ont influencé la décision
2. Le **poids relatif** de chaque facteur
3. Les **données** sur lesquelles la décision s''est appuyée
4. Les **alternatives** envisagées par le modèle
5. La possibilité de **contester** la décision et d''obtenir une révision humaine', 'text', 13, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : Biais et explicabilité', 'Testez vos connaissances sur les biais IA et l''explicabilité.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'Pourquoi un modèle IA de recrutement peut-il être biaisé contre les femmes ?',
 'multiple_choice',
 '[{"id":"a","text":"L''IA est programmée pour être discriminatoire","isCorrect":false},{"id":"b","text":"Les données historiques reflètent des recrutements passés majoritairement masculins","isCorrect":true},{"id":"c","text":"Les femmes ont objectivement de moins bons CV","isCorrect":false},{"id":"d","text":"L''IA ne peut pas lire les CV de femmes","isCorrect":false}]',
 'L''IA apprend des patterns dans les données historiques. Si les recrutements passés étaient biaisés, le modèle reproduit ce biais.', 1),

(q2_id, 'Que dit l''article 22 du RGPD sur les décisions automatisées ?',
 'multiple_choice',
 '[{"id":"a","text":"Toute décision automatisée est interdite","isCorrect":false},{"id":"b","text":"Les personnes ont le droit de ne pas être soumises à une décision exclusivement automatisée ayant des effets significatifs","isCorrect":true},{"id":"c","text":"Les décisions automatisées sont toujours préférables","isCorrect":false},{"id":"d","text":"Seules les entreprises de plus de 250 employés sont concernées","isCorrect":false}]',
 'L''article 22 donne le droit à une intervention humaine et à une explication de la logique sous-jacente.', 2),

(q2_id, 'La règle des 4/5 (80%) est un test pour détecter...',
 'multiple_choice',
 '[{"id":"a","text":"La performance technique d''un modèle IA","isCorrect":false},{"id":"b","text":"L''impact disproportionné d''un système sur certains groupes","isCorrect":true},{"id":"c","text":"La vitesse de traitement des données","isCorrect":false},{"id":"d","text":"Le taux d''erreur acceptable d''une IA","isCorrect":false}]',
 'La règle des 4/5 vérifie si le taux de sélection d''un groupe minoritaire est au moins 80% de celui du groupe majoritaire.', 3),

(q2_id, 'L''explicabilité locale d''un modèle IA consiste à comprendre pourquoi le modèle a pris une décision spécifique pour un cas particulier.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":true},{"id":"b","text":"Faux","isCorrect":false}]',
 'L''explicabilité locale explique les facteurs ayant influencé une décision précise, contrairement à l''explicabilité globale qui décrit le fonctionnement général.', 4);

-- Module 3: Gouvernance de l'IA
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c_id,
  'Gouvernance de l''IA',
  'Mettez en place un comité IA, un registre des traitements et des processus d''audit.',
  'Building', 30, 'expert', 'IA & Décision', false, false, 3);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m3_id, 'Mettre en place un comité IA',
'## Mettre en place un comité IA

### Pourquoi un comité IA ?

L''IA en entreprise soulève des questions qui dépassent la technique : éthique, conformité, impact social, stratégie. Un **comité IA** fournit une gouvernance transversale pour encadrer le déploiement et l''utilisation de l''IA.

### Composition recommandée

Un comité IA efficace est **pluridisciplinaire** :

| Rôle | Profil | Apport |
|------|--------|--------|
| **Sponsor exécutif** | Membre du COMEX | Autorité et budget |
| **Responsable IA / CDO** | Data ou IA leader | Vision technique et stratégique |
| **DPO** | Juriste données | Conformité RGPD et AI Act |
| **Responsable éthique** | Philosophe, sociologue ou juriste | Cadrage éthique |
| **Représentants métier** | Opérationnels (RH, finance, juridique) | Réalité terrain |
| **DSI / RSSI** | Technique et sécurité | Infrastructure et cybersécurité |
| **Représentant des salariés** | CSE | Acceptabilité sociale |

### Mandat et missions

**Missions stratégiques :**
- Définir la **politique IA** de l''organisation (usages autorisés, interdits, encadrés)
- Valider les **cas d''usage** avant déploiement
- Arbitrer les **dilemmes éthiques**

**Missions opérationnelles :**
- Examiner les **analyses d''impact** (AIPD) des projets IA
- Superviser le **registre des traitements IA**
- Organiser les **audits** réguliers

**Missions de veille :**
- Suivre l''évolution **réglementaire** (AI Act, RGPD, NIS2)
- Benchmarker les **bonnes pratiques** du secteur
- Évaluer les **nouvelles technologies** et leur pertinence

### Fonctionnement pratique

- **Fréquence** : réunion mensuelle, avec possibilité de session extraordinaire
- **Documentation** : compte-rendu systématique, registre des décisions
- **Indicateurs** : tableau de bord IA (nombre de systèmes déployés, incidents, demandes d''explication, audits réalisés)
- **Transparence** : communication régulière aux collaborateurs sur les usages IA

> **Bonne pratique :** publiez une **charte IA** interne qui formalise les principes de votre organisation (transparence, équité, supervision humaine, protection des données).', 'text', 10, 1),

(m3_id, 'Registre des traitements IA',
'## Registre des traitements IA

### L''obligation de documentation

L''AI Act européen impose une **documentation rigoureuse** des systèmes IA, proportionnelle à leur niveau de risque. En combinaison avec le registre des traitements RGPD (article 30), les organisations doivent tenir un registre complet de leurs usages IA.

### Classification des risques selon l''AI Act

L''AI Act classe les systèmes IA en quatre niveaux :

**Risque inacceptable (interdit)**
- Notation sociale (social scoring) par les autorités publiques
- Manipulation subliminale portant atteinte à la sécurité des personnes
- Exploitation de vulnérabilités (âge, handicap)
- Identification biométrique en temps réel dans les espaces publics (sauf exceptions)

**Haut risque (fortement encadré)**
- Recrutement et gestion des travailleurs
- Évaluation de la solvabilité (scoring crédit)
- Accès à l''éducation
- Justice et application de la loi
- Infrastructure critique (énergie, transports, eau)
- Dispositifs médicaux

**Risque limité (obligations de transparence)**
- Chatbots : informer l''utilisateur qu''il interagit avec une IA
- Systèmes de génération de contenu : marquer le contenu comme généré par IA
- Systèmes de reconnaissance des émotions : informer les personnes

**Risque minimal (pas d''obligations spécifiques)**
- Filtres anti-spam
- Correcteurs orthographiques
- Jeux vidéo

### Contenu du registre IA

Pour chaque système IA déployé, documentez :

1. **Identification** : nom, version, fournisseur, date de déploiement
2. **Classification** : niveau de risque selon l''AI Act
3. **Finalité** : objectif du système, décisions influencées
4. **Données** : sources, volume, qualité, biais identifiés
5. **Performance** : métriques de précision, taux d''erreur, biais mesurés
6. **Supervision** : modèle HITL choisi, responsables, procédure d''escalade
7. **Conformité** : base légale RGPD, AIPD réalisée, mesures de mitigation
8. **Audit** : date du dernier audit, résultats, actions correctives

### Calendrier de l''AI Act

- **Février 2025** : interdiction des pratiques à risque inacceptable
- **Août 2025** : obligations pour les modèles d''IA à usage général (GPAI)
- **Août 2026** : obligations pour les systèmes IA à haut risque
- **Août 2027** : application complète pour tous les systèmes

> **Action immédiate :** commencez votre inventaire dès maintenant. Identifiez tous les systèmes IA utilisés dans votre organisation, même les plus simples.', 'text', 10, 2),

(m3_id, 'Audit et contrôle continu',
'## Audit et contrôle continu

### Pourquoi auditer les systèmes IA ?

Un modèle IA n''est pas un logiciel classique qu''on déploie et qu''on oublie. Ses performances peuvent se dégrader, ses biais peuvent s''amplifier, et le contexte réglementaire évolue.

### Les types d''audit

**1. Audit technique (performance)**
- Le modèle maintient-il ses performances dans le temps ?
- Le **data drift** (évolution des données) n''a-t-il pas dégradé les prédictions ?
- Les métriques de précision, rappel et F1-score sont-elles stables ?

**2. Audit d''équité (biais)**
- Les résultats du modèle sont-ils équitables entre les différents groupes ?
- Y a-t-il un impact disproportionné sur certaines populations ?
- Les biais identifiés lors du déploiement initial ont-ils évolué ?

**3. Audit de conformité (réglementaire)**
- Le système est-il conforme au RGPD, à l''AI Act, aux réglementations sectorielles ?
- La documentation est-elle à jour ?
- Les droits des personnes concernées sont-ils respectés (explication, contestation) ?

**4. Audit opérationnel (usage)**
- Le système est-il utilisé conformément à sa finalité initiale ?
- Les utilisateurs comprennent-ils les limites du système ?
- La supervision humaine fonctionne-t-elle réellement ?

### Les KPIs de gouvernance IA

| Indicateur | Fréquence | Seuil d''alerte |
|------------|-----------|----------------|
| Précision du modèle | Mensuel | Baisse > 5% |
| Disparate impact ratio | Trimestriel | < 80% |
| Taux de contestation | Mensuel | Hausse > 20% |
| Délai de réponse aux demandes d''explication | Continu | > 30 jours |
| Nombre d''incidents IA | Mensuel | Tout incident |
| Couverture d''audit | Annuel | < 100% des systèmes haut risque |

### Les red flags

Déclenchez une revue immédiate si :
- Un **incident IA** survient (décision erronée avec impact significatif)
- Un **changement réglementaire** affecte vos systèmes
- Les **données d''entrée** changent significativement (nouveau marché, fusion, crise)
- Des **plaintes** récurrentes concernent un système IA
- Un **audit externe** identifie des non-conformités

### La boucle d''amélioration continue

1. **Mesurer** : collecter les métriques et le feedback utilisateur
2. **Analyser** : identifier les écarts et leurs causes
3. **Corriger** : ajuster le modèle, les données ou les processus
4. **Documenter** : mettre à jour le registre et les rapports d''audit
5. **Communiquer** : informer les parties prenantes des améliorations

> **Principe directeur :** la gouvernance IA n''est pas un projet ponctuel, c''est un processus continu. Comme la cybersécurité, elle exige une vigilance permanente.', 'text', 10, 3);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q3_id, m3_id, 'Quiz : Gouvernance de l''IA', 'Testez vos connaissances sur la gouvernance et l''audit des systèmes IA.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q3_id, 'Quel est le rôle principal d''un comité IA en entreprise ?',
 'multiple_choice',
 '[{"id":"a","text":"Développer les algorithmes","isCorrect":false},{"id":"b","text":"Fournir une gouvernance transversale pour encadrer l''utilisation de l''IA","isCorrect":true},{"id":"c","text":"Remplacer le département informatique","isCorrect":false},{"id":"d","text":"Former tous les employés à Python","isCorrect":false}]',
 'Le comité IA gouverne l''utilisation de l''IA : validation des cas d''usage, arbitrage éthique, supervision de la conformité.', 1),

(q3_id, 'Selon l''AI Act, un système de scoring crédit est classé comme...',
 'multiple_choice',
 '[{"id":"a","text":"Risque minimal","isCorrect":false},{"id":"b","text":"Risque limité","isCorrect":false},{"id":"c","text":"Haut risque","isCorrect":true},{"id":"d","text":"Risque inacceptable","isCorrect":false}]',
 'L''évaluation de la solvabilité est classée à haut risque par l''AI Act car elle affecte significativement l''accès au crédit.', 2),

(q3_id, 'La notation sociale (social scoring) par les autorités publiques est autorisée sous conditions par l''AI Act.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'La notation sociale par les autorités publiques est classée comme risque inacceptable et est interdite par l''AI Act.', 3),

(q3_id, 'Qu''est-ce que le data drift ?',
 'multiple_choice',
 '[{"id":"a","text":"Une panne de serveur","isCorrect":false},{"id":"b","text":"L''évolution des données dans le temps qui dégrade les performances du modèle","isCorrect":true},{"id":"c","text":"Le transfert de données entre serveurs","isCorrect":false},{"id":"d","text":"Un biais dans les données d''entraînement","isCorrect":false}]',
 'Le data drift est l''évolution des caractéristiques des données réelles par rapport aux données d''entraînement, causant une dégradation des performances.', 4),

(q3_id, 'À quelle date les obligations de l''AI Act pour les systèmes IA à haut risque entrent-elles pleinement en vigueur ?',
 'multiple_choice',
 '[{"id":"a","text":"Février 2025","isCorrect":false},{"id":"b","text":"Août 2025","isCorrect":false},{"id":"c","text":"Août 2026","isCorrect":true},{"id":"d","text":"Août 2027","isCorrect":false}]',
 'Les obligations pour les systèmes IA à haut risque entrent en vigueur en août 2026.', 5);

END $$;

-- ============================================================================
-- ORGANISATION — Course 2: "Conformité RGPD & AI Act"
-- ============================================================================
DO $$
DECLARE
  c_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c_id, NULL, NULL,
  'Conformité RGPD & AI Act',
  'Maîtrisez vos obligations de conformité en tant que responsable de traitement, et préparez-vous aux exigences de l''AI Act, NIS2 et DORA.',
  'organisation', 'Scale', '#21B2AA', 'Conformité', true, true, 2);

-- Module 1: RGPD pour les professionnels
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c_id,
  'RGPD pour les professionnels',
  'Obligations du responsable de traitement, sous-traitants et transferts internationaux.',
  'FileCheck', 30, 'moyen', 'Conformité', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'Obligations du responsable de traitement',
'## Obligations du responsable de traitement

### Qui est responsable de traitement ?

Le **responsable de traitement** est la personne morale ou physique qui détermine les **finalités** (pourquoi) et les **moyens** (comment) du traitement des données personnelles. En pratique, c''est l''organisation qui décide de collecter et d''utiliser les données.

> **Attention :** être responsable de traitement engage votre responsabilité juridique. « Je ne savais pas » n''est pas une excuse.

### Les bases légales du traitement

Tout traitement de données personnelles doit reposer sur l''une des **six bases légales** du RGPD (article 6) :

1. **Consentement** — la personne a donné son accord explicite
2. **Exécution d''un contrat** — le traitement est nécessaire pour exécuter un contrat avec la personne
3. **Obligation légale** — une loi impose le traitement (ex : déclarations fiscales)
4. **Intérêts vitaux** — protéger la vie de la personne
5. **Mission d''intérêt public** — pour les organismes publics
6. **Intérêt légitime** — l''organisation a un intérêt légitime qui ne porte pas atteinte de manière disproportionnée aux droits des personnes

### Le Délégué à la Protection des Données (DPO)

La désignation d''un DPO est **obligatoire** pour :
- Les autorités et organismes publics
- Les organisations dont l''activité principale implique un suivi régulier et systématique à grande échelle
- Les organisations traitant à grande échelle des données sensibles

Le DPO doit être **indépendant**, avoir les **ressources nécessaires** et être **associé en amont** à tout projet impliquant des données personnelles.

### L''Analyse d''Impact (AIPD)

L''Analyse d''Impact relative à la Protection des Données est **obligatoire** lorsque le traitement est susceptible d''engendrer un **risque élevé** pour les droits et libertés des personnes.

**Cas où l''AIPD est requise :**
- Évaluation systématique de personnes (profilage, scoring)
- Traitement à grande échelle de données sensibles
- Surveillance systématique d''un espace public
- Croisement de bases de données à grande échelle

**Contenu de l''AIPD :**
1. Description du traitement et de ses finalités
2. Évaluation de la nécessité et de la proportionnalité
3. Identification des risques pour les personnes
4. Mesures prévues pour atténuer ces risques

### Le registre des traitements (article 30)

Toute organisation de plus de 250 salariés (et toute organisation traitant des données sensibles) doit tenir un **registre des traitements** documentant tous les traitements de données personnelles.

### La notification des violations (article 33)

En cas de violation de données (fuite, piratage, perte) :
- **Notification à la CNIL** dans les **72 heures** suivant la découverte
- **Notification aux personnes concernées** si la violation présente un risque élevé
- **Documentation** de la violation et des mesures prises', 'text', 15, 1),

(m1_id, 'Sous-traitants et transferts internationaux',
'## Sous-traitants et transferts internationaux

### La relation responsable de traitement / sous-traitant

Le **sous-traitant** (processor) est toute entité qui traite des données personnelles pour le compte du responsable de traitement. Exemples courants : hébergeur cloud, prestataire de paie, outil CRM SaaS, prestataire d''emailing.

### Les obligations contractuelles (article 28)

Un **contrat de sous-traitance** (Data Processing Agreement, DPA) est obligatoire. Il doit prévoir :

- L''**objet et la durée** du traitement
- La **nature et la finalité** du traitement
- Les **types de données** et catégories de personnes concernées
- Les **obligations du sous-traitant** : traiter uniquement sur instruction documentée, assurer la confidentialité, assister le responsable pour les demandes de droits, notifier les violations, supprimer les données à la fin du contrat
- Les conditions de recours à des **sous-traitants ultérieurs**
- Les **mesures de sécurité** techniques et organisationnelles

> **Piège courant :** utiliser un outil SaaS sans DPA signé est une violation du RGPD, même si l''outil est sécurisé.

### Les transferts internationaux de données

Le RGPD encadre strictement le transfert de données personnelles en dehors de l''Espace Économique Européen (EEE).

**Les mécanismes de transfert :**

**1. Décision d''adéquation (article 45)**
La Commission européenne reconnaît que certains pays offrent un niveau de protection « adéquat ». Les transferts vers ces pays sont autorisés sans garantie supplémentaire.
Pays adéquats : Royaume-Uni, Suisse, Japon, Corée du Sud, Canada (secteur privé), Argentine, Israël, Nouvelle-Zélande, Uruguay, États-Unis (sous le Data Privacy Framework depuis juillet 2023).

**2. Clauses Contractuelles Types (CCT / SCCs)**
En l''absence de décision d''adéquation, des **clauses contractuelles standardisées** approuvées par la Commission européenne peuvent encadrer le transfert. Elles doivent être accompagnées d''un **Transfer Impact Assessment** (TIA) évaluant le niveau de protection dans le pays de destination.

**3. Binding Corporate Rules (BCR)**
Pour les transferts intra-groupe, des règles internes approuvées par une autorité de contrôle.

### L''arrêt Schrems II et ses conséquences

L''arrêt **Schrems II** (CJUE, juillet 2020) a invalidé le Privacy Shield EU-US, créant une onde de choc :

- Les transferts vers les États-Unis basés sur le Privacy Shield sont devenus **illicites**
- Le recours aux CCT nécessite désormais un **TIA** et des **mesures supplémentaires** (chiffrement, pseudonymisation)
- Le **Data Privacy Framework** (DPF) adopté en 2023 est le successeur du Privacy Shield, mais sa pérennité est incertaine (un « Schrems III » est attendu)

### Le cloud souverain

Face aux risques liés aux transferts, le concept de **cloud souverain** se développe :
- **OVHcloud**, **Scaleway**, **Outscale** : hébergeurs français/européens
- **Bleu** (Orange/Capgemini avec Microsoft) : cloud de confiance
- **S3NS** (Thales avec Google) : cloud de confiance

L''utilisation d''un cloud souverain simplifie la conformité en gardant les données dans l''EEE.', 'text', 15, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : RGPD pour les professionnels', 'Vérifiez vos connaissances sur les obligations RGPD des professionnels.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Combien de bases légales le RGPD prévoit-il pour le traitement des données personnelles ?',
 'multiple_choice',
 '[{"id":"a","text":"3","isCorrect":false},{"id":"b","text":"6","isCorrect":true},{"id":"c","text":"8","isCorrect":false},{"id":"d","text":"10","isCorrect":false}]',
 'L''article 6 du RGPD prévoit 6 bases légales : consentement, exécution d''un contrat, obligation légale, intérêts vitaux, mission d''intérêt public, intérêt légitime.', 1),

(q1_id, 'Dans quel délai une violation de données doit-elle être notifiée à la CNIL ?',
 'multiple_choice',
 '[{"id":"a","text":"24 heures","isCorrect":false},{"id":"b","text":"72 heures","isCorrect":true},{"id":"c","text":"7 jours","isCorrect":false},{"id":"d","text":"30 jours","isCorrect":false}]',
 'L''article 33 du RGPD impose une notification à l''autorité de contrôle dans les 72 heures suivant la prise de connaissance de la violation.', 2),

(q1_id, 'Un contrat de sous-traitance (DPA) est optionnel si le sous-traitant est certifié ISO 27001.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'Le DPA est obligatoire (article 28 du RGPD) quel que soit le niveau de certification du sous-traitant.', 3),

(q1_id, 'Quel arrêt de la CJUE a invalidé le Privacy Shield EU-US ?',
 'multiple_choice',
 '[{"id":"a","text":"Schrems I","isCorrect":false},{"id":"b","text":"Schrems II","isCorrect":true},{"id":"c","text":"Planet49","isCorrect":false},{"id":"d","text":"Google Spain","isCorrect":false}]',
 'L''arrêt Schrems II (CJUE, juillet 2020) a invalidé le Privacy Shield, exigeant des garanties supplémentaires pour les transferts vers les États-Unis.', 4),

(q1_id, 'Qu''est-ce qu''une AIPD ?',
 'multiple_choice',
 '[{"id":"a","text":"Un audit annuel de sécurité informatique","isCorrect":false},{"id":"b","text":"Une analyse d''impact relative à la protection des données pour les traitements à risque élevé","isCorrect":true},{"id":"c","text":"Un certificat de conformité RGPD","isCorrect":false},{"id":"d","text":"Un contrat avec un sous-traitant","isCorrect":false}]',
 'L''AIPD évalue les risques d''un traitement pour les droits et libertés des personnes et définit les mesures de mitigation.', 5);

-- Module 2: AI Act : ce qui change
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c_id,
  'AI Act : ce qui change',
  'Classification des risques, obligations par niveau et calendrier de mise en conformité.',
  'Gavel', 35, 'expert', 'Conformité', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Classification des risques',
'## Classification des risques selon l''AI Act

L''AI Act (Règlement (UE) 2024/1689) est le premier cadre juridique complet au monde régissant l''intelligence artificielle. Il classe les systèmes IA selon une **approche fondée sur les risques**.

### Niveau 1 : Risque inacceptable (INTERDIT)

Ces pratiques sont purement et simplement **interdites** :

**Manipulation subliminale**
Systèmes IA utilisant des techniques subliminales pour influencer le comportement d''une personne d''une manière qui lui cause un préjudice.
→ *Exemple : publicité ciblée exploitant des vulnérabilités psychologiques pour induire des achats compulsifs*

**Exploitation de vulnérabilités**
Systèmes IA exploitant les vulnérabilités liées à l''âge, au handicap ou à la situation socio-économique.
→ *Exemple : jouet connecté incitant un enfant à adopter des comportements dangereux*

**Notation sociale par les autorités publiques**
Évaluation ou classification de personnes sur la base de leur comportement social, entraînant un traitement préjudiciable disproportionné.
→ *Exemple : système de crédit social comme en Chine*

**Identification biométrique en temps réel dans les espaces publics**
Utilisation de la reconnaissance faciale en temps réel par les forces de l''ordre, sauf exceptions très encadrées (terrorisme, enlèvement).

**Catégorisation biométrique par données sensibles**
Systèmes déduisant la race, les opinions politiques, l''appartenance syndicale, les convictions religieuses ou l''orientation sexuelle à partir de données biométriques.

### Niveau 2 : Haut risque (fortement encadré)

Les systèmes IA **à haut risque** sont soumis à des obligations strictes. Deux catégories :

**A. Systèmes intégrés à des produits réglementés**
IA dans les dispositifs médicaux, véhicules, jouets, ascenseurs, équipements de protection → soumis au marquage CE.

**B. Systèmes IA autonomes dans des domaines sensibles**
- **Recrutement et gestion des travailleurs** : tri de CV, évaluation de candidats, affectation de tâches, surveillance de la performance
- **Éducation** : admission, évaluation, détection de triche
- **Services essentiels** : scoring crédit, assurance, aide sociale
- **Justice et police** : évaluation de preuves, prédiction de récidive, profilage
- **Migration** : évaluation des demandes de visa et d''asile
- **Infrastructures critiques** : gestion du trafic, de l''eau, de l''énergie

### Niveau 3 : Risque limité (transparence)

Obligations de **transparence** uniquement :
- Les chatbots doivent informer qu''ils sont des IA
- Le contenu généré par IA (texte, image, vidéo, audio) doit être marqué comme tel
- Les systèmes de reconnaissance d''émotions doivent informer les personnes

### Niveau 4 : Risque minimal (pas d''obligations spécifiques)

La grande majorité des systèmes IA : filtres anti-spam, correcteurs orthographiques, systèmes de recommandation de contenu, assistants personnels dans un cadre non critique.', 'text', 12, 1),

(m2_id, 'Obligations par niveau de risque',
'## Obligations par niveau de risque

### Obligations pour les systèmes à haut risque

L''AI Act impose un ensemble d''obligations **avant et après** la mise sur le marché.

**Avant la mise sur le marché :**

1. **Système de gestion des risques** (article 9)
Un processus continu d''identification, d''analyse et de gestion des risques tout au long du cycle de vie du système.

2. **Gouvernance des données** (article 10)
Les jeux de données d''entraînement doivent être pertinents, représentatifs, exempts d''erreurs (dans la mesure du possible) et complets. Les biais potentiels doivent être identifiés et traités.

3. **Documentation technique** (article 11)
Description complète du système : finalité, architecture, données d''entraînement, performances, limites connues, instructions d''utilisation.

4. **Enregistrement automatique des activités (logs)** (article 12)
Le système doit enregistrer automatiquement les événements pertinents pour la traçabilité des décisions.

5. **Transparence et information** (article 13)
Les utilisateurs doivent recevoir des instructions d''utilisation claires, incluant les capacités et limites du système.

6. **Contrôle humain** (article 14)
Le système doit être conçu pour permettre un **contrôle humain effectif**, incluant la capacité d''ignorer, annuler ou inverser les résultats du système.

7. **Précision, robustesse et cybersécurité** (article 15)
Le système doit atteindre un niveau approprié de précision, être robuste face aux erreurs et être protégé contre les manipulations.

8. **Marquage CE** et **déclaration de conformité**
Avant la mise sur le marché, le fournisseur doit attester de la conformité.

**Après la mise sur le marché :**

- **Surveillance post-commercialisation** continue
- **Signalement des incidents graves** aux autorités
- **Mise à jour** de la documentation en cas de modification significative

### Obligations pour les fournisseurs de modèles GPAI

Les modèles d''IA à usage général (General Purpose AI, comme GPT-4, Claude, Gemini) ont des obligations spécifiques :

- Documentation technique détaillée
- Politique de respect du droit d''auteur
- Publication d''un résumé du contenu d''entraînement

**Pour les modèles à risque systémique** (entraînés avec une puissance > 10^25 FLOPs) :
- Évaluation du modèle incluant des tests adversariaux (red teaming)
- Mesures de mitigation des risques systémiques
- Signalement des incidents graves
- Protection adéquate en matière de cybersécurité

### Sanctions

Les sanctions de l''AI Act sont **considérables** :

| Violation | Amende maximale |
|-----------|----------------|
| Pratiques interdites | **35 M€** ou **7 % du CA mondial** |
| Non-conformité systèmes à haut risque | **15 M€** ou **3 % du CA mondial** |
| Informations inexactes aux autorités | **7,5 M€** ou **1 % du CA mondial** |

> **Comparaison :** les amendes AI Act sont encore plus élevées que celles du RGPD (20 M€ ou 4 % du CA).', 'text', 12, 2),

(m2_id, 'Calendrier et sanctions',
'## Calendrier et sanctions

### Le calendrier de mise en conformité

L''AI Act a été publié au Journal officiel de l''UE le 12 juillet 2024. Son application se fait **par étapes** :

### Phase 1 : Février 2025
**Interdictions en vigueur**
- Les pratiques à risque inacceptable sont interdites
- Mise en place des premiers programmes de formation en matière d''IA

### Phase 2 : Août 2025
**Modèles d''IA à usage général (GPAI)**
- Obligations de transparence et documentation pour les fournisseurs de modèles GPAI
- Obligations renforcées pour les modèles à risque systémique
- Mise en place des codes de bonnes pratiques

### Phase 3 : Août 2026
**Systèmes IA à haut risque (catégorie B)**
- Entrée en vigueur des obligations pour les systèmes IA listés à l''annexe III (recrutement, crédit, justice, etc.)
- Marquage CE obligatoire
- Mise en place des bacs à sable réglementaires (sandboxes)

### Phase 4 : Août 2027
**Application complète**
- Obligations pour les systèmes IA intégrés à des produits réglementés (catégorie A)
- Pleine application de toutes les dispositions

### Ce que votre organisation doit faire MAINTENANT

**Court terme (immédiat) :**
1. **Inventorier** tous les systèmes IA utilisés dans l''organisation
2. **Classifier** chaque système selon les niveaux de risque
3. **Vérifier** qu''aucun usage ne relève du risque inacceptable (déjà interdit)
4. **Désigner un responsable IA** en interne

**Moyen terme (2025-2026) :**
5. **Réaliser** les analyses de conformité pour les systèmes à haut risque
6. **Mettre en place** la documentation technique requise
7. **Former** les équipes aux nouvelles obligations
8. **Auditer** les fournisseurs de solutions IA

**Long terme (2026-2027) :**
9. **Obtenir** le marquage CE pour les systèmes à haut risque
10. **Mettre en place** la surveillance post-commercialisation
11. **Adapter** les processus en continu selon les guidelines et jurisprudences

### L''articulation avec le RGPD

L''AI Act ne remplace pas le RGPD : les deux s''appliquent **simultanément**. Un système IA traitant des données personnelles doit respecter :
- Le RGPD pour la protection des données
- L''AI Act pour la sécurité et la transparence du système IA
- Les réglementations sectorielles applicables (santé, finance, etc.)

> **Conseil stratégique :** traitez la mise en conformité AI Act comme un projet transversal associant juridique, DSI, métiers et direction. L''investissement initial est significatif mais les sanctions en cas de non-conformité le sont encore plus.', 'text', 11, 3);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : AI Act', 'Testez vos connaissances sur l''AI Act européen.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'Combien de niveaux de risque l''AI Act définit-il ?',
 'multiple_choice',
 '[{"id":"a","text":"2","isCorrect":false},{"id":"b","text":"3","isCorrect":false},{"id":"c","text":"4","isCorrect":true},{"id":"d","text":"5","isCorrect":false}]',
 'L''AI Act définit 4 niveaux : risque inacceptable (interdit), haut risque, risque limité (transparence) et risque minimal.', 1),

(q2_id, 'Un système de tri automatique de CV est classé comme...',
 'multiple_choice',
 '[{"id":"a","text":"Risque minimal","isCorrect":false},{"id":"b","text":"Risque limité","isCorrect":false},{"id":"c","text":"Haut risque","isCorrect":true},{"id":"d","text":"Risque inacceptable","isCorrect":false}]',
 'Le recrutement et la gestion des travailleurs sont explicitement listés comme domaine à haut risque par l''AI Act.', 2),

(q2_id, 'Quelle est l''amende maximale pour l''utilisation de pratiques IA interdites ?',
 'multiple_choice',
 '[{"id":"a","text":"20 millions d''euros ou 4% du CA mondial","isCorrect":false},{"id":"b","text":"35 millions d''euros ou 7% du CA mondial","isCorrect":true},{"id":"c","text":"10 millions d''euros ou 2% du CA mondial","isCorrect":false},{"id":"d","text":"50 millions d''euros ou 10% du CA mondial","isCorrect":false}]',
 'Les pratiques interdites (risque inacceptable) sont sanctionnées par des amendes pouvant atteindre 35 M€ ou 7% du CA mondial annuel.', 3),

(q2_id, 'L''AI Act remplace le RGPD pour les systèmes d''IA.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
 'L''AI Act et le RGPD s''appliquent simultanément. Un système IA traitant des données personnelles doit respecter les deux réglementations.', 4),

(q2_id, 'Quelle obligation l''AI Act impose-t-il pour les chatbots ?',
 'multiple_choice',
 '[{"id":"a","text":"Ils doivent être certifiés CE","isCorrect":false},{"id":"b","text":"Ils doivent informer l''utilisateur qu''il interagit avec une IA","isCorrect":true},{"id":"c","text":"Ils doivent être supervisés en temps réel par un humain","isCorrect":false},{"id":"d","text":"Ils sont interdits","isCorrect":false}]',
 'Les chatbots sont classés à risque limité : leur seule obligation est d''informer l''utilisateur qu''il interagit avec un système d''IA.', 5);

-- Module 3: NIS2 et DORA
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c_id,
  'NIS2 et DORA',
  'Cybersécurité obligatoire avec NIS2 et résilience numérique du secteur financier avec DORA.',
  'Shield', 25, 'expert', 'Conformité', false, false, 3);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m3_id, 'NIS2 : cybersécurité obligatoire',
'## NIS2 : cybersécurité obligatoire

### Qu''est-ce que NIS2 ?

La directive **NIS2** (Network and Information Security 2, Directive (UE) 2022/2555) renforce considérablement les obligations de cybersécurité pour les organisations européennes. Elle remplace la directive NIS1 de 2016, jugée insuffisante face à l''évolution des cybermenaces.

### Qui est concerné ?

NIS2 élargit considérablement le périmètre par rapport à NIS1. Deux catégories d''entités :

**Entités essentielles (EE)**
- Énergie (électricité, gaz, pétrole, hydrogène)
- Transports (aérien, ferroviaire, maritime, routier)
- Secteur bancaire et infrastructures de marchés financiers
- Santé (hôpitaux, laboratoires, fabricants de dispositifs médicaux)
- Eau potable et eaux usées
- Infrastructure numérique (DNS, IXP, cloud, data centers, CDN)
- Administrations publiques
- Espace

**Entités importantes (EI)**
- Services postaux et de courrier
- Gestion des déchets
- Fabrication de produits chimiques
- Industrie alimentaire
- Fabrication (dispositifs médicaux, produits informatiques, électroniques, optiques, équipements de transport)
- Services numériques (places de marché, moteurs de recherche, réseaux sociaux)
- Recherche

> **Critère de taille :** en général, les entreprises de plus de 50 employés ou de plus de 10 M€ de CA dans les secteurs listés sont concernées.

### Les obligations principales

**1. Gouvernance de la cybersécurité**
- La direction (comité de direction, conseil d''administration) est **personnellement responsable** de la cybersécurité
- Formation obligatoire des dirigeants en cybersécurité
- Approbation des mesures de gestion des risques par la direction

**2. Mesures de gestion des risques (article 21)**
Les organisations doivent mettre en œuvre des mesures proportionnées :
- Politiques de sécurité des systèmes d''information
- Gestion des incidents
- Continuité d''activité et gestion de crise
- Sécurité de la chaîne d''approvisionnement
- Sécurité de l''acquisition, du développement et de la maintenance des systèmes
- Évaluation de l''efficacité des mesures
- Pratiques de cyber-hygiène et formation
- Cryptographie et chiffrement
- Sécurité des ressources humaines et contrôle d''accès
- Authentification multi-facteurs (MFA)

**3. Notification des incidents (article 23)**
En cas d''incident de sécurité significatif :
- **Alerte précoce** : dans les **24 heures** suivant la détection
- **Notification** : dans les **72 heures** avec une évaluation initiale
- **Rapport final** : dans le **mois** suivant la notification

### Sanctions

- **Entités essentielles** : jusqu''à **10 M€** ou **2 % du CA mondial**
- **Entités importantes** : jusqu''à **7 M€** ou **1,4 % du CA mondial**
- **Responsabilité personnelle** des dirigeants (interdiction temporaire d''exercer des fonctions de direction)

### Transposition en droit français

La France devait transposer NIS2 en droit national avant octobre 2024. L''ANSSI (Agence Nationale de la Sécurité des Systèmes d''Information) est l''autorité compétente.', 'text', 12, 1),

(m3_id, 'DORA : résilience numérique du secteur financier',
'## DORA : résilience numérique du secteur financier

### Qu''est-ce que DORA ?

Le règlement **DORA** (Digital Operational Resilience Act, Règlement (UE) 2022/2554) harmonise la gestion du risque numérique dans le secteur financier européen. Entré en application le **17 janvier 2025**, il s''applique directement sans transposition nationale.

### Qui est concerné ?

DORA s''applique à un large éventail d''entités financières :

- Établissements de crédit (banques)
- Entreprises d''investissement
- Compagnies d''assurance et de réassurance
- Fonds de pension
- Prestataires de services de paiement
- Établissements de monnaie électronique
- Sociétés de gestion d''actifs
- Plateformes de négociation
- Agences de notation de crédit
- Prestataires de services sur crypto-actifs
- Et leurs **prestataires TIC critiques** (cloud, logiciel, infrastructure)

### Les 5 piliers de DORA

**Pilier 1 : Gestion du risque TIC (articles 5 à 16)**

Les entités financières doivent mettre en place un **cadre de gestion du risque TIC** complet :
- Stratégie de résilience numérique approuvée par la direction
- Identification et classification des actifs TIC
- Protection et prévention (pare-feux, chiffrement, contrôle d''accès)
- Détection des anomalies et incidents
- Réponse et rétablissement
- Apprentissage et évolution

**Pilier 2 : Gestion et signalement des incidents (articles 17 à 23)**

- Classification des incidents TIC selon des critères harmonisés
- **Notification initiale** aux autorités dans les **4 heures** (pour les incidents majeurs) avec un rapport intermédiaire sous 72 heures et un rapport final sous 1 mois
- Analyse post-incident obligatoire

**Pilier 3 : Tests de résilience opérationnelle (articles 24 à 27)**

- Tests de résilience réguliers (scénarios, simulations)
- **Tests de pénétration avancés (TLPT)** au moins tous les 3 ans pour les entités significatives
- Tests réalisés par des prestataires certifiés

**Pilier 4 : Gestion du risque lié aux prestataires TIC tiers (articles 28 à 44)**

- Registre de tous les contrats avec des prestataires TIC
- Évaluation des risques avant et pendant la relation contractuelle
- Clauses contractuelles obligatoires (droit d''audit, continuité, sécurité)
- Stratégies de sortie documentées
- Surveillance directe des prestataires TIC critiques par les autorités européennes

**Pilier 5 : Partage d''informations (article 45)**

- Partage volontaire de renseignements sur les cybermenaces entre entités financières
- Cadre de confiance pour l''échange d''indicateurs de compromission

### Les différences clés entre DORA et NIS2

| Aspect | DORA | NIS2 |
|--------|------|------|
| **Nature** | Règlement (application directe) | Directive (transposition nationale) |
| **Secteur** | Financier uniquement | Tous les secteurs essentiels |
| **Notification** | 4h (incidents majeurs) | 24h |
| **Tests** | TLPT obligatoires tous les 3 ans | Pas d''exigence spécifique |
| **Prestataires** | Surveillance directe des prestataires critiques | Sécurité de la chaîne d''approvisionnement |

> **Point clé :** les entités financières soumises à DORA sont présumées conformes à NIS2 pour les aspects couverts par DORA (principe de lex specialis). Mais elles doivent quand même se conformer à NIS2 pour les aspects non couverts.

### Actions immédiates

1. **Cartographier** l''ensemble de vos prestataires TIC et contrats associés
2. **Évaluer** la maturité de votre gestion du risque TIC
3. **Identifier** les écarts avec les exigences DORA
4. **Planifier** les tests de résilience
5. **Former** la direction à ses nouvelles responsabilités', 'text', 13, 2);

INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q3_id, m3_id, 'Quiz : NIS2 et DORA', 'Testez vos connaissances sur les réglementations NIS2 et DORA.', 60);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q3_id, 'Quel est le délai de notification d''alerte précoce pour un incident de sécurité sous NIS2 ?',
 'multiple_choice',
 '[{"id":"a","text":"4 heures","isCorrect":false},{"id":"b","text":"24 heures","isCorrect":true},{"id":"c","text":"72 heures","isCorrect":false},{"id":"d","text":"1 semaine","isCorrect":false}]',
 'NIS2 impose une alerte précoce dans les 24 heures, suivie d''une notification dans les 72 heures et d''un rapport final dans le mois.', 1),

(q3_id, 'Sous NIS2, les dirigeants peuvent être tenus personnellement responsables en matière de cybersécurité.',
 'true_false',
 '[{"id":"a","text":"Vrai","isCorrect":true},{"id":"b","text":"Faux","isCorrect":false}]',
 'NIS2 prévoit la responsabilité personnelle des dirigeants, pouvant aller jusqu''à l''interdiction temporaire d''exercer des fonctions de direction.', 2),

(q3_id, 'DORA s''applique à quel secteur ?',
 'multiple_choice',
 '[{"id":"a","text":"Tous les secteurs économiques","isCorrect":false},{"id":"b","text":"Le secteur financier","isCorrect":true},{"id":"c","text":"Le secteur de la santé uniquement","isCorrect":false},{"id":"d","text":"Le secteur public uniquement","isCorrect":false}]',
 'DORA est spécifiquement conçu pour le secteur financier : banques, assurances, fonds d''investissement et leurs prestataires TIC.', 3),

(q3_id, 'Quel est le délai de notification initial pour un incident majeur sous DORA ?',
 'multiple_choice',
 '[{"id":"a","text":"4 heures","isCorrect":true},{"id":"b","text":"24 heures","isCorrect":false},{"id":"c","text":"72 heures","isCorrect":false},{"id":"d","text":"1 semaine","isCorrect":false}]',
 'DORA est plus strict que NIS2 : la notification initiale d''un incident majeur doit intervenir dans les 4 heures.', 4);

END $$;
