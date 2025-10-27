import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { Pizza, Order, User, OrderStatus, Extra } from '../types';

// Vérifier si Firebase est disponible
const isFirebaseAvailable = () => {
  return db !== null && db !== undefined;
};

// Collections references
export const COLLECTIONS = {
  USERS: 'users',
  PIZZAS: 'pizzas',
  ORDERS: 'orders',
  EXTRAS: 'extras'
} as const;

// Users Service
export const usersService = {
  async createUser(userId: string, userData: Partial<User>) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...userData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    // Copier le menu template pour ce nouvel utilisateur
    await this.copyBaseMenuForUser(userId);
  },

  async copyBaseMenuForUser(userId: string) {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase non disponible');
      return;
    }

    console.log('🍕 Début de la copie du menu template pour l\'utilisateur:', userId);

    try {
      // Vérifier si l'utilisateur a déjà des pizzas
      const pizzasRef = collection(db, COLLECTIONS.PIZZAS);
      const userPizzasQuery = query(pizzasRef, where('userId', '==', userId));
      const userPizzasSnapshot = await getDocs(userPizzasQuery);

      console.log('📊 Pizzas existantes pour cet utilisateur:', userPizzasSnapshot.size);

      if (!userPizzasSnapshot.empty) {
        console.log(`ℹ️ L'utilisateur ${userId} a déjà ${userPizzasSnapshot.docs.length} pizzas - Aucune copie effectuée`);
        return;
      }

      // Récupérer toutes les pizzas marquées comme templates
      const templateQuery = query(pizzasRef, where('is_template', '==', true));
      const templateSnapshot = await getDocs(templateQuery);

      console.log('📊 Pizzas template trouvées:', templateSnapshot.size);

      if (templateSnapshot.empty) {
        console.log('⚠️ Aucune pizza template trouvée');
        console.log('💡 Pour créer des templates, connectez-vous en pizzeria et allez dans Configurações > Menu Template');
        return;
      }

      // Copier chaque pizza template vers le nouvel utilisateur
      let copiedCount = 0;
      for (const doc of templateSnapshot.docs) {
        const pizzaData = doc.data();

        // Exclure les champs Firebase spécifiques, l'ID et le flag template
        const { created_at, updated_at, userId: oldUserId, isTemplate, ...pizzaToClone } = pizzaData;

        await addDoc(pizzasRef, {
          ...pizzaToClone,
          userId: userId,
          active: true,
          isTemplate: false,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        copiedCount++;
        console.log(`  ✓ Pizza copiée: ${pizzaData.name}`);
      }

      console.log(`✅ ${copiedCount} pizzas copiées depuis les templates vers l'utilisateur ${userId}`);

      // Copier les catégories master vers le nouvel utilisateur
      const categoriesRef = collection(db, 'categories');
      const masterCategoriesQuery = query(categoriesRef, where('userId', '==', 'master'));
      const masterCategoriesSnapshot = await getDocs(masterCategoriesQuery);

      console.log('📊 Catégories master trouvées:', masterCategoriesSnapshot.size);

      if (masterCategoriesSnapshot.empty) {
        console.log('⚠️ Aucune catégorie master trouvée');
        return;
      }

      // Copier chaque catégorie master vers le nouvel utilisateur
      let copiedCategoriesCount = 0;
      for (const doc of masterCategoriesSnapshot.docs) {
        const categoryData = doc.data();

        // Exclure les champs Firebase spécifiques
        const { created_at, updated_at, userId: oldUserId, ...categoryToClone } = categoryData;

        await addDoc(categoriesRef, {
          ...categoryToClone,
          userId: userId,
          active: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        copiedCategoriesCount++;
        console.log(`  ✓ Catégorie copiée: ${categoryData.name}`);
      }

      console.log(`✅ ${copiedCategoriesCount} catégories copiées depuis master vers l'utilisateur ${userId}`);
    } catch (error) {
      console.error('❌ Erreur lors de la copie du menu template:', error);
    }
  },

  async updateUser(userId: string, userData: Partial<User>) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');
    
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...userData,
      updated_at: serverTimestamp()
    });
  },

  async getUser(userId: string): Promise<User | null> {
    if (!isFirebaseAvailable()) return null;
    
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
  },

  async getAllUsers(): Promise<User[]> {
    if (!isFirebaseAvailable()) return [];
    
    const usersRef = collection(db, COLLECTIONS.USERS);
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }
};

// Pizzas Service
export const pizzasService = {
  async createPizza(pizzaData: Omit<Pizza, 'id'>) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');
    
    // Vérifier que l'utilisateur est authentifié
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier le rôle de l'utilisateur avant de créer la pizza
    try {
      const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('Profil utilisateur non trouvé. Veuillez vous reconnecter.');
      }
      
      const userData = userSnap.data();
      if (!userData.role || (userData.role !== 'admin' && userData.role !== 'pizzeria')) {
        throw new Error(`Permissions insuffisantes. Votre rôle actuel: ${userData.role || 'non défini'}. Rôle requis: admin ou pizzeria.`);
      }
    } catch (error: any) {
      if (error.message.includes('Permissions insuffisantes') || error.message.includes('Profil utilisateur')) {
        throw error;
      }
      throw new Error('Erreur lors de la vérification des permissions: ' + error.message);
    }
    
    const pizzasRef = collection(db, COLLECTIONS.PIZZAS);
    try {
      // Nettoyer les données pour enlever les valeurs undefined
      const cleanData: any = {
        name: pizzaData.name || '',
        description: pizzaData.description || '',
        category: pizzaData.category || '',
        image_url: pizzaData.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
        ingredients: pizzaData.ingredients || [],
        has_unique_price: pizzaData.has_unique_price || false,
        prices: {
          small: pizzaData.prices?.small || 0,
          medium: pizzaData.prices?.medium || 0,
          large: pizzaData.prices?.large || 0
        },
        customizable: pizzaData.customizable || false,
        max_custom_ingredients: pizzaData.max_custom_ingredients || 3,
        custom_ingredients: pizzaData.custom_ingredients || [],
        active: true,
        is_override: false,
        is_hidden: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      // Ajouter unique_price seulement s'il est défini et > 0
      if (pizzaData.has_unique_price && pizzaData.unique_price && pizzaData.unique_price > 0) {
        cleanData.unique_price = pizzaData.unique_price;
      }

      // Utiliser 'master' comme userId pour le compte master au lieu de l'UID Firebase
      const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      // Remplacer owner_id par userId
      cleanData.userId = (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid;
      delete cleanData.owner_id;

      const docRef = await addDoc(pizzasRef, cleanData);
      return docRef.id;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        throw new Error('Permissions insuffisantes pour créer une pizza. Vérifiez votre rôle dans Firebase Console.');
      }
      throw new Error('Erreur lors de la création de la pizza: ' + error.message);
    }
  },

  async updatePizza(pizzaId: string, pizzaData: Partial<Pizza>) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error('Utilisateur non connecté');

    const pizzasRef = collection(db, COLLECTIONS.PIZZAS);
    const pizzaRef = doc(db, COLLECTIONS.PIZZAS, pizzaId);
    const pizzaSnap = await getDoc(pizzaRef);

    if (!pizzaSnap.exists()) throw new Error('Pizza introuvable');

    const existingPizza = pizzaSnap.data() as Pizza;

    // Déterminer le userId de l'utilisateur actuel
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const userIdToUse = (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid;

    // Si c'est une pizza master ET que l'utilisateur n'est PAS master
    if (existingPizza.userId === 'master' && userIdToUse !== 'master') {
      // Vérifier si un override existe déjà
      const overrideQuery = query(
        pizzasRef,
        where('userId', '==', userIdToUse),
        where('master_pizza_id', '==', pizzaId)
      );
      const overrideSnapshot = await getDocs(overrideQuery);

      const cleanData: any = {
        ...existingPizza,
        userId: userIdToUse,
        master_pizza_id: pizzaId,
        is_override: true,
        updated_at: serverTimestamp()
      };

      // Appliquer les modifications
      if (pizzaData.name !== undefined) cleanData.name = pizzaData.name;
      if (pizzaData.description !== undefined) cleanData.description = pizzaData.description;
      if (pizzaData.category !== undefined) cleanData.category = pizzaData.category;
      if (pizzaData.image_url !== undefined) cleanData.image_url = pizzaData.image_url;
      if (pizzaData.ingredients !== undefined) cleanData.ingredients = pizzaData.ingredients;
      if (pizzaData.active !== undefined) cleanData.active = pizzaData.active;
      if (pizzaData.is_hidden !== undefined) cleanData.is_hidden = pizzaData.is_hidden;
      if (pizzaData.customizable !== undefined) cleanData.customizable = pizzaData.customizable;
      if (pizzaData.max_custom_ingredients !== undefined) cleanData.max_custom_ingredients = pizzaData.max_custom_ingredients;
      if (pizzaData.custom_ingredients !== undefined) cleanData.custom_ingredients = pizzaData.custom_ingredients;

      if (pizzaData.has_unique_price !== undefined) {
        cleanData.has_unique_price = pizzaData.has_unique_price;
        if (pizzaData.has_unique_price && pizzaData.unique_price && pizzaData.unique_price > 0) {
          cleanData.unique_price = pizzaData.unique_price;
        }
      }

      if (pizzaData.prices !== undefined) {
        cleanData.prices = {
          small: pizzaData.prices.small || 0,
          medium: pizzaData.prices.medium || 0,
          large: pizzaData.prices.large || 0
        };
      }

      delete cleanData.id;
      cleanData.created_at = serverTimestamp();

      if (overrideSnapshot.empty) {
        // Créer un nouvel override
        await addDoc(pizzasRef, cleanData);
      } else {
        // Mettre à jour l'override existant
        const overrideRef = doc(db, COLLECTIONS.PIZZAS, overrideSnapshot.docs[0].id);
        await updateDoc(overrideRef, cleanData);
      }
    } else {
      // Modifier directement (c'est sa propre pizza ou master modifie ses pizzas)
      const cleanData: any = {
        updated_at: serverTimestamp()
      };

      if (pizzaData.name !== undefined) cleanData.name = pizzaData.name;
      if (pizzaData.description !== undefined) cleanData.description = pizzaData.description;
      if (pizzaData.category !== undefined) cleanData.category = pizzaData.category;
      if (pizzaData.image_url !== undefined) cleanData.image_url = pizzaData.image_url;
      if (pizzaData.ingredients !== undefined) cleanData.ingredients = pizzaData.ingredients;
      if (pizzaData.active !== undefined) cleanData.active = pizzaData.active;
      if (pizzaData.is_hidden !== undefined) cleanData.is_hidden = pizzaData.is_hidden;
      if (pizzaData.customizable !== undefined) cleanData.customizable = pizzaData.customizable;
      if (pizzaData.max_custom_ingredients !== undefined) cleanData.max_custom_ingredients = pizzaData.max_custom_ingredients;
      if (pizzaData.custom_ingredients !== undefined) cleanData.custom_ingredients = pizzaData.custom_ingredients;

      if (pizzaData.has_unique_price !== undefined) {
        cleanData.has_unique_price = pizzaData.has_unique_price;
        if (pizzaData.has_unique_price && pizzaData.unique_price && pizzaData.unique_price > 0) {
          cleanData.unique_price = pizzaData.unique_price;
        }
      }

      if (pizzaData.prices !== undefined) {
        cleanData.prices = {
          small: pizzaData.prices.small || 0,
          medium: pizzaData.prices.medium || 0,
          large: pizzaData.prices.large || 0
        };
      }

      await updateDoc(pizzaRef, cleanData);
    }
  },

  async deletePizza(pizzaId: string) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error('Utilisateur non connecté');

    const pizzasRef = collection(db, COLLECTIONS.PIZZAS);
    const pizzaRef = doc(db, COLLECTIONS.PIZZAS, pizzaId);
    const pizzaSnap = await getDoc(pizzaRef);

    if (!pizzaSnap.exists()) throw new Error('Pizza introuvable');

    const existingPizza = pizzaSnap.data() as Pizza;

    // Déterminer le userId de l'utilisateur actuel
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const userIdToUse = (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid;

    // Si c'est une pizza master ET que l'utilisateur n'est PAS master
    if (existingPizza.userId === 'master' && userIdToUse !== 'master') {
      // Créer un override "caché" au lieu de supprimer
      const overrideQuery = query(
        pizzasRef,
        where('userId', '==', userIdToUse),
        where('master_pizza_id', '==', pizzaId)
      );
      const overrideSnapshot = await getDocs(overrideQuery);

      const cleanData: any = {
        ...existingPizza,
        userId: userIdToUse,
        master_pizza_id: pizzaId,
        is_override: true,
        is_hidden: true,
        updated_at: serverTimestamp()
      };

      delete cleanData.id;
      cleanData.created_at = serverTimestamp();

      if (overrideSnapshot.empty) {
        // Créer un nouvel override caché
        await addDoc(pizzasRef, cleanData);
      } else {
        // Mettre à jour l'override existant pour le cacher
        const overrideRef = doc(db, COLLECTIONS.PIZZAS, overrideSnapshot.docs[0].id);
        await updateDoc(overrideRef, { is_hidden: true, updated_at: serverTimestamp() });
      }
    } else {
      // Supprimer directement (c'est sa propre pizza ou master supprime ses pizzas)
      await deleteDoc(pizzaRef);
    }
  },

  async getAllPizzas(): Promise<Pizza[]> {
    if (!isFirebaseAvailable()) return [];

    const pizzasRef = collection(db, COLLECTIONS.PIZZAS);
    const currentUser = auth?.currentUser;

    // Si pas connecté, récupérer uniquement les pizzas master actives
    if (!currentUser) {
      const q = query(pizzasRef, where('active', '==', true), where('userId', '==', 'master'));
      const snapshot = await getDocs(q);
      const pizzas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pizza));
      return pizzas.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(a.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    // Déterminer le userId
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const userIdToUse = (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid;

    // Récupérer les pizzas master actives
    const masterQuery = query(pizzasRef, where('active', '==', true), where('userId', '==', 'master'));
    const masterSnapshot = await getDocs(masterQuery);
    const masterPizzas = masterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pizza));

    // Si c'est le master, retourner uniquement ses pizzas
    if (userIdToUse === 'master') {
      return masterPizzas.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    // Récupérer les overrides de l'utilisateur
    const overridesQuery = query(pizzasRef, where('userId', '==', userIdToUse), where('is_override', '==', true));
    const overridesSnapshot = await getDocs(overridesQuery);
    const overrides = overridesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pizza));

    // Créer un map des overrides par master_pizza_id
    const overrideMap = new Map<string, Pizza>();
    overrides.forEach(override => {
      if (override.master_pizza_id) {
        overrideMap.set(override.master_pizza_id, override);
      }
    });

    // Fusionner : remplacer les pizzas master par leurs overrides
    const finalPizzas: Pizza[] = [];
    masterPizzas.forEach(masterPizza => {
      const override = overrideMap.get(masterPizza.id);
      if (override) {
        // Si l'override est caché, ne pas l'ajouter
        if (!override.is_hidden) {
          finalPizzas.push(override);
        }
      } else {
        // Pas d'override, utiliser la pizza master
        finalPizzas.push(masterPizza);
      }
    });

    // Ajouter les pizzas créées par l'utilisateur (pas des overrides)
    const userPizzasQuery = query(
      pizzasRef,
      where('userId', '==', userIdToUse),
      where('is_override', '==', false)
    );
    const userPizzasSnapshot = await getDocs(userPizzasQuery);
    const userPizzas = userPizzasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pizza));
    finalPizzas.push(...userPizzas.filter(p => p.active));

    // Tri côté client
    return finalPizzas.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  },

  async getAllPizzasForAdmin(): Promise<Pizza[]> {
    if (!isFirebaseAvailable()) return [];

    const currentUser = auth?.currentUser;
    if (!currentUser) return [];

    // Récupérer l'email pour vérifier si c'est le master
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const userIdToQuery = (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid;

    console.log('🔍 getAllPizzasForAdmin - Email utilisateur:', userData?.email);
    console.log('🔍 getAllPizzasForAdmin - userId recherché:', userIdToQuery);
    console.log('🔍 getAllPizzasForAdmin - currentUser.uid:', currentUser.uid);

    const pizzasRef = collection(db, COLLECTIONS.PIZZAS);
    const q = query(pizzasRef, where('userId', '==', userIdToQuery));
    const snapshot = await getDocs(q);

    console.log('🔍 getAllPizzasForAdmin - Nombre de pizzas trouvées:', snapshot.docs.length);
    if (snapshot.docs.length > 0) {
      console.log('🔍 getAllPizzasForAdmin - Première pizza:', snapshot.docs[0].data());
    }

    // Tri côté client pour éviter l'index composite
    const pizzas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pizza));
    return pizzas.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Plus récent en premier
    });
  },

  subscribeToActivePizzas(callback: (pizzas: Pizza[]) => void) {
    if (!isFirebaseAvailable()) {
      callback([]);
      return () => {};
    }

    const pizzasRef = collection(db, COLLECTIONS.PIZZAS);
    const currentUser = auth?.currentUser;

    // Si pas connecté, écouter uniquement les pizzas master
    if (!currentUser) {
      const q = query(pizzasRef, where('active', '==', true), where('userId', '==', 'master'));
      return onSnapshot(q,
        (snapshot) => {
          const pizzas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Pizza));
          callback(pizzas);
        },
        (error) => {
          console.error('Erreur lors de l\'écoute des pizzas:', error);
          callback([]);
        }
      );
    }

    // Écouter les pizzas master
    const masterQuery = query(pizzasRef, where('active', '==', true), where('userId', '==', 'master'));
    let masterPizzas: Pizza[] = [];
    let userPizzas: Pizza[] = [];
    let masterUnsubscribed = false;
    let userUnsubscribed = false;

    const updateCallback = () => {
      if (!masterUnsubscribed || !userUnsubscribed) return;
      const allPizzas = [...masterPizzas, ...userPizzas];
      callback(allPizzas);
    };

    const unsubscribeMaster = onSnapshot(masterQuery,
      (snapshot) => {
        masterPizzas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Pizza));
        masterUnsubscribed = true;
        updateCallback();
      },
      (error) => {
        console.error('Erreur lors de l\'écoute des pizzas master:', error);
        masterPizzas = [];
        masterUnsubscribed = true;
        updateCallback();
      }
    );

    // Écouter les pizzas de l'utilisateur
    const userQuery = query(pizzasRef, where('active', '==', true), where('userId', '==', currentUser.uid));
    const unsubscribeUser = onSnapshot(userQuery,
      (snapshot) => {
        userPizzas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Pizza));
        userUnsubscribed = true;
        updateCallback();
      },
      (error) => {
        console.error('Erreur lors de l\'écoute des pizzas utilisateur:', error);
        userPizzas = [];
        userUnsubscribed = true;
        updateCallback();
      }
    );

    // Retourner une fonction qui désabonne les deux listeners
    return () => {
      unsubscribeMaster();
      unsubscribeUser();
    };
  },

  async subscribeToAllPizzas(callback: (pizzas: Pizza[]) => void) {
    if (!isFirebaseAvailable()) {
      callback([]);
      return () => {};
    }

    const currentUser = auth?.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }

    // Déterminer le userId à rechercher (master ou UID)
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const userIdToQuery = (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid;

    const pizzasRef = collection(db, COLLECTIONS.PIZZAS);
    const q = query(pizzasRef, where('userId', '==', userIdToQuery));

    return onSnapshot(q,
      (snapshot) => {
        const pizzas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Pizza));
        callback(pizzas);
      },
      (error) => {
        console.error('Erreur lors de l\'écoute des pizzas:', error);
        callback([]);
      }
    );
  }
};

// Orders Service
export const ordersService = {
  async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'order_number'>) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error('Utilisateur non authentifié');

    const ordersRef = collection(db, COLLECTIONS.ORDERS);

    // Générer le numéro de commande unique pour cet utilisateur
    const userOrdersQuery = query(ordersRef, where('user_id', '==', currentUser.uid));
    const snapshot = await getDocs(userOrdersQuery);
    const orderNumber = 20251 + snapshot.docs.length;

    const docRef = await addDoc(ordersRef, {
      ...orderData,
      order_number: orderNumber,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return docRef.id;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, preparationTime?: number) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    const updateData: any = {
      status,
      updated_at: serverTimestamp()
    };

    if (status === 'en_preparation') {
      updateData.preparation_time = preparationTime !== undefined ? preparationTime : 10;
    }

    await updateDoc(orderRef, updateData);
  },

  async updateOrderPreparationTime(orderId: string, preparationTime: number) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await updateDoc(orderRef, {
      preparation_time: preparationTime,
      updated_at: serverTimestamp()
    });
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    if (!isFirebaseAvailable()) return [];
    
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: (doc.data().created_at as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
    } as Order));
    
    // Tri côté client pour éviter l'index composite
    return orders.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Plus récent en premier
    });
  },

  async getAllOrders(): Promise<Order[]> {
    if (!isFirebaseAvailable()) return [];

    const currentUser = auth?.currentUser;
    if (!currentUser) return [];

    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, where('user_id', '==', currentUser.uid));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: (doc.data().created_at as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
    } as Order));

    return orders.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  },

  subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
    if (!isFirebaseAvailable()) {
      callback([]);
      return () => {};
    }
    
    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, where('user_id', '==', userId));
    
    return onSnapshot(q, 
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: (doc.data().created_at as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
        } as Order));
        
        // Tri côté client pour éviter l'index composite
        const sortedOrders = orders.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Plus récent en premier
        });
        
        callback(sortedOrders);
      },
      (error) => {
        console.error('Erreur lors de l\'écoute des commandes utilisateur:', error);
        callback([]);
      }
    );
  },

  subscribeToAllOrders(callback: (orders: Order[]) => void) {
    if (!isFirebaseAvailable()) {
      callback([]);
      return () => {};
    }

    const currentUser = auth?.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }

    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, where('user_id', '==', currentUser.uid));

    return onSnapshot(q,
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: (doc.data().created_at as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
        } as Order));

        const sortedOrders = orders.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });

        callback(sortedOrders);
      },
      (error) => {
        console.error('Erreur lors de l\'écoute de toutes les commandes:', error);
        callback([]);
      }
    );
  },

  subscribeToOrdersByStatus(status: OrderStatus, callback: (orders: Order[]) => void) {
    if (!isFirebaseAvailable()) {
      callback([]);
      return () => {};
    }

    const currentUser = auth?.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }

    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(
      ordersRef,
      where('status', '==', status),
      where('user_id', '==', currentUser.uid)
    );

    return onSnapshot(q,
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: (doc.data().created_at as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
        } as Order));

        const sortedOrders = orders.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });

        callback(sortedOrders);
      },
      (error) => {
        console.error('Erreur lors de l\'écoute des commandes par statut:', error);
        callback([]);
      }
    );
  },

  async deleteAllOrders() {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error('Utilisateur non authentifié');

    const ordersRef = collection(db, COLLECTIONS.ORDERS);
    const q = query(ordersRef, where('user_id', '==', currentUser.uid));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }
};

// Extras Service
export const extrasService = {
  async createExtra(extraData: Omit<Extra, 'id'>) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error('Utilisateur non authentifié');

    // Utiliser 'master' comme userId pour le compte master au lieu de l'UID Firebase
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const extrasRef = collection(db, COLLECTIONS.EXTRAS);
    const docRef = await addDoc(extrasRef, {
      ...extraData,
      userId: (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid,
      active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return docRef.id;
  },

  async updateExtra(extraId: string, extraData: Partial<Extra>) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');
    
    const extraRef = doc(db, COLLECTIONS.EXTRAS, extraId);
    await updateDoc(extraRef, {
      ...extraData,
      updated_at: serverTimestamp()
    });
  },

  async deleteExtra(extraId: string) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');
    
    const extraRef = doc(db, COLLECTIONS.EXTRAS, extraId);
    await deleteDoc(extraRef);
  },

  async getAllExtras(): Promise<Extra[]> {
    if (!isFirebaseAvailable()) return [];

    const extrasRef = collection(db, COLLECTIONS.EXTRAS);
    const currentUser = auth?.currentUser;

    // Si pas connecté, récupérer uniquement les extras master
    if (!currentUser) {
      const q = query(extrasRef, where('userId', '==', 'master'));
      const snapshot = await getDocs(q);
      const extras = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Extra)).filter(extra => (extra as any).active !== false);
      return extras.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Récupérer les extras master (menu de base)
    const masterQuery = query(extrasRef, where('userId', '==', 'master'));
    const masterSnapshot = await getDocs(masterQuery);
    const masterExtras = masterSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Extra)).filter(extra => (extra as any).active !== false);

    // Récupérer les extras de l'utilisateur (ses modifications)
    const userQuery = query(extrasRef, where('userId', '==', currentUser.uid));
    const userSnapshot = await getDocs(userQuery);
    const userExtras = userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Extra)).filter(extra => (extra as any).active !== false);

    // Combiner les deux listes
    const allExtras = [...masterExtras, ...userExtras];
    return allExtras.sort((a, b) => a.name.localeCompare(b.name));
  },

  subscribeToActiveExtras(callback: (extras: Extra[]) => void) {
    if (!isFirebaseAvailable()) {
      callback([]);
      return () => {};
    }

    const currentUser = auth?.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }

    const extrasRef = collection(db, COLLECTIONS.EXTRAS);
    const q = query(extrasRef, where('userId', '==', currentUser.uid));
    
    return onSnapshot(q, 
      (snapshot) => {
        const extras = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Extra)).filter(extra => (extra as any).active !== false);
        callback(extras.sort((a, b) => a.name.localeCompare(b.name)));
      },
      (error) => {
        console.error('Erreur lors de l\'écoute des extras:', error);
        callback([]);
      }
    );
  }
};

// Categories Service
export const categoriesService = {
  async createCategory(categoryData: { name: string; description?: string; active: boolean }) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error('Utilisateur non authentifié');

    try {
      // Déterminer le userId (master ou UID)
      const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const userId = (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid;

      console.log('🔍 Création catégorie avec userId:', userId);
      console.log('🔍 Données catégorie:', categoryData);

      const categoriesRef = collection(db, 'categories');
      const docRef = await addDoc(categoriesRef, {
        ...categoryData,
        userId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      console.log('✅ Catégorie créée avec ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erreur détaillée lors de la création:', error);
      throw error;
    }
  },

  async updateCategory(categoryId: string, categoryData: Partial<{ name: string; description?: string; active: boolean }>) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error('Utilisateur non authentifié');

    // Récupérer la catégorie existante
    const categoryRef = doc(db, 'categories', categoryId);
    const categorySnap = await getDoc(categoryRef);

    if (!categorySnap.exists()) {
      throw new Error('Catégorie introuvable');
    }

    const existingCategory = categorySnap.data();

    // Vérifier que l'utilisateur est le propriétaire
    if (existingCategory.userId !== currentUser.uid && existingCategory.userId !== 'master') {
      throw new Error('Vous n\'êtes pas autorisé à modifier cette catégorie');
    }

    // Modifier directement la catégorie
    await updateDoc(categoryRef, {
      ...categoryData,
      updated_at: serverTimestamp()
    });
  },

  async deleteCategory(categoryId: string) {
    if (!isFirebaseAvailable()) throw new Error('Firebase non disponible');

    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error('Utilisateur non authentifié');

    // Récupérer la catégorie existante
    const categoryRef = doc(db, 'categories', categoryId);
    const categorySnap = await getDoc(categoryRef);

    if (!categorySnap.exists()) {
      throw new Error('Catégorie introuvable');
    }

    const existingCategory = categorySnap.data();

    // Vérifier que l'utilisateur est le propriétaire
    if (existingCategory.userId !== currentUser.uid && existingCategory.userId !== 'master') {
      throw new Error('Vous n\'êtes pas autorisé à supprimer cette catégorie');
    }

    // Supprimer directement la catégorie
    await deleteDoc(categoryRef);
  },

  async getAllCategories(): Promise<Array<{ id: string; name: string; description?: string; active: boolean; created_at?: string }>> {
    if (!isFirebaseAvailable()) {
      return [];
    }

    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return [];
    }

    // Déterminer le userId (master ou UID)
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const userId = (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid;

    const categoriesRef = collection(db, 'categories');

    // Récupérer les catégories master
    const masterQuery = query(categoriesRef, where('userId', '==', 'master'));
    const masterSnapshot = await getDocs(masterQuery);
    const masterCategories = new Map();

    masterSnapshot.docs.forEach(doc => {
      const data = doc.data();
      masterCategories.set(doc.id, {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        active: data.active ?? true,
        created_at: (data.created_at as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
      });
    });

    // Si c'est master, retourner uniquement les catégories master
    if (userId === 'master') {
      return Array.from(masterCategories.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    // Récupérer les overrides de l'utilisateur
    const userQuery = query(categoriesRef, where('userId', '==', userId));
    const userSnapshot = await getDocs(userQuery);

    // Appliquer les overrides
    userSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const masterCategoryId = data.masterCategoryId;

      if (masterCategoryId && masterCategories.has(masterCategoryId)) {
        // C'est un override d'une catégorie master
        masterCategories.set(masterCategoryId, {
          id: masterCategoryId,
          name: data.name || '',
          description: data.description || '',
          active: data.active ?? true,
          created_at: (data.created_at as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
        });
      } else if (!masterCategoryId) {
        // C'est une catégorie créée par l'utilisateur
        masterCategories.set(doc.id, {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          active: data.active ?? true,
          created_at: (data.created_at as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
        });
      }
    });

    return Array.from(masterCategories.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  subscribeToCategories(callback: (categories: Array<{ id: string; name: string; description?: string; active: boolean; created_at?: string }>) => void) {
    if (!isFirebaseAvailable()) {
      callback([]);
      return () => {};
    }

    const currentUser = auth?.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }

    // Déterminer le userId (master ou UID)
    const getUserId = async () => {
      const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      return (userData?.email === 'master@pizzeria.com') ? 'master' : currentUser.uid;
    };

    const categoriesRef = collection(db, 'categories');
    let unsubscribe: (() => void) | null = null;

    // Initialiser l'écoute
    getUserId().then(async (userId) => {
      // Écouter en temps réel les catégories de l'utilisateur (ou master si c'est master)
      const userQuery = query(categoriesRef, where('userId', '==', userId));
      unsubscribe = onSnapshot(userQuery, (snapshot) => {
        const categories = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            active: data.active ?? true,
            created_at: (data.created_at as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
          };
        });

        callback(categories.sort((a, b) => a.name.localeCompare(b.name)));
      });
    });

    // Retourner une fonction de nettoyage
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }
};