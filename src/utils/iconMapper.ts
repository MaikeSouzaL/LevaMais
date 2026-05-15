import { MaterialIcons } from "@expo/vector-icons";

/**
 * Map Lucide icon names (web/admin) to MaterialIcons (mobile app).
 */
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

export const ICON_MAP: Record<string, MaterialIconName> = {
  UtensilsCrossed: "restaurant",
  FastForward: "fastfood",
  Salad: "restaurant-menu",
  Wine: "local-bar",
  FileText: "description",
  FolderOpen: "folder-open",
  ShoppingBag: "shopping-bag",
  ShoppingCart: "shopping-cart",
  ShoppingBasket: "shopping-basket",
  Pill: "local-pharmacy",
  HeartPulse: "favorite",
  Gift: "card-giftcard",
  Flower2: "local-florist",
  Package: "inventory",
  Boxes: "inventory-2",
  Key: "vpn-key",
  Shirt: "checkroom",
  Book: "book",
  Smartphone: "smartphone",
  Tv: "tv",
  Sparkles: "auto-awesome",
  Dog: "pets",
  Heart: "favorite",
  PawPrint: "pets",
  Gem: "diamond",
  Watch: "watch",
  Mail: "mail",
  Wrench: "build",
  Tool: "handyman",
  HardHat: "engineering",
  Briefcase: "work",
  Zap: "flash-on",
  Rocket: "rocket-launch",
  Home: "home",
  Armchair: "chair",
  Bed: "hotel",
  Refrigerator: "kitchen",
  Bike: "directions-bike",
  Music: "music-note",
  Megaphone: "campaign",
  Box: "inventory-2",
  List: "list",
};

export function mapIconName(lucideIcon: string): MaterialIconName {
  return ICON_MAP[lucideIcon] || "list";
}
