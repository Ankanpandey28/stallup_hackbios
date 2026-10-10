import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // --------------------------------------------------
    // 1. Get logged-in user
    // --------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Get business ID
    // --------------------------------------------------
    const body = await request.json();
    const businessId = body.businessId;

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Load business
    // --------------------------------------------------
    const { data: business, error: businessError } =
      await supabase
        .from("businesses")
        .select(`
          id,
          Vendor_id,
          funding_required
        `)
        .eq("id", businessId)
        .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 4. Verify ownership
    // --------------------------------------------------
    if (business.Vendor_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to analyze this business.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 5. Load financial analysis
    // --------------------------------------------------
    const { data: analysis, error: analysisError } =
      await supabase
        .from("business_analysis")
        .select(`
          monthly_revenue,
          monthly_expenses,
          monthly_profit,
          profit_margin,
          funding_required,
          break_even_months,
          financial_health_score
        `)
        .eq("business_id", businessId)
        .maybeSingle();

    if (analysisError) {
      return NextResponse.json(
        { error: analysisError.message },
        { status: 500 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        {
          error:
            "Financial analysis is not available yet.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Extract financial values
    // --------------------------------------------------
    const revenue = Number(
      analysis.monthly_revenue ?? 0
    );

    const expenses = Number(
      analysis.monthly_expenses ?? 0
    );

    const profit = Number(
      analysis.monthly_profit ?? 0
    );

    const profitMargin = Number(
      analysis.profit_margin ?? 0
    );

    const breakEvenMonths =
      analysis.break_even_months !== null
        ? Number(analysis.break_even_months)
        : null;

    const financialHealthScore = Number(
      analysis.financial_health_score ?? 0
    );

    // --------------------------------------------------
    // 7. Calculate individual risks
    // --------------------------------------------------

    // Profitability Risk
    let profitabilityRisk = "low";

    if (profit <= 0) {
      profitabilityRisk = "high";
    } else if (profitMargin < 10) {
      profitabilityRisk = "medium";
    }

    // Expense Risk
    let expenseRisk = "low";

    if (revenue > 0) {
      const expenseRatio =
        (expenses / revenue) * 100;

      if (expenseRatio >= 90) {
        expenseRisk = "high";
      } else if (expenseRatio >= 75) {
        expenseRisk = "medium";
      }
    }

    // Revenue Performance Risk
    let revenueRisk = "low";

    if (revenue <= 0) {
      revenueRisk = "high";
    } else if (profitMargin < 10) {
      revenueRisk = "medium";
    }

    // Funding Risk
    let fundingRisk = "low";

    if (breakEvenMonths !== null) {
      if (breakEvenMonths > 24) {
        fundingRisk = "high";
      } else if (breakEvenMonths > 12) {
        fundingRisk = "medium";
      }
    }

    // --------------------------------------------------
    // 8. Determine overall risk
    // --------------------------------------------------
    const risks = [
      profitabilityRisk,
      expenseRisk,
      revenueRisk,
      fundingRisk,
    ];

    let overallRisk = "low";

    if (risks.includes("high")) {
      overallRisk = "high";
    } else if (risks.includes("medium")) {
      overallRisk = "medium";
    }

    // Financial health can also influence overall risk
    if (financialHealthScore < 40) {
      overallRisk = "high";
    } else if (
      financialHealthScore < 70 &&
      overallRisk === "low"
    ) {
      overallRisk = "medium";
    }

    // --------------------------------------------------
    // 9. Generate risk explanation
    // --------------------------------------------------
    let riskSummary = "";

    if (overallRisk === "low") {
      riskSummary =
        "The business currently demonstrates healthy financial performance with positive profitability and manageable operating risk.";
    } else if (overallRisk === "medium") {
      riskSummary =
        "The business shows some financial risk indicators that should be monitored, particularly around profitability, expenses, or funding recovery.";
    } else {
      riskSummary =
        "The business currently shows significant financial risk indicators. Profitability, expenses, and funding recovery should be reviewed carefully before additional investment.";
    }

    // --------------------------------------------------
    // 10. Return risk analysis
    // --------------------------------------------------
    return NextResponse.json({
      success: true,
      risk: {
        overallRisk,
        profitabilityRisk,
        expenseRisk,
        revenueRisk,
        fundingRisk,
        riskSummary,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}