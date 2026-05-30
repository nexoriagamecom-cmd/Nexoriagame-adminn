-- SCHEMA SUPABASE NEXORIAGAME
-- Copiez-collez ce SQL dans l'éditeur SQL de votre projet Supabase

-- Table produits
CREATE TABLE produits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  prix DECIMAL(10,2) NOT NULL,
  prix_barre DECIMAL(10,2),
  images TEXT[] DEFAULT '{}',
  categorie TEXT NOT NULL CHECK (categorie IN ('consoles','accessoires','jeux','univers-pc')),
  stock INTEGER DEFAULT 0,
  badge TEXT,
  variations JSONB DEFAULT '[]',
  actif BOOLEAN DEFAULT true,
  promo_countdown BOOLEAN DEFAULT false,
  promo_stock_limite BOOLEAN DEFAULT false,
  promo_viewers BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table commandes
CREATE TABLE commandes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  client_nom TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_telephone TEXT,
  client_adresse TEXT NOT NULL,
  client_ville TEXT NOT NULL,
  client_code_postal TEXT NOT NULL,
  produits JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente','payee','expediee','livree','annulee')),
  mode_paiement TEXT DEFAULT 'sogecommerce',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table paramètres
CREATE TABLE parametres (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cle TEXT UNIQUE NOT NULL,
  valeur TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paramètres par défaut
INSERT INTO parametres (cle, valeur) VALUES
  ('livraison_gratuite_seuil', '50'),
  ('delai_livraison', '48h'),
  ('annonce_barre', 'Livraison offerte dès 50€ | Prix réduits toute l''année | Paiement sécurisé'),
  ('site_actif', 'true');

-- Row Level Security
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;

-- Politiques: lecture publique pour produits actifs
CREATE POLICY "Produits actifs publics" ON produits FOR SELECT USING (actif = true);
CREATE POLICY "Admin produits" ON produits FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin commandes" ON commandes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Paramètres publics" ON parametres FOR SELECT USING (true);
CREATE POLICY "Admin parametres" ON parametres FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Insertion commandes" ON commandes FOR INSERT WITH CHECK (true);
