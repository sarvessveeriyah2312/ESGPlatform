/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Trees,
  Check,
  Minus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Info,
  HelpCircle,
  Building,
  Target,
  Landmark
} from 'lucide-react';

import Button from './ui/Button';
import Card from './ui/Card';
import { publicApi, PublicPlanPricing, PublicFeatureFlag } from '../api/publicApi';
import { FEATURE_REGISTRY, PlanType } from '../contexts/PlanContext';

interface PricingPageProps {
  onNavigateToDashboard: () => void;
  onNavigateToFeatures: () => void;
  onNavigateToLanding: (section?: string) => void;
  onNavigateToAbout: () => void;
  onNavigateToRegister: () => void;
}

function formatRM(amount: number): string {
  return `RM ${Math.round(amount).toLocaleString('en-MY')}`;
}

const PLAN_LEVELS: Record<PlanType, number> = { starter: 1, growth: 2, 'issuer-ready': 3 };

// Onboarding (OnboardingPage.tsx) derives the plan tier from a market classification the user
// picks in Step 1, defaulting to 'SME' with no memory of which pricing card was clicked — so a
// "Start free trial" click here stashes the intended market and OnboardingPage picks it up as its
// initial selection instead of re-asking from scratch. localStorage survives the login/register/
// email-verification redirect chain between here and onboarding, unlike a URL param.
export const PRICING_INTENT_MARKET_KEY = 'esgeasy_pricing_intent_market';
const MARKET_BY_PLAN: Record<'starter' | 'growth' | 'issuer', 'SME' | 'ACE Market' | 'Main Market'> = {
  starter: 'SME',
  growth: 'ACE Market',
  issuer: 'Main Market'
};

export default function PricingPage({ onNavigateToDashboard, onNavigateToFeatures, onNavigateToLanding, onNavigateToAbout, onNavigateToRegister }: PricingPageProps) {
  // Billing cycle state: false = Monthly, true = Annual
  const [isAnnual, setIsAnnual] = useState(true);

  const handleStartTrial = (planKey: 'starter' | 'growth' | 'issuer') => {
    localStorage.setItem(PRICING_INTENT_MARKET_KEY, MARKET_BY_PLAN[planKey]);
    onNavigateToRegister();
  };

  // Live pricing + feature gating — the same admin-managed data (Platform Admin > Plan
  // Management) the app itself runs on, via the unauthenticated /api/v1/public/* endpoints, so
  // this page can't silently drift from what a subscriber actually gets.
  const [planPricing, setPlanPricing] = useState<PublicPlanPricing[]>([]);
  const [featureFlags, setFeatureFlags] = useState<PublicFeatureFlag[]>([]);

  useEffect(() => {
    publicApi.planPricing().then(setPlanPricing).catch(() => {});
    publicApi.features().then(setFeatureFlags).catch(() => {});
  }, []);

  const starterPricing = planPricing.find((p) => p.plan === 'STARTER');
  const growthPricing = planPricing.find((p) => p.plan === 'GROWTH');
  const issuerPricing = planPricing.find((p) => p.plan === 'ISSUER_READY');

  const prices = {
    starter: {
      monthly: starterPricing ? formatRM(starterPricing.monthlyPrice) : '—',
      annual: starterPricing ? formatRM(starterPricing.annualMonthlyPrice) : '—',
      annualBilled: starterPricing ? formatRM(starterPricing.annualMonthlyPrice * 12) : '—'
    },
    growth: {
      monthly: growthPricing ? formatRM(growthPricing.monthlyPrice) : '—',
      annual: growthPricing ? formatRM(growthPricing.annualMonthlyPrice) : '—',
      annualBilled: growthPricing ? formatRM(growthPricing.annualMonthlyPrice * 12) : '—'
    },
    issuer: {
      monthly: issuerPricing ? formatRM(issuerPricing.monthlyPrice) : '—',
      annual: issuerPricing ? formatRM(issuerPricing.annualMonthlyPrice) : '—',
      annualBilled: issuerPricing ? formatRM(issuerPricing.annualMonthlyPrice * 12) : '—'
    }
  };

  // Simple Included / Not-included comparison, grouped by the minimum plan tier that unlocks each
  // feature — driven by the real feature_flag gating data (same source the app uses to lock
  // features), rather than hand-written per-cell marketing copy that could drift from reality.
  const featureRows = featureFlags
    .map((flag) => ({ flag, meta: FEATURE_REGISTRY[flag.featureKey] }))
    .filter((row) => row.meta)
    .sort((a, b) => PLAN_LEVELS[a.meta.minPlan] - PLAN_LEVELS[b.meta.minPlan] || a.meta.name.localeCompare(b.meta.name));

  const includedAt = (minPlan: PlanType, column: PlanType) => PLAN_LEVELS[column] >= PLAN_LEVELS[minPlan];

  // FAQ state: open questions indexes
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({
    0: true, // open the first FAQ by default
  });

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Mobile Accordion state for Comparison table
  const [openMobilePlan, setOpenMobilePlan] = useState<'starter' | 'growth' | 'issuer' | null>('growth');

  const faqs = [
    {
      question: "What's the difference between SEDG and Bursa's Common Sustainability Matters?",
      answer: "The Simplified ESG Disclosure Guide (SEDG) is developed by Capital Markets Malaysia primarily for small-to-medium enterprises (SMEs) to simplify tracking across common global supply chain demands. Bursa Malaysia's Common Sustainability Matters are a broader, more rigorous set of mandated disclosure metrics specifically required for companies listed on the Main and ACE markets. EsgEasy seamlessly supports both frameworks and maps overlapping indicators to save you double entry."
    },
    {
      question: "Can I upgrade from Growth to Issuer-Ready?",
      answer: "Absolutely. You can upgrade your account at any time. All of your existing materiality assessments, governance documents, and historical emissions data will automatically migrate and pre-populate the corresponding fields in the expanded Bursa Malaysia / NSRF framework."
    },
    {
      question: "Does this replace Bursa Malaysia's CSI platform?",
      answer: "No, EsgEasy is an internal readiness, data consolidation, and compliance prep layer. Bursa Malaysia's Centralised Sustainability Intelligence (CSI) platform remains the official mandatory submission channel for listed issuers. EsgEasy acts as your team's internal collaboration workspace to compile, verify, and export CSI-compatible datasets so you can submit with absolute confidence."
    },
    {
      question: "Are our greenhouse gas (GHG) calculations audit-ready?",
      answer: "Yes, our Scope 1, 2, and 3 emissions engine is built strictly in accordance with the Greenhouse Gas Protocol Corporate Standard. We pre-populate localized emission factors (such as grid electricity intensity from the Energy Commission of Malaysia) and provide complete audit trails, source-document attachments, and version history."
    },
    {
      question: "What is transition-relief handling in Issuer-Ready?",
      answer: "Under the National Sustainability Reporting Framework (NSRF) aligned with ISSB S1/S2 standards, listed companies are granted specific transition relief in the first 1-2 years of mandatory compliance (e.g., regarding Scope 3 emissions or specific climate resilience metrics). Our Issuer-Ready plan handles these reliefs dynamically, allowing you to flag and note them in compliance with official regulatory guidelines."
    },
    {
      question: "What support SLA is provided for Malaysian listed issuers?",
      answer: "Issuer-Ready subscribers are assigned a dedicated sustainability advisor and have access to our priority technical support team with a guaranteed 4-hour response time SLA, ensuring uninterrupted report preparation ahead of annual reporting deadlines."
    }
  ];

  const handleNav = (section?: string) => {
    onNavigateToLanding(section);
  };

  return (
    <div className="min-h-screen bg-bg-light text-navy-900 font-sans selection:bg-primary-100 selection:text-primary-900 relative">
      
      {/* 1. STICKY TOP NAV */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-navy-100/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo segment */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNav()}>
            <div className="p-2 bg-primary-100 text-primary-600 rounded-xl">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-navy-950 block">EsgEasy</span>
              <span className="text-[9px] font-semibold text-navy-400 uppercase tracking-widest block leading-none">MALAYSIA</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-navy-600">
            <button onClick={onNavigateToFeatures} className="hover:text-primary-600 transition-colors cursor-pointer">Product</button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-primary-600 font-semibold cursor-pointer">Pricing</button>
            <button onClick={onNavigateToAbout} className="hover:text-primary-600 transition-colors cursor-pointer">About</button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={onNavigateToDashboard}
              className="text-sm font-semibold text-navy-600 hover:text-navy-900 transition-colors cursor-pointer"
            >
              Log in
            </button>
            <Button variant="primary" size="sm" onClick={onNavigateToRegister}>
              Get Started
            </Button>
          </div>

        </div>
      </nav>

      {/* 2. PAGE HEADER + TOGGLE */}
      <section className="relative overflow-hidden pt-16 pb-12 bg-white">
        {/* Soft background glow */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-5%] right-[-10%] w-[450px] h-[450px] bg-primary-100/25 rounded-full blur-[100px]" />
          <div className="absolute bottom-[5%] left-[-10%] w-[350px] h-[350px] bg-blue-100/20 rounded-full blur-[90px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-wider block mb-2">Flexible Corporate Pricing</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-navy-950 max-w-3xl mx-auto">
            Plans built to scale with your ESG reporting needs
          </h1>
          <p className="text-sm md:text-base text-navy-500 max-w-2xl mx-auto mt-4 leading-relaxed">
            Whether preparing your first Simplified ESG Disclosure Guide (SEDG) report or aligning with mandatory Bursa Malaysia disclosures, choose a plan suited for your audit readiness.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <span className={`text-xs font-semibold transition-colors ${!isAnnual ? 'text-navy-950 font-bold' : 'text-navy-400'}`}>Billed Monthly</span>
            
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Toggle Billing Cycle"
            >
              <span 
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAnnual ? 'translate-x-5 bg-primary-600' : 'translate-x-0'}`} 
              />
            </button>

            <span className={`text-xs font-semibold transition-colors ${isAnnual ? 'text-navy-950 font-bold' : 'text-navy-400'}`}>Billed Annually</span>
            
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-100 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-800 animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>Save over 30%</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. THREE PRICING CARDS */}
      <section className="py-12 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* PLAN 1: STARTER */}
            <Card hoverEffect className="bg-bg-light border border-navy-100 flex flex-col justify-between h-full" padded="lg">
              <div>
                <div className="flex items-center space-x-2.5 mb-4">
                  <div className="p-2 bg-navy-100 text-navy-800 rounded-xl">
                    <Building className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-950">SME Starter</h3>
                </div>
                <p className="text-xs text-navy-500 font-medium min-h-[32px]">
                  Fulfill basic local supply-chain assessments with CMM's core SEDG standards.
                </p>

                {/* Price */}
                <div className="my-6">
                  <div className="flex items-baseline text-navy-950">
                    <span className="text-3xl md:text-4xl font-extrabold tracking-tight">
                      {isAnnual ? prices.starter.annual : prices.starter.monthly}
                    </span>
                    <span className="ml-1 text-xs font-medium text-navy-500">/ month</span>
                  </div>
                  <span className="text-[10px] text-navy-400 font-medium block mt-1">
                    {isAnnual ? `Billed annually at ${prices.starter.annualBilled}/year` : 'Billed monthly'}
                  </span>
                </div>

                {/* Bullet capabilities */}
                <div className="border-t border-navy-200/60 pt-5 mt-5">
                  <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block mb-4">Included capabilities</span>
                  <ul className="space-y-3">
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>SEDG Basic tier template</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>Guided materiality assessment</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>Single-year indicator data entry</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>Exportable disclosure summary PDF</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>Standard email support</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Button variant="secondary" size="md" className="w-full text-center" onClick={() => handleStartTrial('starter')}>
                  Start free trial
                </Button>
              </div>
            </Card>

            {/* PLAN 2: GROWTH (RECOMMENDED / Visually Emphasized) */}
            <div className="relative">
              {/* Popular Badge — rendered outside Card (which clips overflow) so it isn't cut off where it pokes above the card edge */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-primary-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                MOST POPULAR
              </div>

              <Card className="bg-white border-2 border-primary-500 relative flex flex-col justify-between h-full shadow-xl shadow-primary-500/5" padded="lg">
              <div>
                <div className="flex items-center space-x-2.5 mb-4">
                  <div className="p-2 bg-primary-100 text-primary-600 rounded-xl">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-950">SME Growth</h3>
                </div>
                <p className="text-xs text-navy-500 font-medium min-h-[32px]">
                  Robust multi-year tracking for suppliers with advanced export and audit needs.
                </p>

                {/* Price */}
                <div className="my-6">
                  <div className="flex items-baseline text-navy-950">
                    <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary-600">
                      {isAnnual ? prices.growth.annual : prices.growth.monthly}
                    </span>
                    <span className="ml-1 text-xs font-medium text-navy-500">/ month</span>
                  </div>
                  <span className="text-[10px] text-navy-400 font-medium block mt-1">
                    {isAnnual ? `Billed annually at ${prices.growth.annualBilled}/year` : 'Billed monthly'}
                  </span>
                </div>

                {/* Bullet capabilities */}
                <div className="border-t border-navy-200/60 pt-5 mt-5">
                  <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block mb-4">Everything in Starter plus:</span>
                  <ul className="space-y-3">
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span className="font-semibold text-navy-900">Full SEDG (All 35 disclosures)</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>3-year data tracking with targets</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>Governance structure documentation</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>1 localized sector-specific module</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-primary-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>Comprehensive interactive audit trail</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Button variant="primary" size="md" className="w-full text-center" onClick={() => handleStartTrial('growth')}>
                  Start free trial
                </Button>
              </div>
              </Card>
            </div>

            {/* PLAN 3: ISSUER READY */}
            <Card hoverEffect className="bg-bg-light border border-navy-100 flex flex-col justify-between h-full" padded="lg">
              <div>
                <div className="flex items-center space-x-2.5 mb-4">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-950">Issuer-Ready</h3>
                </div>
                <p className="text-xs text-navy-500 font-medium min-h-[32px]">
                  Enterprise-grade platform for public listed companies and high-impact non-listed enterprises.
                </p>

                {/* Price */}
                <div className="my-6">
                  <div className="flex items-baseline text-navy-950">
                    <span className="text-3xl md:text-4xl font-extrabold tracking-tight">
                      {isAnnual ? prices.issuer.annual : prices.issuer.monthly}
                    </span>
                    <span className="ml-1 text-xs font-medium text-navy-500">/ month</span>
                  </div>
                  <span className="text-[10px] text-navy-400 font-medium block mt-1">
                    {isAnnual ? `Billed annually at ${prices.issuer.annualBilled}/year` : 'Billed monthly'}
                  </span>
                </div>

                {/* Bullet capabilities */}
                <div className="border-t border-navy-200/60 pt-5 mt-5">
                  <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block mb-4">Enterprise Capabilites</span>
                  <ul className="space-y-3">
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-purple-500 mr-2.5 shrink-0 mt-0.5" />
                      <span className="font-semibold text-navy-900">Bursa Common Sustainability Matters</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-purple-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>IFRS S1 and S2 Climate Modules</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-purple-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>Full Scope 1-3 greenhouse gas tracking</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-purple-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>Assurance-readiness workspace + sign-off</span>
                    </li>
                    <li className="flex items-start text-xs text-navy-700">
                      <Check className="w-4 h-4 text-purple-500 mr-2.5 shrink-0 mt-0.5" />
                      <span>CSI-compatible JSON export formats</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Button variant="secondary" size="md" className="w-full text-center hover:bg-navy-100" onClick={() => handleStartTrial('issuer')}>
                  Start free trial
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* 4. FULL COMPARISON TABLE SECTION */}
      <section className="py-16 md:py-24 bg-white border-t border-navy-100/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider block mb-2">Granular Details</span>
            <h2 className="text-2xl md:text-3xl font-bold text-navy-950">Feature Comparison</h2>
            <p className="text-sm text-navy-500 mt-2">Exactly what's included at each tier — the same gating rules your workspace runs on.</p>
          </div>

          {/* DESKTOP STICKY COMPARISON TABLE (hidden on mobile) */}
          <div className="hidden lg:block relative overflow-visible border border-navy-100/70 rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              {/* Sticky Table Header */}
              <thead className="sticky top-[73px] z-30 bg-navy-50 border-b border-navy-200/80 shadow-sm">
                <tr>
                  <th className="py-4.5 px-6 text-xs font-bold text-navy-900 uppercase tracking-wider w-1/3">Feature</th>
                  <th className="py-4.5 px-6 text-xs font-bold text-navy-900 uppercase tracking-wider text-center w-1/5">SME Starter</th>
                  <th className="py-4.5 px-6 text-xs font-bold text-navy-900 uppercase tracking-wider text-center w-1/5 bg-primary-50/40">SME Growth</th>
                  <th className="py-4.5 px-6 text-xs font-bold text-navy-900 uppercase tracking-wider text-center w-1/5">Issuer-Ready</th>
                </tr>
              </thead>

              {/* Table Content */}
              <tbody className="divide-y divide-navy-100">
                {featureRows.map(({ flag, meta }) => (
                  <tr key={flag.featureKey} className="hover:bg-navy-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-navy-900 block">{meta.name}</span>
                      {meta.description && <span className="text-[11px] text-navy-400 block mt-0.5">{meta.description}</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {includedAt(meta.minPlan, 'starter') ? (
                        <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-navy-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-6 text-center bg-primary-50/10">
                      {includedAt(meta.minPlan, 'growth') ? (
                        <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-navy-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {includedAt(meta.minPlan, 'issuer-ready') ? (
                        <Check className="w-5 h-5 text-purple-600 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-navy-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE ACCORDION (shown on mobile, collapsed per plan) */}
          <div className="lg:hidden space-y-4">

            {/* Toggle buttons for Mobile comparison */}
            <div className="flex bg-navy-100/60 p-1 rounded-xl">
              <button
                onClick={() => setOpenMobilePlan('starter')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${openMobilePlan === 'starter' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-500'}`}
              >
                Starter
              </button>
              <button
                onClick={() => setOpenMobilePlan('growth')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${openMobilePlan === 'growth' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-500'}`}
              >
                Growth
              </button>
              <button
                onClick={() => setOpenMobilePlan('issuer')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${openMobilePlan === 'issuer' ? 'bg-white text-navy-950 shadow-sm' : 'text-navy-500'}`}
              >
                Issuer
              </button>
            </div>

            {/* Render selected mobile plan comparison card */}
            <Card className="bg-white border border-navy-100" padded="md">
              <div className="border-b border-navy-100 pb-3 mb-4 flex justify-between items-center">
                <span className="text-sm font-bold text-navy-950">
                  {openMobilePlan === 'starter' && "SME Starter Package Details"}
                  {openMobilePlan === 'growth' && "SME Growth Package Details"}
                  {openMobilePlan === 'issuer' && "Issuer-Ready Package Details"}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                  {openMobilePlan === 'starter' && `${isAnnual ? prices.starter.annual : prices.starter.monthly}/mo`}
                  {openMobilePlan === 'growth' && `${isAnnual ? prices.growth.annual : prices.growth.monthly}/mo`}
                  {openMobilePlan === 'issuer' && `${isAnnual ? prices.issuer.annual : prices.issuer.monthly}/mo`}
                </span>
              </div>

              <ul className="divide-y divide-navy-50">
                {featureRows.map(({ flag, meta }) => {
                  const included = includedAt(meta.minPlan, openMobilePlan === 'issuer' ? 'issuer-ready' : openMobilePlan ?? 'starter');
                  return (
                    <li key={flag.featureKey} className="py-2.5 flex items-center justify-between text-xs gap-4">
                      <span className="text-navy-500 font-medium">{meta.name}</span>
                      {included ? (
                        <span className="text-emerald-600 font-bold shrink-0">Included</span>
                      ) : (
                        <span className="text-navy-300 font-medium shrink-0">—</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>

          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-20 md:py-28 bg-bg-light">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <HelpCircle className="w-10 h-10 text-primary-500 mx-auto mb-3" />
            <h2 className="text-3xl font-bold tracking-tight text-navy-950">Frequently Asked Questions</h2>
            <p className="text-sm text-navy-500 mt-2">Everything you need to know about Malaysia's changing ESG regulatory landscape.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqs[index];
              return (
                <div 
                  key={index} 
                  className="bg-white border border-navy-100/80 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left text-navy-950 font-bold text-xs md:text-sm hover:bg-navy-50/40 transition-colors focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4.5 h-4.5 text-navy-500 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-4.5 h-4.5 text-navy-500 shrink-0 ml-4" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="p-5 pt-0 text-xs md:text-sm text-navy-600 leading-relaxed border-t border-navy-50 bg-navy-50/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA BAND */}
      <section className="py-20 relative bg-primary-950 overflow-hidden text-white">
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-organic-gradient opacity-20 pointer-events-none z-0" />
        <div className="absolute -top-1/2 left-1/4 w-[500px] h-[500px] bg-primary-400/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Accelerate your corporate ESG compliance today
          </h2>
          <p className="text-sm md:text-base text-primary-200 max-w-2xl mx-auto mb-8 leading-relaxed">
            Configure your company profile in 10 minutes. Begin tracking your sustainability scope under Malaysia's regulatory guide.
          </p>
          <div className="flex justify-center">
            <Button
              variant="premium"
              size="lg"
              className="px-8 py-4 text-base"
              onClick={onNavigateToRegister}
              icon={<ArrowRight className="w-4.5 h-4.5" />}
              iconPosition="right"
            >
              Get Started for Free
            </Button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-navy-950 text-navy-400 pt-16 pb-8 border-t border-navy-900 font-sans">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Column 1 - Brand info */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <div className="p-1.5 bg-primary-500 rounded-lg text-white">
                <Trees className="w-5 h-5" />
              </div>
              <span className="text-base font-bold tracking-tight">EsgEasy</span>
            </div>
            <p className="text-xs text-navy-400 max-w-sm leading-relaxed">
              Leading Malaysian ESG compliance and sustainability disclosures automation framework. Assisting small enterprises and listed issuers meet modern regulatory compliance.
            </p>
          </div>

          {/* Column 2 - Product */}
          <div className="space-y-3.5 text-xs">
            <span className="font-bold text-white uppercase tracking-wider text-[10px]">Product</span>
            <ul className="space-y-2">
              <li><button onClick={onNavigateToDashboard} className="hover:text-white transition-colors cursor-pointer">Disclosure Engine</button></li>
              <li><button onClick={onNavigateToDashboard} className="hover:text-white transition-colors cursor-pointer">Scope 1, 2 & 3 Carbon Calculator</button></li>
              <li><button onClick={onNavigateToDashboard} className="hover:text-white transition-colors cursor-pointer">SEDG Templates</button></li>
              <li><button onClick={onNavigateToDashboard} className="hover:text-white transition-colors cursor-pointer">AI Drafting Assistant</button></li>
              <li><button onClick={onNavigateToDashboard} className="hover:text-white transition-colors cursor-pointer">Custom Roles & Permissions</button></li>
              <li><button onClick={onNavigateToDashboard} className="hover:text-white transition-colors cursor-pointer">Assurance Workspace</button></li>
            </ul>
          </div>

          {/* Column 3 - Company */}
          <div className="space-y-3.5 text-xs">
            <span className="font-bold text-white uppercase tracking-wider text-[10px]">Company</span>
            <ul className="space-y-2">
              <li><button onClick={onNavigateToAbout} className="hover:text-white transition-colors cursor-pointer text-left">About Us</button></li>
              <li><button onClick={() => handleNav('regulatory')} className="hover:text-white transition-colors cursor-pointer text-left">Framework Partner</button></li>
              <li><button onClick={onNavigateToAbout} className="hover:text-white transition-colors cursor-pointer text-left">Case Studies</button></li>
              <li><button onClick={onNavigateToDashboard} className="hover:text-white transition-colors cursor-pointer">Contact Support</button></li>
            </ul>
          </div>

          {/* Column 4 - Resources & Legal */}
          <div className="space-y-3.5 text-xs">
            <span className="font-bold text-white uppercase tracking-wider text-[10px]">Resources & Legal</span>
            <ul className="space-y-2">
              <li><a href="https://www.bursamalaysia.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Bursa Sustainability Guide</a></li>
              <li><a href="https://www.capitalmarketsmalaysia.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">SEDG Directives</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-navy-900 flex flex-col md:flex-row items-center justify-between text-xs text-navy-500">
          <span>© 2026 EsgEasy Corporation Sdn Bhd. All rights reserved.</span>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer">FB</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">LN</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">TW</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
