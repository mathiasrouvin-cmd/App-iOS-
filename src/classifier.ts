import type { CategoryId } from './types'

const rules: Array<[CategoryId, string[]]> = [
  ['subscriptions', [
    'netflix', 'spotify', 'disney', 'prime video', 'amazon prime', 'apple.com/bill',
    'icloud', 'youtube', 'deezer', 'canal+', 'molotov', 'adobe', 'microsoft 365',
    'office 365', 'github', 'openai', 'chatgpt', 'anthropic', 'claude',
    'dropbox', 'notion', 'figma', 'linkedin', 'nordvpn', 'audible', 'twitch'
  ]],
  ['groceries', [
    'carrefour', 'leclerc', 'auchan', 'monoprix', 'franprix', 'lidl', 'aldi',
    'intermarche', 'casino', 'picard', 'bio c bon', 'naturalia', 'super u',
    'g20', 'cora', 'match', 'biocoop'
  ]],
  ['restaurants', [
    'uber eats', 'ubereats', 'deliveroo', 'just eat', 'frichti', 'mcdonald',
    'burger king', 'kfc', 'starbucks', 'restaurant', 'bistro', 'brasserie',
    'pizza', 'sushi', 'boulangerie', 'paul ', 'pret a manger'
  ]],
  ['transport', [
    'uber', 'bolt', 'sncf', 'ratp', 'navigo', 'blablacar', 'total ', 'shell',
    'bp ', 'esso', 'essence', 'station', 'autoroute', 'vinci', 'sanef',
    'parking', 'velib', 'lime', 'tier', 'dott', 'free now', 'heetch'
  ]],
  ['housing', [
    'loyer', 'foncia', 'nexity', 'syndic', 'copropriete', 'immobilier',
    'century 21', 'orpi'
  ]],
  ['utilities', [
    'edf', 'engie', 'total energies', 'veolia', 'suez', 'free ', 'orange',
    'sfr', 'bouygues', 'sosh', 'red by sfr', 'bbox', 'livebox', 'internet',
    'electricite', ' eau ', ' gaz '
  ]],
  ['health', [
    'pharmacie', 'docteur', 'dr ', 'medecin', 'dentiste', 'hopital', 'clinique',
    'laboratoire', 'mutuelle', 'harmonie', 'mgen', 'ameli', 'cpam'
  ]],
  ['leisure', [
    'cinema', 'ugc', 'pathe', 'mk2', 'gaumont', 'theatre', 'concert', 'fnac',
    'steam', 'playstation', 'xbox', 'nintendo', 'decathlon', 'salle de sport',
    'basic fit', 'fitness park', 'musee'
  ]],
  ['shopping', [
    'amazon', 'darty', 'boulanger', 'zara', 'h&m', 'uniqlo', 'zalando',
    'asos', 'vinted', 'leboncoin', 'ikea', 'leroy merlin', 'castorama',
    'bricorama', 'sephora', 'nocibe', 'apple store'
  ]],
  ['income', [
    'salaire', 'virement recu', 'remuneration', 'paie', 'paye', 'caf',
    'remboursement', 'refund'
  ]],
  ['transfers', [
    'virement', 'vir sepa', 'lydia', 'paypal', 'revolut', 'wise',
    'transfert', 'prelevement sepa'
  ]]
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function classify(label: string, amount: number): CategoryId {
  const n = ` ${normalize(label)} `
  for (const [cat, keywords] of rules) {
    for (const k of keywords) {
      if (n.includes(k)) return cat
    }
  }
  return amount > 0 ? 'income' : 'other'
}
