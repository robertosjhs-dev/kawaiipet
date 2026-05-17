export const PETS_OF_THE_MONTH = [
  { id: 1, name: 'Koda', image: '/src/assets/images/pet_koda_golden_retriever_1779037684657.png' },
  { id: 2, name: 'Milo', image: '/src/assets/images/pet_milo_ginger_cat_1779037705114.png' },
  { id: 3, name: 'Luna', image: '/src/assets/images/pet_golden_retriever_luna_1779037489916.png' },
  { id: 4, name: 'Coco', image: '/src/assets/images/contest_dog_bowtie_1779037546073.png' },
];

export const POSTS = [
  {
    id: 1,
    user: { name: 'Ana García', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
    time: 'Hace 2 horas',
    petImage: '/src/assets/images/beagle_sweater_1779037507135.png',
    likes: '1.2k',
    comments: 48,
    caption: '¡Bruno estrenando su nuevo suéter para el clima fresco de la isla! 🌴🐶',
    firstComment: { user: 'Carlos R.', text: '¡Se ve guapísimo! ¿Dónde lo compraste?' }
  },
  {
    id: 2,
    user: { name: 'Elena Soler', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    time: 'Hace 5 horas',
    petImage: '/src/assets/images/siamese_cats_napping_1779037526957.png',
    likes: 856,
    comments: 24,
    caption: 'La hora de la siesta es sagrada. 😴🐱💤 #GatosHawaii #MascotasFelices',
    isParticipating: true
  }
];

export const CONTESTS = [
  {
    id: 1,
    title: 'El perro más elegante',
    description: 'Viste a tu compañero con su mejor gala y sube una foto. ¡Premios de grooming incluidos!',
    image: '/src/assets/images/contest_dog_bowtie_1779037546073.png',
    timeLeft: '¡Últimos 2 días!',
    variant: 'large'
  },
  {
    id: 2,
    title: 'Gatos saltarines',
    description: 'Captura el salto más alto de tu felino.',
    image: '/src/assets/images/contest_cat_jumping_1779037565058.png',
    entries: 15,
    variant: 'small'
  }
];

export const DAILY_CHALLENGES = [
  { id: 1, title: 'Caminata de 30 min', description: 'Registra una ruta con tu perro y gana 50 puntos.', points: '+50 pts', icon: 'walk', completed: false },
  { id: 2, title: 'Cena Saludable', description: 'Añade una verdura apta a su comida y comparte la foto.', points: '+30 pts', icon: 'food', completed: false },
  { id: 3, title: 'Momento de Cepillado', description: '¡Completado! Has cuidado bien de su pelaje hoy.', completed: true, icon: 'brush' },
];
