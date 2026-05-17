/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Trophy, 
  Dog, 
  Settings, 
  Search, 
  PlusCircle, 
  Heart, 
  MessageCircle, 
  ChevronRight,
  User,
  Bell,
  Lock,
  ShieldCheck,
  CircleHelp,
  LogOut,
  Camera,
  MapPin,
  Mail,
  Grid,
  Play,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { PETS_OF_THE_MONTH } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState<'inicio' | 'retos' | 'mascota' | 'ajustes'>('inicio');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              name: currentUser.displayName || 'Nueva Mascota',
              email: currentUser.email,
              avatar: currentUser.photoURL || '',
              points: 0,
              bio: '¡Hola! Soy nuevo en la comunidad.',
              createdAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Error setting up user profile:", error);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    // Posts Listener
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'posts'));

    // User Profile Listener
    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      setProfile(snapshot.data());
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    // Contests Listener
    const unsubscribeContests = onSnapshot(collection(db, 'contests'), (snapshot) => {
      setContests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'contests'));

    // User Challenges Listener
    const unsubscribeChallenges = onSnapshot(collection(db, 'users', user.uid, 'challenges'), (snapshot) => {
      setChallenges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/challenges`));

    // Seed Initial Data if empty
    const seedInitialData = async () => {
      try {
        const postsSnap = await getDoc(doc(db, 'posts', 'initial-seed-check'));
        if (!postsSnap.exists()) {
          // Add a dummy doc to prevent repeated seeding
          await setDoc(doc(db, 'posts', 'initial-seed-check'), { seeded: true });
          
          // Seed a few contests
          const initialContests = [
            {
              title: "Dismatch: El Perro más Elegante",
              description: "Sube una foto de tu perro con su mejor traje o accesorio. ¡El ganador recibirá 1000 puntos!",
              image: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=800&h=600&fit=crop",
              variant: "large",
              timeLeft: "2 días restantes",
              entries: 124
            },
            {
              title: "Gatos Durmientes",
              description: "La siesta más tierna. Gana una suscripción premium.",
              image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=400&fit=crop",
              variant: "small",
              entries: 45
            }
          ];

          for (const c of initialContests) {
            await setDoc(doc(collection(db, 'contests')), c);
          }

          // Seed an initial post
          await setDoc(doc(collection(db, 'posts')), {
            authorId: 'system',
            authorName: 'Kawaii Pet Team',
            authorAvatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop',
            caption: "¡Bienvenidos a la nueva comunidad Kawaii PET! 🐾 Comparte los momentos más tiernos de tus compañeros.",
            petImage: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=1000&fit=crop",
            likesCount: 15,
            commentsCount: 2,
            isParticipating: false,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error("Seeding error:", error);
      }
    };
    seedInitialData();

    return () => {
      unsubscribePosts();
      unsubscribeProfile();
      unsubscribeContests();
      unsubscribeChallenges();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleCreatePost = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      await setDoc(doc(collection(db, 'posts')), {
        authorId: user.uid,
        authorName: profile?.name || user.displayName,
        authorAvatar: profile?.avatar || user.photoURL,
        caption: "¡Mirad qué mono está hoy! 😍 #KawaiiPet #MascotaFeliz",
        petImage: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=1000&fit=crop",
        likesCount: 0,
        commentsCount: 0,
        isParticipating: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const likeRef = doc(db, 'posts', postId, 'likes', user.uid);
    const postRef = doc(db, 'posts', postId);
    
    try {
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, { at: serverTimestamp() });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}/likes`);
    }
  };

  const toggleChallenge = async (challengeId: string, challengeTitle: string, challengePoints: number) => {
    if (!user) return;
    const challengeRef = doc(db, 'users', user.uid, 'challenges', challengeId);
    const userRef = doc(db, 'users', user.uid);

    try {
      await setDoc(challengeRef, {
        completed: true,
        completedAt: serverTimestamp(),
        title: challengeTitle,
        points: challengePoints
      });
      await updateDoc(userRef, { points: increment(challengePoints) });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/challenges`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-natural">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-natural px-8 text-center space-y-8">
        <div className="w-24 h-24 bg-brand rounded-[32px] flex items-center justify-center shadow-xl rotate-3">
          <Heart size={48} className="text-white fill-current" />
        </div>
        <div className="space-y-3">
          <h1 className="font-display font-black text-4xl uppercase tracking-tighter text-text-natural">
            Kawaii <span className="text-brand-blue">PET</span>
          </h1>
          <p className="text-sm text-text-natural/60 font-medium leading-relaxed">
            La comunidad más tierna para tus mejores amigos. ¡Únete ahora!
          </p>
        </div>
        <button 
          onClick={handleLogin}
          className="w-full bg-brand text-white py-5 rounded-[28px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-brand/20 active:scale-95 transition-all"
        >
          <LogIn size={20} /> Iniciar con Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-bg-natural relative overflow-hidden font-sans text-text-natural">
      {/* Header */}
      <header className="flex items-center justify-between px-8 h-20 bg-white border-b border-border-natural sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center shadow-sm">
            <Heart size={20} className="text-white fill-current" />
          </div>
          <h1 className="font-display font-black text-2xl tracking-tight uppercase">
            <span className="text-brand">Kawaii</span> <span className="text-brand-blue">PET</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-brand-green/30 px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-800">
             {profile?.points || 0} pts
           </div>
           <button className="text-text-natural/60 p-2 hover:bg-bg-natural rounded-full transition-colors">
            <Search size={22} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 overflow-y-auto hide-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'inicio' && <InicioView posts={posts} onLike={handleLike} currentUser={user} key="inicio" />}
          {activeTab === 'retos' && <RetosView challenges={challenges} contests={contests} onToggleChallenge={toggleChallenge} key="retos" />}
          {activeTab === 'mascota' && <ProfileView user={user} profile={profile} key="mascota" />}
          {activeTab === 'ajustes' && <AjustesView user={user} profile={profile} onLogout={handleLogout} key="ajustes" />}
        </AnimatePresence>
      </main>


      {/* Floating Action Button */}
      {(activeTab === 'inicio' || activeTab === 'retos') && (
        <button 
          onClick={handleCreatePost}
          disabled={isCreating}
          className="fixed bottom-24 right-5 bg-brand text-white p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all z-30 flex items-center justify-center disabled:opacity-50"
        >
          {isCreating ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Camera size={24} />}
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-white border-t border-border-natural px-4 flex justify-around items-center z-50">
        <NavButton 
          active={activeTab === 'inicio'} 
          onClick={() => setActiveTab('inicio')} 
          icon={<Home size={24} />} 
          label="Home" 
        />
        <NavButton 
          active={activeTab === 'retos'} 
          onClick={() => setActiveTab('retos')} 
          icon={<Trophy size={24} />} 
          label="Challenges" 
        />
        <NavButton 
          active={activeTab === 'mascota'} 
          onClick={() => setActiveTab('mascota')} 
          icon={<Dog size={24} />} 
          label="Pet" 
        />
        <NavButton 
          active={activeTab === 'ajustes'} 
          onClick={() => setActiveTab('ajustes')} 
          icon={<Settings size={24} />} 
          label="Settings" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-1 transition-all duration-300 relative h-full flex-1 ${active ? 'text-brand' : 'text-text-natural opacity-30 hover:opacity-80'}`}
    >
      <div className="mb-0.5">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter">
        {label}
      </span>
    </button>
  );
}

// --- Views ---

function InicioView({ posts, onLike, currentUser }: { posts: any[], onLike: (id: string) => void, currentUser: FirebaseUser, key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 py-6"
    >
      {/* Mascotas del Mes */}
      <section className="px-5">
        <h2 className="text-base font-black uppercase tracking-widest text-brand opacity-80 mb-4 px-3">Pets of the Month</h2>
        <div className="flex gap-6 overflow-x-auto hide-scrollbar py-2 px-3">
          {PETS_OF_THE_MONTH.map(pet => (
            <div key={pet.id} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-20 h-20 rounded-[24px] p-0.5 border-2 border-brand-soft shadow-sm">
                <img 
                  src={pet.image} 
                  alt={pet.name} 
                  className="w-full h-full object-cover rounded-[22px]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tight text-text-natural">{pet.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section className="space-y-8 px-5 pb-8">
        {posts.map(post => (
          <article key={post.id} className="bg-white rounded-[32px] overflow-hidden border border-border-natural shadow-kawaii">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-brand/20 p-0.5">
                  <img src={post.authorAvatar || 'https://via.placeholder.com/100'} className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-text-natural">{post.authorName || 'Usuario'}</h3>
                  <p className="text-[10px] text-text-natural/40 italic">
                    {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                  </p>
                </div>
              </div>
              <button className="text-text-natural/40"><Settings size={16} /></button>
            </div>
            
            <div className="relative p-2">
              <img 
                src={post.petImage} 
                className="w-full aspect-[4/5] object-cover rounded-[24px]"
                referrerPolicy="no-referrer"
              />
              {post.isParticipating && (
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm text-brand text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-2 shadow-sm uppercase tracking-tight">
                  🏆 Concurso en marcha
                </div>
              )}
            </div>

            <div className="p-5 pt-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onLike(post.id)}
                    className="flex items-center gap-1.5 text-brand bg-brand/10 px-4 py-2 rounded-full transition-all active:scale-90"
                  >
                    <Heart size={18} className="fill-current" />
                    <span className="text-xs font-black">{post.likesCount || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-text-natural opacity-40 hover:opacity-100 transition-opacity">
                    <MessageCircle size={18} />
                    <span className="text-xs font-black">{post.commentsCount || 0}</span>
                  </button>
                </div>
                <button className="w-10 h-10 border-2 border-brand shadow-sm rounded-full flex items-center justify-center text-brand">
                  <PlusCircle size={20} />
                </button>
              </div>
              <p className="text-sm leading-relaxed">
                <span className="font-black mr-2 uppercase text-[11px] tracking-tight text-brand-blue">{post.authorName}</span>
                {post.caption}
              </p>
            </div>
          </article>
        ))}
      </section>
    </motion.div>
  );
}

function RetosView({ challenges, contests, onToggleChallenge }: { challenges: any[], contests: any[], onToggleChallenge: (id: string, title: string, pts: number) => void, key?: string }) {
  const dailyTemplates = [
    { id: 'walk', title: 'Caminata de 30 min', description: 'Registra una ruta con tu perro y gana 50 puntos.', points: 50 },
    { id: 'food', title: 'Cena Saludable', description: 'Añade una verdura apta a su comida y comparte la foto.', points: 30 },
    { id: 'brush', title: 'Momento de Cepillado', description: '¡Completado! Has cuidado bien de su pelaje hoy.', points: 20 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-5 space-y-8 py-6"
    >
      <header className="space-y-3">
        <h2 className="font-display font-black text-3xl text-text-natural leading-tight uppercase">Concursos & retos</h2>
        <p className="text-xs text-text-natural/60 leading-relaxed max-w-[90%]">
          ¡Demuestra el talento de tu mascota! Participa en los eventos de la comunidad y gana premios exclusivos.
        </p>
      </header>

      <div className="flex bg-white border border-border-natural p-1.5 rounded-[24px] gap-2 shadow-sm">
        <button className="flex-1 bg-brand text-white py-3 rounded-[18px] text-[10px] font-black uppercase tracking-wider">Concursos</button>
        <button className="flex-1 text-text-natural/40 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-wider hover:text-text-natural/80 transition-colors">Retos Diarios</button>
      </div>

      <div className="space-y-6">
        {contests.length > 0 ? contests.map(contest => (
          <div key={contest.id} className="relative group overflow-hidden rounded-[32px] shadow-kawaii border border-border-natural bg-white p-2">
            <div className={`relative overflow-hidden rounded-[24px]`}>
              <img 
                src={contest.image} 
                className={`w-full ${contest.variant === 'large' ? 'aspect-[4/3]' : 'h-32'} object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700`} 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-5 flex flex-col justify-end text-white">
                {contest.timeLeft && (
                  <div className="absolute top-4 left-4 bg-brand text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-2 shadow-lg scale-90 -translate-x-2 -translate-y-2">
                    <Play size={8} fill="currentColor" /> {contest.timeLeft}
                  </div>
                )}
                <h3 className="font-black text-xl mb-1">{contest.title}</h3>
                <p className="text-[10px] opacity-90 mb-4 line-clamp-2 max-w-[85%] font-medium">{contest.description}</p>
                <div className="flex items-center justify-between">
                  {contest.variant === 'large' ? (
                    <button className="bg-white text-brand px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-transform active:scale-95 shadow-sm">
                      Participar ahora <ChevronRight size={14} />
                    </button>
                  ) : (
                    <>
                      <span className="text-[10px] font-black bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">{contest.entries || 0} entradas</span>
                      <button className="text-white text-[10px] font-black uppercase tracking-widest border-b-2 border-white pb-0.5">Votar</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-10 opacity-30 font-black uppercase text-xs">No hay concursos activos</div>
        )}
      </div>

      <section className="space-y-6 pb-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-display font-black text-xl text-text-natural uppercase tracking-tight">Retos Diarios</h3>
          <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse"></div>
        </div>

        <div className="space-y-4 px-2">
          {dailyTemplates.map(template => {
            const progress = challenges.find(c => c.id === template.id);
            const isCompleted = progress?.completed;

            return (
              <button 
                key={template.id} 
                onClick={() => onToggleChallenge(template.id, template.title, template.points)}
                disabled={isCompleted}
                className={`w-full flex items-center gap-4 p-4 rounded-[28px] border transition-all text-left group ${isCompleted ? 'bg-bg-natural border-transparent opacity-60' : 'bg-white border-border-natural shadow-sm hover:border-brand/40 active:scale-[0.98]'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isCompleted ? 'bg-slate-100 text-slate-400' : 'bg-brand-green/20 text-emerald-700 group-hover:bg-brand-green/40'}`}>
                  {isCompleted ? <CheckCircle2 size={24} /> : <PlusCircle size={24} />}
                </div>
                <div className="flex-1">
                  <h4 className={`text-xs font-black uppercase tracking-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-text-natural'}`}>{template.title}</h4>
                  <p className="text-[10px] text-text-natural/50 leading-snug font-medium mt-1">{template.description}</p>
                </div>
                {!isCompleted && (
                  <div className="bg-brand/10 text-brand text-[10px] font-black px-4 py-2 rounded-full border border-brand/5">
                    +{template.points} pts
                  </div>
                )}
                {isCompleted && (
                  <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black bg-brand-green/30 px-3 py-1.5 rounded-full">
                    Hecho
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}

function ProfileView({ user, profile, key }: { user: FirebaseUser, profile: any, key?: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(1254);

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    setFollowers(f => isFollowing ? f - 1 : f + 1);
  };

  return (
    <motion.div 
      key={key}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="px-5 space-y-8 py-6"
    >
      <div className="bg-white rounded-[48px] shadow-kawaii p-4 border border-border-natural relative">
        <div className="aspect-square relative mb-8">
          <img 
            src={profile?.avatar || user.photoURL || "/src/assets/images/pet_golden_retriever_luna_1779037489916.png"} 
            className="w-full h-full object-cover rounded-[40px]" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
             <span className="text-brand">💖</span>
             <span className="text-[11px] font-black uppercase tracking-tight">Cuteness overload</span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-brand p-4 rounded-[20px] shadow-lg border-4 border-white text-white">
            <Dog size={28} />
          </div>
        </div>

        <div className="text-center space-y-6 px-4">
          <div>
            <h2 className="font-display font-black text-5xl text-text-natural mb-2 leading-none uppercase tracking-tighter">{profile?.name || user.displayName || 'Luna'}</h2>
            <div className="flex items-center justify-center gap-3 text-[10px] text-text-natural/60 font-black uppercase tracking-widest mt-4">
              <span className="bg-brand/10 text-brand px-4 py-1.5 rounded-full">{profile?.breed || 'Golden Retriever'}</span>
              <span className="w-1.5 h-1.5 bg-brand rounded-full opacity-30"></span>
              <span>{profile?.age || '2 Años'}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-text-natural opacity-40 mt-3 font-bold uppercase tracking-widest">
              <MapPin size={12} /> Honolulu, HI
            </div>
          </div>

          <p className="text-sm text-text-natural/70 leading-relaxed font-medium">
            {profile?.bio || 'Amo las playas de arena blanca y perseguir pelotas de tenis. Soy una experta en conseguir premios extra con solo una mirada. 🌴☀️'}
          </p>

          <div className="flex justify-around py-6 border-y border-border-natural/50">
            <div className="text-center">
              <div className="font-black text-2xl text-text-natural leading-none">{followers.toLocaleString()}</div>
              <div className="text-[9px] text-text-natural opacity-40 uppercase tracking-[0.2em] mt-2 font-black">Siguidores</div>
            </div>
            <div className="text-center">
              <div className="font-black text-2xl text-text-natural leading-none">8.4k</div>
              <div className="text-[9px] text-text-natural opacity-40 uppercase tracking-[0.2em] mt-2 font-black">Likes</div>
            </div>
            <div className="text-center">
              <div className="font-black text-2xl text-text-natural leading-none">42</div>
              <div className="text-[9px] text-text-natural opacity-40 uppercase tracking-[0.2em] mt-2 font-black">Posts</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4">
            <button 
              onClick={toggleFollow}
              className={`py-4 rounded-[24px] text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${isFollowing ? 'bg-bg-natural text-brand shadow-none border border-brand' : 'bg-brand text-white shadow-brand/20'}`}
            >
              {isFollowing ? 'Siguiendo' : 'Seguir'}
            </button>
            <button className="flex items-center justify-center gap-2 border-2 border-brand py-4 rounded-[24px] text-xs font-black uppercase tracking-widest text-brand transition-transform active:scale-95">
              <Mail size={18} /> Mensaje
            </button>
          </div>
        </div>
      </div>


      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-display font-black text-xl text-text-natural uppercase tracking-tight">Galería de Momentos</h3>
          <div className="flex gap-3">
             <button className="text-brand bg-brand/10 w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm"><Grid size={20} /></button>
             <button className="text-text-natural/30 w-10 h-10 flex items-center justify-center rounded-xl"><Play size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-2">
          <div className="group overflow-hidden rounded-[28px] shadow-sm border border-border-natural">
            <img src="/src/assets/images/pet_golden_retriever_luna_1779037489916.png" className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
          <div className="group overflow-hidden rounded-[28px] shadow-sm border border-border-natural">
            <img src="/src/assets/images/contest_dog_bowtie_1779037546073.png" className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
          <div className="group overflow-hidden rounded-[28px] shadow-sm border border-border-natural">
            <img src="/src/assets/images/siamese_cats_napping_1779037526957.png" className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
          <div className="group overflow-hidden rounded-[28px] shadow-sm border border-border-natural">
            <img src="/src/assets/images/beagle_sweater_1779037507135.png" className="w-full aspect-square object-cover transform group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AjustesView({ user, profile, onLogout, key }: { user: FirebaseUser, profile: any, onLogout: () => void, key?: string }) {
  const menuItems = [
    { icon: <User size={20} />, title: 'Mi Perfil', sub: 'Información personal y de contacto', bg: 'bg-brand/10 text-brand' },
    { icon: <Bell size={20} />, title: 'Notificaciones', sub: 'Alertas de concursos e interacciones', bg: 'bg-brand-blue/10 text-brand-blue' },
    { icon: <Lock size={20}  />, title: 'Privacidad', sub: 'Quién puede ver tus publicaciones', bg: 'bg-brand-accent/10 text-brand-accent' },
    { icon: <ShieldCheck size={20} />, title: 'Seguridad', sub: 'Contraseña y autenticación', bg: 'bg-brand-green/20 text-emerald-700' },
    { icon: <CircleHelp size={20} />, title: 'Centro de Ayuda', sub: 'Preguntas frecuentes y soporte', bg: 'bg-bg-natural text-text-natural/40' },
  ];

  return (
    <motion.div 
      key={key}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="px-5 space-y-10 py-10"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-brand-soft p-1 shadow-lg">
            <img 
              src={profile?.avatar || user.photoURL || "/src/assets/images/user_alex_rivera_1779037469317.png"} 
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <button className="absolute bottom-1 right-1 bg-brand p-2 rounded-full border-4 border-white text-white shadow-md transform hover:scale-110 active:scale-95 transition-transform">
            <Camera size={18} />
          </button>
        </div>
        <div className="text-center">
          <h2 className="font-display font-black text-3xl text-text-natural uppercase tracking-tighter">{profile?.name || user.displayName}</h2>
          <p className="text-[10px] text-text-natural/40 italic font-medium uppercase tracking-[0.2em] mt-2">Level 24 Trainer • Enero 2024</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-kawaii border border-border-natural overflow-hidden">
        {menuItems.map((item, i) => (
          <button key={i} className={`w-full flex items-center gap-4 p-5 hover:bg-bg-natural border-b border-border-natural/50 last:border-b-0 transition-colors group text-left`}>
            <div className={`p-4 rounded-[20px] flex items-center justify-center shrink-0 transition-all ${item.bg}`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black uppercase tracking-tight text-text-natural">{item.title}</h3>
              <p className="text-[10px] text-text-natural/40 mt-1 font-medium">{item.sub}</p>
            </div>
            <ChevronRight size={18} className="text-text-natural/20 group-hover:text-text-natural/60 transition-colors" />
          </button>
        ))}
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-5 hover:bg-red-50 transition-colors text-left group"
        >
          <div className="p-4 rounded-[20px] bg-red-50 text-red-500 flex items-center justify-center shrink-0 shadow-sm shadow-red-100 group-hover:bg-white transition-colors">
            <LogOut size={20} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-tight text-red-500">Cerrar Sesión</h3>
        </button>
      </div>


      <footer className="text-center space-y-2 py-6">
        <div className="flex justify-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-brand opacity-50"></div>
          <div className="w-2 h-2 rounded-full bg-brand"></div>
          <div className="w-2 h-2 rounded-full bg-brand opacity-50"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-natural/30 italic">Kawaii PET Community v2.0.1</p>
      </footer>
    </motion.div>
  );
}
