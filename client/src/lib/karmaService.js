/**
 * KarmaService
 * Handles local persistence and business logic for the Karma & Reputation system.
 * This is a frontend-only implementation designed for easy migration to a backend later.
 */

const KARMA_KEY = 'fuelwatch_user_karma';
const TRUST_SCORE_KEY = 'fuelwatch_user_trust_score';
const CONTRIBUTIONS_KEY = 'fuelwatch_user_contributions';

const DEFAULT_KARMA = 2500;
const DEFAULT_TRUST_SCORE = 98;
const DEFAULT_TOTAL_CONTRIBUTIONS = 142;
const DEFAULT_VERIFIED_CONTRIBUTIONS = 139; // 139/142 ≈ 98%

export const KarmaService = {
  getKarma: () => {
    const saved = localStorage.getItem(KARMA_KEY);
    return saved !== null ? parseInt(saved, 10) : DEFAULT_KARMA;
  },

  setKarma: (value) => {
    localStorage.setItem(KARMA_KEY, value.toString());
    // Trigger a storage event for other components to listen to
    window.dispatchEvent(new Event('storage'));
    return value;
  },

  getTrustScore: () => {
    const contributions = KarmaService.getContributions();
    const localVerified = contributions.filter(c => c.status === 'verified' || c.status === 'approved' || c.status === 'confirmed').length;
    const localTotal = contributions.length;
    
    const totalVerified = DEFAULT_VERIFIED_CONTRIBUTIONS + localVerified;
    const totalCount = DEFAULT_TOTAL_CONTRIBUTIONS + localTotal;
    
    return totalCount > 0 ? Math.round((totalVerified / totalCount) * 100) : 100;
  },

  setTrustScore: (value) => {
    localStorage.setItem(TRUST_SCORE_KEY, value.toString());
    window.dispatchEvent(new Event('storage'));
    return value;
  },

  getContributions: () => {
    const saved = localStorage.getItem(CONTRIBUTIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  addContribution: (type, data) => {
    const contributions = KarmaService.getContributions();
    const karmaImpact = KarmaService.getKarmaImpact(type);
    
    const newContribution = {
      id: crypto.randomUUID(),
      type, // 'Added Station', 'Updated Fuel Price', 'Reported Issue', 'Edited Station', 'Confirmed Price'
      stationName: data.stationName || 'Unknown Station',
      fuelType: data.fuelType || null,
      price: data.price || null,
      date: new Date().toISOString(),
      status: 'verified',
      karmaImpact,
      ...data
    };

    contributions.unshift(newContribution);
    localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(contributions));
    
    // Update Karma
    const currentKarma = KarmaService.getKarma();
    KarmaService.setKarma(currentKarma + karmaImpact);

    return newContribution;
  },

  getKarmaImpact: (type) => {
    switch (type) {
      case 'Updated Fuel Price':
        return 10;
      case 'Confirmed Price':
        return 5;
      case 'Added Station':
        return 20;
      case 'Reported Issue':
        return 20; // Assuming this is for "Report False Station" which was defined as +20
      case 'Penalty (False Report)':
        return -20;
      default:
        return 0;
    }
  },

  isBlocked: () => {
    return KarmaService.getKarma() < 0;
  }
};
