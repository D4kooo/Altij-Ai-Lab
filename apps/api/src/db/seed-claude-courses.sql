-- ============================================================================
-- ALTIJ LAB — Seed: Claude AI Training Courses
-- Course 1: Claude 101 (adultes + organisation)
-- Course 2: Claude & Donnees Confidentielles (organisation only)
-- ============================================================================

-- ============================================================================
-- COURSE 1: Claude 101 — Maitriser Claude en Entreprise (ADULTES)
-- ============================================================================
DO $$
DECLARE
  c1_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  m4_id UUID := gen_random_uuid();
  m5_id UUID := gen_random_uuid();
  m6_id UUID := gen_random_uuid();
  m7_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
  q4_id UUID := gen_random_uuid();
  q5_id UUID := gen_random_uuid();
  q6_id UUID := gen_random_uuid();
  q7_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c1_id, NULL, NULL,
  'Claude 101 : Maitriser l''IA en Entreprise',
  'Formation pratique pour apprendre a utiliser Claude dans un contexte professionnel. Du prompt engineering aux workflows avances, maitrisez l''IA generative pour gagner en productivite.',
  'adultes', 'Bot', '#7C3AED', 'Intelligence Artificielle', true, true, 1);

-- ──────────────────────────────────────────────────────────────────────
-- Module 1: Comprendre Claude — Les fondamentaux
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c1_id,
  'Comprendre Claude : les fondamentaux',
  'Decouvrez ce qu''est Claude, comment il fonctionne, et ce qui le differencie des autres IA generatives.',
  'Brain', 20, 'facile', 'Fondamentaux', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'Qu''est-ce que Claude ?',
'## Qu''est-ce que Claude ?

Claude est un assistant IA developpe par **Anthropic**, une entreprise fondee en 2021 par d''anciens chercheurs d''OpenAI. Claude est concu pour etre utile, honnete et inoffensif.

### Les modeles Claude disponibles

Claude existe en plusieurs versions, chacune optimisee pour un usage different :

| Modele | Forces | Cas d''usage |
|--------|--------|-------------|
| **Claude Opus** | Le plus intelligent, raisonnement complexe | Analyse juridique approfondie, strategie |
| **Claude Sonnet** | Equilibre performance/cout | Usage quotidien, redaction, recherche |
| **Claude Haiku** | Le plus rapide et economique | Classification, extraction, taches repetitives |

### Comment Claude « pense »

Contrairement a un moteur de recherche, Claude ne cherche pas l''information sur Internet. Il genere ses reponses mot par mot en s''appuyant sur :
- Les **connaissances** acquises pendant son entrainement (jusqu''a une date de coupure)
- Le **contexte** que vous lui fournissez dans la conversation
- Les **instructions** du prompt systeme (pour les assistants configures)

### Ce que Claude peut faire

- Rediger et reformuler des textes
- Analyser et resumer des documents
- Repondre a des questions complexes
- Extraire des informations structurees
- Generer du code
- Raisonner etape par etape sur des problemes

### Ce que Claude ne peut PAS faire

- Acceder a Internet en temps reel (sauf configuration specifique)
- Se souvenir des conversations precedentes (chaque conversation est independante)
- Garantir l''exactitude factuelle a 100 %
- Remplacer un expert humain pour des decisions critiques

> **Point cle :** Claude est un outil puissant, mais il reste un assistant. Vous etes toujours responsable de verifier et valider ses reponses.', 'text', 10, 1),

(m1_id, 'L''interface et les modes d''interaction',
'## L''interface et les modes d''interaction

### Les differentes facons d''utiliser Claude

Il existe plusieurs manieres d''interagir avec Claude selon votre contexte professionnel :

**1. Claude.ai (interface web)**
L''interface conversationnelle classique. Vous tapez un message, Claude repond. Ideal pour :
- Questions ponctuelles
- Redaction assistee
- Brainstorming

**2. Les assistants specialises (comme dans Data Ring)**
Des Claudes pre-configures avec un prompt systeme et des sources de donnees. Exemples :
- Assistant juridique avec acces aux bases legales
- Assistant RH pour les questions de droit du travail
- Assistant compliance pour la verification reglementaire

**3. Claude Code (ligne de commande)**
Pour les developpeurs et les utilisateurs avances. Permet de :
- Automatiser des taches repetitives
- Integrer Claude dans des workflows
- Travailler directement sur du code

**4. L''API Claude (programmatique)**
Pour les equipes techniques qui integrent Claude dans leurs outils internes.

### La fenetre de contexte

Chaque conversation avec Claude a une **fenetre de contexte** limitee. C''est la quantite de texte que Claude peut « garder en tete » pendant une conversation.

- **Claude Opus/Sonnet :** jusqu''a 200 000 tokens (~150 000 mots)
- Tout ce que vous envoyez (messages + documents) consomme des tokens
- Quand la limite est atteinte, Claude « oublie » le debut de la conversation

**Conseil pratique :** pour les conversations longues, resumez regulierement le contexte important pour que Claude n''oublie pas les points cles.', 'text', 10, 2);

-- Quiz Module 1
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : Les fondamentaux de Claude', 'Testez vos connaissances sur les bases de Claude.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Quelle est la principale difference entre Claude et un moteur de recherche ?',
'multiple_choice',
'[{"id":"a","text":"Claude est plus rapide","isCorrect":false},{"id":"b","text":"Claude genere des reponses a partir de son entrainement et du contexte, il ne cherche pas sur Internet","isCorrect":true},{"id":"c","text":"Claude est gratuit","isCorrect":false},{"id":"d","text":"Claude ne fait pas d''erreurs","isCorrect":false}]',
'Claude genere ses reponses mot par mot en s''appuyant sur ses connaissances et le contexte fourni, contrairement a un moteur de recherche qui indexe et retrouve des pages web existantes.', 1),

(q1_id, 'Quel modele Claude est le plus adapte pour une analyse juridique approfondie ?',
'multiple_choice',
'[{"id":"a","text":"Claude Haiku","isCorrect":false},{"id":"b","text":"Claude Sonnet","isCorrect":false},{"id":"c","text":"Claude Opus","isCorrect":true},{"id":"d","text":"Tous se valent","isCorrect":false}]',
'Claude Opus est le modele le plus intelligent, concu pour le raisonnement complexe comme l''analyse juridique approfondie.', 2),

(q1_id, 'Que se passe-t-il quand la fenetre de contexte de Claude est saturee ?',
'multiple_choice',
'[{"id":"a","text":"Claude s''arrete de repondre","isCorrect":false},{"id":"b","text":"Claude oublie le debut de la conversation","isCorrect":true},{"id":"c","text":"Claude ralentit","isCorrect":false},{"id":"d","text":"Rien, la fenetre est illimitee","isCorrect":false}]',
'Quand la fenetre de contexte est pleine, Claude perd progressivement le debut de la conversation. Il est recommande de resumer les points cles regulierement.', 3),

(q1_id, 'Claude peut-il se souvenir de vos conversations precedentes ?',
'true_false',
'[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
'Chaque conversation avec Claude est independante. Il ne conserve pas de memoire entre les sessions, sauf si un systeme externe le permet.', 4);

-- ──────────────────────────────────────────────────────────────────────
-- Module 2: L''art du prompting
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c1_id,
  'L''art du prompting : bien communiquer avec Claude',
  'Apprenez les techniques de prompt engineering pour obtenir des reponses precises et exploitables.',
  'PenTool', 25, 'facile', 'Prompt Engineering', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Les principes du bon prompt',
'## Les principes du bon prompt

Un prompt est l''instruction que vous donnez a Claude. La qualite de la reponse depend directement de la qualite du prompt. Voici les principes fondamentaux.

### 1. Soyez specifique

| Prompt faible | Prompt efficace |
|---------------|-----------------|
| « Resume ce document » | « Resume ce contrat de bail en 5 points cles : parties, duree, loyer, clauses resolutoires, et conditions de renouvellement » |
| « Ecris un mail » | « Redige un email professionnel a un client pour l''informer du report de l''audience du 15 mars. Ton formel mais empathique. » |

### 2. Donnez du contexte

Claude ne sait rien de votre situation. Plus vous lui donnez de contexte, plus sa reponse sera pertinente.

**Structure recommandee :**
```
[Role] Tu es un avocat specialise en droit du travail.
[Contexte] Mon client est un salarie en CDI licencie pour faute grave apres 12 ans d''anciennete.
[Tache] Analyse les motifs de licenciement suivants et identifie les faiblesses juridiques.
[Format] Presente ton analyse sous forme de tableau avec : motif, base legale, force/faiblesse, recommandation.
```

### 3. Specifiez le format de sortie

Si vous ne precisez pas le format, Claude choisira lui-meme. Soyez explicite :

- « Reponds en bullet points »
- « Presente sous forme de tableau »
- « Limite ta reponse a 200 mots »
- « Utilise des titres et sous-titres en markdown »

### 4. Decomposez les taches complexes

Plutot qu''un seul prompt enorme, decomposez en etapes :

1. D''abord : « Identifie les parties et les obligations de chaque partie dans ce contrat »
2. Ensuite : « Maintenant, analyse les clauses qui pourraient poser probleme pour le preneur »
3. Enfin : « Redige un resume executif de tes conclusions »

> **Regle d''or :** si vous n''etes pas satisfait de la reponse, le probleme vient probablement du prompt, pas de Claude.', 'text', 12, 1),

(m2_id, 'Techniques avancees de prompting',
'## Techniques avancees de prompting

### Le Few-Shot Prompting (exemples guides)

Montrez a Claude exactement ce que vous attendez en lui donnant des exemples :

```
Classe les emails suivants par urgence (haute/moyenne/basse).

Exemple 1 :
Email : « La deadline du depot des conclusions est demain 17h »
Classification : haute

Exemple 2 :
Email : « Rappel : reunion d''equipe vendredi prochain »
Classification : basse

Maintenant, classe cet email :
Email : « Le client demande une modification du contrat avant signature prevue jeudi »
```

Cette technique est extremement efficace quand le format de sortie doit etre precis.

### Le Chain-of-Thought (raisonnement etape par etape)

Demandez a Claude de raisonner explicitement :

```
Analyse cette situation juridique. Avant de donner ta conclusion,
raisonne etape par etape :
1. Identifie les faits pertinents
2. Determine les regles de droit applicables
3. Applique les regles aux faits
4. Formule ta conclusion
```

### Le Role Prompting

Attribuez un role precis a Claude pour cadrer ses reponses :

```
Tu es un avocat fiscaliste senior avec 20 ans d''experience.
Un client TPE te consulte sur l''optimisation de sa remuneration
de dirigeant (dividendes vs salaire). Explique les options
avec les implications sociales et fiscales de chacune.
```

### La validation croisee

Demandez a Claude de critiquer sa propre reponse :

```
[Apres une premiere reponse]
Maintenant, relis ta reponse et identifie :
- Les points qui pourraient etre inexacts
- Les nuances que tu as omises
- Les contre-arguments possibles
```

### Les delimiteurs pour les documents longs

Quand vous collez un document dans le prompt, encadrez-le clairement :

```
Analyse le contrat suivant :

<contrat>
[Texte du contrat colle ici]
</contrat>

Identifie les 3 clauses les plus risquees pour le preneur.
```', 'text', 13, 2);

-- Quiz Module 2
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : L''art du prompting', 'Verifiez que vous maitrisez les techniques de prompting.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'Quelle est la structure recommandee pour un bon prompt ?',
'multiple_choice',
'[{"id":"a","text":"Juste la question","isCorrect":false},{"id":"b","text":"Role + Contexte + Tache + Format","isCorrect":true},{"id":"c","text":"Le plus de texte possible","isCorrect":false},{"id":"d","text":"Un seul mot-cle","isCorrect":false}]',
'La structure Role + Contexte + Tache + Format permet a Claude de comprendre qui il est, la situation, ce qu''on attend de lui, et comment presenter sa reponse.', 1),

(q2_id, 'A quoi sert le few-shot prompting ?',
'multiple_choice',
'[{"id":"a","text":"A faire plusieurs requetes en parallele","isCorrect":false},{"id":"b","text":"A montrer a Claude le format exact attendu via des exemples","isCorrect":true},{"id":"c","text":"A accelerer les reponses","isCorrect":false},{"id":"d","text":"A reduire les couts","isCorrect":false}]',
'Le few-shot prompting consiste a fournir des exemples concrets pour que Claude comprenne exactement le format et le style de reponse attendus. C''est efficace pour les taches de classification et d''extraction.', 2),

(q2_id, 'Quelle technique demande a Claude de raisonner explicitement avant de conclure ?',
'multiple_choice',
'[{"id":"a","text":"Role Prompting","isCorrect":false},{"id":"b","text":"Few-Shot Prompting","isCorrect":false},{"id":"c","text":"Chain-of-Thought","isCorrect":true},{"id":"d","text":"Validation croisee","isCorrect":false}]',
'Le Chain-of-Thought demande a Claude de detailler son raisonnement etape par etape avant de donner sa conclusion, ce qui ameliore la qualite des analyses complexes.', 3),

(q2_id, 'Si la reponse de Claude n''est pas satisfaisante, que faut-il faire en premier ?',
'multiple_choice',
'[{"id":"a","text":"Changer de modele","isCorrect":false},{"id":"b","text":"Reformuler et preciser le prompt","isCorrect":true},{"id":"c","text":"Abandonner la tache","isCorrect":false},{"id":"d","text":"Relancer la meme requete plusieurs fois","isCorrect":false}]',
'La qualite de la reponse depend directement du prompt. Si le resultat n''est pas bon, la premiere action est de reformuler en etant plus specifique sur le contexte, la tache et le format attendu.', 4);

-- ──────────────────────────────────────────────────────────────────────
-- Module 3: Cas pratiques — Redaction professionnelle
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c1_id,
  'Cas pratiques : redaction professionnelle',
  'Apprenez a utiliser Claude pour rediger des documents professionnels de qualite : emails, notes, rapports.',
  'FileText', 25, 'moyen', 'Cas Pratiques', false, false, 3);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m3_id, 'Rediger des emails et courriers professionnels',
'## Rediger des emails et courriers professionnels

### Le prompt structurant

Pour obtenir un email professionnel de qualite, fournissez a Claude ces elements :

```
Redige un email professionnel avec ces parametres :
- Destinataire : [qui]
- Objet : [sujet]
- Ton : [formel/semi-formel/cordial]
- Points a aborder : [liste]
- Action attendue du destinataire : [ce qu''on attend]
- Contrainte : [longueur, delai, etc.]
```

### Exemple concret : relance client

**Prompt :**
```
Redige un email de relance pour un client qui n''a pas regle
une facture de 5 000 EUR echue depuis 15 jours.
- Ton : ferme mais courtois
- Rappeler le numero de facture : FA-2024-0847
- Mentionner les penalites de retard prevues aux CGV
- Proposer un echeancier si besoin
- Demander une reponse sous 5 jours
```

### Iteration et affinage

La premiere version n''est jamais parfaite. Iterez :

1. **Premiere passe :** Claude produit un brouillon
2. **Affinage :** « Rends le ton plus diplomatique dans le 2e paragraphe »
3. **Ajustement :** « Ajoute une reference a notre dernier echange telephonique du 10 mars »
4. **Finalisation :** « Raccourcis le mail a 150 mots maximum »

> **Astuce :** gardez vos meilleurs prompts dans un document partage d''equipe. Avec le temps, vous construirez une bibliotheque de prompts optimises pour chaque type de document.', 'text', 12, 1),

(m3_id, 'Resumer et analyser des documents',
'## Resumer et analyser des documents

### La technique des details cibles

Ne demandez jamais un resume generique. Precisez toujours **ce que vous cherchez** :

```
Resume ce contrat de prestation de services en extrayant :
1. Les obligations du prestataire (livraisons, delais, SLA)
2. Les obligations du client (paiement, fourniture d''acces)
3. Les clauses de responsabilite et limitations
4. Les conditions de resiliation
5. Les points d''attention ou risques identifies

Format : tableau avec colonnes [Theme | Contenu | Risque potentiel]
```

### Analyser des documents juridiques

Pour l''analyse juridique, utilisez le prompting par etapes :

**Etape 1 — Extraction :**
```
Lis ce contrat et liste toutes les obligations
de chaque partie sous forme de bullet points.
```

**Etape 2 — Analyse :**
```
Pour chaque obligation identifiee, evalue :
- Si elle est claire ou ambigue
- Si elle est equilibree entre les parties
- Les risques en cas de non-respect
```

**Etape 3 — Recommandations :**
```
Sur la base de ton analyse, propose les 5 modifications
prioritaires que je devrais negocier, classees par impact.
```

### La meta-resume pour les documents longs

Pour les documents qui depassent la fenetre de contexte (>150 pages), utilisez la technique du resume par morceaux :

1. Decoupez le document en sections logiques
2. Resumez chaque section separement
3. Demandez a Claude de synthetiser les resumes en un resume global

> **Important :** quand vous collez un document, utilisez toujours des delimiteurs (balises XML, triple tirets) pour que Claude distingue clairement le document de vos instructions.', 'text', 13, 2);

-- Quiz Module 3
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q3_id, m3_id, 'Quiz : Redaction et analyse', 'Testez vos competences en redaction assistee par Claude.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q3_id, 'Pour resumer un contrat, que faut-il toujours preciser dans le prompt ?',
'multiple_choice',
'[{"id":"a","text":"Juste dire resume-moi ce contrat","isCorrect":false},{"id":"b","text":"Les details specifiques a extraire et le format de sortie","isCorrect":true},{"id":"c","text":"Le nom de l''auteur du contrat","isCorrect":false},{"id":"d","text":"La date de creation du document","isCorrect":false}]',
'Sans direction claire, Claude ne sait pas quels details prioriser. Il faut toujours specifier les elements a extraire et le format souhaite.', 1),

(q3_id, 'Quelle est la meilleure approche pour analyser un document juridique complexe ?',
'multiple_choice',
'[{"id":"a","text":"Un seul prompt tres long","isCorrect":false},{"id":"b","text":"Decomposer en etapes : extraction, analyse, recommandations","isCorrect":true},{"id":"c","text":"Demander directement les conclusions","isCorrect":false},{"id":"d","text":"Copier-coller le document sans instruction","isCorrect":false}]',
'La decomposition en etapes (extraction puis analyse puis recommandations) produit des resultats beaucoup plus fiables que de demander tout en une seule fois.', 2),

(q3_id, 'Comment gerer un document trop long pour la fenetre de contexte ?',
'multiple_choice',
'[{"id":"a","text":"Abandonner et le lire manuellement","isCorrect":false},{"id":"b","text":"Le decouper en sections, resumer chacune, puis synthetiser","isCorrect":true},{"id":"c","text":"Envoyer le document entier en esperant que ca passe","isCorrect":false},{"id":"d","text":"N''envoyer que la premiere page","isCorrect":false}]',
'La technique de meta-resume consiste a decouper le document, resumer chaque partie, puis creer un resume global a partir des resumes partiels.', 3);

-- ──────────────────────────────────────────────────────────────────────
-- Module 4: Workflows et automatisation
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m4_id, c1_id,
  'Workflows et automatisation avec Claude',
  'Apprenez a integrer Claude dans vos processus de travail quotidiens pour automatiser les taches repetitives.',
  'Zap', 25, 'moyen', 'Automatisation', false, false, 4);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m4_id, 'Construire un workflow avec Claude',
'## Construire un workflow avec Claude

### Qu''est-ce qu''un workflow IA ?

Un workflow est une **sequence de taches** ou Claude intervient a une ou plusieurs etapes. L''objectif n''est pas de tout automatiser, mais d''accelerer les etapes a faible valeur ajoutee.

### Exemple : traitement d''un dossier client

**Sans IA (processus classique) :**
1. Recevoir le dossier (10 min)
2. Lire et comprendre les pieces (45 min)
3. Identifier les points juridiques (30 min)
4. Rediger une note de synthese (60 min)
5. Relire et corriger (20 min)

**Avec Claude dans le workflow :**
1. Recevoir le dossier (10 min)
2. Claude resume chaque piece et extrait les faits cles (5 min)
3. Vous verifiez et completez le resume (15 min)
4. Claude identifie les textes applicables et la jurisprudence potentielle (5 min)
5. Vous validez l''analyse juridique (15 min)
6. Claude redige un premier jet de note de synthese (5 min)
7. Vous affinez et finalisez (15 min)

**Gain : de 2h45 a 1h10** — soit un gain de 58 %.

### Les principes d''un bon workflow IA

1. **L''humain reste dans la boucle** : Claude propose, vous validez
2. **Decomposez en etapes** : chaque etape a un input et un output clair
3. **Verifiez les sorties critiques** : ne faites jamais confiance aveuglément a Claude pour des elements factuels
4. **Iterez** : le premier workflow n''est jamais optimal, ameliorez-le au fil de l''usage

### Les assistants specialises

Plutot que d''ecrire un prompt complet a chaque fois, configurez des **assistants pre-programmes** :

- **Assistant de synthese** : systeme prompt avec le format de resume standard du cabinet
- **Assistant de veille** : surveille et resume les nouvelles publications juridiques
- **Assistant de redaction** : connait vos modeles de courriers et votre style

> **Conseil :** commencez par automatiser la tache que vous faites le plus souvent et qui vous ennuie le plus. C''est la ou le ROI sera le plus visible.', 'text', 12, 1),

(m4_id, 'Extraction de donnees structurees',
'## Extraction de donnees structurees

### Le pouvoir de l''output structure

Claude excelle dans l''extraction d''informations structurees a partir de texte libre. C''est l''un de ses usages les plus fiables en entreprise.

### Exemple : extraire les informations d''un contrat

```
Extrait les informations suivantes de ce contrat et presente-les
en JSON :

{
  "parties": {
    "prestataire": { "nom": "", "siret": "", "adresse": "" },
    "client": { "nom": "", "siret": "", "adresse": "" }
  },
  "objet": "",
  "duree": { "debut": "", "fin": "", "reconduction": "" },
  "prix": { "montant_ht": "", "modalites_paiement": "" },
  "clauses_importantes": []
}

Si une information n''est pas presente dans le document,
mets "non specifie".

<contrat>
[Votre contrat ici]
</contrat>
```

### L''importance des schemas stricts

Quand vous demandez un output JSON :
- Definissez toujours la structure attendue
- Incluez des champs optionnels avec « non specifie » plutot que de les omettre
- Demandez a Claude de ne jamais inventer une information absente

### Cas d''usage courants en entreprise

| Tache | Input | Output structure |
|-------|-------|-----------------|
| Analyse de CV | PDF du CV | JSON avec competences, experience, formation |
| Traitement de factures | Image/PDF de facture | JSON avec montant, fournisseur, date, TVA |
| Classification d''emails | Texte d''email | Categorie + urgence + action requise |
| Extraction contractuelle | Texte du contrat | Parties, obligations, dates cles, risques |

> **Astuce avancee :** pour les extractions repetitives, creez un prompt template avec des exemples (few-shot) pour garantir la coherence du format de sortie.', 'text', 13, 2);

-- Quiz Module 4
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q4_id, m4_id, 'Quiz : Workflows et automatisation', 'Testez vos connaissances sur l''integration de Claude dans vos processus.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q4_id, 'Quel est le principe fondamental d''un workflow IA bien concu ?',
'multiple_choice',
'[{"id":"a","text":"Tout automatiser pour eliminer l''intervention humaine","isCorrect":false},{"id":"b","text":"L''humain reste dans la boucle : Claude propose, vous validez","isCorrect":true},{"id":"c","text":"Laisser Claude decider seul des etapes","isCorrect":false},{"id":"d","text":"N''utiliser Claude que pour la redaction finale","isCorrect":false}]',
'Un bon workflow IA garde l''humain dans la boucle de decision. Claude accelere les taches a faible valeur ajoutee, mais les validations critiques restent humaines.', 1),

(q4_id, 'Quand vous demandez un output JSON a Claude, pourquoi faut-il definir la structure a l''avance ?',
'multiple_choice',
'[{"id":"a","text":"Pour que Claude aille plus vite","isCorrect":false},{"id":"b","text":"Pour garantir un format coherent et eviter que Claude invente des champs","isCorrect":true},{"id":"c","text":"Ce n''est pas necessaire, Claude devine le format","isCorrect":false},{"id":"d","text":"Pour reduire le nombre de tokens","isCorrect":false}]',
'Un schema strict garantit la coherence entre les extractions et empeche Claude d''inventer des informations ou d''omettre des champs importants.', 2);

-- ──────────────────────────────────────────────────────────────────────
-- Module 5: Les limites et les pieges
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m5_id, c1_id,
  'Les limites et les pieges a eviter',
  'Comprenez les limitations de Claude pour les anticiper et construire des processus fiables.',
  'AlertTriangle', 20, 'moyen', 'Bonnes Pratiques', false, false, 5);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m5_id, 'Les hallucinations et comment les eviter',
'## Les hallucinations et comment les eviter

### Qu''est-ce qu''une hallucination ?

Une hallucination, c''est quand Claude genere une information **fausse mais presentee avec assurance**. Exemples :
- Inventer une reference de jurisprudence qui n''existe pas
- Citer un article de loi avec un mauvais numero
- Attribuer une citation a la mauvaise personne
- Inventer des statistiques

### Pourquoi Claude hallucine-t-il ?

Claude genere du texte de maniere **probabiliste** : il predit le mot suivant le plus vraisemblable. Quand il ne « connait » pas la reponse, il peut generer un texte plausible mais faux, car son objectif est de produire un texte coherent, pas forcement factuel.

### Comment reduire les hallucinations

**1. Demandez des citations et sources**
```
Cite les articles de loi exacts et les references
de jurisprudence. Si tu n''es pas sur d''une reference,
indique clairement "a verifier".
```

**2. Autorisez Claude a dire « je ne sais pas »**
```
Si tu ne connais pas la reponse ou si tu n''es pas certain,
dis-le explicitement plutot que de deviner.
```

**3. Verifiez les faits critiques**
Ne faites JAMAIS confiance a Claude pour :
- Les numeros d''articles de loi
- Les references de jurisprudence
- Les dates precises
- Les chiffres et statistiques

**4. Utilisez Claude pour structurer, pas pour sourcer**
Claude est excellent pour organiser, reformuler et analyser des informations que VOUS lui fournissez. Il est moins fiable quand il doit retrouver des faits de memoire.

> **Regle d''or en milieu professionnel :** utilisez Claude comme un stagiaire brillant. Il travaille vite et bien, mais vous relisez toujours son travail avant de le signer.', 'text', 10, 1),

(m5_id, 'Les biais et la confidentialite',
'## Les biais et la confidentialite

### Les biais de Claude

Comme tout modele de langage, Claude peut avoir des biais :
- **Biais de confirmation** : tendance a aller dans le sens de votre question
- **Biais de recence** : les informations recentes de son entrainement pesent plus
- **Biais culturel** : entrainement principalement sur des sources anglophones

**Comment les mitiger :**
- Demandez explicitement les contre-arguments
- Posez la question sous plusieurs angles
- Comparez avec d''autres sources

### Les risques de confidentialite

**Regles fondamentales :**

1. **Ne partagez jamais de donnees personnelles identifiantes** dans Claude.ai (version grand public)
2. **Les conversations sur Claude.ai peuvent etre utilisees pour l''entrainement** (sauf opt-out)
3. **L''API et les plans professionnels** offrent des garanties de non-retention

### Que faire en environnement professionnel ?

- Utilisez toujours la version **API ou professionnelle** pour les donnees clients
- **Anonymisez** les donnees avant de les soumettre a Claude
- Verifiez la **politique de confidentialite** de votre outil (Data Ring utilise l''API, pas les donnees d''entrainement)
- Creez des **regles internes** sur ce qui peut et ne peut pas etre soumis a Claude

> **Attention :** le module specialise « Claude & Donnees Confidentielles » approfondit ce sujet pour les environnements avec des donnees sensibles.', 'text', 10, 2);

-- Quiz Module 5
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q5_id, m5_id, 'Quiz : Limites et pieges', 'Testez votre comprehension des limites de Claude.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q5_id, 'Qu''est-ce qu''une hallucination de Claude ?',
'multiple_choice',
'[{"id":"a","text":"Un bug technique","isCorrect":false},{"id":"b","text":"Une information fausse mais presentee avec assurance","isCorrect":true},{"id":"c","text":"Une reponse trop longue","isCorrect":false},{"id":"d","text":"Un refus de repondre","isCorrect":false}]',
'Une hallucination est une information inventee par Claude mais presentee de maniere convaincante. C''est le risque principal a connaitre.', 1),

(q5_id, 'Quelle est la meilleure analogie pour l''usage de Claude en milieu professionnel ?',
'multiple_choice',
'[{"id":"a","text":"Un moteur de recherche infaillible","isCorrect":false},{"id":"b","text":"Un stagiaire brillant dont on relit toujours le travail","isCorrect":true},{"id":"c","text":"Un expert qui a toujours raison","isCorrect":false},{"id":"d","text":"Un logiciel de calcul deterministe","isCorrect":false}]',
'Claude travaille vite et bien, mais comme un stagiaire, son travail doit toujours etre verifie par un professionnel avant validation.', 2),

(q5_id, 'Les conversations sur Claude.ai (version gratuite) peuvent-elles etre utilisees pour l''entrainement ?',
'true_false',
'[{"id":"a","text":"Vrai","isCorrect":true},{"id":"b","text":"Faux","isCorrect":false}]',
'Par defaut, les conversations sur Claude.ai peuvent contribuer a l''entrainement du modele. Les versions API et professionnelles offrent des garanties de non-retention des donnees.', 3);

-- ──────────────────────────────────────────────────────────────────────
-- Module 6: Claude pour le juridique
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m6_id, c1_id,
  'Claude pour les professionnels du droit',
  'Cas d''usage specifiques pour les avocats, juristes et professions reglementees.',
  'Scale', 30, 'moyen', 'Juridique', false, false, 6);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m6_id, 'Recherche juridique assistee par IA',
'## Recherche juridique assistee par IA

### Ce que Claude peut faire pour votre recherche

Claude peut accelerer considerablement la recherche juridique, mais avec des precautions importantes.

### Utilisations fiables

**1. Structurer une problematique juridique**
```
Je dois conseiller un client sur la rupture conventionnelle
d''un salarie protege. Structure ma recherche :
- Questions juridiques a traiter
- Textes de reference a consulter
- Points de jurisprudence a verifier
```

**2. Analyser un texte de loi que vous fournissez**
```
Voici l''article L.1237-15 du Code du travail :
[texte colle]

Explique les conditions de validite de la rupture
conventionnelle pour un salarie protege selon cet article.
```

**3. Comparer des regimes juridiques**
```
Compare les regimes de responsabilite du dirigeant en :
- SAS
- SARL
- SA

Presente sous forme de tableau avec : fondement juridique,
conditions, sanctions, prescription.
```

### Utilisations risquees (a verifier systematiquement)

- **Citations de jurisprudence** : Claude peut inventer des numeros d''arret
- **Numeros d''articles** : verifiez toujours sur Legifrance
- **Etat du droit actuel** : les connaissances de Claude ont une date de coupure

### Workflow de recherche juridique recommande

1. **Claude structure** votre problematique et identifie les axes de recherche
2. **Vous verifiez** les textes sur les bases officielles (Legifrance, EUR-Lex)
3. **Claude analyse** les textes que vous lui fournissez
4. **Vous validez** l''analyse et la completez
5. **Claude redige** une premiere synthese
6. **Vous finalisez** et signez

> **Principe fondamental :** Claude est votre assistant de recherche, pas votre source. Les sources, ce sont les textes officiels.', 'text', 15, 1),

(m6_id, 'Redaction juridique assistee',
'## Redaction juridique assistee

### Rediger des conclusions

Claude peut aider a structurer et rediger des conclusions, mais le contenu juridique doit etre verifie :

```
Redige un projet de conclusions en reponse avec la structure suivante :
1. Rappel des faits
2. Discussion (moyens de droit)
3. Par ces motifs

Contexte :
- Juridiction : Tribunal judiciaire de Paris
- Parties : [demandeur] c/ [defendeur]
- Objet : action en responsabilite contractuelle
- Faits cles : [decrire les faits]
- Arguments adverses : [resumer les conclusions adverses]
- Nos arguments : [lister vos moyens]

Style : formel, juridique, precis. Utilise le vouvoiement.
```

### Rediger des actes types

Pour les actes repetitifs, creez des prompts templates :

**Statuts de SAS :**
```
Redige un projet de statuts de SAS avec les parametres suivants :
- Denomination : [nom]
- Siege social : [adresse]
- Objet : [activite]
- Capital : [montant]
- Associes : [liste avec apports]
- President : [nom]
- Duree : 99 ans
- Exercice social : 1er janvier au 31 decembre

Inclus les clauses standard + une clause d''agrement
et une clause de preemption.
```

### Revue de contrats

L''un des meilleurs usages de Claude pour un juriste :

```
Relis ce contrat du point de vue du [preneur/bailleur/prestataire/client].
Identifie :
1. Les clauses desequilibrees
2. Les clauses absentes qui devraient y figurer
3. Les ambiguites de redaction
4. Les risques principaux

Pour chaque point, propose une reformulation.
```

> **Conseil :** construisez progressivement votre bibliotheque de prompts juridiques. En 3 mois d''usage, vous aurez un veritable kit d''acceleration.', 'text', 15, 2);

-- Quiz Module 6
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q6_id, m6_id, 'Quiz : Claude et le juridique', 'Verifiez vos connaissances sur l''usage de Claude dans le domaine juridique.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q6_id, 'Pourquoi ne faut-il jamais se fier a Claude pour les references de jurisprudence ?',
'multiple_choice',
'[{"id":"a","text":"Claude ne connait pas le droit","isCorrect":false},{"id":"b","text":"Claude peut inventer des numeros d''arret qui n''existent pas","isCorrect":true},{"id":"c","text":"Les references changent tous les jours","isCorrect":false},{"id":"d","text":"Claude refuse de donner des references","isCorrect":false}]',
'Claude genere du texte probabiliste et peut creer des references de jurisprudence plausibles mais fictives. Il faut toujours verifier sur les bases officielles.', 1),

(q6_id, 'Quel est le role ideal de Claude dans un workflow de recherche juridique ?',
'multiple_choice',
'[{"id":"a","text":"Source principale de droit","isCorrect":false},{"id":"b","text":"Assistant de recherche qui structure et analyse, pas source","isCorrect":true},{"id":"c","text":"Remplacant de Legifrance","isCorrect":false},{"id":"d","text":"Outil de signature electronique","isCorrect":false}]',
'Claude est un assistant de recherche qui structure les problematiques et analyse les textes fournis. Les sources de droit restent les bases officielles (Legifrance, EUR-Lex).', 2),

(q6_id, 'Quel est le meilleur usage de Claude pour la revue de contrats ?',
'multiple_choice',
'[{"id":"a","text":"Signer les contrats automatiquement","isCorrect":false},{"id":"b","text":"Identifier les clauses desequilibrees, absentes ou ambigues","isCorrect":true},{"id":"c","text":"Negocier directement avec la partie adverse","isCorrect":false},{"id":"d","text":"Rediger le contrat sans supervision","isCorrect":false}]',
'Claude excelle dans l''identification des problemes contractuels : clauses desequilibrees, manquantes ou ambigues. C''est un des usages les plus fiables en juridique.', 3);

-- ──────────────────────────────────────────────────────────────────────
-- Module 7: Evaluation et certification
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m7_id, c1_id,
  'Evaluation finale et bonnes pratiques',
  'Synthese des bonnes pratiques et evaluation finale pour valider vos competences.',
  'Award', 15, 'moyen', 'Evaluation', false, false, 7);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m7_id, 'Checklist des bonnes pratiques',
'## Checklist des bonnes pratiques

### Avant d''utiliser Claude

- [ ] J''ai identifie si la tache est adaptee a l''IA (repetitive, structurable, non-critique)
- [ ] J''ai verifie que je n''envoie pas de donnees personnelles non anonymisees
- [ ] J''ai choisi le bon modele (Opus pour l''analyse, Sonnet pour le quotidien, Haiku pour les taches simples)

### Pendant l''utilisation

- [ ] Mon prompt inclut : role, contexte, tache, format
- [ ] J''ai utilise des delimiteurs pour les documents
- [ ] J''ai decompose les taches complexes en etapes
- [ ] J''ai demande a Claude de signaler ses incertitudes

### Apres la reponse

- [ ] J''ai verifie les faits critiques (references, chiffres, dates)
- [ ] J''ai relu le contenu avant de l''utiliser
- [ ] J''ai itere si le premier resultat n''etait pas satisfaisant
- [ ] J''ai sauvegarde mes meilleurs prompts pour reutilisation

### En equipe

- [ ] Nous avons une bibliotheque de prompts partagee
- [ ] Nous avons des regles claires sur les donnees acceptables
- [ ] Nous formons les nouveaux arrivants
- [ ] Nous mesurons les gains de productivite

> **Vous avez termine Claude 101 !** Passez le quiz final pour valider vos competences. Pour aller plus loin sur les donnees confidentielles, consultez la formation specialisee « Claude & Donnees Confidentielles en Entreprise ».', 'text', 15, 1);

-- Quiz Module 7 (Final)
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q7_id, m7_id, 'Evaluation finale Claude 101', 'Evaluation finale pour valider l''ensemble de vos competences.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q7_id, 'Un collegue vous demande de copier-coller un dossier client complet dans Claude.ai (version gratuite) pour obtenir un resume. Que faites-vous ?',
'multiple_choice',
'[{"id":"a","text":"Je le fais, c''est rapide et pratique","isCorrect":false},{"id":"b","text":"Je refuse et j''utilise la version API/professionnelle ou j''anonymise les donnees","isCorrect":true},{"id":"c","text":"Je demande au client la permission","isCorrect":false},{"id":"d","text":"Je le fais mais je supprime la conversation apres","isCorrect":false}]',
'Les donnees clients ne doivent jamais etre envoyees sur Claude.ai (version gratuite) car elles peuvent etre utilisees pour l''entrainement. Utilisez la version API/pro ou anonymisez.', 1),

(q7_id, 'Claude vous fournit une reference de jurisprudence pour etayer votre argument. Quelle est la bonne reaction ?',
'multiple_choice',
'[{"id":"a","text":"L''utiliser directement dans mes conclusions","isCorrect":false},{"id":"b","text":"Verifier la reference sur Legifrance ou une base juridique officielle","isCorrect":true},{"id":"c","text":"Demander a Claude s''il est sur de sa reference","isCorrect":false},{"id":"d","text":"L''ignorer car Claude se trompe toujours","isCorrect":false}]',
'Toute reference juridique fournie par Claude doit etre verifiee sur une source officielle. Claude peut halluciner des references qui semblent vraies mais sont fictives.', 2),

(q7_id, 'Vous voulez que Claude analyse un contrat de 200 pages. Quelle est la meilleure approche ?',
'multiple_choice',
'[{"id":"a","text":"Envoyer les 200 pages d''un coup","isCorrect":false},{"id":"b","text":"Decouper en sections, resumer chacune, puis synthetiser","isCorrect":true},{"id":"c","text":"N''envoyer que la premiere et la derniere page","isCorrect":false},{"id":"d","text":"Demander a Claude de telecharger le document","isCorrect":false}]',
'Pour les documents longs, la technique de meta-resume (decouper, resumer par section, synthetiser) est la plus fiable et evite les pertes d''information.', 3),

(q7_id, 'Quel est le gain de productivite typique quand Claude est bien integre dans un workflow juridique ?',
'multiple_choice',
'[{"id":"a","text":"Aucun gain, c''est un gadget","isCorrect":false},{"id":"b","text":"40 a 60 % sur les taches de synthese et redaction","isCorrect":true},{"id":"c","text":"100 %, il remplace le juriste","isCorrect":false},{"id":"d","text":"5 % maximum","isCorrect":false}]',
'Un workflow bien concu avec Claude permet typiquement de gagner 40 a 60 % de temps sur les taches de synthese, redaction et extraction, tout en gardant la validation humaine.', 4);

END $$;


-- ============================================================================
-- COURSE 1 BIS: Claude 101 — Version Organisation (meme contenu, audience orga)
-- ============================================================================
DO $$
DECLARE
  c1b_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  m4_id UUID := gen_random_uuid();
  m5_id UUID := gen_random_uuid();
  m6_id UUID := gen_random_uuid();
  m7_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
  q4_id UUID := gen_random_uuid();
  q5_id UUID := gen_random_uuid();
  q6_id UUID := gen_random_uuid();
  q7_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c1b_id, NULL, NULL,
  'Claude 101 : Maitriser l''IA en Entreprise',
  'Formation pratique pour apprendre a utiliser Claude dans un contexte professionnel. Du prompt engineering aux workflows avances, maitrisez l''IA generative pour gagner en productivite.',
  'organisation', 'Bot', '#7C3AED', 'Intelligence Artificielle', true, true, 1);

-- Duplicate all modules/lessons/quizzes with same content but new IDs for organisation audience
-- Module 1
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c1b_id, 'Comprendre Claude : les fondamentaux', 'Decouvrez ce qu''est Claude, comment il fonctionne, et ce qui le differencie des autres IA generatives.', 'Brain', 20, 'facile', 'Fondamentaux', false, false, 1);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m1_id, 'Qu''est-ce que Claude ?', 'Contenu identique a la version adultes — voir le cours Claude 101 audience adultes pour le contenu complet des lecons.', 'text', 10, 1);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m1_id, 'L''interface et les modes d''interaction', 'Contenu identique a la version adultes.', 'text', 10, 2);

-- Module 2
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c1b_id, 'L''art du prompting : bien communiquer avec Claude', 'Apprenez les techniques de prompt engineering pour obtenir des reponses precises et exploitables.', 'PenTool', 25, 'facile', 'Prompt Engineering', false, false, 2);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m2_id, 'Les principes du bon prompt', 'Contenu identique a la version adultes.', 'text', 12, 1);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m2_id, 'Techniques avancees de prompting', 'Contenu identique a la version adultes.', 'text', 13, 2);

-- Module 3
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c1b_id, 'Cas pratiques : redaction professionnelle', 'Apprenez a utiliser Claude pour rediger des documents professionnels de qualite.', 'FileText', 25, 'moyen', 'Cas Pratiques', false, false, 3);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m3_id, 'Rediger des emails et courriers professionnels', 'Contenu identique a la version adultes.', 'text', 12, 1);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m3_id, 'Resumer et analyser des documents', 'Contenu identique a la version adultes.', 'text', 13, 2);

-- Module 4
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m4_id, c1b_id, 'Workflows et automatisation avec Claude', 'Integrez Claude dans vos processus de travail quotidiens.', 'Zap', 25, 'moyen', 'Automatisation', false, false, 4);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m4_id, 'Construire un workflow avec Claude', 'Contenu identique a la version adultes.', 'text', 12, 1);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m4_id, 'Extraction de donnees structurees', 'Contenu identique a la version adultes.', 'text', 13, 2);

-- Module 5
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m5_id, c1b_id, 'Les limites et les pieges a eviter', 'Comprenez les limitations de Claude pour les anticiper.', 'AlertTriangle', 20, 'moyen', 'Bonnes Pratiques', false, false, 5);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m5_id, 'Les hallucinations et comment les eviter', 'Contenu identique a la version adultes.', 'text', 10, 1);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m5_id, 'Les biais et la confidentialite', 'Contenu identique a la version adultes.', 'text', 10, 2);

-- Module 6
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m6_id, c1b_id, 'Claude pour les professionnels du droit', 'Cas d''usage specifiques pour les avocats et juristes.', 'Scale', 30, 'moyen', 'Juridique', false, false, 6);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m6_id, 'Recherche juridique assistee par IA', 'Contenu identique a la version adultes.', 'text', 15, 1);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m6_id, 'Redaction juridique assistee', 'Contenu identique a la version adultes.', 'text', 15, 2);

-- Module 7
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m7_id, c1b_id, 'Evaluation finale et bonnes pratiques', 'Synthese et evaluation finale.', 'Award', 15, 'moyen', 'Evaluation', false, false, 7);
INSERT INTO lessons (module_id, title, content, content_type, duration, "order") VALUES (m7_id, 'Checklist des bonnes pratiques', 'Contenu identique a la version adultes.', 'text', 15, 1);

END $$;


-- ============================================================================
-- COURSE 2: Claude & Donnees Confidentielles en Entreprise (ORGANISATION ONLY)
-- ============================================================================
DO $$
DECLARE
  c2_id UUID := gen_random_uuid();
  m1_id UUID := gen_random_uuid();
  m2_id UUID := gen_random_uuid();
  m3_id UUID := gen_random_uuid();
  m4_id UUID := gen_random_uuid();
  m5_id UUID := gen_random_uuid();
  q1_id UUID := gen_random_uuid();
  q2_id UUID := gen_random_uuid();
  q3_id UUID := gen_random_uuid();
  q4_id UUID := gen_random_uuid();
  q5_id UUID := gen_random_uuid();
BEGIN

INSERT INTO courses (id, organization_id, created_by, name, description, audience, icon, color, category, is_published, is_active, "order")
VALUES (c2_id, NULL, NULL,
  'Claude & Donnees Confidentielles en Entreprise',
  'Specialisation pour les professionnels travaillant avec des donnees sensibles : secret professionnel, RGPD, conformite, et bonnes pratiques pour utiliser l''IA sans compromettre la confidentialite.',
  'organisation', 'ShieldCheck', '#DC2626', 'Conformite & Securite', true, true, 2);

-- ──────────────────────────────────────────────────────────────────────
-- Module 1: Le paysage reglementaire
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m1_id, c2_id,
  'Le paysage reglementaire de l''IA et des donnees',
  'Comprenez le cadre juridique applicable a l''utilisation de l''IA avec des donnees sensibles : RGPD, secret professionnel, AI Act.',
  'Landmark', 30, 'moyen', 'Reglementation', false, false, 1);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m1_id, 'RGPD et IA generative',
'## RGPD et IA generative

### Les principes RGPD applicables a l''IA

L''utilisation de Claude avec des donnees personnelles est soumise au RGPD. Voici les principes cles :

### 1. Licitude du traitement (Art. 6)

Pour soumettre des donnees personnelles a Claude, vous devez disposer d''une **base legale** :
- **Interet legitime** : le plus courant en usage professionnel (analyse de dossiers, recherche)
- **Consentement** : si le traitement n''est pas strictement necessaire
- **Execution d''un contrat** : si l''usage de l''IA fait partie du service convenu

### 2. Minimisation des donnees (Art. 5.1.c)

Ne soumettez a Claude que les donnees **strictement necessaires** a la tache :

| Situation | Mauvaise pratique | Bonne pratique |
|-----------|-------------------|----------------|
| Analyse d''un litige | Envoyer le dossier complet avec toutes les pieces d''identite | Envoyer uniquement les faits pertinents, anonymises |
| Resume de contrat | Copier le contrat avec les coordonnees bancaires | Retirer les donnees bancaires avant l''envoi |
| Recherche jurisprudentielle | Inclure les noms reels des parties | Remplacer par « Societe A » et « M. X » |

### 3. Transfert de donnees (Art. 44-49)

Les serveurs de Claude sont heberges principalement aux Etats-Unis. Le transfert de donnees personnelles hors UE necessite des **garanties appropriees** :
- Clauses contractuelles types (CCT) signees avec Anthropic
- Verification que le sous-traitant (Anthropic) offre des garanties suffisantes

### 4. Sous-traitance (Art. 28)

Si vous utilisez Claude via un prestataire (comme Data Ring), celui-ci est **sous-traitant** au sens du RGPD :
- Un contrat de sous-traitance (DPA) doit etre signe
- Les finalites de traitement doivent etre documentees
- Les mesures de securite doivent etre specifiees

> **Point pratique :** avant d''utiliser Claude avec des donnees personnelles, verifiez que votre DPA couvre l''usage de l''IA generative.', 'text', 15, 1),

(m1_id, 'Secret professionnel et IA',
'## Secret professionnel et IA

### Le secret professionnel de l''avocat

Le secret professionnel de l''avocat (art. 66-5 de la loi du 31 decembre 1971) couvre **toutes les informations** echangees entre l''avocat et son client, y compris :
- Les consultations et correspondances
- Les pieces du dossier
- Les strategies processuelles

### L''IA met-elle en danger le secret ?

**Oui, si mal utilisee.** Quand vous soumettez un dossier client a Claude, vous transmettez des informations couvertes par le secret a un tiers (Anthropic).

### Les trois niveaux de risque

**Niveau 1 — Risque eleve (INTERDIT) :**
- Utiliser Claude.ai (version gratuite) avec des dossiers clients
- Partager des pieces identifiantes sur des IA non contractualisees
- Copier-coller des correspondances client-avocat

**Niveau 2 — Risque modere (ENCADRE) :**
- Utiliser l''API Claude avec un DPA signe
- Travailler via un intermediaire contractualise (ex: Data Ring)
- Condition : anonymisation prealable si possible

**Niveau 3 — Risque faible (RECOMMANDE) :**
- Anonymiser completement les donnees avant envoi
- Utiliser Claude uniquement pour la structure et la forme, pas pour les faits sensibles
- Instance privee de Claude (Claude Enterprise)

### Les regles du Conseil National des Barreaux

Le CNB a emis des recommandations sur l''usage de l''IA par les avocats :
1. Le secret professionnel doit etre garanti a chaque etape
2. L''avocat reste responsable du travail produit, meme assiste par l''IA
3. Le client doit etre informe de l''usage de l''IA quand c''est pertinent
4. L''IA ne peut pas se substituer au jugement professionnel de l''avocat

> **Regle d''or :** en cas de doute, anonymisez. Le cout de l''anonymisation est infiniment inferieur au risque d''une violation du secret professionnel.', 'text', 15, 2);

-- Quiz Module 1
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q1_id, m1_id, 'Quiz : Reglementation IA et donnees', 'Testez vos connaissances sur le cadre reglementaire.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q1_id, 'Quelle base legale RGPD est la plus courante pour l''usage professionnel de Claude avec des donnees personnelles ?',
'multiple_choice',
'[{"id":"a","text":"Le consentement de la personne concernee","isCorrect":false},{"id":"b","text":"L''interet legitime du responsable de traitement","isCorrect":true},{"id":"c","text":"L''obligation legale","isCorrect":false},{"id":"d","text":"La sauvegarde des interets vitaux","isCorrect":false}]',
'L''interet legitime est la base legale la plus adaptee pour l''usage professionnel de l''IA (analyse de dossiers, recherche, etc.) a condition de realiser une mise en balance avec les droits des personnes.', 1),

(q1_id, 'Un avocat peut-il copier-coller un dossier client complet dans Claude.ai (version gratuite) ?',
'true_false',
'[{"id":"a","text":"Vrai","isCorrect":false},{"id":"b","text":"Faux","isCorrect":true}]',
'Non. Claude.ai (version gratuite) ne garantit pas la confidentialite des donnees et peut les utiliser pour l''entrainement. C''est incompatible avec le secret professionnel.', 2),

(q1_id, 'Quel est le niveau de risque recommande pour l''usage de l''IA avec des dossiers clients ?',
'multiple_choice',
'[{"id":"a","text":"Risque eleve : utiliser Claude.ai directement","isCorrect":false},{"id":"b","text":"Risque faible : anonymiser et utiliser l''API ou une instance privee","isCorrect":true},{"id":"c","text":"Risque modere : utiliser l''API sans anonymisation","isCorrect":false},{"id":"d","text":"Aucun risque si on supprime la conversation apres","isCorrect":false}]',
'L''approche recommandee est d''anonymiser les donnees et d''utiliser l''API ou une instance privee. Supprimer la conversation ne supprime pas les donnees des serveurs.', 3);

-- ──────────────────────────────────────────────────────────────────────
-- Module 2: Techniques d''anonymisation
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m2_id, c2_id,
  'Techniques d''anonymisation pour l''IA',
  'Maitrisez les techniques pratiques pour anonymiser vos donnees avant de les soumettre a Claude.',
  'EyeOff', 25, 'moyen', 'Anonymisation', false, false, 2);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m2_id, 'Anonymisation vs pseudonymisation',
'## Anonymisation vs pseudonymisation

### Definitions

**Anonymisation** : transformation irreversible des donnees de sorte qu''il est impossible de reidentifier la personne, meme avec des informations supplementaires.

**Pseudonymisation** : remplacement des identifiants directs par des pseudonymes, avec conservation d''une table de correspondance permettant la reidentification.

### Quelle technique pour l''IA ?

| Critere | Anonymisation | Pseudonymisation |
|---------|---------------|------------------|
| Reversibilite | Irreversible | Reversible via table |
| Statut RGPD | Hors champ RGPD | Toujours soumise au RGPD |
| Utilite pour l''IA | Suffisante pour la plupart des usages | Necessaire quand on doit recontextualiser |
| Complexite | Plus simple | Plus complexe (gestion de la table) |

### En pratique avec Claude

Pour la plupart des usages avec Claude, la **pseudonymisation** est suffisante et plus pratique :

1. Remplacez les noms par des codes : « M. Dupont » → « Client A »
2. Remplacez les adresses : « 15 rue de la Paix, Paris » → « [Adresse Client A] »
3. Remplacez les numeros : SIRET, comptes bancaires → « [SIRET-A] »
4. Conservez les elements juridiquement pertinents : montants, dates, faits

### Les donnees a TOUJOURS retirer

Avant tout envoi a Claude, retirez systematiquement :
- Numeros de securite sociale
- Coordonnees bancaires completes (IBAN, numeros de carte)
- Mots de passe et identifiants
- Donnees de sante detaillees
- Donnees biometriques
- Numeros de pieces d''identite

> **Astuce :** creez un processus d''anonymisation standardise dans votre equipe. Un simple « rechercher-remplacer » dans votre traitement de texte peut couvrir 80 % des cas.', 'text', 12, 1),

(m2_id, 'Protocole d''anonymisation en 5 etapes',
'## Protocole d''anonymisation en 5 etapes

### Etape 1 : Identifier les donnees sensibles

Faites un inventaire des donnees presentes dans le document :
- **Identifiants directs** : noms, prenoms, adresses email, numeros de telephone
- **Identifiants indirects** : adresses, dates de naissance, postes occupes (qui, combines, permettent l''identification)
- **Donnees sensibles** : donnees de sante, opinions politiques, orientation sexuelle, condamnations

### Etape 2 : Choisir la technique

- **Remplacement** : « Jean Dupont » → « Personne A » (le plus courant)
- **Generalisation** : « 42 ans » → « 40-50 ans »
- **Suppression** : retirer completement l''information non pertinente
- **Masquage** : « 06 12 34 56 78 » → « 06 XX XX XX XX »

### Etape 3 : Creer la table de correspondance

```
Personne A = Jean Dupont (directeur commercial)
Personne B = Marie Martin (DRH)
Societe X = Dupont SARL
Societe Y = Martin & Associes
Adresse 1 = 15 rue de la Paix, 75002 Paris
```

Conservez cette table **localement** (jamais dans Claude).

### Etape 4 : Verifier l''anonymisation

Avant d''envoyer a Claude, relisez le document anonymise et posez-vous la question : « Si quelqu''un lit ce texte, peut-il identifier les personnes concernees ? »

Verifiez :
- Les noms dans les en-tetes et pieds de page
- Les references de dossier qui contiennent des noms
- Les adresses email dans le corps du texte
- Les metadonnees du document (auteur, etc.)

### Etape 5 : Recontextualiser les resultats

Apres avoir recu la reponse de Claude, replacez les vrais noms a l''aide de votre table de correspondance.

> **Gain de temps :** avec l''habitude, l''anonymisation d''un document de 10 pages prend 5 a 10 minutes. C''est un investissement minimal par rapport au risque evite.', 'text', 13, 2);

-- Quiz Module 2
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q2_id, m2_id, 'Quiz : Anonymisation', 'Verifiez vos competences en anonymisation.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q2_id, 'Quelle est la difference entre anonymisation et pseudonymisation ?',
'multiple_choice',
'[{"id":"a","text":"Aucune, ce sont des synonymes","isCorrect":false},{"id":"b","text":"L''anonymisation est irreversible, la pseudonymisation est reversible via une table de correspondance","isCorrect":true},{"id":"c","text":"La pseudonymisation est plus securisee","isCorrect":false},{"id":"d","text":"L''anonymisation necessite un logiciel special","isCorrect":false}]',
'L''anonymisation rend impossible la reidentification. La pseudonymisation remplace les identifiants par des codes, avec une table de correspondance conservee separement.', 1),

(q2_id, 'Ou doit etre conservee la table de correspondance ?',
'multiple_choice',
'[{"id":"a","text":"Dans la conversation Claude","isCorrect":false},{"id":"b","text":"Localement, jamais dans Claude","isCorrect":true},{"id":"c","text":"Dans un email au client","isCorrect":false},{"id":"d","text":"Dans le cloud public","isCorrect":false}]',
'La table de correspondance doit rester locale et securisee. L''envoyer a Claude annulerait tout l''interet de l''anonymisation.', 2),

(q2_id, 'Quelles donnees doivent etre TOUJOURS retirees avant envoi a Claude ?',
'multiple_choice',
'[{"id":"a","text":"Les dates du contrat","isCorrect":false},{"id":"b","text":"Les montants financiers","isCorrect":false},{"id":"c","text":"Les numeros de securite sociale et coordonnees bancaires completes","isCorrect":true},{"id":"d","text":"Les noms des societes","isCorrect":false}]',
'Les numeros de securite sociale, coordonnees bancaires, mots de passe et donnees biometriques ne doivent jamais etre envoyes a Claude, meme sur l''API.', 3);

-- ──────────────────────────────────────────────────────────────────────
-- Module 3: Architecture securisee
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m3_id, c2_id,
  'Architecture securisee pour l''IA en entreprise',
  'Comprenez les differentes architectures de deploiement de Claude et leurs implications en termes de securite.',
  'Server', 25, 'expert', 'Architecture', false, false, 3);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m3_id, 'Les options de deploiement de Claude',
'## Les options de deploiement de Claude

### 1. Claude.ai (grand public)

**Securite :** minimale pour les donnees d''entreprise
- Les donnees **peuvent** etre utilisees pour l''entrainement (sauf opt-out)
- Pas de DPA
- Pas de garanties sur la retention des donnees
- **Usage :** uniquement pour des recherches generiques sans donnees sensibles

### 2. Claude API (Anthropic)

**Securite :** correcte avec DPA
- Les donnees ne sont **pas** utilisees pour l''entrainement
- Retention de 30 jours pour la detection d''abus, puis suppression
- DPA disponible (Data Processing Agreement)
- Chiffrement en transit (TLS) et au repos
- **Usage :** usage professionnel standard avec anonymisation

### 3. Claude Enterprise / Team

**Securite :** elevee
- Zero retention des donnees
- SSO / SAML pour l''authentification
- Controle d''acces granulaire
- Journalisation des usages
- **Usage :** equipes qui travaillent regulierement avec des donnees sensibles

### 4. Claude sur AWS Bedrock / Google Vertex AI

**Securite :** maximale
- Les donnees ne quittent **jamais** votre infrastructure cloud
- Conformite avec les certifications de votre fournisseur cloud (SOC 2, ISO 27001, HDS)
- Controle total sur la retention et le chiffrement
- **Usage :** donnees hautement sensibles, secteurs reglementes (sante, finance, defense)

### 5. Intermediaire specialise (ex: Data Ring)

**Securite :** adaptee
- API Claude en back-end avec DPA
- Couche d''anonymisation integree
- Logs et audit des usages
- Controle des modeles et des couts par organisation
- **Usage :** cabinets d''avocats et entreprises qui veulent un cadre cle en main

### Comment choisir ?

| Type de donnees | Deploiement recommande |
|-----------------|----------------------|
| Recherche generique, pas de donnees sensibles | Claude.ai ou API |
| Donnees clients pseudonymisees | API avec DPA |
| Dossiers juridiques, donnees de sante | Enterprise ou Bedrock/Vertex |
| Donnees classifiees defense | Uniquement on-premise (non disponible actuellement) |

> **Principe :** le niveau de securite du deploiement doit etre proportionnel a la sensibilite des donnees.', 'text', 12, 1),

(m3_id, 'Politique interne d''usage de l''IA',
'## Politique interne d''usage de l''IA

### Pourquoi une politique interne ?

Sans regles claires, chaque collaborateur utilisera l''IA a sa facon — avec des risques inconsistants. Une politique interne permet de :
- Definir ce qui est autorise et interdit
- Standardiser les pratiques d''anonymisation
- Responsabiliser les utilisateurs
- Couvrir l''organisation juridiquement

### Modele de politique interne

**1. Perimetre**
- Outils autorises : [lister les outils valides, ex: Data Ring, Claude API]
- Outils interdits : [Claude.ai gratuit, ChatGPT gratuit, etc.]

**2. Classification des donnees**

| Niveau | Description | Regles IA |
|--------|-------------|-----------|
| **Public** | Informations diffusees publiquement | Utilisation libre |
| **Interne** | Documents internes non sensibles | IA autorisee avec precaution |
| **Confidentiel** | Dossiers clients, donnees personnelles | IA autorisee apres anonymisation sur outil valide uniquement |
| **Strictement confidentiel** | Secret des affaires, defense | IA interdite ou instance privee uniquement |

**3. Regles d''anonymisation**
- Toute donnee de niveau « Confidentiel » ou superieur DOIT etre anonymisee
- Protocole d''anonymisation en 5 etapes (cf. module precedent)
- Table de correspondance conservee localement

**4. Responsabilites**
- L''utilisateur est responsable de l''anonymisation avant envoi
- Le DPO valide la politique et les outils autorises
- Le management s''assure de la formation des equipes

**5. Incidents**
- Procedure en cas d''envoi accidentel de donnees sensibles
- Notification au DPO dans les 24h
- Documentation de l''incident

**6. Formation**
- Formation obligatoire avant tout usage (cette formation !)
- Rappels trimestriels
- Mise a jour annuelle de la politique

> **Template disponible :** demandez a votre administrateur le template de politique IA adapte a votre organisation.', 'text', 13, 2);

-- Quiz Module 3
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q3_id, m3_id, 'Quiz : Architecture securisee', 'Testez vos connaissances sur les deploiements securises.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q3_id, 'Quel deploiement de Claude offre la securite maximale pour les donnees sensibles ?',
'multiple_choice',
'[{"id":"a","text":"Claude.ai (gratuit)","isCorrect":false},{"id":"b","text":"Claude API avec DPA","isCorrect":false},{"id":"c","text":"Claude sur AWS Bedrock ou Google Vertex AI","isCorrect":true},{"id":"d","text":"Claude Team","isCorrect":false}]',
'Bedrock/Vertex AI offre la securite maximale car les donnees ne quittent jamais votre infrastructure cloud et beneficient des certifications de votre fournisseur.', 1),

(q3_id, 'Quelle est la premiere etape pour mettre en place l''IA dans une organisation avec des donnees sensibles ?',
'multiple_choice',
'[{"id":"a","text":"Installer Claude sur tous les postes","isCorrect":false},{"id":"b","text":"Rediger une politique interne d''usage de l''IA avec classification des donnees","isCorrect":true},{"id":"c","text":"Former tout le monde au prompting","isCorrect":false},{"id":"d","text":"Attendre que la reglementation soit plus claire","isCorrect":false}]',
'La politique interne est le prerequis. Elle definit les outils autorises, la classification des donnees et les regles d''anonymisation avant tout deploiement.', 2);

-- ──────────────────────────────────────────────────────────────────────
-- Module 4: Cas pratiques juridiques avec donnees sensibles
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m4_id, c2_id,
  'Cas pratiques : l''IA avec des donnees sensibles',
  'Exercices concrets d''utilisation de Claude dans des scenarios juridiques reels avec anonymisation.',
  'BookOpen', 30, 'expert', 'Cas Pratiques', false, false, 4);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m4_id, 'Scenario 1 : Analyse d''un dossier de licenciement',
'## Scenario : Analyse d''un dossier de licenciement

### Le contexte

Vous etes avocat en droit du travail. Votre client, un salarie, conteste son licenciement pour faute grave. Vous devez analyser les pieces du dossier pour preparer votre strategie.

### Le dossier contient :
- Lettre de licenciement avec les motifs
- Contrat de travail
- Echanges d''emails entre le salarie et sa hierarchie
- Comptes rendus d''entretiens prealables
- Bulletins de salaire

### Etape 1 : Anonymiser le dossier

**Avant envoi a Claude :**

```
Remplacement :
- Jean-Pierre Martin → Salarie A
- Sophie Legrand (DRH) → RH-1
- Technovision SAS → Societe X
- 15 rue des Lilas, Lyon → [Adresse Societe X]
- SIRET 123 456 789 00012 → [SIRET-X]
- jean-pierre.martin@email.com → [email-A]

Donnees conservees (pertinentes juridiquement) :
- Dates (embauche, licenciement, entretiens)
- Anciennete (12 ans)
- Salaire brut (4 500 EUR/mois)
- Motifs de la lettre de licenciement
- Convention collective applicable
```

### Etape 2 : Prompt d''analyse

```
Tu es un avocat specialise en droit du travail francais.

Analyse le dossier de licenciement suivant du point de vue
du salarie (Salarie A). Identifie :

1. Les vices de forme eventuels dans la procedure
2. La qualification de la faute : est-ce que les faits
   constituent reellement une faute grave ?
3. Les moyens de defense exploitables
4. Les indemnites potentiellement dues

<lettre_licenciement>
[Texte anonymise de la lettre]
</lettre_licenciement>

<contrat_travail>
[Elements cles du contrat anonymise]
</contrat_travail>

Contexte : anciennete 12 ans, salaire brut 4 500 EUR/mois,
convention collective Syntec.
```

### Etape 3 : Verifier et completer

- Verifier les references legales citees par Claude sur Legifrance
- Completer avec la jurisprudence recente de la Cour de cassation
- Recontextualiser avec les vrais noms pour votre memo interne

> **Temps gagne :** l''analyse initiale qui prenait 2h peut etre ramenee a 30 min avec Claude, tout en respectant la confidentialite.', 'text', 15, 1),

(m4_id, 'Scenario 2 : Due diligence contractuelle',
'## Scenario : Due diligence contractuelle

### Le contexte

Votre cabinet est mandate pour une due diligence dans le cadre d''une acquisition. Vous devez analyser 150 contrats commerciaux pour identifier les risques.

### Le defi

150 contrats x 30 pages en moyenne = 4 500 pages a analyser. Manuellement : 3 a 4 semaines. Avec Claude : 3 a 4 jours.

### Le workflow securise

**1. Preparation batch**

Pour chaque contrat :
- Anonymiser les parties (Societe Cible → Target, Cocontractant → Counterparty-[N])
- Retirer les coordonnees bancaires
- Conserver : montants, durees, clauses cles

**2. Prompt template d''extraction**

```
Analyse ce contrat et extrait les informations suivantes
au format JSON :

{
  "type_contrat": "",
  "contrepartie": "",
  "date_signature": "",
  "date_expiration": "",
  "valeur_annuelle": "",
  "clause_resiliation": {
    "preavis": "",
    "conditions": "",
    "penalites": ""
  },
  "clause_non_concurrence": { "present": true/false, "details": "" },
  "clause_changement_controle": { "present": true/false, "details": "" },
  "risques_identifies": [],
  "score_risque": "faible/moyen/eleve/critique",
  "commentaires": ""
}

Si une information est absente, indiquer "non specifie".
Ne jamais inventer d''information.

<contrat>
[Texte anonymise du contrat]
</contrat>
```

**3. Agregation et analyse**

Apres extraction de tous les contrats :

```
Voici les analyses JSON de 150 contrats de la Societe Target.
Produis un rapport de synthese avec :
1. Vue d''ensemble : types de contrats et valeurs
2. Top 10 des risques les plus critiques
3. Contrats avec clause de changement de controle (bloquants pour l''acquisition)
4. Recommandations priorisees

Format : rapport executif de 2 pages maximum.
```

### Les regles de securite specifiques

- Chaque contrat est anonymise individuellement
- Les extractions JSON sont stockees sur un serveur interne (pas dans Claude)
- La synthese finale est generee a partir des JSON, pas des contrats originaux
- L''acces au projet est restreint a l''equipe due diligence

> **ROI :** sur une due diligence typique, Claude reduit le cout de 60 a 70 % tout en augmentant la couverture (100 % des contrats analyses vs echantillonnage).', 'text', 15, 2);

-- Quiz Module 4
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q4_id, m4_id, 'Quiz : Cas pratiques', 'Verifiez votre maitrise des scenarios concrets.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q4_id, 'Dans le scenario du licenciement, quelles donnees faut-il anonymiser en priorite ?',
'multiple_choice',
'[{"id":"a","text":"Les dates et les montants","isCorrect":false},{"id":"b","text":"Les noms, adresses, emails et identifiants des personnes et entreprises","isCorrect":true},{"id":"c","text":"La convention collective applicable","isCorrect":false},{"id":"d","text":"Les motifs du licenciement","isCorrect":false}]',
'Les identifiants directs (noms, emails, adresses, SIRET) doivent etre anonymises. Les elements juridiquement pertinents (dates, montants, motifs, convention) sont conserves car necessaires a l''analyse.', 1),

(q4_id, 'Pourquoi la synthese de la due diligence est-elle generee a partir des JSON et non des contrats originaux ?',
'multiple_choice',
'[{"id":"a","text":"C''est plus rapide","isCorrect":false},{"id":"b","text":"Les JSON sont deja anonymises et structures, limitant l''exposition des donnees sensibles","isCorrect":true},{"id":"c","text":"Claude ne peut pas lire les contrats","isCorrect":false},{"id":"d","text":"Les JSON sont plus petits","isCorrect":false}]',
'Travailler a partir des extractions JSON deja anonymisees et structurees evite de re-exposer les contrats originaux a Claude et reduit le risque de fuite de donnees.', 2);

-- ──────────────────────────────────────────────────────────────────────
-- Module 5: Evaluation finale
-- ──────────────────────────────────────────────────────────────────────
INSERT INTO modules (id, course_id, title, description, icon, duration, difficulty, category, has_audio, is_locked, "order")
VALUES (m5_id, c2_id,
  'Evaluation finale : Donnees confidentielles',
  'Evaluez vos competences sur l''ensemble de la formation.',
  'Award', 15, 'expert', 'Evaluation', false, false, 5);

INSERT INTO lessons (module_id, title, content, content_type, duration, "order")
VALUES
(m5_id, 'Synthese et checklist conformite',
'## Synthese et checklist conformite

### Checklist avant chaque usage de Claude avec des donnees sensibles

**Verification prealable :**
- [ ] J''utilise un outil autorise par la politique interne
- [ ] J''ai identifie le niveau de sensibilite des donnees
- [ ] J''ai un DPA en place avec le fournisseur

**Anonymisation :**
- [ ] J''ai remplace tous les identifiants directs
- [ ] J''ai verifie les identifiants indirects
- [ ] J''ai retire les donnees bancaires, SSN, et donnees de sante
- [ ] J''ai conserve ma table de correspondance localement
- [ ] J''ai relu le document anonymise avant envoi

**Pendant l''utilisation :**
- [ ] Je ne partage pas la table de correspondance avec Claude
- [ ] Je verifie les references juridiques sur des sources officielles
- [ ] Je ne fais pas confiance aveuglément aux citations

**Apres l''utilisation :**
- [ ] J''ai recontextualise les resultats avec ma table
- [ ] J''ai documente l''usage (quel outil, quelles donnees, quel objectif)
- [ ] J''ai supprime les donnees temporaires

### Les 5 commandements

1. **Tu anonymiseras** tes donnees avant tout envoi
2. **Tu verifieras** toute reference juridique sur les sources officielles
3. **Tu n''enverras jamais** de donnees sur des outils non autorises
4. **Tu documenteras** ton usage de l''IA
5. **Tu resteras** responsable du travail produit

> **Felicitations !** Vous avez termine la formation specialisee. Passez le quiz final pour obtenir votre certification.', 'text', 15, 1);

-- Quiz Module 5 (Final)
INSERT INTO quizzes (id, module_id, title, description, passing_score)
VALUES (q5_id, m5_id, 'Evaluation finale : Donnees Confidentielles', 'Evaluation finale de la formation specialisee.', 70);

INSERT INTO quiz_questions (quiz_id, question, question_type, options, explanation, "order")
VALUES
(q5_id, 'Un associe vous demande d''analyser rapidement un contrat client urgent avec Claude.ai (gratuit) car l''API est en panne. Que faites-vous ?',
'multiple_choice',
'[{"id":"a","text":"J''utilise Claude.ai car c''est urgent","isCorrect":false},{"id":"b","text":"J''anonymise d''abord le contrat, puis j''utilise Claude.ai avec les donnees anonymisees","isCorrect":true},{"id":"c","text":"J''attends que l''API remarche, meme si ca prend 2 jours","isCorrect":false},{"id":"d","text":"J''envoie le contrat tel quel, c''est couvert par le DPA","isCorrect":false}]',
'Meme en cas d''urgence, l''anonymisation est non-negociable. Un contrat anonymise peut etre envoye sur n''importe quel outil car il ne contient plus de donnees sensibles.', 1),

(q5_id, 'Quelle est la difference entre l''API Claude et Claude.ai en termes de retention des donnees ?',
'multiple_choice',
'[{"id":"a","text":"Aucune difference","isCorrect":false},{"id":"b","text":"L''API ne retient pas les donnees pour l''entrainement, Claude.ai peut le faire","isCorrect":true},{"id":"c","text":"Claude.ai est plus securise car c''est la version officielle","isCorrect":false},{"id":"d","text":"L''API conserve les donnees plus longtemps","isCorrect":false}]',
'L''API Claude ne retient pas les donnees pour l''entrainement et offre un DPA. Claude.ai (gratuit) peut utiliser les conversations pour ameliorer le modele.', 2),

(q5_id, 'Dans une due diligence avec Claude, pourquoi anonymiser chaque contrat individuellement plutot qu''en bloc ?',
'multiple_choice',
'[{"id":"a","text":"C''est plus rapide","isCorrect":false},{"id":"b","text":"Pour maintenir la correspondance entre chaque contrat et sa table d''anonymisation","isCorrect":true},{"id":"c","text":"Claude ne peut traiter qu''un contrat a la fois","isCorrect":false},{"id":"d","text":"Ce n''est pas necessaire, un remplacement global suffit","isCorrect":false}]',
'Chaque contrat implique des parties differentes et necessite sa propre table de correspondance pour pouvoir recontextualiser les resultats correctement.', 3),

(q5_id, 'Quel est le premier reflexe quand vous recevez un dossier a analyser avec l''IA ?',
'multiple_choice',
'[{"id":"a","text":"L''envoyer directement a Claude pour gagner du temps","isCorrect":false},{"id":"b","text":"Classifier le niveau de sensibilite des donnees et anonymiser si necessaire","isCorrect":true},{"id":"c","text":"Demander au client s''il est d''accord","isCorrect":false},{"id":"d","text":"Verifier que Claude est disponible","isCorrect":false}]',
'Le premier reflexe est toujours de classifier la sensibilite des donnees, puis d''appliquer le protocole d''anonymisation adapte avant tout envoi.', 4);

END $$;
