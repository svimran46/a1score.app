import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Menu,
  Newspaper,
  Radio,
  Scale,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavIconKey } from "@/lib/nav/config";

export const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  matches: Radio,
  news: Newspaper,
  leagues: Trophy,
  following: Star,
  more: Menu,
  values: TrendingUp,
  transfers: ArrowLeftRight,
  compare: Scale,
  players: Users,
  clubs: Shield,
  notifications: Bell,
  settings: Settings,
  methodology: BookOpen,
};
