export interface Mutator {
  id:   string
  name: string
  icon: string
  desc: string
}

export const MUTATORS: Record<string, Mutator> = {
  hydra: {
    id:   'hydra',
    name: 'HYDRA',
    icon: '🐍',
    desc: 'Each eliminated enemy spawns 2 more nearby.',
  },
  glassCannon: {
    id:   'glassCannon',
    name: 'GLASS CANNON',
    icon: '💥',
    desc: 'You deal 3× damage — but also take 3×.',
  },
  darkness: {
    id:   'darkness',
    name: 'DARKNESS',
    icon: '🌑',
    desc: 'Heavy fog — visibility limited to ~10m.',
  },
  berserker: {
    id:   'berserker',
    name: 'BERSERKER',
    icon: '⚡',
    desc: 'All enemies move and attack twice as fast.',
  },
  oneDown: {
    id:   'oneDown',
    name: 'ONE DOWN',
    icon: '☠',
    desc: 'Getting downed once means instant custody.',
  },
  cursed: {
    id:   'cursed',
    name: 'CURSED',
    icon: '🔴',
    desc: 'Start with half ammo. Enemy drops give no ammo.',
  },
}
