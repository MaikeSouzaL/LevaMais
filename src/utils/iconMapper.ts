/**
 * Mapeia ícones do Lucide (usado no painel web)
 * para MaterialIcons (usado no app mobile)
 */
export const ICON_MAP: Record<string, string> = {
  // Delivery & Food
  UtensilsCrossed: "restaurant",
  FastForward: "fastfood",
  Salad: "restaurant-menu",
  Wine: "local-bar",

  // Documents & Files
  FileText: "description",
  FolderOpen: "folder-open",

  // Shopping
  ShoppingBag: "shopping-bag",
  ShoppingCart: "shopping-cart",
  ShoppingBasket: "shopping-basket",

  // Health
  Pill: "local-pharmacy",
  HeartPulse: "favorite",

  // Gifts & Flowers
  Gift: "card-giftcard",
  Flower2: "local-florist",

  // Packages & Boxes
  Package: "inventory",
  Boxes: "inventory-2",

  // Keys
  Key: "vpn-key",

  // Clothing
  Shirt: "checkroom",

  // Books
  Book: "book",

  // Electronics
  Smartphone: "smartphone",
  Tv: "tv",

  // Beauty
  Sparkles: "auto-awesome",

  // Pets
  Dog: "pets",
  Heart: "favorite",
  PawPrint: "pets",

  // Jewelry
  Gem: "diamond",
  Watch: "watch",

  // Mail
  Mail: "mail",

  // Tools & Work
  Wrench: "build",
  Tool: "handyman",
  HardHat: "engineering",
  Briefcase: "work",

  // Express/Fast
  Zap: "flash-on",
  Rocket: "rocket-launch",

  // Home & Furniture
  Home: "home",
  Armchair: "chair",
  Bed: "hotel",
  Refrigerator: "kitchen",

  // Sports & Music
  Bike: "directions-bike",
  Music: "music-note",

  // Marketing
  Megaphone: "campaign",

  // Generic fallback
  Box: "inventory-2",
  List: "list",
};

/**
 * Converte nome de ícone Lucide para MaterialIcons
 * @param lucideIcon Nome do ícone no formato Lucide (ex: "FileText")
 * @returns Nome do ícone no formato MaterialIcons (ex: "description")
 */
export function mapIconName(lucideIcon: string): string {
  return ICON_MAP[lucideIcon] || "list"; // fallback to 'list' if not found
}
