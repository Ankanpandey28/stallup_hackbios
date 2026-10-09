
export type FunderPreferences = {
  preferred_city: string | null;
  preferred_state: string | null;
  preferred_categories: string[];
  preferred_business_types: string[];
  min_investment: number | null;
  max_investment: number | null;
  min_experience: number | null;
};

export type Business = {
  id: string;
  business_name: string;
  description: string | null;
  business_type: string;
  food_category: string;
  city: string;
  state: string;
  country: string;
  years_of_experience: number | null;
  monthly_revenue: number | null;
  monthly_expenses: number | null;
  funding_required: number | null;
  funding_purpose: string | null;
  verification_status: string;
  is_active: boolean;
};

export type MatchedBusiness = Business & {
  match_score: number;
  match_reasons: string[];
};

export function calculateMatchScore(
  preferences: FunderPreferences,
  business: Business
): MatchedBusiness {
  const reasons: string[] = [];

  // Never recommend unverified or inactive businesses.
  if (
    business.verification_status !== "verified" ||
    business.is_active !== true
  ) {
    return {
      ...business,
      match_score: 0,
      match_reasons: [],
    };
  }

  // Minimum experience is a strict requirement.
  if (preferences.min_experience !== null) {
    const experience = Number(business.years_of_experience);

    if (
      business.years_of_experience === null ||
      !Number.isFinite(experience) ||
      experience < preferences.min_experience
    ) {
      return {
        ...business,
        match_score: 0,
        match_reasons: [],
      };
    }
  }

  let score = 0;
  let possibleScore = 0;

  // 1. City — 20 points
  if (preferences.preferred_city) {
    possibleScore += 20;

    if (
      preferences.preferred_city.trim().toLowerCase() ===
      business.city.trim().toLowerCase()
    ) {
      score += 20;
      reasons.push("City matches");
    }
  }

  // 2. State — 10 points
  if (preferences.preferred_state) {
    possibleScore += 10;

    if (
      preferences.preferred_state.trim().toLowerCase() ===
      business.state.trim().toLowerCase()
    ) {
      score += 10;
      reasons.push("State matches");
    }
  }

  // 3. Food category — 20 points
  if (preferences.preferred_categories.length > 0) {
    possibleScore += 20;

    const categoryMatches = preferences.preferred_categories.some(
      (category) =>
        category.trim().toLowerCase() ===
        business.food_category.trim().toLowerCase()
    );

    if (categoryMatches) {
      score += 20;
      reasons.push("Food category matches");
    }
  }

  // 4. Business type — 15 points
  if (preferences.preferred_business_types.length > 0) {
    possibleScore += 15;

    const typeMatches = preferences.preferred_business_types.some(
      (type) =>
        type.trim().toLowerCase() ===
        business.business_type.trim().toLowerCase()
    );

    if (typeMatches) {
      score += 15;
      reasons.push("Business type matches");
    }
  }

  // 5. Investment range — 20 points
  if (
    preferences.min_investment !== null ||
    preferences.max_investment !== null
  ) {
    possibleScore += 20;

    const fundingRequired = business.funding_required;
    const minInvestment = preferences.min_investment ?? 0;
    const maxInvestment = preferences.max_investment ?? Infinity;

    if (
      fundingRequired !== null &&
      Number.isFinite(Number(fundingRequired)) &&
      Number(fundingRequired) >= minInvestment &&
      Number(fundingRequired) <= maxInvestment
    ) {
      score += 20;
      reasons.push("Investment amount matches");
    }
  }

  // 6. Experience — 10 points.
  // A configured minimum has already been enforced above.
  if (preferences.min_experience !== null) {
    possibleScore += 10;
    score += 10;
    reasons.push("Experience requirement matches");
  }

  const normalizedScore =
    possibleScore > 0
      ? Math.round((score / possibleScore) * 100)
      : 0;

  return {
    ...business,
    match_score: normalizedScore,
    match_reasons: reasons,
  };
}