// PBJ Health - Today Dashboard
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ✅ Your fixed AuthProvider API
import { useAuth } from "@/auth/AuthProvider";

// Profile hook
import { useProfile } from "@/hooks/useProfile";

// UI hooks + components
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { DashboardCard } from "@/components/DashboardCard";
import { StatusChip } from "@/components/StatusChip";
import { EmptyState } from "@/components/EmptyState";
import HeaderMenu from "@/components/HeaderMenu";
import { Button } from "@/components/ui/button";
import { DailyCheckInWizard } from "@/components/DailyCheckInWizard";

import { Sleep7d } from "@/components/charts/Sleep7d";
import { Weight7d } from "@/components/charts/Weight7d";
import { Nutrition7d } from "@/components/charts/Nutrition7d";
import { Workouts7dTable } from "@/components/Workouts7dTable";

import {
  Activity,
  Moon,
  Scale,
  Utensils,
  Brain,
  Briefcase,
  Heart,
  Home,
  Coffee,
  Wind,
  Sparkles,
} from "lucide-react";

import { getTodayISO } from "@/lib/dateUtils";
import { apiClient } from "@/lib/apiClient";

// ================================
// 🔥 FIXED AUTH DESTRUCTURING
// ================================
export default function Today() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const { profile } = useProfile();
  const today = getTodayISO();

  const [showWizard, setShowWizard] = useState(false);

  console.log("=== TODAY PAGE MOUNTED ===");
  console.log("AUTH:", { user, isLoading, isAuthenticated });
  console.log("PROFILE:", profile);
