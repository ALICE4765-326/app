// Types de base pour l'application
export type UserRole = 'admin' | 'pizzeria' | 'client';

export type OrderStatus = 'en_attente' | 'confirmee' | 'en_preparation' | 'prete' | 'recuperee' | 'cancelled';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  selectedSpace?: UserRole;
  full_name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at?: string;
}

export interface Pizza {
  id: string;
  name: string;
  description: string;
  image_url: string;
  prices: {
    small: number;
    medium: number;
    large: number;
  };
  has_unique_price?: boolean;
  unique_price?: number;
  ingredients: string[];
  category: string;
  vegetarian: boolean;
  active?: boolean;
  customizable?: boolean;
  max_custom_ingredients?: number;
  custom_ingredients?: string[];
  created_at?: string;
  updated_at?: string;
  userId?: string;
  master_pizza_id?: string;
  is_override?: boolean;
  is_hidden?: boolean;
}

export interface Extra {
  id: number;
  name: string;
  price: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  pizza_id: string;
  pizza_name: string;
  pizza_category?: string;
  size: 'small' | 'medium' | 'large';
  quantity: number;
  price: number;
  removed_ingredients?: string[];
  extras?: Extra[];
  custom_ingredients?: string[];
}

export interface Order {
  id: string;
  order_number: number;
  user_id: string;
  user: {
    full_name: string;
    phone: string;
    address: string;
    email: string;
  };
  pickup_address: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  preparation_time?: number;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  pizza: Pizza;
  size: 'small' | 'medium' | 'large';
  quantity: number;
  removedIngredients: string[];
  extras: Extra[];
  customIngredients: string[];
}