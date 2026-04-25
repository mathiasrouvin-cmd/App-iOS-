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
    'burger king', ' kfc ', 'starbucks', 'restaurant', 'bistro', 'brasserie',
    'pizza', 'sushi', 'boulangerie', 'patisserie', 'cafe', 'coffee',
    'bar ', 'creperie', 'kebab', 'tacos', 'pret a manger'
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
    'salaire', 'virement recu', 'vir recu', 'remuneration',
    ' caf ', 'allocations familiales', 'remboursement', 'refund',
    'bulletin de paie', 'bulletin paie', 'fiche de paie'
  ]],
  // Savings must be checked before transfers so a "VIREMENT LIVRET A"
  // ends up here and not in the generic transfers bucket.
  ['savings', [
    'livret a', 'livret jeune', 'livret bleu', 'livret rose',
    'livret developpement durable', ' ldd ', ' ldds ',
    'livret epargne', ' lep ',
    'plan epargne', ' pel ', ' cel ',
    'pea ', ' pea-', 'compte titres', 'assurance vie',
    'epargne', 'caisse epargne livret', 'boursorama epargne',
    'tontine'
  ]],
  ['transfers', [
    'virement', 'vir sepa', 'lydia', 'paypal', 'revolut', 'wise',
    'transfert', 'prelevement sepa'
  ]]
]

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[*/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface CustomRule {
  id: string
  keyword: string
  category: CategoryId
}

const PEER_TO_PEER = ['lydia', 'paypal', 'revolut', 'wise', 'pumpkin']

export function classify(
  label: string,
  amount: number,
  customRules: CustomRule[] = []
): CategoryId {
  const n = ` ${normalize(label)} `

  // User rules take precedence
  for (const r of customRules) {
    const kw = normalize(r.keyword)
    if (kw && n.includes(kw)) return r.category
  }

  for (const [cat, keywords] of rules) {
    for (const k of keywords) {
      if (n.includes(k)) {
        if (cat === 'transfers' && amount > 0 &&
            !PEER_TO_PEER.some(p => n.includes(p))) {
          return 'income'
        }
        return cat
      }
    }
  }
  return amount > 0 ? 'income' : 'other'
}
